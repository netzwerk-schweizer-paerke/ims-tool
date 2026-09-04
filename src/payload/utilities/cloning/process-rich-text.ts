import { PayloadRequest, TypedLocale } from 'payload'

import { isRecord, isUnknownArray } from '@/payload/assertions'
import { normalizeRichText } from '@/payload/utilities/cloning/normalize-rich-text'
import {
  MissingDocumentFileError,
  RichTextProcessingResult,
} from '@/payload/utilities/cloning/types'

import { CloneStatisticsTracker } from './clone-statistics-tracker'

// The three assertions below rebuild the node tree and keep its shape, which the compiler cannot
// prove. They are the only place this file asserts, and they keep the caller's field type intact.
export async function processRichTextField<TContent>(
  richText: TContent,
  req: PayloadRequest,
  targetOrgId: number,
  collectionName: string,
  locale: TypedLocale,
  documentPreloader?: import('./document-preloader').DocumentPreloader,
): Promise<RichTextProcessingResult<TContent>> {
  const documentIds: number[] = []
  const publicDocumentIds: number[] = []
  const errors: MissingDocumentFileError[] = []

  if (!richText || typeof richText !== 'object') {
    return {
      content: richText,
      errors,
    }
  }

  // Normalize the rich text to ensure consistent handling
  // This converts any resolved entities to unresolved format
  const normalizedRichText = normalizeRichText(richText)

  // Handle Lexical rich text (has root property)
  if (isRecord(normalizedRichText) && normalizedRichText.root) {
    const processedRoot = await processNode(
      normalizedRichText.root,
      req,
      targetOrgId,
      documentIds,
      publicDocumentIds,
      errors,
      collectionName,
      locale,
      documentPreloader,
    )

    return {
      content: { ...normalizedRichText, root: processedRoot } as TContent,
      errors: errors.length > 0 ? errors : [],
    }
  }

  // Handle Slate rich text (array of nodes)
  if (isUnknownArray(normalizedRichText)) {
    const processedNodes = await Promise.all(
      normalizedRichText.map((node) =>
        processNode(
          node,
          req,
          targetOrgId,
          documentIds,
          publicDocumentIds,
          errors,
          collectionName,
          locale,
          documentPreloader,
        ),
      ),
    )

    return {
      content: processedNodes.filter((node) => node !== null) as TContent,
      errors: errors.length > 0 ? errors : [],
    }
  }

  // Return original content if it's not recognizable rich text
  return {
    content: normalizedRichText as TContent,
    errors: [],
  }
}

async function processNode(
  node: unknown,
  req: PayloadRequest,
  targetOrgId: number,
  documentIds: number[],
  publicDocumentIds: number[],
  errors: MissingDocumentFileError[],
  collectionName: string,
  locale: TypedLocale,
  documentPreloader?: import('./document-preloader').DocumentPreloader,
): Promise<unknown> {
  if (!isRecord(node)) {
    return node
  }

  const processedNode: Record<string, unknown> = { ...node }

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)

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
        documentIds.push(docId)

        try {
          // The tracker copies each source document once per entity, however many links
          // reach it, and it counts the source and the clone on that single attempt.
          const clonedId = await tracker.resolveClonedDocumentId(docId, async () => {
            if (documentPreloader && documentPreloader.preloadedDocuments.has(docId)) {
              const preloadedDoc = documentPreloader.preloadedDocuments.get(docId)!
              const { createClonedDocumentFromPreloaded } = await import('./document-preloader')
              const created = await createClonedDocumentFromPreloaded(req, preloadedDoc, targetOrgId)
              return created.id
            }

            // Fallback to original method (will cause transaction timeout risk)
            const { cloneDocumentFile } = await import('./clone-document')
            const created = await cloneDocumentFile(req, docId, targetOrgId)
            return created.id
          })

          relationship.value = clonedId
        } catch (error) {
          // Try to get document details for error reporting
          let documentName = 'Unknown'
          let fileName = 'Unknown'

          try {
            const sourceDoc = await req.payload.findByID({
              collection: 'documents',
              depth: 0,
              id: docId,
              locale,
              req,
            })

            if (sourceDoc) {
              documentName = sourceDoc.name || 'Unnamed'
              fileName = sourceDoc.filename || 'Unknown'
            }
          } catch {
            // Couldn't get document details
          }

          const errorEntry: MissingDocumentFileError = {
            documentId: docId,
            documentName,
            error:
              error instanceof Error ? error.message : `Failed to clone document ${documentName}`,
            fileName,
            usageLocation: `${collectionName} rich text field`,
          }

          tracker.addMissingFileError(errorEntry)

          // Convert failed link to text
          const label = typeof relationship.label === 'string' ? relationship.label : 'Document'
          processedNode.type = 'text'
          processedNode.text = `[${label}]`
          delete processedNode.fields
          delete processedNode.children
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
      children.map((child) =>
        processNode(
          child,
          req,
          targetOrgId,
          documentIds,
          publicDocumentIds,
          errors,
          collectionName,
          locale,
          documentPreloader,
        ),
      ),
    )
    processedNode.children = processedChildren.filter((child) => child !== null)
  }

  return processedNode
}
