import { cloneDocumentFile } from './clone-document-file'
import { PayloadRequest } from 'payload'
import { Document } from '@/payload-types'
import { CloneStatisticsTracker } from './clone-statistics-tracker'

/**
 * Utility to clean rich text fields for cloning
 * Handles relationship nodes in rich text properly
 */

export interface RichTextProcessingResult {
  content: any
  errors: Array<{
    documentId: number
    documentName: string
    fileName: string
    error: string
    location: string
  }>
  documentsFound?: number[] // IDs of all documents found in rich text
  documentsCloned?: number[] // IDs of documents successfully cloned
}

/**
 * Process a rich text field to make it suitable for cloning
 * - Removes any IDs
 * - Handles link nodes with relationships
 *
 * @param richText The rich text field to process
 * @param req Payload request (needed for document cloning)
 * @param organisationId Target organisation ID
 * @returns Processed content and any errors encountered
 */
export const stripRichTextField = async (
  richText: any,
  req: PayloadRequest,
  organisationId: number,
  locale?: string,
): Promise<RichTextProcessingResult> => {
  const errors: RichTextProcessingResult['errors'] = []
  const documentsFound: number[] = []
  const documentsCloned: number[] = []

  if (!richText || typeof richText !== 'object') {
    return { content: richText, errors, documentsFound, documentsCloned }
  }

  // If it's a rich text object with root property
  if (richText.root) {
    const result = await processRichTextNode(richText.root, req, organisationId, locale, 'root')
    return {
      content: {
        ...richText,
        root: result.content,
      },
      errors: result.errors,
      documentsFound: result.documentsFound || [],
      documentsCloned: result.documentsCloned || [],
    }
  }

  return { content: richText, errors, documentsFound, documentsCloned }
}

/**
 * Recursively process a rich text node
 */
const processRichTextNode = async (
  node: any,
  req: PayloadRequest,
  organisationId: number,
  locale?: string,
  location: string = '',
): Promise<{
  content: any
  errors: RichTextProcessingResult['errors']
  documentsFound?: number[]
  documentsCloned?: number[]
}> => {
  const errors: RichTextProcessingResult['errors'] = []
  const documentsFound: number[] = []
  const documentsCloned: number[] = []

  if (!node || typeof node !== 'object') {
    return { content: node, errors, documentsFound, documentsCloned }
  }

  // Make a copy we can modify
  const processedNode = { ...node }

  // Remove node IDs if present
  if ('id' in processedNode) {
    delete processedNode.id
  }

  // Process link nodes (potential relationships)
  if (processedNode.type === 'link' && processedNode.fields) {
    // Handle document relationships
    if (processedNode.fields.doc && processedNode.fields.doc.relationTo === 'documents') {
      const docId = processedNode.fields.doc.value

      // Track that we found this document
      documentsFound.push(docId)

      const tracker = CloneStatisticsTracker.getInstance()

      try {
        let clonedDocument: { id: number; collection: string }

        // Check if we've already cloned this document
        const existingClonedId = tracker.getClonedDocumentId(docId)
        if (existingClonedId) {
          // Reuse the existing cloned document
          clonedDocument = {
            id: existingClonedId,
            collection: 'documents',
          }
          req.payload.logger.debug({
            msg: 'Reusing existing cloned document',
            sourceId: docId,
            clonedId: existingClonedId,
          })
        } else {
          // Clone the document from the source organization to the target organization
          clonedDocument = await cloneDocumentFile(req, docId, organisationId)

          // Store the mapping for future reuse
          tracker.setDocumentCloneMapping(docId, clonedDocument.id)
          req.payload.logger.debug({
            msg: 'Document cloned and cached',
            sourceId: docId,
            clonedId: clonedDocument.id,
          })
        }

        // Update the node with the cloned document reference
        processedNode.fields = {
          ...processedNode.fields,
          newTab: processedNode.fields.newTab !== undefined ? processedNode.fields.newTab : true,
          doc: {
            value: clonedDocument.id,
            relationTo: 'documents',
          },
        }

        // Track successful clone
        documentsCloned.push(docId)
      } catch (error: unknown) {
        const docId = processedNode.fields.doc.value
        const label = processedNode.fields.doc.label || 'Document'

        // Log the error
        req.payload.logger.warn({
          msg: 'Failed to clone document in rich text link, removing link',
          error: error instanceof Error ? error.message : 'Unknown error',
          docId,
          label,
          location,
        })

        // Try to get document details for error reporting
        let documentName = typeof label === 'string' ? label : 'Document'
        let fileName = 'Unknown'
        let documentUsedIn = location // Default to the location where we found it

        try {
          // Debug - log what locale we're using
          req.payload.logger.debug({
            msg: 'Fetching document for error details',
            docId,
            locale: req.locale,
          })

          const sourceDoc = (await req.payload.findByID({
            req,
            collection: 'documents',
            id: docId,
            depth: 1,
            locale: (locale || req.locale || 'de') as any, // Use passed locale first
          })) as Document

          // Debug - log what we got back
          req.payload.logger.debug({
            msg: 'Document fetched',
            nameType: typeof sourceDoc?.name,
            name: sourceDoc?.name,
          })

          // Now that we're passing locale, name should be a string
          if (sourceDoc?.name) {
            documentName = sourceDoc.name
          }

          fileName = sourceDoc.filename || 'Unknown'

          // Get the document's actual usedIn field if available
          if (sourceDoc?.usedIn) {
            if (typeof sourceDoc.usedIn === 'string') {
              documentUsedIn = sourceDoc.usedIn
            } else if (typeof sourceDoc.usedIn === 'object') {
              // If it's an object or array, try to extract meaningful information
              documentUsedIn = JSON.stringify(sourceDoc.usedIn, null, 2)
            }
          }
        } catch {
          // Couldn't get document details, use defaults
        }

        // Add to errors array
        errors.push({
          documentId: docId,
          documentName,
          fileName,
          error: error instanceof Error ? error.message : 'Unknown error',
          location: documentUsedIn,
        })

        // Convert the link to plain text with the original label
        processedNode.type = 'text'
        processedNode.text = `[${label}]`
        processedNode.format = 0
        // Remove link-specific fields
        delete processedNode.fields
        delete processedNode.children
      }
    }
    // Other relationship types should be left unchanged
    else if (processedNode.fields.doc && processedNode.fields.doc.relationTo) {
      req.payload.logger.debug({
        msg: 'Preserving relationship',
        relationTo: processedNode.fields.doc.relationTo,
      })

      // Track public documents
      if (processedNode.fields.doc.relationTo === 'documents-public') {
        const tracker = CloneStatisticsTracker.getInstance()
        tracker.addSourcePublicDocument()
        tracker.addClonedPublicDocument()
      }

      // No modification needed, keep the original relationship
    }
  }

  // Recursively process children
  if (Array.isArray(processedNode.children)) {
    const childResults = await Promise.all(
      processedNode.children.map((child: any, index: number) =>
        processRichTextNode(child, req, organisationId, locale, `${location}.children[${index}]`),
      ),
    )

    processedNode.children = childResults.map((r) => r.content)

    // Collect all errors and document info from children
    for (const result of childResults) {
      errors.push(...result.errors)
      if (result.documentsFound) {
        documentsFound.push(...result.documentsFound)
      }
      if (result.documentsCloned) {
        documentsCloned.push(...result.documentsCloned)
      }
    }
  }

  return { content: processedNode, errors, documentsFound, documentsCloned }
}
