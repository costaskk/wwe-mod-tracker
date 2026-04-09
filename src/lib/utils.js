export const MOD_TYPES = ['original', 'port']
export const SOURCE_GAMES = ['WWE 2K26', 'WWE 2K25', 'WWE 2K24', 'WWE 2K23', 'WWE 2K22', 'WWE 2K19', 'WWE 2K18', 'WWE 2K17', 'WWE 2K16', 'WWE 2K15', 'WWE 2K14', 'WWE 13', 'WWE 12', 'Other']
export const ATTIRE_STATUSES = ['complete', 'partial', 'needs_work', 'missing']
export const COLLECTION_ITEM_TYPES = ['attire', 'arena', 'title', 'other']

export const OTHER_MOD_SUBTYPES = [
  'weapons',
  'moves',
  'ui',
  'music',
  'crowd',
  'referee',
  'camera',
  'lighting',
  'gameplay',
  'match_type',
  'misc'
]

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
  return String(value)
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export function emptyWrestler() {
  return {
    id: null,
    persisted: false,
    temp_upload_id: '',
    wrestler_name: '',
    notes: '',
    tags_text: '',
    headshot_path: '',
    headshot_url: '',
    headshot_name: '',
    headshot_external_url: '',
    auto_match_titles: [],
    auto_match_urls: [],
    audio_files: [],
    pendingAudioUploads: [],
    titantrons: [],
    removedTitantronIds: []
  }
}

export function emptyTitantron() {
  return {
    id: uid(),
    persisted: false,
    wrestler_id: null,
    title: '',
    download_url: '',
    source_game: 'WWE 2K25',
    screenshots: [],
    pendingScreenshotUploads: []
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
    persisted: false,
    temp_upload_id: '',
    name: '',
    slug: '',
    description: '',
    visibility: 'public',
    cover_path: '',
    cover_url: '',
    cover_name: ''
  }
}

export function emptyArena() {
  return {
    id: uid(),
    persisted: false,
    temp_upload_id: '',
    name: '',
    creator_name: '',
    download_url: '',
    source_game: 'WWE 2K25',
    notes: '',
    profile_json_text: '',
    images: [],
    pendingImageUploads: []
  }
}

export function emptyTitleBelt() {
  return {
    id: uid(),
    persisted: false,
    temp_upload_id: '',
    name: '',
    creator_name: '',
    download_url: '',
    source_game: 'WWE 2K25',
    notes: '',
    render_dds_path: '',
    render_dds_url: '',
    render_dds_name: '',
    images: [],
    pendingImageUploads: [],
    audio_files: [],
    pendingAudioUploads: []
  }
}

export function emptyOtherMod() {
  return {
    id: uid(),
    persisted: false,
    temp_upload_id: '',
    name: '',
    creator_name: '',
    subtype: '',
    download_url: '',
    source_game: 'WWE 2K25',
    notes: '',
    profile_json_text: '',
    images: [],
    pendingImageUploads: []
  }
}

export function normalizeWrestlerForEditor(wrestler) {
  return {
    id: wrestler.id,
    persisted: true,
    temp_upload_id: '',
    wrestler_name: wrestler.wrestler_name || '',
    notes: wrestler.notes || '',
    tags_text: (wrestler.tags || []).join(', '),
    headshot_path: wrestler.headshot_path || '',
    headshot_url: wrestler.headshot_path ? (wrestler.headshot_url || '') : (wrestler.headshot_external_url || ''),
    headshot_name: wrestler.headshot_name || '',
    headshot_external_url: wrestler.headshot_external_url || '',
    auto_match_titles: [],
    auto_match_urls: wrestler.headshot_external_url ? [wrestler.headshot_external_url] : [],
    audio_files: (wrestler.audio_files || wrestler.wrestler_audio_files || []).map((file) => ({
      id: file.id || null,
      wrestler_id: file.wrestler_id || wrestler.id,
      owner_id: file.owner_id || '',
      audio_type: file.audio_type || '',
      file_path: file.file_path || '',
      file_name: file.file_name || '',
      file_url: file.file_url || ''
    })),
    pendingAudioUploads: [],
    titantrons: (wrestler.titantrons || wrestler.wrestler_titantrons || []).map((item) => ({
      id: item.id,
      persisted: true,
      wrestler_id: item.wrestler_id || wrestler.id,
      title: item.title || '',
      download_url: item.download_url || '',
      source_game: item.source_game || 'WWE 2K25',
      screenshots: (item.titantron_images || item.screenshots || []).map((img) => ({
        id: img.id || null,
        path: img.image_path || img.path || '',
        url: img.image_url || img.url || '',
        name: img.image_name || img.name || ''
      })),
      pendingScreenshotUploads: []
    })),
    removedTitantronIds: []
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
    mod_type: attire.mod_type === 'port' ? 'port' : 'original',
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
    persisted: true,
    temp_upload_id: '',
    name: collection.name || '',
    slug: collection.slug || '',
    description: collection.description || '',
    visibility: collection.visibility || 'public',
    cover_path: collection.cover_path || '',
    cover_url: collection.cover_url || '',
    cover_name: collection.cover_name || ''
  }
}

