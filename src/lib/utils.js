export function uid() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function emptyAttire() {
  return {
    id: uid(),
    name: '',
    slot_name: '',
    era: '',
    creator_name: '',
    download_url: '',
    notes: '',
    status: 'complete',
    preview_image_path: '',
    preview_image_url: '',
    preview_image_name: '',
    render_dds_path: '',
    render_dds_url: '',
    render_dds_name: ''
  }
}

export function emptyMod() {
  return {
    wrestler_name: '',
    game_version: '1.00',
    source_game: 'WWE 2K25',
    mod_type: 'original',
    is_missing_target: false,
    target_attire_count: 1,
    notes: '',
    tags_text: '',
    moveset_json_text: '',
    profile_json_text: '',
    attires: [emptyAttire()]
  }
}

export function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function tryParseJson(text) {
  if (!text || !text.trim()) return null
  return JSON.parse(text)
}

export function prettifyJson(value) {
  if (!value) return ''
  return JSON.stringify(value, null, 2)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function normalizeModForEditor(mod) {
  return {
    wrestler_name: mod.wrestler_name || '',
    game_version: mod.game_version || '1.00',
    source_game: mod.source_game || 'WWE 2K25',
    mod_type: mod.mod_type || 'original',
    is_missing_target: Boolean(mod.is_missing_target),
    target_attire_count: mod.target_attire_count || 1,
    notes: mod.notes || '',
    tags_text: (mod.tags || []).join(', '),
    moveset_json_text: prettifyJson(mod.moveset_json),
    profile_json_text: prettifyJson(mod.profile_json),
    attires:
      mod.attires && mod.attires.length
        ? mod.attires.map((attire) => ({
            id: attire.id || uid(),
            name: attire.name || '',
            slot_name: attire.slot_name || '',
            era: attire.era || '',
            creator_name: attire.creator_name || '',
            download_url: attire.download_url || '',
            notes: attire.notes || '',
            status: attire.status || 'complete',
            preview_image_path: attire.preview_image_path || '',
            preview_image_url: attire.preview_image_url || '',
            preview_image_name: attire.preview_image_name || '',
            render_dds_path: attire.render_dds_path || '',
            render_dds_url: attire.render_dds_url || '',
            render_dds_name: attire.render_dds_name || ''
          }))
        : [emptyAttire()]
  }
}

export function computeDashboardStats(mods) {
  const totalMods = mods.length
  const totalAttires = mods.reduce((sum, mod) => sum + (mod.attires?.length || 0), 0)
  const incompleteAttires = mods.reduce(
    (sum, mod) => sum + (mod.attires?.filter((attire) => attire.status !== 'complete').length || 0),
    0
  )
  const missingTargets = mods.filter((mod) => mod.is_missing_target).length
  const attireGap = mods.reduce(
    (sum, mod) => sum + Math.max(0, (mod.target_attire_count || 0) - (mod.attires?.length || 0)),
    0
  )
  const withRenders = mods.reduce(
    (sum, mod) => sum + (mod.attires?.filter((attire) => attire.render_dds_path).length || 0),
    0
  )

  return { totalMods, totalAttires, incompleteAttires, missingTargets, attireGap, withRenders }
}

export function statusLabel(value) {
  return value.replaceAll('_', ' ')
}

export function extFromFile(fileName = '') {
  const safe = fileName.split('.').pop()
  return safe ? safe.toLowerCase() : 'bin'
}

export function isImageFile(file) {
  return file.type.startsWith('image/')
}
