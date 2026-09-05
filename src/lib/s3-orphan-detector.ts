/**
 * Find the S3 objects that no Payload record points at, and delete the ones an operator names.
 *
 * Both entry points run inside the server, through `src/endpoints/s3-orphan-*.ts`. There is no
 * command-line entry point, so every message goes to the Payload logger.
 */

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { groupBy, orderBy } from 'es-toolkit'
import { CollectionSlug, Payload, PayloadRequest } from 'payload'

import type { Document, DocumentsPublic, Media } from '../payload-types'

import { getS3Client } from './s3-client'
import { buildStoredKeys } from './s3-orphan-keys'
import { coversWholeBucket, isTooRecentToDelete, referenceScanFailed } from './s3-orphan-safety'

interface OrphanDeletionFailure {
  key: string
  message: string
}

interface OrphanDeletionResult {
  deleted: string[]
  failed: OrphanDeletionFailure[]
  freedBytes: number
  /** Set when the request was refused whole. Nothing is deleted in that case. */
  refusedReason: 'covers-whole-bucket' | 'reference-scan-failed' | 'reference-scan-incomplete' | null
  requested: number
  skipped: OrphanDeletionSkip[]
}

interface OrphanDeletionSkip {
  key: string
  /**
   * `referenced` means a record now points at it. `missing` means the bucket has no object.
   * `too-recent` means the bucket wrote it inside the upload window.
   */
  reason: 'missing' | 'referenced' | 'too-recent'
}

interface OrphanReport {
  /**
   * Every orphaned key. `orphansByPrefix[].objects` caps at the 10 largest per prefix for
   * display, so it is not the deletion list. The delete endpoint takes keys from here.
   */
  orphanKeys: string[]
  orphansByPrefix: Array<{
    count: number
    objects: Array<{
      key: string
      lastModified: string
      size: number
      sizeFormatted: string
    }>
    prefix: string
    totalSize: number
  }>
  summary: {
    /** Bucket objects that a reference points at. Zero with references present means a broken scan. */
    matchedReferences: number
    orphanedCount: number
    /** False when the scan missed rows. The report is then unusable, and a deletion refuses. */
    scanComplete: boolean
    totalOrphanedSize: number
    totalOrphanedSizeFormatted: string
    totalReferencedFiles: number
    totalS3Objects: number
  }
  timestamp: string
}

interface ReferenceScan {
  /**
   * False when a query failed, a page came back short, or a row named a file the scan could not
   * place. A deletion refuses on false, because a missed reference makes a live object an orphan.
   */
  complete: boolean
  references: Set<string>
}

interface S3Object {
  key: string
  lastModified: Date
  prefix: string
  size: number
}

class S3OrphanDetector {
  private bucket: string
  private logger: Payload['logger']
  private payloadRequest: PayloadRequest
  private s3Client: S3Client
  private readonly TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

  constructor(req: PayloadRequest) {
    this.payloadRequest = req
    this.logger = req.payload.logger
    this.bucket = process.env.S3_BUCKET || ''
    this.s3Client = getS3Client()
  }

