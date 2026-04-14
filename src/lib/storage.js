import { supabase } from './supabase'

const BUCKET = 'mod-assets'

/**
 * Upload asset (images, audio, etc)
 */
export async function uploadAsset({ userId, entityId, file, kind, folder = 'attires' }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${folder}/${entityId}/${kind}-${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: true
  })

  if (error) throw error
  return { path, fileName: file.name }
}

/**
 * Remove assets from storage
 */
export async function removeAssets(paths = []) {
  const clean = paths.filter(Boolean)
  if (!clean.length) return

  const { error } = await supabase.storage.from(BUCKET).remove(clean)
  if (error) throw error
}

/**
 * Get asset URL with optional transformation
 */
export function getAssetUrl(path, options = {}) {
  if (!path) return ''

  const {
    width,
    height,
    quality = 70,
    resize = 'contain' // 🔥 safer default than 'cover'
  } = options

  const hasTransform = width || height

  if (hasTransform) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path, {
      transform: {
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
        quality,
        resize
      }
    })

    return data?.publicUrl || ''
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data?.publicUrl || ''
}

/**
 * Compress image before upload
 */
export async function compressImage(file, { maxWidth = 2200, quality = 0.82 } = {}) {
  if (!file?.type?.startsWith('image/')) return file

  try {
    const imageBitmap = await createImageBitmap(file)

    const scale = Math.min(1, maxWidth / imageBitmap.width)
    const width = Math.round(imageBitmap.width * scale)
    const height = Math.round(imageBitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    ctx.drawImage(imageBitmap, 0, 0, width, height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )

    if (!blob) return file

    return new File(
      [blob],
      file.name.replace(/\.\w+$/, '.jpg'),
      { type: 'image/jpeg' }
    )
  } catch (err) {
    console.warn('Image compression failed, using original file', err)
    return file
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