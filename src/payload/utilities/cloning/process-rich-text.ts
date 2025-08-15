import { PayloadRequest } from 'payload'
import { cloneDocumentFile } from './clone-document'
import { CloneStatisticsTracker } from './clone-statistics-tracker'
import {
  MissingDocumentFileError,
  RichTextProcessingResult,
} from '@/payload/utilities/cloning/types'
import { normalizeRichText } from '@/payload/utilities/cloning/normalize-rich-text'


export async function processRichTextField(
  richText: any,
  req: PayloadRequest,
  targetOrgId: number,
  collectionName: string,
  locale: string,
  documentPreloader?: import('./document-preloader').DocumentPreloader,
): Promise<RichTextProcessingResult> {
  const documentIds: number[] = []
  const publicDocumentIds: number[] = []
  const errors: MissingDocumentFileError[] = []

  if (!richText || typeof richText !== 'object') {
    return {
      errors,
      content: richText,
    }
  }

  // Normalize the rich text to ensure consistent handling
  // This converts any resolved entities to unresolved format
  const normalizedRichText = normalizeRichText(richText)

  // Handle Lexical rich text (has root property)
  if (normalizedRichText.root) {
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
      content: { ...normalizedRichText, root: processedRoot },
      errors: errors.length > 0 ? errors : [],
    }
  }

  // Handle Slate rich text (array of nodes)
  if (Array.isArray(normalizedRichText)) {
    const processedNodes = await Promise.all(
      normalizedRichText.map((node: any) =>
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
      content: processedNodes.filter((node) => node !== null),
      errors: errors.length > 0 ? errors : [],
    }
  }

  // Return original content if it's not recognizable rich text
  return {
    content: normalizedRichText,
    errors: [],
  }
}

async function processNode(
  node: any,
  req: PayloadRequest,
  targetOrgId: number,
  documentIds: number[],
  publicDocumentIds: number[],
  errors: MissingDocumentFileError[],
  collectionName: string,
  locale: string,
  documentPreloader?: import('./document-preloader').DocumentPreloader,
): Promise<any> {
  if (!node || typeof node !== 'object') {
    return node
  }

  const processedNode = { ...node }

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)

  // Remove IDs
  if ('id' in processedNode) {
    delete processedNode.id
  }

  // Handle document relationships in links
  if (processedNode.type === 'link' && processedNode.fields?.doc) {
    const relationship = processedNode.fields.doc

    if (relationship.relationTo === 'documents' && relationship.value) {
      const docId =
        typeof relationship.value === 'object' ? relationship.value.id : relationship.value

      documentIds.push(docId)

      try {
        // Check if already cloned (for reuse within same operation)
        let clonedId = tracker.getClonedDocumentId(docId)

        if (!clonedId) {
          tracker.addSourceDocument()
          
          // Use pre-loaded document if available
          if (documentPreloader && documentPreloader.preloadedDocuments.has(docId)) {
            const preloadedDoc = documentPreloader.preloadedDocuments.get(docId)!
            const { createClonedDocumentFromPreloaded } = await import('./document-preloader')
            const clonedDoc = await createClonedDocumentFromPreloaded(req, preloadedDoc, targetOrgId)
            clonedId = clonedDoc.id
          } else {
            // Fallback to original method (will cause transaction timeout risk)
            const { cloneDocumentFile } = await import('./clone-document')
            const clonedDoc = await cloneDocumentFile(req, docId, targetOrgId)
            clonedId = clonedDoc.id
          }
          
          tracker.addClonedDocument()
        }

        processedNode.fields.doc.value = clonedId
      } catch (error) {
        // Try to get document details for error reporting
        let documentName = 'Unknown'
        let fileName = 'Unknown'

        try {
          const sourceDoc = await req.payload.findByID({
            req,
            collection: 'documents',
            id: docId,
            depth: 0,
            locale: locale as any,
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
          fileName,
          error:
            error instanceof Error ? error.message : `Failed to clone document ${documentName}`,
          usageLocation: `${collectionName} rich text field`,
        }

        tracker.addMissingFileError(errorEntry)

        // Convert failed link to text
        const label = processedNode.fields.doc.label || 'Document'
        processedNode.type = 'text'
        processedNode.text = `[${label}]`
        delete processedNode.fields
        delete processedNode.children
      }
    } else if (relationship.relationTo === 'documents-public') {
      tracker.addClonedPublicDocument()
      tracker.addSourcePublicDocument()
    }
  }

  // Process children recursively
  if (Array.isArray(processedNode.children)) {
    const processedChildren = await Promise.all(
      processedNode.children.map((child: any) =>
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
