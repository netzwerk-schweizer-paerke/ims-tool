#!/usr/bin/env tsx

/**
 * S3 Orphan Detection Utility for Payload CMS
 * Optimized version with better error handling and timeout management
 */

import { ListObjectsV2Command, ListObjectsV2CommandOutput, S3Client } from '@aws-sdk/client-s3'
import { writeFileSync } from 'fs'
import { groupBy, orderBy } from 'es-toolkit'
import { CollectionSlug, PayloadRequest } from 'payload'
import type { Media, Document, DocumentsPublic } from '../payload-types'

interface S3Object {
  key: string
  size: number
  lastModified: Date
  prefix: string
}

interface OrphanReport {
  timestamp: string
  summary: {
    totalS3Objects: number
    totalReferencedFiles: number
    orphanedCount: number
    totalOrphanedSize: number
    totalOrphanedSizeFormatted: string
  }
  orphansByPrefix: Array<{
    prefix: string
    count: number
    totalSize: number
    objects: Array<{
      key: string
      size: number
      sizeFormatted: string
      lastModified: string
    }>
  }>
}

class S3OrphanDetector {
  private payloadRequest: PayloadRequest
  private s3Client: S3Client
  private bucket: string
  private readonly TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

  constructor(req: PayloadRequest) {
    this.payloadRequest = req
    this.bucket = process.env.S3_BUCKET || ''
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      region: 'auto',
      endpoint: process.env.S3_ENDPOINT || '',
      forcePathStyle: true,
    })
  }

  private validateEnvironment(): void {
    const required = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_ENDPOINT']
    const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim() === '')

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
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
          if (obj.Key && obj.Size !== undefined && obj.LastModified) {
            const prefix = this.getObjectPrefix(obj.Key)
            objects.push({
              key: obj.Key,
              size: obj.Size,
              lastModified: obj.LastModified,
              prefix,
            })
          }
        }
        totalObjects += response.Contents.length
      }

      continuationToken = response.NextContinuationToken
      process.stdout.write(`\\r📦 Found ${totalObjects} S3 objects...`)
    } while (continuationToken)

    console.log(`\\n✅ Listed ${objects.length} S3 objects total`)
    return objects
  }

  private getObjectPrefix(key: string): string {
    const parts = key.split('/')
    return parts[0] || 'unknown'
  }

  private extractS3Key(url: string): string | null {
    if (!url) return null

    try {
      const urlObj = new URL(url)
      return urlObj.pathname.substring(1)
    } catch {
      const parts = url.split('/')
      const bucketIndex = parts.indexOf(this.bucket)
      if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
        return parts.slice(bucketIndex + 1).join('/')
      }
      return null
    }
  }

  private async collectPayloadFileReferences(): Promise<Set<string>> {
    console.log('🔍 Collecting Payload file references...')

    const startTime = Date.now()
    const fileReferences = new Set<string>()

    // Direct file collection references
    await this.collectDirectFileReferences(fileReferences)

    // Rich text file references (with timeout protection)
    await this.collectRichTextFileReferences(fileReferences)

    console.log(`✅ Found ${fileReferences.size} unique file references in Payload`)
    return fileReferences
  }

  private async collectDirectFileReferences(fileReferences: Set<string>): Promise<void> {
    // Process Media collection
    try {
      console.log(`  📄 Scanning media collection...`)
      const mediaResult = await this.payloadRequest.payload.find({
        collection: 'media',
        limit: 0, // Get all records
        depth: 0, // No relations needed
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
          for (const [sizeName, sizeData] of Object.entries(doc.sizes)) {
            if (typeof sizeData === 'object' && sizeData && 'url' in sizeData) {
              const key = sizeData.url ? this.extractS3Key(sizeData.url) : null
              if (key) fileReferences.add(key)
            }
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
        limit: 0, // Get all records
        depth: 0, // No relations needed
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
        limit: 0, // Get all records
        depth: 0, // No relations needed
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

  private async collectRichTextFileReferences(fileReferences: Set<string>): Promise<void> {
    const collections: CollectionSlug[] = ['activities', 'task-flows', 'task-lists']

    for (const collection of collections) {
      console.log(`  📝 Scanning ${collection} rich text content...`)

      try {
        const result = await this.payloadRequest.payload.find({
          collection,
          limit: 0, // Get all records for comprehensive scan
          depth: 1, // Get one level of relationships for upload references
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

  private scanDocumentForFileReferences(obj: any, fileReferences: Set<string>): void {
    if (!obj || typeof obj !== 'object') return

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.scanDocumentForFileReferences(item, fileReferences)
      }
      return
    }

    // Check for upload/relationship nodes in rich text
    if (obj.type === 'upload' && obj.value && typeof obj.value === 'object') {
      if (obj.value.url) {
        const key = this.extractS3Key(obj.value.url)
        if (key) fileReferences.add(key)
      }
      if (obj.value.thumbnailURL) {
        const key = this.extractS3Key(obj.value.thumbnailURL)
        if (key) fileReferences.add(key)
      }
      if (obj.value.sizes) {
        for (const [sizeName, sizeData] of Object.entries(obj.value.sizes)) {
          if (typeof sizeData === 'object' && sizeData && 'url' in sizeData) {
            const key = this.extractS3Key((sizeData as any).url)
            if (key) fileReferences.add(key)
          }
        }
      }
    }

    // Handle relationship references to file collections
    if (obj.relationTo && ['documents', 'media', 'documents-public'].includes(obj.relationTo)) {
      if (obj.value && typeof obj.value === 'object' && obj.value.url) {
        const key = this.extractS3Key(obj.value.url)
        if (key) fileReferences.add(key)
      }
    }

    // Handle direct upload field references
    if ((obj.filename || obj.url) && obj.url) {
      const key = this.extractS3Key(obj.url)
      if (key) fileReferences.add(key)
    }

    // Recursively scan nested objects
    for (const [key, value] of Object.entries(obj)) {
      this.scanDocumentForFileReferences(value, fileReferences)
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

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      timestamp: new Date().toISOString(),
      summary: {
        totalS3Objects: s3Objects.length,
        totalReferencedFiles: payloadReferences.size,
        orphanedCount: orphans.length,
        totalOrphanedSize,
        totalOrphanedSizeFormatted: this.formatBytes(totalOrphanedSize),
      },
      orphansByPrefix: sortedPrefixEntries.map(([prefix, objs]) => ({
        prefix,
        count: objs.length,
        totalSize: objs.reduce((sum, obj) => sum + obj.size, 0),
        objects: orderBy(
          objs.map((obj) => ({
            key: obj.key,
            size: obj.size,
            sizeFormatted: this.formatBytes(obj.size),
            lastModified: obj.lastModified.toISOString(),
          })),
          ['size'],
          ['desc'],
        ).slice(0, 10), // Show only top 10 objects per prefix for performance
      })),
    }
  }

  private displayReport(report: OrphanReport): void {
    console.log('\\n' + '='.repeat(80))
    console.log('📊 S3 ORPHAN DETECTION REPORT')
    console.log('='.repeat(80))

    console.log(`📦 Total S3 Objects: ${report.summary.totalS3Objects.toLocaleString()}`)
    console.log(`🔗 Referenced Files: ${report.summary.totalReferencedFiles.toLocaleString()}`)
    console.log(`🗑️  Orphaned Objects: ${report.summary.orphanedCount.toLocaleString()}`)
    console.log(`💾 Orphaned Size: ${report.summary.totalOrphanedSizeFormatted}`)

    if (report.orphansByPrefix.length > 0) {
      console.log('\\n📊 ORPHANS BY PREFIX:')
      for (const prefixData of report.orphansByPrefix) {
        const prefixSize = this.formatBytes(prefixData.totalSize)
        console.log(`  ${prefixData.prefix}/: ${prefixData.count} objects (${prefixSize})`)
      }

      // Show sample orphaned files
      const allOrphans = report.orphansByPrefix.flatMap((p) => p.objects)
      if (allOrphans.length > 0) {
        console.log('\\n🗑️  SAMPLE ORPHANED FILES (first 10):')
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
      console.log(`\\n💾 Detailed report saved to: ${reportFilename}`)

      const totalTime = Math.round((Date.now() - startTime) / 1000)
      console.log(`\\n✅ S3 Orphan Detection completed successfully in ${totalTime}s!`)
    } catch (error) {
      console.error('❌ Error during S3 orphan detection:', error)
      process.exit(1)
    }
  }
}

export { S3OrphanDetector }