export function normalizeArenaForEditor(arena) {
  return {
    id: arena.id,
    persisted: true,
    temp_upload_id: '',
    name: arena.name || '',
    creator_name: arena.creator_name || '',
    download_url: arena.download_url || '',
    source_game: arena.source_game || 'WWE 2K25',
    notes: arena.notes || '',
    profile_json_text: arena.profile_json ? JSON.stringify(arena.profile_json, null, 2) : '',
    images: (arena.arena_images || arena.images || []).map((img) => ({
      id: img.id || null,
      path: img.image_path || img.path || '',
      url: img.image_url || img.url || '',
      name: img.image_name || img.name || ''
    })),
    pendingImageUploads: []
  }
}

export function normalizeTitleBeltForEditor(titleBelt) {
  return {
    id: titleBelt.id,
    persisted: Boolean(titleBelt.id),
    name: titleBelt.name || '',
    temp_upload_id: '',
    creator_name: titleBelt.creator_name || '',
    download_url: titleBelt.download_url || '',
    source_game: titleBelt.source_game || 'WWE 2K25',
    notes: titleBelt.notes || '',
    render_dds_path: titleBelt.render_dds_path || '',
    render_dds_url: titleBelt.render_dds_url || '',
    render_dds_name: titleBelt.render_dds_name || '',
    images: (titleBelt.title_belt_images || titleBelt.images || []).map((img) => ({
      id: img.id || null,
      path: img.image_path || img.path || '',
      url: img.image_url || img.url || '',
      name: img.image_name || img.name || ''
    })),
    pendingImageUploads: [],
    audio_files: (titleBelt.title_belt_audio_files || titleBelt.audio_files || []).map((file) => ({
      id: file.id || null,
      title_belt_id: file.title_belt_id || titleBelt.id,
      owner_id: file.owner_id || '',
      audio_type: file.audio_type || 'generic',
      file_path: file.file_path || '',
      file_name: file.file_name || '',
      file_url: file.file_url || ''
    })),
    pendingAudioUploads: []
  }
}

export function normalizeOtherModForEditor(otherMod) {
  return {
    id: otherMod.id,
    persisted: true,
    name: otherMod.name || '',
    temp_upload_id: '',
    creator_name: otherMod.creator_name || '',
    subtype: otherMod.subtype || '',
    download_url: otherMod.download_url || '',
    source_game: otherMod.source_game || 'WWE 2K25',
    notes: otherMod.notes || '',
    profile_json_text: otherMod.profile_json ? JSON.stringify(otherMod.profile_json, null, 2) : '',
    images: (otherMod.other_mod_images || otherMod.images || []).map((img) => ({
      id: img.id || null,
      path: img.image_path || img.path || '',
      url: img.image_url || img.url || '',
      name: img.image_name || img.name || ''
    })),
    pendingImageUploads: []
  }
}

export function parseTags(text = '') {
  return text.split(',').map((item) => item.trim()).filter(Boolean)
}

