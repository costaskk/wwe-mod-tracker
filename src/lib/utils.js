
export const MOD_TYPES = ['original', 'port']
export const SOURCE_GAMES = ['WWE 2K25', 'WWE 2K24', 'WWE 2K23', 'WWE 2K22', 'WWE 2K19', 'WWE 2K18', 'Other']
export const ATTIRE_STATUSES = ['complete', 'partial', 'needs_work', 'missing']

export function uid() {
  return crypto.randomUUID()
}

export function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function titleCase(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\w/g, (m) => m.toUpperCase())
}

export function emptyWrestler() {
  return {
    id: null,
    wrestler_name: '',
    target_attire_count: 1,
    is_missing_target: false,
    notes: '',
    tags_text: '',
    headshot_path: '',
    headshot_url: '',
    headshot_name: '',
    headshot_external_url: '',
    auto_match_titles: [],
    auto_match_urls: []
  }
}

export function emptyAttire(wrestlerId = null) {
  return {
    id: uid(),
    persisted: false,
    wrestler_id: wrestlerId,
    name: '',
    era: '',
    creator_name: '',
    download_url: '',
    source_game: 'WWE 2K25',
    mod_type: 'original',
    notes: '',
    status: 'complete',
    render_dds_path: '',
    render_dds_url: '',
    render_dds_name: '',
    images: [],
    pendingImageUploads: [],
    moveset_json_text: '',
    profile_json_text: ''
  }
}

export function emptyCollection() {
  return {
    id: null,
    name: '',
    slug: '',
    description: '',
    visibility: 'public',
    cover_path: '',
    cover_url: '',
    cover_name: ''
  }
}

export function normalizeWrestlerForEditor(wrestler) {
  return {
    id: wrestler.id,
    wrestler_name: wrestler.wrestler_name || '',
    target_attire_count: wrestler.target_attire_count || 0,
    is_missing_target: Boolean(wrestler.is_missing_target),
    notes: wrestler.notes || '',
    tags_text: (wrestler.tags || []).join(', '),
    headshot_path: wrestler.headshot_path || '',
    headshot_url: wrestler.headshot_path ? wrestler.headshot_url || '' : (wrestler.headshot_external_url || ''),
    headshot_name: wrestler.headshot_name || '',
    headshot_external_url: wrestler.headshot_external_url || '',
    auto_match_titles: [],
    auto_match_urls: wrestler.headshot_external_url ? [wrestler.headshot_external_url] : []
  }
}

export function normalizeAttireForEditor(attire) {
  return {
    id: attire.id,
    persisted: true,
    wrestler_id: attire.wrestler_id,
    name: attire.name || '',
    era: attire.era || '',
    creator_name: attire.creator_name || '',
    download_url: attire.download_url || '',
    source_game: attire.source_game || 'WWE 2K25',
    mod_type: (attire.mod_type === 'port' ? 'port' : 'original'),
    notes: attire.notes || '',
    status: attire.status || 'complete',
    render_dds_path: attire.render_dds_path || '',
    render_dds_url: attire.render_dds_url || '',
    render_dds_name: attire.render_dds_name || '',
    moveset_json_text: attire.moveset_json ? JSON.stringify(attire.moveset_json, null, 2) : '',
    profile_json_text: attire.profile_json ? JSON.stringify(attire.profile_json, null, 2) : '',
    images: (attire.attire_images || attire.images || []).map((img) => ({
      id: img.id,
      path: img.image_path || img.path || '',
      url: img.image_url || img.url || '',
      name: img.image_name || img.name || ''
    })),
    pendingImageUploads: []
  }
}

export function normalizeCollectionForEditor(collection) {
  return {
    id: collection.id,
    name: collection.name || '',
    slug: collection.slug || '',
    description: collection.description || '',
    visibility: collection.visibility || 'public',
    cover_path: collection.cover_path || '',
    cover_url: collection.cover_url || '',
    cover_name: collection.cover_name || ''
  }
}

export function parseTags(text) {
  return text.split(',').map(item => item.trim()).filter(Boolean)
}

export function parseJsonOrNull(text) {
  const clean = (text || '').trim()
  if (!clean) return null
  return JSON.parse(clean)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function parseAppearanceDate(name = '') {
  const normalized = name.toLowerCase()
  const yearMatch = normalized.match(/(19[6-9]\d|20[0-4]\d)/)
  const year = yearMatch ? Number(yearMatch[1]) : null
  const months = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
    may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9,
    october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12
  }

  let month = null
  for (const key of Object.keys(months)) {
    if (normalized.includes(key)) {
      month = months[key]
      break
    }
  }
  return { year, month }
}

export function attireSortValue(attire) {
  const parsed = parseAppearanceDate(`${attire.name} ${attire.era || ''}`)
  if (parsed.year) return parsed.year * 100 + (parsed.month || 0)
  return 999999
}

export function sortAttires(attires = []) {
  return [...attires].sort((a, b) => {
    const aValue = attireSortValue(a)
    const bValue = attireSortValue(b)
    if (aValue !== bValue) return aValue - bValue
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  })
}

export function computeStats(wrestlers, collections = []) {
  const attireCount = wrestlers.reduce((sum, wrestler) => sum + (wrestler.attires?.length || 0), 0)
  const requestCount = wrestlers.reduce((sum, wrestler) => sum + (wrestler.requests?.length || 0), 0)
  const missingTargets = wrestlers.filter(item => item.is_missing_target).length
  const gapCount = wrestlers.reduce((sum, item) => sum + Math.max(0, (item.target_attire_count || 0) - (item.attires?.length || 0)), 0)
  return {
    wrestlerCount: wrestlers.length,
    attireCount,
    requestCount,
    missingTargets,
    gapCount,
    collectionCount: collections.length
  }
}

export function requestSummary(requests = [], attireId) {
  const relevant = requests.filter((item) => item.attire_id === attireId && item.status === 'open')
  return {
    total: relevant.length,
    missingLinks: relevant.filter((item) => item.request_type === 'missing_link').length,
    deadLinks: relevant.filter((item) => item.request_type === 'dead_link').length
  }
}
