import type { Activity } from '@/payload-types'

import type { FetchLegacyDocsTracker } from './statistics-tracker'

/**
 * Convert legacy external links to internal document references in the activity data
 */
export async function convertLinks(
  activityData: Activity,
  documentMap: Map<string, number>,
  tracker: FetchLegacyDocsTracker,
): Promise<Activity> {
  // Deep clone the activity data to avoid mutations
  const updatedData = structuredClone(activityData)

  // Recursively process the data
  convertLinksInObject(updatedData, documentMap, tracker)

  return updatedData
}

/**
 * Create a summary of the conversion process
 */
export function createConversionSummary(
  documentMap: Map<string, number>,
  tracker: FetchLegacyDocsTracker,
): {
  failedMappings: number
  mappingDetails: Array<{ documentId: null | number; url: string; }>
  successfulMappings: number
  totalUrls: number
} {
  const stats = tracker.getStatistics()
  const mappingDetails: Array<{ documentId: null | number; url: string; }> = Array.from(
    documentMap,
  ).map(([url, docId]) => ({
    documentId: docId,
    url,
  }))

  // Add failed URLs to the mapping details
  if (stats && stats.errors && Array.isArray(stats.errors)) {
    const failedUrls = stats.errors.map((e) => e.url)
    const uniqueFailedUrls = Array.from(new Set(failedUrls))

    for (const url of uniqueFailedUrls) {
      if (typeof url === 'string' && !documentMap.has(url)) {
        mappingDetails.push({ documentId: null, url: url })
      }
    }
  }

  return {
    failedMappings: mappingDetails.length - documentMap.size,
    mappingDetails,
    successfulMappings: documentMap.size,
    totalUrls: mappingDetails.length,
  }
}

/**
 * Recursively convert links in an object
 */
function convertLinksInObject(
  data: unknown,
  documentMap: Map<string, number>,
  tracker: FetchLegacyDocsTracker,
): void {
  if (!isRecord(data)) {
    return
  }

  // Handle arrays
  if (Array.isArray(data)) {
    for (const item of data) {
      convertLinksInObject(item, documentMap, tracker)
    }
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
 * Convert links in a rich text field
 */
function convertLinksInRichText(
  richText: unknown,
  documentMap: Map<string, number>,
  tracker: FetchLegacyDocsTracker,
): void {
  function traverseAndConvert(node: unknown): void {
    if (!isRecord(node)) {
      return
    }

    // Check if this is a link node with a legacy URL
    const nodeFields = isRecord(node.fields) ? node.fields : undefined
    if (node.type === 'link' && nodeFields) {
      const url = nodeFields.url || node.url
      const linkType = nodeFields.linkType || node.linkType

      // Check if it's a custom link that we have a mapping for
      if (linkType === 'custom' && url && typeof url === 'string' && documentMap.has(url)) {
        const documentId = documentMap.get(url)

        // Convert to internal link
        const updatedFields: Record<string, unknown> = {
          ...nodeFields,
          doc: {
            relationTo: 'documents',
            value: documentId,
          },
          linkType: 'internal',
        }

        // Remove the URL field as it's no longer needed
        delete updatedFields.url
        node.fields = updatedFields

        tracker.increment('linksConverted')
      }
    }

    // Handle array of nodes
    if (Array.isArray(node)) {
      for (const child of node) {
        traverseAndConvert(child)
      }
      return
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverseAndConvert(child)
      }
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
 * Check if a value is a non-null object. An array passes as well, because the walkers
 * below treat an array of nodes as a valid rich text shape.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Check if a field appears to be a rich text field
 */
function isRichTextField(data: unknown): boolean {
  if (Array.isArray(data)) {
    return data.some((item) => isRecord(item) && item.type && item.children)
  }

  if (!isRecord(data)) {
    return false
  }

  const root = data.root
  return isRecord(root) && root.type === 'root' && Array.isArray(root.children)
}