export function parseJsonOrNull(text) {
  const clean = (text || '').trim()
  if (!clean) return null
  return JSON.parse(clean)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export function parseAppearanceDate(name = '') {
  const normalized = name.toLowerCase()
  const yearMatch = normalized.match(/\b(19[6-9]\d|20[0-4]\d)\b/)
  const year = yearMatch ? Number(yearMatch[1]) : null

  const months = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sept: 9, sep: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12
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

export function computeStats(
  wrestlers = [],
  collections = [],
  arenas = [],
  titleBelts = [],
  otherMods = []
) {
  const attires = wrestlers.flatMap((wrestler) => wrestler.attires || [])
  const wrestlerRequests = (wrestlers || []).flatMap((wrestler) => wrestler.requests || [])
  const arenaRequests = (arenas || []).flatMap((arena) => arena.requests || [])
  const titleRequests = (titleBelts || []).flatMap((title) => title.requests || [])
  const otherRequests = (otherMods || []).flatMap((mod) => mod.requests || [])

  const requests = [
    ...wrestlerRequests,
    ...arenaRequests,
    ...titleRequests,
    ...otherRequests
  ].filter((item) => item.status === 'open')

  return {
    wrestlers: wrestlers.length,
    attires: attires.length,
    arenas: arenas.length,
    titleBelts: titleBelts.length,
    otherMods: otherMods.length,
    totalMods: attires.length + arenas.length + titleBelts.length + otherMods.length,
    requests: requests.length,
    missingDownloads:
      attires.filter((attire) => !attire.download_url || !attire.download_url.trim()).length +
      arenas.filter((arena) => !arena.download_url || !arena.download_url.trim()).length +
      titleBelts.filter((title) => !title.download_url || !title.download_url.trim()).length +
      otherMods.filter((mod) => !mod.download_url || !mod.download_url.trim()).length,
    collections: collections.length
  }
}

export function requestSummary(requests = [], key, id) {
  const relevant = requests.filter((item) => item[key] === id && item.status === 'open')
  return {
    total: relevant.length,
    missingLinks: relevant.filter((item) => item.request_type === 'missing_link').length,
    deadLinks: relevant.filter((item) => item.request_type === 'dead_link').length
  }
}

export function uniqueCollectionSlug(name, ownerId = '') {
  const base = slugify(name || 'collection') || 'collection'
  const shortOwner = String(ownerId || 'public')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toLowerCase() || 'public'
  const random = Math.random().toString(36).slice(2, 6)

  return `${base}-${shortOwner}-${random}`
}

export function paginateItems(items = [], page = 1, perPage = 16) {
  const safePerPage = Math.max(1, perPage)
  const totalPages = Math.max(1, Math.ceil(items.length / safePerPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * safePerPage

  return {
    page: safePage,
    perPage: safePerPage,
    totalPages,
    totalItems: items.length,
    items: items.slice(start, start + safePerPage)
  }
}

export function findDuplicateWrestler(wrestlers = [], name = '') {
  const clean = (name || '').trim().toLowerCase()
  if (!clean) return null
  return wrestlers.find((w) => (w.wrestler_name || '').trim().toLowerCase() === clean) || null
}

export function findDuplicateAttire(attires = [], name = '') {
  const clean = (name || '').trim().toLowerCase()
  if (!clean) return null
  return attires.find((a) => (a.name || '').trim().toLowerCase() === clean) || null
}

export function findDuplicateArena(arenas = [], name = '') {
  const clean = (name || '').trim().toLowerCase()
  if (!clean) return null
  return arenas.find((a) => (a.name || '').trim().toLowerCase() === clean) || null
}

export function findDuplicateTitleBelt(titleBelts = [], name = '') {
  const clean = (name || '').trim().toLowerCase()
  if (!clean) return null
  return titleBelts.find((item) => (item.name || '').trim().toLowerCase() === clean) || null
}

export function findDuplicateOtherMod(otherMods = [], name = '') {
  const clean = (name || '').trim().toLowerCase()
  if (!clean) return null
  return otherMods.find((item) => (item.name || '').trim().toLowerCase() === clean) || null
}

export function parseDownloadLinks(value = '') {
  return [...new Set(
    String(value)
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  )]
}

export function hasMissingDownload(url = '') {
  return !String(url || '').trim()
}

export function getDownloadProvider(url = '') {
  const value = String(url).toLowerCase()

  if (value.includes('mediafire.com')) return 'mediafire'
  if (value.includes('mega.nz') || value.includes('mega.io')) return 'mega'
  if (value.includes('drive.google.com') || value.includes('docs.google.com')) return 'google_drive'
  if (value.includes('discord.com') || value.includes('discordapp.com') || value.includes('cdn.discordapp.com')) return 'discord'
  if (value.includes('patreon.com')) return 'patreon'
  if (value.includes('pixeldrain.com')) return 'pixeldrain'
  if (value.includes('dropbox.com')) return 'dropbox'
  if (value.includes('onedrive.live.com')) return 'onedrive'

  return 'link'
}

export function getDownloadProviderLabel(provider = '') {
  switch (provider) {
    case 'mediafire':
      return 'MediaFire'
    case 'mega':
      return 'MEGA'
    case 'google_drive':
      return 'Google Drive'
    case 'discord':
      return 'Discord'
    case 'patreon':
      return 'Patreon'
    case 'pixeldrain':
      return 'PixelDrain'
    case 'dropbox':
      return 'Dropbox'
    case 'onedrive':
      return 'OneDrive'
    default:
      return 'Link'
  }
}

export function getDownloadProviderMark(provider = '') {
  switch (provider) {
    case 'mediafire':
      return 'MF'
    case 'mega':
      return 'M'
    case 'google_drive':
      return 'GD'
    case 'discord':
      return 'DC'
    case 'patreon':
      return 'P'
    case 'pixeldrain':
      return 'PD'
    case 'dropbox':
      return 'DB'
    case 'onedrive':
      return 'OD'
    default:
      return '↗'
  }
}

export function getCollectionItemId(item, modType) {
  if (!item) return null

  switch (modType) {
    case 'attire':
      return item.attire_id || item.id
    case 'arena':
      return item.arena_id || item.id
    case 'title':
      return item.title_id || item.title_belt_id || item.id
    case 'other':
      return item.other_mod_id || item.id
    default:
      return null
  }
}

export function getCollectionItemTarget(item = {}) {
  if (item.attire_id || item.attire || item.attires) {
    return { mod_type: 'attire', mod_subtype: item.mod_subtype || '' }
  }

  if (item.arena_id || item.arena || item.arenas) {
    return { mod_type: 'arena', mod_subtype: item.mod_subtype || '' }
  }

  if (item.title_id || item.title_belt_id || item.title_belt || item.title || item.titleBelt) {
    return { mod_type: 'title', mod_subtype: item.mod_subtype || '' }
  }

  if (item.other_mod_id || item.other_mod || item.other || item.otherMods) {
    return { mod_type: 'other', mod_subtype: item.mod_subtype || '' }
  }

  return {
    mod_type: item.mod_type || '',
    mod_subtype: item.mod_subtype || ''
  }
}

export function getModTypeLabel(type = '') {
  switch (type) {
    case 'attire':
      return 'Attire'
    case 'arena':
      return 'Arena'
    case 'title':
      return 'Title Belt'
    case 'other':
      return 'Other Mod'
    default:
      return 'Mod'
  }
}

export function getSubtypeIcon(subtype = '') {
  switch (subtype) {
    case 'music': return '🎵'
    case 'ui': return '🖥'
    case 'camera': return '🎥'
    case 'lighting': return '💡'
    case 'referee': return '🧑'
    case 'crowd': return '👥'
    case 'match_type': return '🥊'
    case 'weapons': return '⚔'
    case 'moves': return '🕺'
    case 'gameplay': return '🎮'
    default: return '📦'
  }
}

export function getOtherModSubtypeLabel(subtype = '') {
  if (!subtype) return 'Other'
  return titleCase(subtype)
}

export function getUnifiedModTypeOrder(modType = '') {
  switch (modType) {
    case 'attire':
      return 1
    case 'arena':
      return 2
    case 'title':
      return 3
    case 'other':
      return 4
    default:
      return 99
  }
}

export function getUnifiedModPreview(item = {}) {
  if (item.modType === 'attire') {
    return (
      item.render_dds_url ||
      item.images?.[0]?.image_url ||
      item.images?.[0]?.url ||
      item.wrestlerHeadshotUrl ||
      ''
    )
  }

  if (item.modType === 'arena') {
    return item.images?.[0]?.image_url || item.images?.[0]?.url || ''
  }

  if (item.modType === 'title') {
    return (
      item.render_dds_url ||
      item.images?.[0]?.image_url ||
      item.images?.[0]?.url ||
      ''
    )
  }

  if (item.modType === 'other') {
    return item.images?.[0]?.image_url || item.images?.[0]?.url || ''
  }

  return ''
}

export function buildUnifiedModsFeed({
  wrestlers = [],
  arenas = [],
  titleBelts = [],
  otherMods = []
}) {
  const attireItems = wrestlers.flatMap((wrestler) =>
    (wrestler.attires || []).map((attire) => {
      const images = attire.attire_images || attire.images || []
      const links = parseDownloadLinks(attire.download_url || '')

      return {
        key: `attire-${attire.id}`,
        entityId: attire.id,
        modType: 'attire',
        modSubtype: '',
        title: attire.name || 'Unknown attire',
        parentTitle: wrestler.wrestler_name || 'Unknown wrestler',
        creatorName: attire.creator_name || '',
        sourceGame: attire.source_game || 'WWE 2K25',
        createdAt: attire.created_at || '',
        updatedAt: attire.updated_at || '',
        ownerId: attire.owner_id || '',
        hasDownload: links.length > 0,
        linkCount: links.length,
        previewUrl: getUnifiedModPreview({
          modType: 'attire',
          render_dds_url: attire.render_dds_url,
          images,
          wrestlerHeadshotUrl: wrestler.headshot_url || ''
        }),
        images,
        raw: attire,
        searchText: [
          attire.name,
          wrestler.wrestler_name,
          attire.era,
          attire.creator_name,
          attire.notes,
          attire.source_game,
          JSON.stringify(attire.moveset_json || {}),
          JSON.stringify(attire.profile_json || {})
        ]
          .join(' ')
          .toLowerCase()
      }
    })
  )

  const arenaItems = arenas.map((arena) => {
    const images = arena.arena_images || arena.images || []
    const links = parseDownloadLinks(arena.download_url || '')

    return {
      key: `arena-${arena.id}`,
      entityId: arena.id,
      modType: 'arena',
      modSubtype: '',
      title: arena.name || 'Unknown arena',
      parentTitle: '',
      creatorName: arena.creator_name || '',
      sourceGame: arena.source_game || 'WWE 2K25',
      createdAt: arena.created_at || '',
      updatedAt: arena.updated_at || '',
      ownerId: arena.owner_id || '',
      hasDownload: links.length > 0,
      linkCount: links.length,
      previewUrl: getUnifiedModPreview({
        modType: 'arena',
        images
      }),
      images,
      raw: arena,
      searchText: [
        arena.name,
        arena.creator_name,
        arena.notes,
        arena.source_game,
        JSON.stringify(arena.profile_json || {})
      ]
        .join(' ')
        .toLowerCase()
    }
  })

  const titleItems = titleBelts.map((title) => {
    const images = title.title_belt_images || title.images || []
    const links = parseDownloadLinks(title.download_url || '')

    return {
      key: `title-${title.id}`,
      entityId: title.id,
      modType: 'title',
      modSubtype: '',
      title: title.name || 'Unknown title belt',
      parentTitle: '',
      creatorName: title.creator_name || '',
      sourceGame: title.source_game || 'WWE 2K25',
      createdAt: title.created_at || '',
      updatedAt: title.updated_at || '',
      ownerId: title.owner_id || '',
      hasDownload: links.length > 0,
      linkCount: links.length,
      previewUrl: getUnifiedModPreview({
        modType: 'title',
        render_dds_url: title.render_dds_url,
        images
      }),
      images,
      raw: title,
      searchText: [
        title.name,
        title.creator_name,
        title.notes,
        title.source_game
      ]
        .join(' ')
        .toLowerCase()
    }
  })

  const otherItems = otherMods.map((otherMod) => {
    const images = otherMod.other_mod_images || otherMod.images || []
    const links = parseDownloadLinks(otherMod.download_url || '')

    return {
      key: `other-${otherMod.id}`,
      entityId: otherMod.id,
      modType: 'other',
      modSubtype: otherMod.subtype || '',
      title: otherMod.name || 'Unknown mod',
      parentTitle: '',
      creatorName: otherMod.creator_name || '',
      sourceGame: otherMod.source_game || 'WWE 2K25',
      createdAt: otherMod.created_at || '',
      updatedAt: otherMod.updated_at || '',
      ownerId: otherMod.owner_id || '',
      hasDownload: links.length > 0,
      linkCount: links.length,
      previewUrl: getUnifiedModPreview({
        modType: 'other',
        images
      }),
      images,
      raw: otherMod,
      searchText: [
        otherMod.name,
        otherMod.creator_name,
        otherMod.notes,
        otherMod.source_game,
        otherMod.subtype,
        JSON.stringify(otherMod.profile_json || {})
      ]
        .join(' ')
        .toLowerCase()
    }
  })

  return [...attireItems, ...arenaItems, ...titleItems, ...otherItems]
}

export function sortUnifiedMods(items = [], sortBy = 'newest') {
  const sorted = [...items]

  if (sortBy === 'oldest') {
    return sorted.sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    )
  }

  if (sortBy === 'updated') {
    return sorted.sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    )
  }

  if (sortBy === 'az') {
    return sorted.sort((a, b) => a.title.localeCompare(b.title))
  }

  if (sortBy === 'za') {
    return sorted.sort((a, b) => b.title.localeCompare(a.title))
  }

  return sorted.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
}