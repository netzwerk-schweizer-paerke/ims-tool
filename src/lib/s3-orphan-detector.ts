/**
 * S3 Orphan Detection Utility for Payload CMS
 * Optimized version with better error handling and timeout management
 */

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { groupBy, orderBy } from 'es-toolkit'
import { writeFileSync } from 'node:fs'
import { CollectionSlug, PayloadRequest } from 'payload'

import type { Document, DocumentsPublic, Media } from '../payload-types'

import { getS3Client } from './s3-client'
import { coversWholeBucket } from './s3-orphan-safety'

interface OrphanDeletionFailure {
  key: string
  message: string
}

interface OrphanDeletionResult {
  deleted: string[]
  failed: OrphanDeletionFailure[]
  freedBytes: number
  /** Set when the request was refused whole. Nothing is deleted in that case. */
  refusedReason: 'covers-whole-bucket' | null
  requested: number
  skipped: OrphanDeletionSkip[]
}

interface OrphanDeletionSkip {
  key: string
  /** `referenced` means a record now points at it. `missing` means the bucket has no object. */
  reason: 'missing' | 'referenced'
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
    orphanedCount: number
    totalOrphanedSize: number
    totalOrphanedSizeFormatted: string
    totalReferencedFiles: number
    totalS3Objects: number
  }
  timestamp: string
}

interface S3Object {
  key: string
  lastModified: Date
  prefix: string
  size: number
}

class S3OrphanDetector {
  private bucket: string
  private payloadRequest: PayloadRequest
  private s3Client: S3Client
  private readonly TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

  constructor(req: PayloadRequest) {
    this.payloadRequest = req
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
    const [s3Objects, payloadReferences] = await Promise.all([
      this.listAllS3Objects(),
      this.collectPayloadFileReferences(),
    ])

    const sizeByKey = new Map(s3Objects.map((object) => [object.key, object.size]))
    const deletable: string[] = []
    const skipped: OrphanDeletionSkip[] = []

    for (const key of requested) {
      if (payloadReferences.has(key)) {
        skipped.push({ key, reason: 'referenced' })
        continue
      }

      if (!sizeByKey.has(key)) {
        skipped.push({ key, reason: 'missing' })
        continue
      }

      deletable.push(key)
    }

    // A sweep that names every object has failed to build the reference set, not found that
    // every file is unused. Deleting on that answer empties the bucket.
    if (coversWholeBucket(deletable.length, s3Objects.length)) {
      return {
        deleted: [],
        failed: [],
        freedBytes: 0,
        refusedReason: 'covers-whole-bucket',
        requested: requested.length,
        skipped,
      }
    }

    const deleted: string[] = []
    const failed: OrphanDeletionFailure[] = []

    // `DeleteObjects` accepts at most 1000 keys per request.
    for (let start = 0; start < deletable.length; start += 1000) {
      const batch = deletable.slice(start, start + 1000)
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
    }

    return {
      deleted,
      failed,
      freedBytes: deleted.reduce((sum, key) => sum + (sizeByKey.get(key) ?? 0), 0),
      refusedReason: null,
      requested: requested.length,
      skipped,
    }
  }

  async execute(): Promise<void> {
    try {
      console.log('🚀 Starting S3 Orphan Detection...')
      const startTime = Date.now()

      // Validate environment
      this.validateEnvironment()

      // List all S3 objects
      const s3Objects = await this.listAllS3Objects()

      // Collect Payload file references
      const payloadReferences = await this.collectPayloadFileReferences()

      // Find orphans
      const orphans = this.findOrphans(s3Objects, payloadReferences)

      // Generate report
      const report = this.generateReport(s3Objects, payloadReferences, orphans)

      // Display report
      this.displayReport(report)

      // Save detailed report
      const reportFilename = `.tmp-workspace/s3-orphan-report-${Date.now()}.json`
      writeFileSync(reportFilename, JSON.stringify(report, null, 2))
      console.log(String.raw`\n💾 Detailed report saved to: ${reportFilename}`)

      const totalTime = Math.round((Date.now() - startTime) / 1000)
      console.log(String.raw`\n✅ S3 Orphan Detection completed successfully in ${totalTime}s!`)
    } catch (error) {
      console.error('❌ Error during S3 orphan detection:', error)
      // Rethrow rather than process.exit(): this module is imported by the
      // s3-orphan-detection endpoint, so exiting here would take the server down.
      throw error
    }
  }

