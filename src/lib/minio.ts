import { S3Client, CreateBucketCommand, HeadBucketCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Internal client - used for server-side operations (ensureBucket, deleteFile)
export const s3 = new S3Client({
  endpoint: `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true,
})

// Public client - used for presigned URLs that the browser will fetch directly
export const s3Public = process.env.MINIO_PUBLIC_URL
  ? new S3Client({
      endpoint: process.env.MINIO_PUBLIC_URL,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER!,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  : s3

export const BUCKET = process.env.MINIO_BUCKET!

/**
 * Ensures the bucket exists. Call this once at app startup (e.g. in API routes).
 * Safe to call multiple times - no-ops if the bucket already exists.
 */
export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }))
  }


}

export async function getFileUrl(fileKey: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey })
  return getSignedUrl(s3Public, command, { expiresIn })
}

export async function deleteFile(fileKey: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }))
}
