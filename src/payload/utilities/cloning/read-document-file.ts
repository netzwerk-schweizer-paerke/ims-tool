import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

import { getS3Client } from '@/lib/s3-client'
import { Document } from '@/payload-types'

/** The prefix `payload.config.ts` gives the Documents collection in the storage plugin. */
const COLLECTION_PREFIX = 'documents'

/**
 * Reads the bytes of a document straight from the bucket.
 *
 * The clone used to request its own HTTP file endpoint with a service API key. A key that no
 * longer authenticated made every download answer 403, and the clone dropped the attachment.
 */
export const readDocumentFile = async (document: Document): Promise<Buffer> => {
  const bucket = process.env.S3_BUCKET

  if (!bucket) {
    throw new Error('S3_BUCKET is not set')
  }

  if (!document.filename) {
    throw new Error(`Document ${document.id} has no file`)
  }

  // The stored prefix wins over the collection prefix, and some rows legitimately sit at a
  // doubled key. See `.claude/rules/project/pitfalls/s3-upload-prefix-depends-on-beforechange-hook.md`.
  const { fileKey } = getFileKey({
    collectionPrefix: COLLECTION_PREFIX,
    docPrefix: document.prefix ?? '',
    filename: document.filename,
  })

  const object = await getS3Client().send(
    new GetObjectCommand({ Bucket: bucket, Key: fileKey }),
  )

  if (!object.Body) {
    throw new Error(`Document ${document.id} has no object at ${fileKey}`)
  }

  return Buffer.from(await object.Body.transformToByteArray())
}
