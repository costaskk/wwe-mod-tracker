import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAssetUrl } from '../lib/storage'
import { sortAttires, uniqueCollectionSlug } from '../lib/utils'

function asset(path, externalUrl = '') {
  return getAssetUrl(path, externalUrl) || ''
}

function resolveImageUrls(img = {}) {
  const full = asset(img.image_path, img.external_original_url)
  const medium =
    asset(img.image_medium_path, img.external_medium_url) ||
    full

  const thumb =
    asset(img.image_thumb_path, img.external_thumb_url) ||
    medium ||
    full

  return {
    image_thumb_url: thumb,
    image_medium_url: medium || thumb || full,
    image_url: medium || thumb || full,
    full_image_url: full || medium || thumb
  }
}

function resolveHeadshotUrls(wrestler = {}) {
  const full = asset(
    wrestler.headshot_path,
    wrestler.headshot_external_original_url || wrestler.headshot_external_url
  )

  const medium =
    asset(
      wrestler.headshot_medium_path,
      wrestler.headshot_external_medium_url || wrestler.headshot_external_url
    ) ||
    full

  const thumb =
    asset(
      wrestler.headshot_thumb_path,
      wrestler.headshot_external_thumb_url || wrestler.headshot_external_url
    ) ||
    medium ||
    full

  return {
    headshot_thumb_url: thumb,
    headshot_medium_url: medium || thumb || full,
    headshot_url: medium || thumb || full,
    headshot_full_url: full || medium || thumb
  }
}

function resolveRenderDdsUrls(item = {}) {
  const url = asset(
    item.render_dds_path,
    item.render_dds_external_url || item.render_dds_url
  )

  return {
    render_dds_url: url,
    render_dds_full_url: url
  }
}

