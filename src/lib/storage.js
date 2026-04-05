import { supabase } from './supabase'

const BUCKET = 'mod-assets'

export async function uploadAsset({ userId, attireId, file, kind }) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${attireId}/${kind}-${Date.now()}-${safeName}`

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
