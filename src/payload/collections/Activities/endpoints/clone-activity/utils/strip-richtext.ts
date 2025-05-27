import { cloneDocument } from './clone-document'
import { PayloadRequest } from 'payload'

/**
 * Utility to clean rich text fields for cloning
 * Handles relationship nodes in rich text properly
 */

/**
 * Process a rich text field to make it suitable for cloning
 * - Removes any IDs
 * - Handles link nodes with relationships
 *
 * @param richText The rich text field to process
 * @param req Payload request (needed for document cloning)
 * @param organisationId Target organisation ID
 * @param options Additional options for processing
 */
export const stripRichTextField = async (
  richText: any,
  req: PayloadRequest,
  organisationId: number,
): Promise<any> => {
  if (!richText || typeof richText !== 'object') {
    return richText
  }

  // If it's a rich text object with root property
  if (richText.root) {
    const processedRoot = await processRichTextNode(richText.root, req, organisationId)
    return {
      ...richText,
      root: processedRoot,
    }
  }

  return richText
}

/**
 * Recursively process a rich text node
 */
const processRichTextNode = async (
  node: any,
  req: PayloadRequest,
  organisationId: number,
): Promise<any> => {
  if (!node || typeof node !== 'object') {
    return node
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
      try {
        // Clone the document from the source organization to the target organization
        const docId = processedNode.fields.doc.value
        const clonedDocument = await cloneDocument(req, docId, organisationId)

        // Update the node with the cloned document reference
        processedNode.fields = {
          ...processedNode.fields,
          newTab: processedNode.fields.newTab !== undefined ? processedNode.fields.newTab : true,
          doc: {
            value: clonedDocument.id,
            relationTo: 'documents',
          },
        }
      } catch (error: any) {
        // Log the error for debugging but rethrow to halt the process
        req.payload.logger.error({
          msg: 'Error cloning document in rich text link',
          error: error.message,
          node: JSON.stringify({
            type: processedNode.type,
            fields: processedNode.fields,
          }),
        })
        throw error
      }
    }
    // Other relationship types should be left unchanged
    else if (processedNode.fields.doc && processedNode.fields.doc.relationTo) {
      console.log(`Preserving relationship of type: ${processedNode.fields.doc.relationTo}`)
      // No modification needed, keep the original relationship
    }
  }

  // Recursively process children
  if (Array.isArray(processedNode.children)) {
    processedNode.children = await Promise.all(
      processedNode.children.map((child: any) => processRichTextNode(child, req, organisationId)),
    )
  }

  return processedNode
}

/**
 * Synchronous version that just strips relationships
 */
const processRichTextNodeSync = (node: any): any => {
  if (!node || typeof node !== 'object') {
    return node
  }

  // Make a copy we can modify
  const processedNode = { ...node }

  // Remove node IDs if present
  if ('id' in processedNode) {
    delete processedNode.id
  }

  // Process link nodes (potential relationships)
  if (
    processedNode.type === 'link' &&
    processedNode.fields?.relationTo &&
    processedNode.fields?.value
  ) {
    // For all relationships in sync mode, we'll just keep the URL if it exists
    if (processedNode.fields.url) {
      processedNode.fields = {
        ...processedNode.fields,
        relationTo: undefined,
        value: undefined,
      }
    } else {
      // Convert to plain text if no URL is available
      return {
        type: 'text',
        text: processedNode.children?.[0]?.text || '',
        format: processedNode.format || '',
      }
    }
  }

  // Recursively process children
  if (Array.isArray(processedNode.children)) {
    processedNode.children = processedNode.children.map(processRichTextNodeSync)
  }

  return processedNode
}