  public generateReport(
    s3Objects: S3Object[],
    payloadReferences: Set<string>,
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
        orphanedCount: orphans.length,
        totalOrphanedSize,
        totalOrphanedSizeFormatted: this.formatBytes(totalOrphanedSize),
        totalReferencedFiles: payloadReferences.size,
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
    const payloadReferences = await this.collectPayloadFileReferences()

    // Find orphans
    const orphans = this.findOrphans(s3Objects, payloadReferences)

    // Generate and return report
    return this.generateReport(s3Objects, payloadReferences, orphans)
  }

  private async collectDirectFileReferences(fileReferences: Set<string>): Promise<void> {
    // Process Media collection
    try {
      console.log(`  📄 Scanning media collection...`)
      const mediaResult = await this.payloadRequest.payload.find({
        collection: 'media',
        depth: 0, // No relations needed
        limit: 0, // Get all records
      })

      for (const doc of mediaResult.docs as Media[]) {
        // Main file URL
        if (doc.url) {
          const key = this.extractS3Key(doc.url)
          if (key) fileReferences.add(key)
        }

        // Thumbnail URL
        if (doc.thumbnailURL) {
          const key = this.extractS3Key(doc.thumbnailURL)
          if (key) fileReferences.add(key)
        }

        // Media collection size variants
        if (doc.sizes) {
          for (const sizeData of Object.values(doc.sizes)) {
            if (!(typeof sizeData === 'object' && sizeData && 'url' in sizeData)) {
            	continue;
            }

            const key = sizeData.url ? this.extractS3Key(sizeData.url) : null
            if (key) fileReferences.add(key)
          }
        }
      }
      console.log(`    ✅ Found ${mediaResult.docs.length} media records`)
    } catch (error) {
      console.warn(`    ⚠️  Warning: Could not scan media collection:`, error)
    }

    // Process Documents collection
    try {
      console.log(`  📄 Scanning documents collection...`)
      const documentsResult = await this.payloadRequest.payload.find({
        collection: 'documents',
        depth: 0, // No relations needed
        limit: 0, // Get all records
      })

      for (const doc of documentsResult.docs as Document[]) {
        // Main file URL
        if (doc.url) {
          const key = this.extractS3Key(doc.url)
          if (key) fileReferences.add(key)
        }

        // Thumbnail URL
        if (doc.thumbnailURL) {
          const key = this.extractS3Key(doc.thumbnailURL)
          if (key) fileReferences.add(key)
        }
      }
      console.log(`    ✅ Found ${documentsResult.docs.length} documents records`)
    } catch (error) {
      console.warn(`    ⚠️  Warning: Could not scan documents collection:`, error)
    }

    // Process Documents Public collection
    try {
      console.log(`  📄 Scanning documents-public collection...`)
      const documentsPublicResult = await this.payloadRequest.payload.find({
        collection: 'documents-public',
        depth: 0, // No relations needed
        limit: 0, // Get all records
      })

      for (const doc of documentsPublicResult.docs as DocumentsPublic[]) {
        // Main file URL
        if (doc.url) {
          const key = this.extractS3Key(doc.url)
          if (key) fileReferences.add(key)
        }

        // Thumbnail URL
        if (doc.thumbnailURL) {
          const key = this.extractS3Key(doc.thumbnailURL)
          if (key) fileReferences.add(key)
        }
      }
      console.log(`    ✅ Found ${documentsPublicResult.docs.length} documents-public records`)
    } catch (error) {
      console.warn(`    ⚠️  Warning: Could not scan documents-public collection:`, error)
    }
  }

