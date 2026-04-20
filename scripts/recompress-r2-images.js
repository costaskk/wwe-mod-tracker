import 'dotenv/config'
import sharp from 'sharp'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PREFIX = 'images/',
  DRY_RUN = 'true',
  JPEG_QUALITY = '78',
  WEBP_QUALITY = '78',
  PNG_COMPRESSION_LEVEL = '9',
  MIN_SAVINGS_BYTES = '4096'
} = process.env

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET
) {
  throw new Error('Missing R2 environment variables.')
}

const dryRun = String(DRY_RUN).toLowerCase() === 'true'
const jpegQuality = Number(JPEG_QUALITY) || 78
const webpQuality = Number(WEBP_QUALITY) || 78
const pngCompressionLevel = Number(PNG_COMPRESSION_LEVEL) || 9
const minSavingsBytes = Number(MIN_SAVINGS_BYTES) || 4096

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

function isProcessableImage(key = '') {
  const lower = key.toLowerCase()
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp')
  )
}

function getFormatFromKey(key = '') {
  const lower = key.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpeg'
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.webp')) return 'webp'
  return null
}

function contentTypeForKey(key = '') {
  const fmt = getFormatFromKey(key)
  if (fmt === 'jpeg') return 'image/jpeg'
  if (fmt === 'png') return 'image/png'
  if (fmt === 'webp') return 'image/webp'
  return 'application/octet-stream'
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function recompressBuffer(buffer, key) {
  const format = getFormatFromKey(key)
  if (!format) return null

  let img = sharp(buffer, { failOn: 'none' }).rotate()

  if (format === 'jpeg') {
    return await img
      .jpeg({
        quality: jpegQuality,
        mozjpeg: true,
        progressive: true
      })
      .toBuffer()
  }

  if (format === 'png') {
    return await img
      .png({
        compressionLevel: pngCompressionLevel,
        progressive: false,
        palette: true
      })
      .toBuffer()
  }

  if (format === 'webp') {
    return await img
      .webp({
        quality: webpQuality
      })
      .toBuffer()
  }

  return null
}

async function listAllKeys(prefix) {
  let continuationToken = undefined
  const keys = []

  do {
    const result = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    )

    for (const obj of result.Contents || []) {
      if (obj.Key && isProcessableImage(obj.Key)) {
        keys.push(obj.Key)
      }
    }

    continuationToken = result.IsTruncated
      ? result.NextContinuationToken
      : undefined
  } while (continuationToken)

  return keys
}

async function processKey(key) {
  const original = await r2.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key
    })
  )

  const originalBuffer = await streamToBuffer(original.Body)
  const optimizedBuffer = await recompressBuffer(originalBuffer, key)

  if (!optimizedBuffer) {
    return { key, status: 'skipped', reason: 'unsupported' }
  }

  const savings = originalBuffer.length - optimizedBuffer.length

  if (savings < minSavingsBytes) {
    return {
      key,
      status: 'skipped',
      reason: `not enough savings (${savings} bytes)`
    }
  }

  if (dryRun) {
    return {
      key,
      status: 'dry-run',
      before: originalBuffer.length,
      after: optimizedBuffer.length,
      savings
    }
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: contentTypeForKey(key),
      CacheControl: 'public, max-age=31536000, immutable'
    })
  )

  return {
    key,
    status: 'updated',
    before: originalBuffer.length,
    after: optimizedBuffer.length,
    savings
  }
}

async function main() {
  console.log(`Scanning prefix: ${R2_PREFIX}`)
  console.log(`Dry run: ${dryRun}`)

  const keys = await listAllKeys(R2_PREFIX)
  console.log(`Found ${keys.length} image(s)`)

  let updated = 0
  let skipped = 0
  let savedBytes = 0

  for (const key of keys) {
    try {
      const result = await processKey(key)

      if (result.status === 'updated' || result.status === 'dry-run') {
        updated += 1
        savedBytes += result.savings || 0
        console.log(
          `[${result.status}] ${key} | ${result.before} -> ${result.after} | saved ${result.savings} bytes`
        )
      } else {
        skipped += 1
        console.log(`[skipped] ${key} | ${result.reason}`)
      }
    } catch (err) {
      skipped += 1
      console.error(`[error] ${key} | ${err.message}`)
    }
  }

  console.log('\nDone.')
  console.log(`Processed: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total saved: ${savedBytes} bytes`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})