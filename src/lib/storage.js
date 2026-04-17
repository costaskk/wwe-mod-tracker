import { supabase } from './supabase'

const BUCKET = 'mod-assets'
const R2_PUBLIC_BASE_URL = String(import.meta.env.VITE_CLOUDFLARE_IMAGE_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

function sanitizeName(name = '') {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function getFileExtension(name = '') {
  const match = String(name).match(/\.([a-zA-Z0-9]+)$/)
  return match ? `.${match[1].toLowerCase()}` : ''
}

function stripExtension(name = '') {
  return String(name).replace(/\.[^.]+$/, '')
}

function makeUniqueToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function buildSafeBaseName(kind, originalName) {
  const safeName = sanitizeName(originalName)
  const baseName = stripExtension(safeName)
  return `${kind}-${makeUniqueToken()}-${baseName}`
}

function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'))
}

function isR2ManagedAsset(file, ext = '') {
  return isImageFile(file) || ext === '.dds'
}

function isExternalLinkOnlyAsset(ext = '') {
  return ext === '.wem'
}

function shouldPreservePng(file) {
  return file?.type === 'image/png'
}

function shouldUseWebP(file, options = {}) {
  if (!isImageFile(file)) return false
  if (shouldPreservePng(file)) return false
  if (options.preserveOriginalFormat) return false
  return true
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  return '.jpg'
}

function fileNameWithExtension(name, mimeType) {
  return `${stripExtension(name)}${extensionFromMime(mimeType)}`
}

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`
}

function getR2PublicUrl(path) {
  if (!path || !R2_PUBLIC_BASE_URL) return ''
  return joinUrl(R2_PUBLIC_BASE_URL, path)
}

async function fileToImageBitmap(file) {
  try {
    return await createImageBitmap(file)
  } catch (err) {
    console.warn('Could not decode image file', err)
    return null
  }
}

async function canvasToBlob(canvas, mimeType, quality) {
  return await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || null),
      mimeType,
      quality
    )
  })
}

async function transformImageFile(
  file,
  {
    maxWidth,
    quality = 0.82,
    preservePng = true,
    preferWebP = true
  } = {}
) {
  if (!isImageFile(file)) return file

  try {
    const imageBitmap = await fileToImageBitmap(file)
    if (!imageBitmap) return file

    const scale = Math.min(1, maxWidth / imageBitmap.width)
    const width = Math.max(1, Math.round(imageBitmap.width * scale))
    const height = Math.max(1, Math.round(imageBitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(imageBitmap, 0, 0, width, height)

    const outputMimeType = preservePng && shouldPreservePng(file)
      ? 'image/png'
      : preferWebP && shouldUseWebP(file)
        ? 'image/webp'
        : 'image/jpeg'

    const blob = await canvasToBlob(canvas, outputMimeType, quality)
    if (!blob) return file

    return new File(
      [blob],
      fileNameWithExtension(file.name, outputMimeType),
      {
        type: outputMimeType,
        lastModified: Date.now()
      }
    )
  } catch (err) {
    console.warn('Image transform failed, using original file', err)
    return file
  }
}

function contentTypeForFile(file, fallbackName = '') {
  if (file?.type) return file.type

  const ext = getFileExtension(fallbackName)
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.dds') return 'application/octet-stream'
  if (ext === '.wem') return 'application/octet-stream'
  if (ext === '.json') return 'application/json'
  return 'application/octet-stream'
}

async function uploadFileToSupabase(path, file) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: true,
    contentType: contentTypeForFile(file, file?.name || path)
  })

  if (error) throw error
}

async function getSignedR2Uploads(files) {
  const response = await fetch('/api/r2-sign-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Could not get R2 upload URLs.')
  }

  return await response.json()
}

async function uploadBlobToSignedUrl(url, file) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentTypeForFile(file, file?.name || '')
    },
    body: file
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `R2 upload failed with status ${response.status}`)
  }
}

async function uploadFilesToR2(fileSpecs) {
  const signed = await getSignedR2Uploads(
    fileSpecs.map((item) => ({
      key: item.path,
      contentType: contentTypeForFile(item.file, item.file?.name || item.path)
    }))
  )

  const uploads = signed?.uploads || []

  if (uploads.length !== fileSpecs.length) {
    throw new Error('R2 signing response was incomplete.')
  }

  await Promise.all(
    uploads.map((upload, index) => uploadBlobToSignedUrl(upload.signedUrl, fileSpecs[index].file))
  )

  return uploads.map((upload) => ({
    key: upload.key,
    publicUrl: upload.publicUrl || getR2PublicUrl(upload.key)
  }))
}

/**
 * Upload asset (DDS, audio, JSON-adjacent files, anything non-image or single-file uploads)
 * Non-image assets stay on Supabase.
 */
export async function uploadAsset({ userId, entityId, file, kind, folder = 'attires' }) {
  const safeName = sanitizeName(file.name)
  const ext = getFileExtension(file.name)
  const path = `${userId}/${folder}/${entityId}/${kind}-${makeUniqueToken()}-${safeName}`

  // WEM files should not be uploaded through storage anymore.
  // They should be saved as external links in the database/UI.
  if (isExternalLinkOnlyAsset(ext)) {
    throw new Error('WEM uploads are disabled. Save an external download link instead.')
  }

  // Images + DDS should live on Cloudflare R2
  if (isR2ManagedAsset(file, ext)) {
    const uploaded = await uploadFilesToR2([
      { path, file }
    ])

    return {
      path,
      fileName: file.name,
      externalUrl: uploaded[0]?.publicUrl || getR2PublicUrl(path),
      isExternal: true
    }
  }

  // Everything else can stay on Supabase
  await uploadFileToSupabase(path, file)

  return {
    path,
    fileName: file.name,
    externalUrl: '',
    isExternal: false
  }
}

/**
 * Remove assets from both R2 and Supabase.
 * Safe to call for mixed paths.
 */
export async function removeAssets(paths = []) {
  const clean = [...new Set(paths.filter(Boolean))]
  if (!clean.length) return

  try {
    await fetch('/api/r2-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: clean })
    })
  } catch (err) {
    console.warn('R2 delete warning', err)
  }

  try {
    const { error } = await supabase.storage.from(BUCKET).remove(clean)
    if (error) {
      console.warn('Supabase delete warning', error)
    }
  } catch (err) {
    console.warn('Supabase delete warning', err)
  }
}

/**
 * Get asset URL
 * Prefers external CDN URL when provided.
 */
export function getAssetUrl(path, externalUrl = '') {
  if (externalUrl) return externalUrl
  if (!path) return ''

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data?.publicUrl || ''
}

/**
 * Compress image before upload
 */
export async function compressImage(file, { maxWidth = 2200, quality = 0.82 } = {}) {
  return await transformImageFile(file, {
    maxWidth,
    quality,
    preservePng: true,
    preferWebP: true
  })
}

async function resizeVariant(file, maxWidth, quality = 0.8) {
  return await transformImageFile(file, {
    maxWidth,
    quality,
    preservePng: true,
    preferWebP: true
  })
}

/**
 * Upload image with original + medium + thumb variants directly to R2
 */
export async function uploadImageWithVariants({
  userId,
  entityId,
  file,
  kind = 'image',
  folder = 'attires'
}) {
  const baseName = buildSafeBaseName(kind, file.name)
  const basePath = `${userId}/${folder}/${entityId}`

  try {
    const original = await compressImage(file, { maxWidth: 2200, quality: 0.82 })
    const medium = await resizeVariant(original, 1200, 0.78)
    const thumb = await resizeVariant(original, 480, 0.72)

    const originalExt = getFileExtension(original.name) || '.jpg'
    const mediumExt = getFileExtension(medium.name) || '.jpg'
    const thumbExt = getFileExtension(thumb.name) || '.jpg'

    const originalPath = `${basePath}/${baseName}-original${originalExt}`
    const mediumPath = `${basePath}/${baseName}-medium${mediumExt}`
    const thumbPath = `${basePath}/${baseName}-thumb${thumbExt}`

    const uploaded = await uploadFilesToR2([
      { path: originalPath, file: original },
      { path: mediumPath, file: medium },
      { path: thumbPath, file: thumb }
    ])

    return {
      originalPath,
      mediumPath,
      thumbPath,
      externalOriginalUrl: uploaded[0]?.publicUrl || getR2PublicUrl(originalPath),
      externalMediumUrl: uploaded[1]?.publicUrl || getR2PublicUrl(mediumPath),
      externalThumbUrl: uploaded[2]?.publicUrl || getR2PublicUrl(thumbPath),
      fileName: file.name
    }
  } catch (err) {
    console.error('Variant generation/upload failed, falling back to single original upload', err)

    const fallbackFile = await compressImage(file, { maxWidth: 2200, quality: 0.82 })
    const fallbackExt = getFileExtension(fallbackFile.name) || '.jpg'
    const fallbackPath = `${basePath}/${baseName}-original${fallbackExt}`

    const uploaded = await uploadFilesToR2([
      { path: fallbackPath, file: fallbackFile }
    ])

    const fallbackUrl = uploaded[0]?.publicUrl || getR2PublicUrl(fallbackPath)

    return {
      originalPath: fallbackPath,
      mediumPath: '',
      thumbPath: '',
      externalOriginalUrl: fallbackUrl,
      externalMediumUrl: fallbackUrl,
      externalThumbUrl: fallbackUrl,
      fileName: file.name
    }
  }
}

/**
 * Wikipedia auto headshot fetch
 */
export async function tryAutoMatchHeadshot(name, excludedTitles = [], excludedUrls = []) {
  const query = encodeURIComponent(name.trim())
  if (!query) throw new Error('Wrestler name is required for auto-match.')

  const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=8&namespace=0&format=json&origin=*`
  const searchResponse = await fetch(searchUrl)
  if (!searchResponse.ok) throw new Error('Auto-match search failed.')

  const searchData = await searchResponse.json()
  const titles = (searchData?.[1] || []).filter(Boolean)

  for (const title of titles) {
    if (excludedTitles.includes(title)) continue

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const summaryResponse = await fetch(summaryUrl)
    if (!summaryResponse.ok) continue

    const summaryData = await summaryResponse.json()
    const imageUrl =
      summaryData?.thumbnail?.source ||
      summaryData?.originalimage?.source

    if (!imageUrl || excludedUrls.includes(imageUrl)) continue

    return { imageUrl, sourceTitle: title }
  }

  throw new Error('No alternative public headshot was available for that wrestler name.')
}