  private async collectPayloadFileReferences(): Promise<Set<string>> {
    console.log('🔍 Collecting Payload file references...')

    const fileReferences = new Set<string>()

    // Direct file collection references
    await this.collectDirectFileReferences(fileReferences)

    // Rich text file references (with timeout protection)
    await this.collectRichTextFileReferences(fileReferences)

    console.log(`✅ Found ${fileReferences.size} unique file references in Payload`)
    return fileReferences
  }

  private async collectRichTextFileReferences(fileReferences: Set<string>): Promise<void> {
    const collections: CollectionSlug[] = ['activities', 'task-flows', 'task-lists']

    for (const collection of collections) {
      console.log(`  📝 Scanning ${collection} rich text content...`)

      try {
        const result = await this.payloadRequest.payload.find({
          collection,
          depth: 1, // Get one level of relationships for upload references
          limit: 0, // Get all records for comprehensive scan
        })

        let refsFound = 0
        for (const doc of result.docs) {
          const prevSize = fileReferences.size
          this.scanDocumentForFileReferences(doc, fileReferences)
          refsFound += fileReferences.size - prevSize
        }

        console.log(
          `    ✅ Scanned ${result.docs.length} ${collection} records, found ${refsFound} file references`,
        )
      } catch (error) {
        console.warn(`    ⚠️  Warning: Could not scan ${collection} collection:`, error)
      }
    }
  }

  private displayReport(report: OrphanReport): void {
    console.log(String.raw`\n` + '='.repeat(80))
    console.log('📊 S3 ORPHAN DETECTION REPORT')
    console.log('='.repeat(80))

    console.log(`📦 Total S3 Objects: ${report.summary.totalS3Objects.toLocaleString()}`)
    console.log(`🔗 Referenced Files: ${report.summary.totalReferencedFiles.toLocaleString()}`)
    console.log(`🗑️  Orphaned Objects: ${report.summary.orphanedCount.toLocaleString()}`)
    console.log(`💾 Orphaned Size: ${report.summary.totalOrphanedSizeFormatted}`)

    if (report.orphansByPrefix.length > 0) {
      console.log(String.raw`\n📊 ORPHANS BY PREFIX:`)
      for (const prefixData of report.orphansByPrefix) {
        const prefixSize = this.formatBytes(prefixData.totalSize)
        console.log(`  ${prefixData.prefix}/: ${prefixData.count} objects (${prefixSize})`)
      }

      // Show sample orphaned files
      const allOrphans = report.orphansByPrefix.flatMap((p) => p.objects)
      if (allOrphans.length > 0) {
        console.log(String.raw`\n🗑️  SAMPLE ORPHANED FILES (first 10):`)
        const sampleOrphans = allOrphans.slice(0, 10)
        for (const orphan of sampleOrphans) {
          console.log(`  ${orphan.key} (${orphan.sizeFormatted})`)
        }

        if (allOrphans.length > 10) {
          console.log(`  ... and ${allOrphans.length - 10} more (see full report)`)
        }
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
    console.log('🔍 Finding orphaned objects...')

    const orphans = s3Objects.filter((obj) => !payloadReferences.has(obj.key))

    console.log(`✅ Found ${orphans.length} orphaned objects`)
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
    console.log('📦 Listing all S3 objects...')

    const objects: S3Object[] = []
    let continuationToken: string | undefined
    let totalObjects = 0

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
        totalObjects += response.Contents.length
      }

      continuationToken = response.NextContinuationToken
      process.stdout.write(String.raw`\r📦 Found ${totalObjects} S3 objects...`)
    } while (continuationToken)

    console.log(String.raw`\n✅ Listed ${objects.length} S3 objects total`)
    return objects
  }

  private scanDocumentForFileReferences(obj: unknown, fileReferences: Set<string>): void {
    if (!obj || typeof obj !== 'object') return

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.scanDocumentForFileReferences(item, fileReferences)
      }
      return
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
