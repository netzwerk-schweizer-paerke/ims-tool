import type { PayloadRequest } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'

import type { FetchLegacyDocsTracker } from './statistics-tracker'

export interface LegacyLink {
  context: unknown
  fieldLabel: string // Human-readable field name (e.g., "Input")
  fieldPath: string[]
  locationPath: string // Full path context (e.g., "Introduction block > Input field")
  parentEntity: string // Human-readable parent entity (e.g., "Task Group #1")
  url: string
}

type AdminLanguage = keyof typeof I18nCollection.fieldLabel.description

/**
 * Recursively scan an object for legacy document links in rich text fields
 */
export async function scanLegacyLinks(
  data: unknown,
  tracker: FetchLegacyDocsTracker,
  req: PayloadRequest,
  fieldPath: string[] = [],
  parentContext: { entity?: string; label?: string } = {},
): Promise<LegacyLink[]> {
  const legacyLinks: LegacyLink[] = []

  if (!isRecord(data)) {
    return legacyLinks
  }

  // Handle arrays
  if (Array.isArray(data)) {
    for (const [index, item] of data.entries()) {
      // Special handling for blocks array
      let itemLinks
      const blockType = isRecord(item) ? item.blockType : undefined
      if (fieldPath.at(-1) === 'blocks' && typeof blockType === 'string' && blockType) {
        const blockLabel = getBlockLabel(blockType, index, adminLanguage(req))
        itemLinks = await scanLegacyLinks(item, tracker, req, [...fieldPath, String(index)], {
          entity: blockLabel,
          label: blockLabel,
        })
      } else {
        itemLinks = await scanLegacyLinks(
          item,
          tracker,
          req,
          [...fieldPath, String(index)],
          parentContext,
        )
      }
      legacyLinks.push(...itemLinks)
    }
    return legacyLinks
  }

  // Check if this is a rich text field
  if (isRichTextField(data)) {
    tracker.increment('processedFields')
    const fieldLabel = getFieldLabel(fieldPath, adminLanguage(req))
    const links = extractLegacyLinksFromRichText(
      data,
      fieldPath,
      parentContext.entity || I18nCollection.fieldLabel.activity[adminLanguage(req)],
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
    if (['infos', 'io', 'relations'].includes(key)) {
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
 * Get unique legacy URLs from a list of links
 */
export function getUniqueUrls(links: LegacyLink[]): string[] {
  return Array.from(new Set(links.map((link) => link.url)))
}

/**
 * Build location path for user display
 */
// Payload resolves the admin language from the payload-lng cookie, then Accept-Language, then
// i18n.fallbackLanguage. Only the four configured languages carry a label, so anything else
// falls back to the configured default.
function adminLanguage(req: PayloadRequest): AdminLanguage {
  const language = req.i18n?.language
  return (['en', 'fr', 'it'] as string[]).includes(language) ? (language as AdminLanguage) : 'de'
}

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
  richText: unknown,
  fieldPath: string[],
  parentEntity: string,
  fieldLabel: string,
): LegacyLink[] {
  const links: LegacyLink[] = []

  // Recursive function to traverse rich text nodes
  function traverseNode(node: unknown, nodePath: string[] = []): void {
    if (!isRecord(node)) {
      return
    }

    // Check if this is a link node with a legacy URL
    const nodeFields = isRecord(node.fields) ? node.fields : undefined
    if (node.type === 'link' && nodeFields) {
      const url = nodeFields.url || node.url
      const linkType = nodeFields.linkType || node.linkType

      // Check if it's a custom link to parcs-ims.ch with a file extension
      if (linkType === 'custom' && url && typeof url === 'string' && isLegacyDocumentUrl(url)) {
        links.push({
          context: node,
          fieldLabel,
          fieldPath: [...fieldPath, ...nodePath],
          locationPath: buildLocationPath(parentEntity, fieldLabel),
          parentEntity,
          url,
        })
      }
    }

    // Handle array of nodes
    if (Array.isArray(node)) {
      for (const [index, item] of node.entries()) {
        traverseNode(item, [...nodePath, String(index)])
      }
      return
    }

    // Traverse children
    const children = node.children
    if (Array.isArray(children)) {
      for (const [index, child] of children.entries()) {
        traverseNode(child, [...nodePath, 'children', String(index)])
      }
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
 * Get human-readable block label
 */
function getBlockLabel(blockType: string, index: number, lang: AdminLanguage): string {
  const blockLabels: Record<string, string> = {
    'activity-io': I18nCollection.blockLabel.inputOutputTaskGroup.singular[lang],
    'activity-task': I18nCollection.blockLabel.taskGroup.singular[lang],
  }
  const label = blockLabels[blockType] || I18nCollection.fieldLabel.block[lang]
  return `${label} #${index + 1}`
}

/**
 * Get human-readable field label from field path
 */
function getFieldLabel(fieldPath: string[], lang: AdminLanguage): string {
  const fieldLabels: Record<string, string> = {
    content: I18nCollection.fieldLabel.content[lang],
    description: I18nCollection.fieldLabel.description[lang],
    input: I18nCollection.fieldLabel.input[lang],
    keypoints: I18nCollection.fieldLabel.keypoints[lang],
    norms: I18nCollection.fieldLabel.normRequirements[lang],
    output: I18nCollection.fieldLabel.output[lang],
    support: I18nCollection.fieldLabel.activitySupport[lang],
    text: I18nCollection.fieldLabel.text[lang],
    tools: I18nCollection.fieldLabel.tools[lang],
    topic: I18nCollection.fieldLabel.topic[lang],
  }

  // Get the last meaningful field name from the path
  for (let i = fieldPath.length - 1; i >= 0; i--) {
    const segment = fieldPath[i]
    if (fieldLabels[segment]) {
      return fieldLabels[segment]
    }
  }

  // Default to the last non-numeric segment
  const lastField = fieldPath.findLast((p) => Number.isNaN(Number(p)))
  return fieldLabels[lastField || ''] || lastField || I18nCollection.fieldLabel.field[lang]
}

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

    // If it has an extension and it's not excluded, it's a document
    const isExcluded = EXCLUDED_EXTENSIONS.some((ext) => pathname.endsWith(ext))
    return !isExcluded
  } catch {
    return false
  }
}

/**
 * Check if a value is a non-null object. An array passes as well, because the walkers
 * above treat an array of nodes as a valid rich text shape.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Check if a field appears to be a rich text field
 */
function isRichTextField(data: unknown): boolean {
  // Or they might be an array of content blocks
  if (Array.isArray(data)) {
    return data.some((item) => isRecord(item) && item.type && item.children)
  }

  if (!isRecord(data)) {
    return false
  }

  // Rich text fields typically have a root property with children
  const root = data.root
  return isRecord(root) && root.type === 'root' && Array.isArray(root.children)
}
