import { STORAGE_BUCKET, supabase } from './supabase'
import { extFromFile } from './utils'

export async function uploadAsset({ userId, attireId, file, kind }) {
  const ext = extFromFile(file.name)
  const fileName = `${kind}-${Date.now()}.${ext}`
  const path = `${userId}/attires/${attireId}/${fileName}`

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true
  })

  if (error) throw error
  return { path, fileName: file.name }
}

export async function createSignedUrl(path) {
  if (!path) return ''
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7)
  if (error) return ''
  return data?.signedUrl || ''
}

export async function createSignedUrls(paths = []) {
  const unique = [...new Set(paths.filter(Boolean))]
  const entries = await Promise.all(unique.map(async (path) => [path, await createSignedUrl(path)]))
  return Object.fromEntries(entries)
}

export async function removeAssets(paths = []) {
  const clean = [...new Set(paths.filter(Boolean))]
  if (!clean.length) return
  await supabase.storage.from(STORAGE_BUCKET).remove(clean)
}
