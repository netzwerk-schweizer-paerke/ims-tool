import type { File as PayloadFile, PayloadRequest } from 'payload'

import path from 'node:path'

import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

import type { FetchLegacyDocsTracker } from './statistics-tracker'

import { EXCLUDED_EXTENSIONS, LEGACY_DOMAINS } from './scan-legacy-links'

/**
 * Validation result for URL security checks
 */
interface ValidationResult {
  error?: string
  valid: boolean
}

/**
 * Download a document from an external URL and create it in Payload CMS
 */
export async function downloadExternalDocument(
  url: string,
  organisationId: number,
  req: PayloadRequest,
  tracker: FetchLegacyDocsTracker,
): Promise<null | number> {
  try {
    // Validate URL for security before any processing
    const validation = validateLegacyUrl(url)
    if (!validation.valid) {
      throw new Error(`URL validation failed: ${validation.error}`)
    }

    // Extract filename from URL
    const urlParts = new URL(url)
    const pathname = urlParts.pathname
    const filename = path.basename(pathname) || 'document'

    // Determine file extension and MIME type
    const ext = path.extname(filename).toLowerCase()
    const mimeType = getMimeType(ext)

    // Download the file (now safely validated)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
    }

    // Get file data
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now()
    const uniqueFilename = `legacy_${timestamp}_${filename}`

    // Create file object for Payload upload
    const file: PayloadFile = {
      data: buffer,
      mimetype: mimeType,
      name: uniqueFilename,
      size: buffer.length,
    }

    // Create document with file directly
    const document = await req.payload.create({
      collection: 'documents',
      data: {
        description: `Migrated from legacy URL: ${url}`,
        name: filename,
        organisation: getIdFromRelation(organisationId),
      },
      file,
      req,
    })

    return document.id as number
  } catch (error) {
    console.error(`Failed to download document from ${url}:`, error)
    tracker.addError({
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      url,
    })
    return null
  }
}

/**
 * Extract a meaningful identifier from a parcs-ims.ch URL
 * Since URLs are file paths, we'll use the filename as identifier
 */
export function extractDocumentNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = decodeURIComponent(urlObj.pathname)

    // Get the filename from the path
    const segments = pathname.split('/')
    const filename = segments.at(-1) || 'document'

    // Remove file extension for cleaner name
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

    // Clean up special characters
    return nameWithoutExt.replaceAll('%20', ' ').replaceAll('_', ' ').trim()
  } catch {
    return 'document'
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rar': 'application/x-rar-compressed',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Validate legacy URL for security and compliance
 * Protects against SSRF attacks by enforcing strict URL validation
 */
function validateLegacyUrl(url: string): ValidationResult {
  try {
    const urlObj = new URL(url)

    // 1. Only allow HTTPS protocol to prevent protocol-based attacks
    if (urlObj.protocol !== 'https:') {
      return { error: 'Only HTTPS URLs are allowed', valid: false }
    }

    // 2. Block private IP ranges to prevent SSRF attacks
    const hostname = urlObj.hostname.toLowerCase()

    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('127.')) {
      return { error: 'Private IP addresses are not allowed', valid: false }
    }

    // Block private IPv4 ranges (RFC 1918)
    const ipRegex = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/
    const ipMatch = hostname.match(ipRegex)
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number)

      // 10.0.0.0/8
      if (a === 10) {
        return { error: 'Private IP addresses are not allowed', valid: false }
      }

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { error: 'Private IP addresses are not allowed', valid: false }
      }

      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { error: 'Private IP addresses are not allowed', valid: false }
      }

      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) {
        return { error: 'Link-local addresses are not allowed', valid: false }
      }
    }

    // Block IPv6 private ranges
    if (hostname.includes(':')) {
      // Block IPv6 localhost
      if (hostname === '::1') {
        return { error: 'Private IP addresses are not allowed', valid: false }
      }

      // Block IPv6 private ranges
      if (
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('fe8') ||
        hostname.startsWith('fe9') ||
        hostname.startsWith('fea') ||
        hostname.startsWith('feb')
      ) {
        return { error: 'Private IP addresses are not allowed', valid: false }
      }
    }

    // 3. Enforce domain whitelist using LEGACY_DOMAINS
    const isAllowedDomain = LEGACY_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain),
    )

    if (!isAllowedDomain) {
      return { error: 'Domain not in allowed list', valid: false }
    }

    // 4. Block dangerous ports
    const port = urlObj.port
    if (port) {
      const portNum = parseInt(port, 10)
      const dangerousPorts = [
        22, 23, 25, 53, 80, 110, 135, 139, 143, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5984,
        6379, 8080, 9200, 11_211, 27_017,
      ]

      if (dangerousPorts.includes(portNum)) {
        return { error: 'Port not allowed', valid: false }
      }
    }

    // 5. Check file extension against excluded list
    const pathname = decodeURIComponent(urlObj.pathname).toLowerCase()
    const isExcluded = EXCLUDED_EXTENSIONS.some((ext) => pathname.endsWith(ext.toLowerCase()))

    if (isExcluded) {
      return { error: 'File type not allowed', valid: false }
    }

    // 6. Ensure URL has a file extension (documents should have extensions)
    const lastSegment = pathname.split('/').pop() || ''
    if (!lastSegment.includes('.')) {
      return { error: 'URL must point to a file with extension', valid: false }
    }

    return { valid: true }
  } catch {
    return { error: 'Invalid URL format', valid: false }
  }
}
