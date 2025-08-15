import type { PayloadRequest } from 'payload'

/**
 * Convert legacy external links to internal document references in the activity data
 */
export async function convertLinks(
  activityData: any,
  documentMap: Map<string, number>,
  tracker: any,
  req: PayloadRequest,
): Promise<any> {
  // Deep clone the activity data to avoid mutations
  const updatedData = JSON.parse(JSON.stringify(activityData))

  // Recursively process the data
  convertLinksInObject(updatedData, documentMap, tracker)

  return updatedData
}

/**
 * Recursively convert links in an object
 */
function convertLinksInObject(data: any, documentMap: Map<string, number>, tracker: any): void {
  if (!data || typeof data !== 'object') {
    return
  }

  // Handle arrays
  if (Array.isArray(data)) {
    data.forEach((item) => convertLinksInObject(item, documentMap, tracker))
    return
  }

  // Check if this is a rich text field
  if (isRichTextField(data)) {
    convertLinksInRichText(data, documentMap, tracker)
  }

  // Recursively process object properties
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_') || key === 'id' || key === 'createdAt' || key === 'updatedAt') {
      continue
    }
    convertLinksInObject(value, documentMap, tracker)
  }
}

/**
 * Check if a field appears to be a rich text field
 */
function isRichTextField(data: any): boolean {
  return (
    (data?.root?.type === 'root' && Array.isArray(data.root.children)) ||
    (Array.isArray(data) && data.length > 0 && data.some((item) => item?.type && item?.children))
  )
}

/**
 * Convert links in a rich text field
 */
function convertLinksInRichText(
  richText: any,
  documentMap: Map<string, number>,
  tracker: any,
): void {
  function traverseAndConvert(node: any): void {
    if (!node || typeof node !== 'object') {
      return
    }

    // Check if this is a link node with a legacy URL
    if (node.type === 'link' && node.fields) {
      const url = node.fields.url || node.url
      const linkType = node.fields.linkType || node.linkType

      // Check if it's a custom link that we have a mapping for
      if (linkType === 'custom' && url && typeof url === 'string' && documentMap.has(url)) {
        const documentId = documentMap.get(url)

        // Convert to internal link
        node.fields = {
          ...node.fields,
          linkType: 'internal',
          doc: {
            relationTo: 'documents',
            value: documentId,
          },
        }

        // Remove the URL field as it's no longer needed
        delete node.fields.url

        tracker.increment('linksConverted')
      }
    }

    // Handle array of nodes
    if (Array.isArray(node)) {
      node.forEach(traverseAndConvert)
      return
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverseAndConvert)
    }

    // Check root
    if (node.root) {
      traverseAndConvert(node.root)
    }

    // Check content
    if (node.content) {
      traverseAndConvert(node.content)
    }

    // Handle other properties that might contain nodes
    for (const [key, value] of Object.entries(node)) {
      if (
        key !== 'type' &&
        key !== 'fields' &&
        key !== 'children' &&
        key !== 'root' &&
        key !== 'content' &&
        value &&
        typeof value === 'object'
      ) {
        traverseAndConvert(value)
      }
    }
  }

  traverseAndConvert(richText)
}

/**
 * Create a summary of the conversion process
 */
export function createConversionSummary(
  documentMap: Map<string, number>,
  tracker: any,
): {
  totalUrls: number
  successfulMappings: number
  failedMappings: number
  mappingDetails: Array<{ url: string; documentId: number | null }>
} {
  const stats = tracker.getStatistics()
  const mappingDetails = Array.from(documentMap.entries()).map(([url, docId]) => ({
    url,
    documentId: docId,
  }))

  // Add failed URLs to the mapping details
  if (stats && stats.errors && Array.isArray(stats.errors)) {
    const failedUrls = stats.errors.map((e: any) => e.url as string)
    const uniqueFailedUrls = Array.from(new Set(failedUrls))

    uniqueFailedUrls.forEach((url) => {
      if (typeof url === 'string' && !documentMap.has(url)) {
        mappingDetails.push({ url: url, documentId: null as any })
      }
    })
  }

  return {
    totalUrls: mappingDetails.length,
    successfulMappings: documentMap.size,
    failedMappings: mappingDetails.length - documentMap.size,
    mappingDetails,
  }
}