  /**
   * Delete the named objects, after a fresh check that each one is still an orphan.
   *
   * The caller sends the keys a report showed it. That report is a point-in-time read, so a
   * key can gain a reference between the report and the click. This re-reads the references
   * and the bucket, and it deletes only a key that is still unreferenced and still present.
   */
  async deleteOrphans(keys: readonly string[]): Promise<OrphanDeletionResult> {
    this.validateEnvironment()

    const requested = [...new Set(keys)]
    const [s3Objects, scan] = await Promise.all([
      this.listAllS3Objects(),
      this.collectPayloadFileReferences(),
    ])

    const objectByKey = new Map(s3Objects.map((object) => [object.key, object]))
    const deletable: string[] = []
    const skipped: OrphanDeletionSkip[] = []
    // One clock reading for the whole request, so two keys never land on different sides.
    const now = new Date()

    for (const key of requested) {
      if (scan.references.has(key)) {
        skipped.push({ key, reason: 'referenced' })
        continue
      }

      const object = objectByKey.get(key)

      if (!object) {
        skipped.push({ key, reason: 'missing' })
        continue
      }

      if (isTooRecentToDelete(object.lastModified, now)) {
        skipped.push({ key, reason: 'too-recent' })
        continue
      }

      deletable.push(key)
    }

    const refusedReason = this.refuseDeletion(scan, s3Objects, deletable.length)

    if (refusedReason) {
      return {
        deleted: [],
        failed: [],
        freedBytes: 0,
        refusedReason,
        requested: requested.length,
        skipped,
      }
    }

    const deleted: string[] = []
    const failed: OrphanDeletionFailure[] = []

    // `DeleteObjects` accepts at most 1000 keys per request. A throw on a later batch must not
    // discard the record of an earlier one, because a deletion is irreversible. Each batch
    // therefore reports its own outcome, and the loop continues.
    for (let start = 0; start < deletable.length; start += 1000) {
      const batch = deletable.slice(start, start + 1000)

      try {
        const response = await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: false },
          }),
        )

        for (const entry of response.Deleted ?? []) {
          if (entry.Key) deleted.push(entry.Key)
        }

        for (const entry of response.Errors ?? []) {
          if (entry.Key) failed.push({ key: entry.Key, message: entry.Message ?? 'Unknown error' })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        for (const key of batch) failed.push({ key, message })
      }
    }

    return {
      deleted,
      failed,
      freedBytes: deleted.reduce((sum, key) => sum + (objectByKey.get(key)?.size ?? 0), 0),
      refusedReason: null,
      requested: requested.length,
      skipped,
    }
  }

  public generateReport(
    s3Objects: S3Object[],
    scan: ReferenceScan,
    orphans: S3Object[],
  ): OrphanReport {
    const totalOrphanedSize = orphans.reduce((sum, obj) => sum + obj.size, 0)

    // Use es-toolkit groupBy for better performance and type safety
    const orphansByPrefix = groupBy(orphans, (orphan) => orphan.prefix)

    // Sort prefixes by count (descending) for better reporting
    const sortedPrefixEntries = orderBy(
      Object.entries(orphansByPrefix),
      [([_, objs]: [string, S3Object[]]) => objs.length],
      ['desc'],
    )

    return {
      orphanKeys: orphans.map((orphan) => orphan.key),
      orphansByPrefix: sortedPrefixEntries.map(([prefix, objs]) => ({
        count: objs.length,
        objects: orderBy(
          objs.map((obj) => ({
            key: obj.key,
            lastModified: obj.lastModified.toISOString(),
            size: obj.size,
            sizeFormatted: this.formatBytes(obj.size),
          })),
          ['size'],
          ['desc'],
        ).slice(0, 10), // Show only top 10 objects per prefix for performance
        prefix,
        totalSize: objs.reduce((sum, obj) => sum + obj.size, 0),
      })),
      summary: {
        matchedReferences: s3Objects.filter((object) => scan.references.has(object.key)).length,
        orphanedCount: orphans.length,
        scanComplete: scan.complete,
        totalOrphanedSize,
        totalOrphanedSizeFormatted: this.formatBytes(totalOrphanedSize),
        totalReferencedFiles: scan.references.size,
        totalS3Objects: s3Objects.length,
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Generate orphan detection report data without console output
   * @returns Promise<OrphanReport> - Comprehensive report data
   */
  async generateReportData(): Promise<OrphanReport> {
    // Validate environment
    this.validateEnvironment()

    // List all S3 objects
    const s3Objects = await this.listAllS3Objects()

    // Collect Payload file references
    const scan = await this.collectPayloadFileReferences()

    // Find orphans
    const orphans = this.findOrphans(s3Objects, scan.references)

    // Generate and return report
    return this.generateReport(s3Objects, scan, orphans)
  }

  /**
   * Read every upload row of the installation, and build its keys from the stored columns.
   *
   * This is the authoritative half of the scan. A key it misses makes a live object read as an
   * orphan, so every miss marks the whole scan incomplete.
   */
  private async collectDirectFileReferences(scan: ReferenceScan): Promise<void> {
    const collections = ['documents', 'documents-public', 'media'] as const

    for (const collection of collections) {
      try {
        const result = await this.payloadRequest.payload.find({
          collection,
          depth: 0,
          limit: 0,
          // Every park, never the selected one. An access-checked read returns the selected
          // park alone, and every other park's files then read as orphans.
          overrideAccess: true,
        })

        if (result.docs.length !== result.totalDocs) {
          scan.complete = false
          this.logger.warn(
            { collection, read: result.docs.length, total: result.totalDocs },
            '[S3Orphans] Short page: the scan did not read every row',
          )
        }

        let unbuildableRows = 0

        for (const doc of result.docs as Array<Document | DocumentsPublic | Media>) {
          const { keys, unbuildable } = buildStoredKeys(doc)

          if (unbuildable) {
            unbuildableRows += 1
            scan.complete = false
          }

          for (const key of keys) scan.references.add(key)
        }

        if (unbuildableRows > 0) {
          this.logger.warn(
            { collection, unbuildableRows },
            '[S3Orphans] Rows name a file the scan cannot place',
          )
        }

        this.logger.info(
          { collection, rows: result.docs.length },
          '[S3Orphans] Read an upload collection',
        )
      } catch (error) {
        scan.complete = false
        this.logger.error(
          { collection, error: error instanceof Error ? error.message : String(error) },
          '[S3Orphans] Could not scan an upload collection',
        )
      }
    }
  }

  private async collectPayloadFileReferences(): Promise<ReferenceScan> {
    const scan: ReferenceScan = { complete: true, references: new Set<string>() }

    await this.collectDirectFileReferences(scan)
    await this.collectRichTextFileReferences(scan)

    this.logger.info(
      { complete: scan.complete, references: scan.references.size },
      '[S3Orphans] Collected the Payload file references',
    )
    return scan
  }

  /**
   * Add whatever the rich text points at, on top of the row scan.
   *
   * This half never subtracts. It catches an absolute S3 link that somebody pasted into a field,
   * which owns no upload row of its own.
   */
  private async collectRichTextFileReferences(scan: ReferenceScan): Promise<void> {
    const collections: CollectionSlug[] = ['activities', 'task-flows', 'task-lists']

    for (const collection of collections) {
      try {
        const result = await this.payloadRequest.payload.find({
          collection,
          depth: 1, // Get one level of relationships for upload references
          limit: 0, // Get all records for comprehensive scan
          overrideAccess: true,
        })

        if (result.docs.length !== result.totalDocs) {
          scan.complete = false
          this.logger.warn(
            { collection, read: result.docs.length, total: result.totalDocs },
            '[S3Orphans] Short page: the scan did not read every row',
          )
        }

        let refsFound = 0
        for (const doc of result.docs) {
          const prevSize = scan.references.size
          this.scanDocumentForFileReferences(doc, scan.references)
          refsFound += scan.references.size - prevSize
        }

        this.logger.info(
          { collection, references: refsFound, rows: result.docs.length },
          '[S3Orphans] Scanned the rich text content',
        )
      } catch (error) {
        scan.complete = false
        this.logger.error(
          { collection, error: error instanceof Error ? error.message : String(error) },
          '[S3Orphans] Could not scan a rich text collection',
        )
      }
    }
  }

  private extractS3Key(url: string): null | string {
    if (!url) return null

    try {
      const urlObj = new URL(url)
      return urlObj.pathname.slice(1)
    } catch {
      const parts = url.split('/')
      const bucketIndex = parts.indexOf(this.bucket)
      if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
        return parts.slice(bucketIndex + 1).join('/')
      }
      return null
    }
  }

  private findOrphans(s3Objects: S3Object[], payloadReferences: Set<string>): S3Object[] {

    const orphans = s3Objects.filter((obj) => !payloadReferences.has(obj.key))

    this.logger.info({ orphans: orphans.length }, '[S3Orphans] Found the orphaned objects')
    return orphans
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private getObjectPrefix(key: string): string {
    const parts = key.split('/')
    return parts[0] || 'unknown'
  }

  private async listAllS3Objects(): Promise<S3Object[]> {
    const objects: S3Object[] = []
    let continuationToken: string | undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })

      const response: ListObjectsV2CommandOutput = await this.s3Client.send(command)

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (!(obj.Key && obj.Size !== undefined && obj.LastModified)) {
          	continue;
          }

          const prefix = this.getObjectPrefix(obj.Key)
          objects.push({
            key: obj.Key,
            lastModified: obj.LastModified,
            prefix,
            size: obj.Size,
          })
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    this.logger.info({ objects: objects.length }, '[S3Orphans] Listed the bucket')
    return objects
  }

  /**
   * Decide whether the whole request must be refused, before a single object is deleted.
   *
   * Each test answers a different question. The scan may have missed rows, it may have built
   * every key wrongly, or the request may cover the bucket. Any one of those makes a deletion
   * unsafe, and none of them depends on how many keys the caller sent.
   */
  private refuseDeletion(
    scan: ReferenceScan,
    s3Objects: S3Object[],
    deletableCount: number,
  ): OrphanDeletionResult['refusedReason'] {
    if (!scan.complete) return 'reference-scan-incomplete'

    const matched = s3Objects.filter((object) => scan.references.has(object.key)).length

    if (referenceScanFailed(matched, scan.references.size)) return 'reference-scan-failed'
    if (coversWholeBucket(deletableCount, s3Objects.length)) return 'covers-whole-bucket'

    return null
  }

  private scanDocumentForFileReferences(obj: unknown, fileReferences: Set<string>): void {
    if (!obj || typeof obj !== 'object') return

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.scanDocumentForFileReferences(item, fileReferences)
      }
      return
    }

    // A populated upload relation carries the same two columns as its own row, so the key needs
    // no URL parse here either.
    if ('filename' in obj && 'prefix' in obj) {
      for (const key of buildStoredKeys(obj).keys) fileReferences.add(key)
    }

    // Check for upload/relationship nodes in rich text
    const uploadValue = 'type' in obj && obj.type === 'upload' && 'value' in obj ? obj.value : null
    if (uploadValue && typeof uploadValue === 'object') {
      if ('url' in uploadValue && typeof uploadValue.url === 'string') {
        const key = this.extractS3Key(uploadValue.url)
        if (key) fileReferences.add(key)
      }
      if ('thumbnailURL' in uploadValue && typeof uploadValue.thumbnailURL === 'string') {
        const key = this.extractS3Key(uploadValue.thumbnailURL)
        if (key) fileReferences.add(key)
      }
      if ('sizes' in uploadValue && uploadValue.sizes && typeof uploadValue.sizes === 'object') {
        for (const sizeData of Object.values(uploadValue.sizes)) {
          if (!(typeof sizeData === 'object' && sizeData && 'url' in sizeData)) {
          	continue;
          }

          const sizeUrl = sizeData.url
          if (typeof sizeUrl !== 'string') continue

          const key = this.extractS3Key(sizeUrl)
          if (key) fileReferences.add(key)
        }
      }
    }

    // Handle relationship references to file collections
    const relationTo = 'relationTo' in obj ? obj.relationTo : undefined
    const relationValue = 'value' in obj ? obj.value : undefined
    if (
      typeof relationTo === 'string' &&
      ['documents', 'documents-public', 'media'].includes(relationTo) &&
      relationValue &&
      typeof relationValue === 'object' &&
      'url' in relationValue &&
      typeof relationValue.url === 'string'
    ) {
      const key = this.extractS3Key(relationValue.url)
      if (key) fileReferences.add(key)
    }

    // Handle direct upload field references. The original filename check was redundant, because
    // the url had to be truthy either way.
    if ('url' in obj && typeof obj.url === 'string') {
      const key = this.extractS3Key(obj.url)
      if (key) fileReferences.add(key)
    }

    // Recursively scan nested objects
    for (const value of Object.values(obj)) {
      this.scanDocumentForFileReferences(value, fileReferences)
    }
  }

  private validateEnvironment(): void {
    const required = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_ENDPOINT']
    const missing = required.filter((key) => {
      const value = process.env[key]
      return !value || value.trim() === ''
    })

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}

export { S3OrphanDetector }
export type { OrphanDeletionFailure, OrphanDeletionResult, OrphanDeletionSkip, OrphanReport }
