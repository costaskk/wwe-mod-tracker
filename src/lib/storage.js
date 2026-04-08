
import { supabase } from './supabase'

const BUCKET = 'mod-assets'

export async function uploadAsset({ userId, entityId, file, kind, folder = 'attires' }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${folder}/${entityId}/${kind}-${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true
  })

  if (error) throw error
  return { path, fileName: file.name }
}

export async function removeAssets(paths = []) {
  const clean = paths.filter(Boolean)
  if (!clean.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(clean)
  if (error) throw error
}

export function getAssetUrl(path) {
  if (!path) return ''
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

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
    const imageUrl = summaryData?.thumbnail?.source || summaryData?.originalimage?.source
    if (!imageUrl || excludedUrls.includes(imageUrl)) continue

    return { imageUrl, sourceTitle: title }
  }

  throw new Error('No alternative public headshot was available for that wrestler name.')
}
