import type { File as PayloadFile, PayloadRequest } from 'payload'

import path from 'node:path'

import { withoutDocumentUsage } from '@/lib/document-usage'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

import type { FetchLegacyDocsTracker } from './statistics-tracker'

import { EXCLUDED_EXTENSIONS, LEGACY_DOMAINS } from './scan-legacy-links'

/**
 * The file behind a legacy url, ready for a Payload upload
 */
interface LegacyFile {
  file: PayloadFile
  filename: string
}

/**
 * Validation result for URL security checks
 */
interface ValidationResult {
  error?: string
  valid: boolean
}

/**
 * A legacy host that accepts the connection and never answers holds the request for undici's
 * 300-second idle timeout otherwise. The abort covers the headers and the body alike.
 */
export const DOWNLOAD_TIMEOUT_MS = 30_000

/** The whole body sits on the heap before the create, so the migration refuses a larger file. */
export const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024

/**
 * Download a document from an external URL and create it in Payload CMS
 *
 * This is phase 1 of the migration, and no transaction is open. A failed download and a failed
 * create both answer null, so the caller skips the link and the run continues.
 */
export async function downloadExternalDocument(
  url: string,
  organisationId: number,
  req: PayloadRequest,
  tracker: FetchLegacyDocsTracker,
): Promise<null | number> {
  const recordFailure = (error: unknown, message: string) => {
    const reason = error instanceof Error ? error.message : String(error)
    req.payload.logger.error({ error: reason, url }, message)
    tracker.addError({ error: reason, timestamp: Date.now(), url })
  }

  let download: LegacyFile

  // No Payload call runs here, so a failure is recorded and the link is skipped.
  try {
    download = await fetchLegacyFile(url)
  } catch (error) {
    recordFailure(error, 'Failed to download a legacy document')
    return null
  }

  // The create commits on its own connection, because the request carries no transaction id.
  // A failure here leaves nothing to roll back, so it is recorded and skipped as well.
  // The opt-out keeps the Documents afterRead hook from scanning the usage of the new row.
  try {
    const document = await req.payload.create({
      collection: 'documents',
      data: {
        description: `Migrated from legacy URL: ${url}`,
        name: download.filename,
        organisation: getIdFromRelation(organisationId),
      },
      file: download.file,
      req: withoutDocumentUsage(req),
    })

    return document.id as number
  } catch (error) {
    recordFailure(error, 'Failed to create the legacy document')
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
 * Fetches the body behind a validated url, bounded in time and in size. Every failure throws.
 */
async function downloadWithLimits(url: string): Promise<Buffer> {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error(`Download timed out after ${DOWNLOAD_TIMEOUT_MS} ms`)),
    DOWNLOAD_TIMEOUT_MS,
  )

  try {
    // `validateLegacyUrl` checks the scheme, the domain allowlist, the port and the private
    // ranges of this url alone. A followed redirect would reach any host past all four checks,
    // so a 3xx stays unfollowed and fails the `ok` test below.
    const response = await fetch(url, { redirect: 'manual', signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
    }

    return await readBodyWithCap(response, MAX_DOWNLOAD_BYTES)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Downloads the file behind a legacy url. Every failure throws, and no Payload call runs here.
 */
async function fetchLegacyFile(url: string): Promise<LegacyFile> {
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
  const buffer = await downloadWithLimits(url)

  // Generate a unique filename to avoid conflicts
  const timestamp = Date.now()
  const uniqueFilename = `legacy_${timestamp}_${filename}`

  return {
    file: {
      data: buffer,
      mimetype: mimeType,
      name: uniqueFilename,
      size: buffer.length,
    },
    filename,
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
 * Reads the body chunk by chunk, so an oversized file is refused before it fills the heap.
 * A declared length above the cap is refused before the first byte.
 */
async function readBodyWithCap(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get('content-length'))

  if (declaredLength > maxBytes) {
    throw new Error(`Download exceeds ${maxBytes} bytes: ${declaredLength} bytes declared`)
  }

  if (!response.body) {
    return Buffer.from(await response.arrayBuffer())
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  let chunk = await reader.read()

  while (!chunk.done) {
    received += chunk.value.byteLength

    if (received > maxBytes) {
      await reader.cancel()
      throw new Error(`Download exceeds ${maxBytes} bytes`)
    }

    chunks.push(chunk.value)
    chunk = await reader.read()
  }

  return Buffer.concat(chunks)
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
