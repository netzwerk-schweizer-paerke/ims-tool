import { S3Client } from '@aws-sdk/client-s3'

let client: S3Client | undefined

/**
 * The S3 client for code that reads the bucket outside the storage plugin.
 *
 * SigV4 signs with the client region and the server rejects a mismatch, so the region always
 * comes from the environment. See `.claude/rules/project/pitfalls/s3-region-must-match-garage.md`.
 */
export const getS3Client = (): S3Client => {
  if (!client) {
    client = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.S3_ENDPOINT || '',
      forcePathStyle: true,
      region: process.env.S3_REGION || 'auto',
    })
  }

  return client
}
