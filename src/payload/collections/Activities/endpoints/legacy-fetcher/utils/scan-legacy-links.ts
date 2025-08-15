import type { PayloadRequest } from 'payload'

export interface LegacyLink {
  url: string
  fieldPath: string[]
  context: any
  parentEntity: string // Human-readable parent entity (e.g., "Task Group #1")
  fieldLabel: string // Human-readable field name (e.g., "Input")
  locationPath: string // Full path context (e.g., "Introduction block > Input field")
}

/**
 * Recursively scan an object for legacy document links in rich text fields
 */
export async function scanLegacyLinks(
  data: any,
  tracker: any,
  req: PayloadRequest,
  fieldPath: string[] = [],
  parentContext: { entity?: string; label?: string } = {},
): Promise<LegacyLink[]> {
  const legacyLinks: LegacyLink[] = []

  if (!data || typeof data !== 'object') {
    return legacyLinks
  }

  // Handle arrays
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      // Special handling for blocks array
      if (fieldPath[fieldPath.length - 1] === 'blocks' && data[i]?.blockType) {
        const blockLabel = getBlockLabel(data[i].blockType, i)
        const itemLinks = await scanLegacyLinks(data[i], tracker, req, [...fieldPath, String(i)], {
          entity: blockLabel,
          label: blockLabel,
        })
        legacyLinks.push(...itemLinks)
      } else {
        const itemLinks = await scanLegacyLinks(
          data[i],
          tracker,
          req,
          [...fieldPath, String(i)],
          parentContext,
        )
        legacyLinks.push(...itemLinks)
      }
    }
    return legacyLinks
  }

  // Check if this is a rich text field
  if (isRichTextField(data)) {
    tracker.increment('processedFields')
    const fieldLabel = getFieldLabel(fieldPath)
    const links = extractLegacyLinksFromRichText(
      data,
      fieldPath,
      parentContext.entity || 'Activity',
      fieldLabel,
    )
    legacyLinks.push(...links)
    tracker.updateStatistics({
      totalLinksFound: tracker.getStatistics().totalLinksFound + links.length,
    })
  }

  // Recursively scan object properties
  for (const [key, value] of Object.entries(data)) {
    // Skip internal fields and relations that are just IDs
    if (key.startsWith('_') || key === 'id' || key === 'createdAt' || key === 'updatedAt') {
      continue
    }

    // Update context for nested tabs
    let newContext = parentContext
    if (key === 'io' || key === 'infos' || key === 'relations') {
      // We're entering a tab section, but keep parent entity
      newContext = { ...parentContext }
    }

    const nestedLinks = await scanLegacyLinks(value, tracker, req, [...fieldPath, key], newContext)
    legacyLinks.push(...nestedLinks)
  }

  return legacyLinks
}

// Configuration constants for legacy document detection
export const LEGACY_DOMAINS = [
  'parcs-ims.ch',
  'parcs-ims.ddev.site',
  // Add more legacy domains as needed
]

// Extensions that should NOT be fetched as documents
export const EXCLUDED_EXTENSIONS = [
  '.html',
  '.htm',
  '.php',
  '.asp',
  '.aspx',
  '.jsp',
  '.js',
  '.css',
  '.sh',
  '.bat',
  '.exe',
  '.app',
]

/**
 * Check if a URL is a legacy document URL based on domain and file extension
 */
function isLegacyDocumentUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)

    // Check if hostname matches any of the legacy domains
    const isLegacyDomain = LEGACY_DOMAINS.some((domain) => urlObj.hostname.includes(domain))

    if (!isLegacyDomain) {
      return false
    }

    const pathname = decodeURIComponent(urlObj.pathname).toLowerCase()

    // Check if URL has NO file extension (directory or dynamic page)
    const lastSegment = pathname.split('/').pop() || ''
    if (!lastSegment.includes('.')) {
      return false
    }

    // Check if the extension is in the excluded list
    const isExcluded = EXCLUDED_EXTENSIONS.some((ext) => pathname.endsWith(ext))
    if (isExcluded) {
      return false
    }

    // If it has an extension and it's not excluded, it's a document
    return true
  } catch {
    return false
  }
}

