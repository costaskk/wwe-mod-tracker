import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  CF_IMAGE_BASE_URL
} = process.env

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !CF_IMAGE_BASE_URL) {
      return res.status(500).json({ error: 'Missing R2 environment variables on Vercel.' })
    }

    const files = Array.isArray(req.body?.files) ? req.body.files : []

    if (!files.length) {
      return res.status(400).json({ error: 'No files were provided.' })
    }

    const uploads = await Promise.all(
      files.map(async (item) => {
        const key = String(item?.key || '').trim()
        const contentType = String(item?.contentType || 'application/octet-stream').trim()

        if (!key) {
          throw new Error('Missing upload key.')
        }

        const signedUrl = await getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable'
          }),
          { expiresIn: 300 }
        )

        return {
          key,
          signedUrl,
          publicUrl: joinUrl(CF_IMAGE_BASE_URL, key)
        }
      })
    )

    return res.status(200).json({ uploads })
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Could not create signed upload URLs.'
    })
  }
}