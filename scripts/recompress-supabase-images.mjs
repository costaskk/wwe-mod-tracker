import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = process.env.SUPABASE_BUCKET || 'mod-assets'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const SKIP_FOLDERS = new Set([
  // add folders here if you want to exclude any
])

const MAX_WIDTH = 1920
const JPEG_QUALITY = 82
const PNG_QUALITY = 80

async function listAllFiles(bucket, folder = '') {
  const all = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    for (const item of data) {
      const itemPath = folder ? `${folder}/${item.name}` : item.name

      if (item.id === null) {
        if (!SKIP_FOLDERS.has(item.name)) {
          const nested = await listAllFiles(bucket, itemPath)
          all.push(...nested)
        }
      } else {
        all.push(itemPath)
      }
    }

    if (data.length < limit) {
      break
    }

    offset += limit
  }

  return all
}

function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return IMAGE_EXTENSIONS.has(ext)
}

async function downloadToBuffer(bucket, filePath) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath)

  if (error) {
    throw error
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function recompressBuffer(inputBuffer, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  let image = sharp(inputBuffer).rotate()

  const metadata = await image.metadata()
  if (metadata.width && metadata.width > MAX_WIDTH) {
    image = image.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }

  if (ext === '.png') {
    return await image.png({
      quality: PNG_QUALITY,
      compressionLevel: 9,
      palette: true
    }).toBuffer()
  }

  if (ext === '.webp') {
    return await image.webp({
      quality: JPEG_QUALITY
    }).toBuffer()
  }

  return await image.jpeg({
    quality: JPEG_QUALITY,
    mozjpeg: true
  }).toBuffer()
}

async function uploadBuffer(bucket, filePath, buffer, originalPath) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType =
    ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : 'image/jpeg'

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      upsert: true,
      contentType,
      cacheControl: '31536000'
    })

  if (error) {
    throw error
  }
}

async function main() {
  console.log(`Scanning bucket: ${BUCKET}`)
  const files = await listAllFiles(BUCKET)

  const imageFiles = files.filter(isImageFile)
  console.log(`Found ${imageFiles.length} image files`)

  let processed = 0
  let skipped = 0
  let savedBytes = 0

  for (const filePath of imageFiles) {
    try {
      const originalBuffer = await downloadToBuffer(BUCKET, filePath)
      const recompressedBuffer = await recompressBuffer(originalBuffer, filePath)

      if (recompressedBuffer.length >= originalBuffer.length) {
        skipped += 1
        console.log(`SKIP  ${filePath} (no gain)`)
        continue
      }

      await uploadBuffer(BUCKET, filePath, recompressedBuffer)

      processed += 1
      savedBytes += originalBuffer.length - recompressedBuffer.length

      const beforeKB = (originalBuffer.length / 1024).toFixed(1)
      const afterKB = (recompressedBuffer.length / 1024).toFixed(1)
      console.log(`DONE  ${filePath}  ${beforeKB}KB -> ${afterKB}KB`)
    } catch (error) {
      console.error(`FAIL  ${filePath}`, error?.message || error)
    }
  }

  console.log('---')
  console.log(`Processed: ${processed}`)
  console.log(`Skipped:   ${skipped}`)
  console.log(`Saved:     ${(savedBytes / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})