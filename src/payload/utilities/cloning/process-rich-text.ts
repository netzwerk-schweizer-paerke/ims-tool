import { PayloadRequest, TypedLocale } from 'payload'

import { isRecord, isUnknownArray } from '@/payload/assertions'
import { normalizeRichText } from '@/payload/utilities/cloning/normalize-rich-text'
import { RichTextProcessingResult } from '@/payload/utilities/cloning/types'

import { CloneStatisticsTracker } from './clone-statistics-tracker'
import {
  describePreloadFailure,
  DocumentPreloader,
  resolvePreloadedDocumentId,
} from './document-preloader'
import { getErrorMessage } from './error-utils'

// The three assertions below rebuild the node tree and keep its shape, which the compiler cannot
// prove. They are the only place this file asserts, and they keep the caller's field type intact.
// A missing document is reported on the tracker alone. The result carries no error list.
export async function processRichTextField<TContent>(
  richText: TContent,
  req: PayloadRequest,
  targetOrgId: number,
  collectionName: string,
  locale: TypedLocale,
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
): Promise<RichTextProcessingResult<TContent>> {
  if (!richText || typeof richText !== 'object') {
    return { content: richText }
  }

  // Normalize the rich text to ensure consistent handling
  // This converts any resolved entities to unresolved format
  const normalizedRichText = normalizeRichText(richText)

  // Handle Lexical rich text (has root property)
  if (isRecord(normalizedRichText) && normalizedRichText.root) {
    const processedRoot = await processNode(
      normalizedRichText.root,
      collectionName,
      documentPreloader,
      tracker,
    )

    return { content: { ...normalizedRichText, root: processedRoot } as TContent }
  }

  // Handle Slate rich text (array of nodes)
  if (isUnknownArray(normalizedRichText)) {
    const processedNodes = await Promise.all(
      normalizedRichText.map((node) =>
        processNode(node, collectionName, documentPreloader, tracker),
      ),
    )

    return { content: processedNodes.filter((node) => node !== null) as TContent }
  }

  // Return original content if it's not recognizable rich text
  return { content: normalizedRichText as TContent }
}

async function processNode(
  node: unknown,
  collectionName: string,
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
): Promise<unknown> {
  if (!isRecord(node)) {
    return node
  }

  const processedNode: Record<string, unknown> = { ...node }

  // Remove IDs
  delete processedNode.id

  // Handle document relationships in links
  const nodeFields = processedNode.fields
  if (processedNode.type === 'link' && isRecord(nodeFields) && isRecord(nodeFields.doc)) {
    // `relationship` is the same object as `processedNode.fields.doc`, so a write below reaches
    // the node itself. The shallow copy above shares it with the caller's node, as before.
    const relationship = nodeFields.doc

    if (relationship.relationTo === 'documents' && relationship.value) {
      const relationshipValue = relationship.value
      const docId = isRecord(relationshipValue) ? relationshipValue.id : relationshipValue

      // Every id that reaches the clone is a Postgres serial. `document-scanner` applies the
      // same guard, so a non-numeric id is never preloaded either.
      if (typeof docId === 'number') {
        try {
          // Phase 1 copied the document before the transaction opened. The tracker counts the
          // source and the clone once per entity, however many links reach it.
          const clonedId = await tracker.resolveClonedDocumentId(docId, async () =>
            resolvePreloadedDocumentId(documentPreloader, docId),
          )

          relationship.value = clonedId
        } catch (error) {
          // The lookup ran no Payload operation, so the transaction is intact. A read of the
          // source document for the report would run inside it, and a NotFound would kill it.
          const failure = describePreloadFailure(documentPreloader, docId)

          tracker.addMissingFileError({
            documentId: docId,
            documentName: failure.documentName ?? 'Unknown',
            error: getErrorMessage(error),
            fileName: failure.fileName ?? 'Unknown',
            usageLocation: `${collectionName} rich text field`,
          })

          // The link would otherwise keep a document id of the source organisation. A text node
          // keeps the visible words in the paragraph and drops the reference.
          return degradeLinkToText(processedNode)
        }
      }
    } else if (relationship.relationTo === 'documents-public') {
      tracker.addClonedPublicDocument()
      tracker.addSourcePublicDocument()
    }
  }

  // Process children recursively
  const children = processedNode.children
  if (isUnknownArray(children)) {
    const processedChildren = await Promise.all(
      children.map((child) => processNode(child, collectionName, documentPreloader, tracker)),
    )
    processedNode.children = processedChildren.filter((child) => child !== null)
  }

  return processedNode
}

/**
 * Replaces a link node by a text node that carries the link's visible words.
 *
 * The shape follows lexical's `SerializedTextNode`. A link node keeps element keys such as a
 * string `format`, which a text node must not carry, or the admin editor cannot load the clone.
 */
const degradeLinkToText = (linkNode: Record<string, unknown>): Record<string, unknown> => {
  const words = isUnknownArray(linkNode.children)
    ? linkNode.children
        .map((child) => (isRecord(child) && typeof child.text === 'string' ? child.text : ''))
        .join('')
    : ''

  return {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: words || '[Document]',
    type: 'text',
    version: 1,
  }
}
