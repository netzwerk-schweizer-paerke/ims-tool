import type { PayloadRequest } from 'payload'
import path from 'path'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { LEGACY_DOMAINS, EXCLUDED_EXTENSIONS } from './scan-legacy-links'

/**
 * Validation result for URL security checks
 */
interface ValidationResult {
  valid: boolean
  error?: string
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
      return { valid: false, error: 'Only HTTPS URLs are allowed' }
    }

    // 2. Block private IP ranges to prevent SSRF attacks
    const hostname = urlObj.hostname.toLowerCase()

    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('127.')) {
      return { valid: false, error: 'Private IP addresses are not allowed' }
    }

    // Block private IPv4 ranges (RFC 1918)
    const ipRegex = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/
    const ipMatch = hostname.match(ipRegex)
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number)

      // 10.0.0.0/8
      if (a === 10) {
        return { valid: false, error: 'Private IP addresses are not allowed' }
      }

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { valid: false, error: 'Private IP addresses are not allowed' }
      }

      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { valid: false, error: 'Private IP addresses are not allowed' }
      }

      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) {
        return { valid: false, error: 'Link-local addresses are not allowed' }
      }
    }

    // Block IPv6 private ranges
    if (hostname.includes(':')) {
      // Block IPv6 localhost
      if (hostname === '::1') {
        return { valid: false, error: 'Private IP addresses are not allowed' }
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
        return { valid: false, error: 'Private IP addresses are not allowed' }
      }
    }

    // 3. Enforce domain whitelist using LEGACY_DOMAINS
    const isAllowedDomain = LEGACY_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain),
    )

    if (!isAllowedDomain) {
      return { valid: false, error: 'Domain not in allowed list' }
    }

    // 4. Block dangerous ports
    const port = urlObj.port
    if (port) {
      const portNum = parseInt(port, 10)
      const dangerousPorts = [
        22, 23, 25, 53, 80, 110, 135, 139, 143, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5984,
        6379, 8080, 9200, 11211, 27017,
      ]

      if (dangerousPorts.includes(portNum)) {
        return { valid: false, error: 'Port not allowed' }
      }
    }

    // 5. Check file extension against excluded list
    const pathname = decodeURIComponent(urlObj.pathname).toLowerCase()
    const isExcluded = EXCLUDED_EXTENSIONS.some((ext) => pathname.endsWith(ext.toLowerCase()))

    if (isExcluded) {
      return { valid: false, error: 'File type not allowed' }
    }

    // 6. Ensure URL has a file extension (documents should have extensions)
    const lastSegment = pathname.split('/').pop() || ''
    if (!lastSegment.includes('.')) {
      return { valid: false, error: 'URL must point to a file with extension' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Download a document from an external URL and create it in Payload CMS
 */
export async function downloadExternalDocument(
  url: string,
  organisationId: number,
  req: PayloadRequest,
  tracker: any,
): Promise<number | null> {
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
    const file = {
      data: buffer,
      mimetype: mimeType,
      name: uniqueFilename,
      size: buffer.length,
    } as any

    // Create document with file directly
    const document = await req.payload.create({
      collection: 'documents',
      data: {
        name: filename,
        description: `Migrated from legacy URL: ${url}`,
        organisation: getIdFromRelation(organisationId),
      },
      file,
      req,
    })

    return document.id as number
  } catch (error) {
    console.error(`Failed to download document from ${url}:`, error)
    tracker.addError({
      url,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    })
    return null
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  }

  return mimeTypes[ext] || 'application/octet-stream'
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
    const filename = segments[segments.length - 1] || 'document'

    // Remove file extension for cleaner name
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

    // Clean up special characters
    return nameWithoutExt.replace(/%20/g, ' ').replace(/_/g, ' ').trim()
  } catch {
    return 'document'
  }
}
