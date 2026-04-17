import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET
} = process.env

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
      return res.status(500).json({ error: 'Missing R2 environment variables on Vercel.' })
    }

    const keys = [...new Set((req.body?.keys || []).filter(Boolean))]

    if (!keys.length) {
      return res.status(200).json({ ok: true, deleted: 0 })
    }

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true
        }
      })
    )

    return res.status(200).json({
      ok: true,
      deleted: keys.length
    })
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Could not delete R2 objects.'
    })
  }
}