/**
 * Check if a field appears to be a rich text field
 */
function isRichTextField(data: any): boolean {
  // Rich text fields typically have a root property with children
  return (
    (data?.root?.type === 'root' && Array.isArray(data.root.children)) ||
    // Or they might be an array of content blocks
    (Array.isArray(data) && data.length > 0 && data.some((item) => item?.type && item?.children))
  )
}

/**
 * Get human-readable block label
 */
function getBlockLabel(blockType: string, index: number): string {
  const blockLabels: Record<string, string> = {
    'activity-task': 'Task Group',
    'activity-io': 'Input/Output Task Group',
  }
  const label = blockLabels[blockType] || 'Block'
  return `${label} #${index + 1}`
}

/**
 * Get human-readable field label from field path
 */
function getFieldLabel(fieldPath: string[]): string {
  const fieldLabels: Record<string, string> = {
    description: 'Description',
    input: 'Input',
    output: 'Output',
    norms: 'Norm Requirements',
    support: 'Infos / Support',
    content: 'Content',
    text: 'Text',
    tools: 'Tools',
    keypoints: 'Key Points',
    topic: 'Topics / Activities',
  }

  // Get the last meaningful field name from the path
  for (let i = fieldPath.length - 1; i >= 0; i--) {
    const segment = fieldPath[i]
    if (fieldLabels[segment]) {
      return fieldLabels[segment]
    }
  }

  // Default to the last non-numeric segment
  const lastField = fieldPath.filter((p) => isNaN(Number(p))).pop()
  return fieldLabels[lastField || ''] || lastField || 'Field'
}

/**
 * Build location path for user display
 */
function buildLocationPath(parentEntity: string, fieldLabel: string): string {
  if (parentEntity === 'Activity') {
    return fieldLabel
  }
  return `${parentEntity} > ${fieldLabel}`
}

/**
 * Extract legacy links from a rich text field
 */
function extractLegacyLinksFromRichText(
  richText: any,
  fieldPath: string[],
  parentEntity: string,
  fieldLabel: string,
): LegacyLink[] {
  const links: LegacyLink[] = []

  // Recursive function to traverse rich text nodes
  function traverseNode(node: any, nodePath: string[] = []): void {
    if (!node || typeof node !== 'object') {
      return
    }

    // Check if this is a link node with a legacy URL
    if (node.type === 'link' && node.fields) {
      const url = node.fields.url || node.url
      const linkType = node.fields.linkType || node.linkType

      // Check if it's a custom link to parcs-ims.ch with a file extension
      if (linkType === 'custom' && url && typeof url === 'string' && isLegacyDocumentUrl(url)) {
        links.push({
          url,
          fieldPath: [...fieldPath, ...nodePath],
          context: node,
          parentEntity,
          fieldLabel,
          locationPath: buildLocationPath(parentEntity, fieldLabel),
        })
      }
    }

    // Handle array of nodes
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        traverseNode(item, [...nodePath, String(index)])
      })
      return
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any, index: number) => {
        traverseNode(child, [...nodePath, 'children', String(index)])
      })
    }

    // Check for nested content in various formats
    if (node.root) {
      traverseNode(node.root, [...nodePath, 'root'])
    }

    // Some rich text formats might have content property
    if (node.content) {
      traverseNode(node.content, [...nodePath, 'content'])
    }

    // Handle any other properties that might contain nodes
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
        traverseNode(value, [...nodePath, key])
      }
    }
  }

  traverseNode(richText)
  return links
}

/**
 * Get unique legacy URLs from a list of links
 */
export function getUniqueUrls(links: LegacyLink[]): string[] {
  return Array.from(new Set(links.map((link) => link.url)))
}