export default function useAppData(session) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])

  const [wrestlers, setWrestlers] = useState([])
  const [arenas, setArenas] = useState([])
  const [titleBelts, setTitleBelts] = useState([])
  const [otherMods, setOtherMods] = useState([])
  const [creators, setCreators] = useState([])
  const [collections, setCollections] = useState([])
  const [modAddRequests, setModAddRequests] = useState([])
  const [modPortRequests, setModPortRequests] = useState([])
  const [modVersionLinks, setModVersionLinks] = useState([])

  const [installedIds, setInstalledIds] = useState(new Set())
  const [installedArenaIds, setInstalledArenaIds] = useState(new Set())
  const [installedTitleIds, setInstalledTitleIds] = useState(new Set())
  const [installedOtherModIds, setInstalledOtherModIds] = useState(new Set())

  const fetchCurrentUserProfile = useCallback(async () => {
    if (!session?.user?.id) return { data: null, error: null }

    return await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
  }, [session])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const currentProfileResult = await fetchCurrentUserProfile()

      if (currentProfileResult.error) {
        setError(currentProfileResult.error.message || 'Failed to load your profile.')
        return
      }

      const myProfile = currentProfileResult.data || null

      const publicCollectionsQuery = supabase
        .from('collections')
        .select(`
          *,
          collection_items (
            *,
            attire:attires (
              *,
              wrestler:wrestlers (*),
              attire_images (*)
            ),
            arena:arenas (
              *,
              arena_images (*)
            ),
            title_belt:title_belts (
              *,
              title_belt_images (*)
            ),
            other_mod:other_mods (
              *,
              other_mod_images (*)
            )
          )
        `)
        .eq('visibility', 'public')
        .order('updated_at', { ascending: false })

      const ownCollectionsQuery = session?.user?.id
        ? supabase
            .from('collections')
            .select(`
              *,
              collection_items (
                *,
                attire:attires (
                  *,
                  wrestler:wrestlers (*),
                  attire_images (*)
                ),
                arena:arenas (
                  *,
                  arena_images (*)
                ),
                title_belt:title_belts (
                  *,
                  title_belt_images (*)
                ),
                other_mod:other_mods (
                  *,
                  other_mod_images (*)
                )
              )
            `)
            .eq('owner_id', session.user.id)
            .order('updated_at', { ascending: false })
        : Promise.resolve({ data: [], error: null })

      const [
        wrestlerResult,
        arenaResult,
        creatorResult,
        titleResult,
        otherModsResult,
        modAddRequestsResult,
        modPortRequestsResult,
        modVersionLinksResult,
        installedOtherModsResult,
        installsResult,
        installedArenasResult,
        installedTitlesResult,
        publicCollectionsResult,
        ownCollectionsResult
      ] = await Promise.all([
        supabase
          .from('wrestlers')
          .select(`
            *,
            wrestler_audio_files (*),
            wrestler_titantrons (
              *,
              titantron_images (*)
            ),
            attires (
              *,
              attire_images (*)
            ),
            mod_requests (*)
          `)
          .order('wrestler_name', { ascending: true }),

        supabase
          .from('arenas')
          .select(`
            *,
            arena_images (*),
            arena_requests (*)
          `)
          .order('name', { ascending: true }),

        supabase.from('creators').select('*').order('name', { ascending: true }),

        supabase
          .from('title_belts')
          .select(`
            *,
            title_belt_images (*),
            title_belt_audio_files (*),
            title_belt_requests (*)
          `)
          .order('name', { ascending: true }),

        supabase
          .from('other_mods')
          .select(`
            *,
            other_mod_images (*),
            other_mod_requests (*)
          `)
          .order('name', { ascending: true }),

        supabase
          .from('mod_add_requests')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('mod_port_requests')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('mod_version_links')
          .select('*')
          .order('created_at', { ascending: false }),

        session?.user?.id
          ? supabase.from('user_installed_other_mods').select('other_mod_id').eq('user_id', session.user.id)
          : Promise.resolve({ data: [], error: null }),

        session?.user?.id
          ? supabase.from('user_installed_attires').select('attire_id').eq('user_id', session.user.id)
          : Promise.resolve({ data: [], error: null }),

        session?.user?.id
          ? supabase.from('user_installed_arenas').select('arena_id').eq('user_id', session.user.id)
          : Promise.resolve({ data: [], error: null }),

        session?.user?.id
          ? supabase.from('user_installed_title_belts').select('title_belt_id').eq('user_id', session.user.id)
          : Promise.resolve({ data: [], error: null }),

        publicCollectionsQuery,
        ownCollectionsQuery
      ])

      const errors = [
        wrestlerResult.error,
        arenaResult.error,
        creatorResult.error,
        titleResult.error,
        otherModsResult.error,
        modAddRequestsResult.error,
        modPortRequestsResult.error,
        modVersionLinksResult.error,
        installedOtherModsResult.error,
        installsResult.error,
        installedArenasResult.error,
        installedTitlesResult.error,
        publicCollectionsResult.error,
        ownCollectionsResult.error
      ].filter(Boolean)

      if (errors.length) {
        console.error('fetchAll errors:', errors)
        setError(errors[0].message || 'Failed to load data.')
        return
      }

      const versionLinks = modVersionLinksResult.data || []
      const portRequests = modPortRequestsResult.data || []

      const byForeignKey = (rows, key) => rows.reduce((acc, row) => {
        const id = row?.[key]
        if (!id) return acc
        if (!acc[id]) acc[id] = []
        acc[id].push(row)
        return acc
      }, {})

      const attireVersionLinksById = byForeignKey(versionLinks.filter((row) => row.mod_type === 'attire'), 'attire_id')
      const arenaVersionLinksById = byForeignKey(versionLinks.filter((row) => row.mod_type === 'arena'), 'arena_id')
      const titleVersionLinksById = byForeignKey(versionLinks.filter((row) => row.mod_type === 'title'), 'title_belt_id')
      const otherVersionLinksById = byForeignKey(versionLinks.filter((row) => row.mod_type === 'other'), 'other_mod_id')

      const attirePortRequestsById = byForeignKey(portRequests.filter((row) => row.mod_type === 'attire'), 'attire_id')
      const arenaPortRequestsById = byForeignKey(portRequests.filter((row) => row.mod_type === 'arena'), 'arena_id')
      const titlePortRequestsById = byForeignKey(portRequests.filter((row) => row.mod_type === 'title'), 'title_belt_id')
      const otherPortRequestsById = byForeignKey(portRequests.filter((row) => row.mod_type === 'other'), 'other_mod_id')

      const normalizedWrestlers = (wrestlerResult.data || []).map((wrestler) => ({
        ...wrestler,
        ...resolveHeadshotUrls(wrestler),
        audio_files: (wrestler.wrestler_audio_files || []).map((file) => ({
          ...file,
          file_url: file.download_url || file.external_url || (file.file_path ? getAssetUrl(file.file_path) : '')
        })),
        titantrons: (wrestler.wrestler_titantrons || []).map((item) => ({
          ...item,
          titantron_images: (item.titantron_images || []).map((img) => ({
            ...img,
            ...resolveImageUrls(img)
          }))
        })),
        attires: sortAttires((wrestler.attires || []).map((attire) => ({
          ...attire,
          mod_type: attire.mod_type === 'port' ? 'port' : 'original',
          ...resolveRenderDdsUrls(attire),
          attire_images: (attire.attire_images || []).map((img) => ({
            ...img,
            ...resolveImageUrls(img)
          })),
          version_links: (attireVersionLinksById[attire.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
          mod_version_links: (attireVersionLinksById[attire.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
          port_requests: (attirePortRequestsById[attire.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
          mod_port_requests: (attirePortRequestsById[attire.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }))),
        requests: [...(wrestler.mod_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      }))

      const normalizedArenas = (arenaResult.data || []).map((arena) => ({
        ...arena,
        arena_images: (arena.arena_images || []).map((img) => ({
          ...img,
          ...resolveImageUrls(img)
        })),
        version_links: (arenaVersionLinksById[arena.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        mod_version_links: (arenaVersionLinksById[arena.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        port_requests: (arenaPortRequestsById[arena.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        mod_port_requests: (arenaPortRequestsById[arena.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        requests: [...(arena.arena_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      }))

      const normalizedTitles = (titleResult.data || []).map((title) => ({
        ...title,
        ...resolveRenderDdsUrls(title),
        title_belt_images: (title.title_belt_images || []).map((img) => ({
          ...img,
          ...resolveImageUrls(img)
        })),
        audio_files: (title.title_belt_audio_files || []).map((file) => ({
          ...file,
          file_url: file.download_url || file.external_url || (file.file_path ? getAssetUrl(file.file_path) : '')
        })),
        version_links: (titleVersionLinksById[title.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        mod_version_links: (titleVersionLinksById[title.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        port_requests: (titlePortRequestsById[title.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        mod_port_requests: (titlePortRequestsById[title.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        requests: [...(title.title_belt_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      }))

      const normalizedOtherMods = (otherModsResult.data || []).map((otherMod) => ({
        ...otherMod,
        other_mod_images: (otherMod.other_mod_images || []).map((img) => ({
          ...img,
          ...resolveImageUrls(img)
        })),
        version_links: (otherVersionLinksById[otherMod.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        mod_version_links: (otherVersionLinksById[otherMod.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        port_requests: (otherPortRequestsById[otherMod.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        mod_port_requests: (otherPortRequestsById[otherMod.id] || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        requests: [...(otherMod.other_mod_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      }))

      const collectionMap = new Map()
      ;[...(publicCollectionsResult.data || []), ...(ownCollectionsResult.data || [])].forEach((collection) => {
        const normalizedItems = (collection.collection_items || []).map((item) => ({
          ...item,
          attire: item.attire
            ? {
                ...item.attire,
                ...resolveRenderDdsUrls(item.attire),
                attire_images: (item.attire.attire_images || []).map((img) => ({
                  ...img,
                  ...resolveImageUrls(img)
                })),
                wrestler: item.attire.wrestler
                  ? {
                      ...item.attire.wrestler,
                      ...resolveHeadshotUrls(item.attire.wrestler)
                    }
                  : null
              }
            : null,
          arena: item.arena
            ? {
                ...item.arena,
                arena_images: (item.arena.arena_images || []).map((img) => ({
                  ...img,
                  ...resolveImageUrls(img)
                }))
              }
            : null,
          title_belt: item.title_belt
            ? {
                ...item.title_belt,
                ...resolveRenderDdsUrls(item.title_belt),
                title_belt_images: (item.title_belt.title_belt_images || []).map((img) => ({
                  ...img,
                  ...resolveImageUrls(img)
                }))
              }
            : null,
          other_mod: item.other_mod
            ? {
                ...item.other_mod,
                other_mod_images: (item.other_mod.other_mod_images || []).map((img) => ({
                  ...img,
                  ...resolveImageUrls(img)
                }))
              }
            : null
        }))

        collectionMap.set(collection.id, {
          ...collection,
          cover_url: getAssetUrl(collection.cover_path, collection.cover_external_url),
          cover_full_url: getAssetUrl(collection.cover_path, collection.cover_external_url),
          items: normalizedItems
        })
      })

      const mergedCollections = [...collectionMap.values()].sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      )

      const seenSlugs = new Set()
      const repairedCollections = await Promise.all(
        mergedCollections.map(async (collection) => {
          if (!collection.slug || seenSlugs.has(collection.slug)) {
            const newSlug = uniqueCollectionSlug(collection.name, collection.owner_id)
            const { error: slugUpdateError } = await supabase
              .from('collections')
              .update({ slug: newSlug })
              .eq('id', collection.id)

            if (slugUpdateError) throw slugUpdateError

            seenSlugs.add(newSlug)
            return { ...collection, slug: newSlug }
          }

          seenSlugs.add(collection.slug)
          return collection
        })
      )

      let loadedProfiles = myProfile ? [myProfile] : []

      if (myProfile?.role === 'admin') {
        const adminProfilesResult = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (adminProfilesResult.error) throw adminProfilesResult.error
        loadedProfiles = adminProfilesResult.data || []
      }

      setProfiles(loadedProfiles)
      setCurrentProfile(myProfile)
      setWrestlers(normalizedWrestlers)
      setArenas(normalizedArenas)
      setTitleBelts(normalizedTitles)
      setOtherMods(normalizedOtherMods)
      setCreators(creatorResult.data || [])
      setCollections(repairedCollections)
      setModAddRequests((modAddRequestsResult.data || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      setModPortRequests((modPortRequestsResult.data || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      setModVersionLinks((modVersionLinksResult.data || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))

      setInstalledIds(new Set((installsResult.data || []).map((item) => item.attire_id)))
      setInstalledArenaIds(new Set((installedArenasResult.data || []).map((item) => item.arena_id)))
      setInstalledTitleIds(new Set((installedTitlesResult.data || []).map((item) => item.title_belt_id)))
      setInstalledOtherModIds(new Set((installedOtherModsResult.data || []).map((item) => item.other_mod_id)))
    } catch (err) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [fetchCurrentUserProfile, session])

  return {
    loading,
    error,
    currentProfile,
    profiles,
    wrestlers,
    arenas,
    titleBelts,
    otherMods,
    creators,
    collections,
    modAddRequests,
    modPortRequests,
    modVersionLinks,
    installedIds,
    installedArenaIds,
    installedTitleIds,
    installedOtherModIds,
    setProfiles,
    setCurrentProfile,
    setWrestlers,
    setArenas,
    setTitleBelts,
    setOtherMods,
    setCreators,
    setCollections,
    setModAddRequests,
    setModPortRequests,
    setModVersionLinks,
    setInstalledIds,
    setInstalledArenaIds,
    setInstalledTitleIds,
    setInstalledOtherModIds,
    fetchAll
  }
}