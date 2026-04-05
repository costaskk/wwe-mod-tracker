
import { useEffect, useMemo, useState } from 'react'
import AdminPanel from './components/AdminPanel'
import AuthPanel from './components/AuthPanel'
import AttireEditorModal from './components/AttireEditorModal'
import CollectionModal from './components/CollectionModal'
import CollectionPickerModal from './components/CollectionPickerModal'
import CollectionView from './components/CollectionView'
import DetailPanel from './components/DetailPanel'
import Filters from './components/Filters'
import Header from './components/Header'
import ModalNotice from './components/ModalNotice'
import ProfileCollections from './components/ProfileCollections'
import RequestModal from './components/RequestModal'
import ResolveLinkModal from './components/ResolveLinkModal'
import StatsGrid from './components/StatsGrid'
import WrestlerEditorModal from './components/WrestlerEditorModal'
import WrestlerList from './components/WrestlerList'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { getAssetUrl, removeAssets, tryAutoMatchHeadshot, uploadAsset } from './lib/storage'
import {
  computeStats,
  emptyAttire,
  emptyCollection,
  emptyWrestler,
  normalizeAttireForEditor,
  normalizeCollectionForEditor,
  normalizeWrestlerForEditor,
  parseJsonOrNull,
  parseTags,
  slugify,
  sortAttires,
  SOURCE_GAMES
} from './lib/utils'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [wrestlers, setWrestlers] = useState([])
  const [creators, setCreators] = useState([])
  const [collections, setCollections] = useState([])
  const [installedIds, setInstalledIds] = useState(new Set())
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState(null)

  const [query, setQuery] = useState('')
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [sourceGameFilter, setSourceGameFilter] = useState('all')
  const [installFilter, setInstallFilter] = useState('all')
  const [missingDownloadOnly, setMissingDownloadOnly] = useState(false)
  const [deadLinkOnly, setDeadLinkOnly] = useState(false)
  const [wrestlerViewMode, setWrestlerViewMode] = useState('cards')
  const [attireViewMode, setAttireViewMode] = useState('gallery')

  const [wrestlerModalOpen, setWrestlerModalOpen] = useState(false)
  const [wrestlerForm, setWrestlerForm] = useState(emptyWrestler())
  const [attireModalOpen, setAttireModalOpen] = useState(false)
  const [attireForm, setAttireForm] = useState(emptyAttire())
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [collectionForm, setCollectionForm] = useState(emptyCollection())
  const [collectionPicker, setCollectionPicker] = useState({ open: false, attire: null })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newCreatorName, setNewCreatorName] = useState('')
  const [addingCreator, setAddingCreator] = useState(false)
  const [notice, setNotice] = useState(null)
  const [requestModal, setRequestModal] = useState({ open: false, context: null })
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [resolveModal, setResolveModal] = useState({ open: false, context: null })
  const [resolvingLink, setResolvingLink] = useState(false)

  const isApproved = Boolean(session && currentProfile?.approval_status === 'approved')
  const isModerator = currentProfile?.role === 'moderator'
  const isAdmin = currentProfile?.role === 'admin'
  const isStaff = isModerator || isAdmin

  function canManageContent(ownerId) {
    if (!session) return false
    return session.user.id === ownerId || isStaff
  }

  function openNotice(type, title, message) {
    setNotice({ type, title, message })
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    fetchAll()
  }, [session])

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('collection')
    if (!slug) return
    const found = collections.find((item) => item.slug === slug)
    if (found) setSelectedCollection(found)
  }, [collections])

  async function fetchAll() {
    setLoading(true)
    setError('')

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
              )
            )
          `)
          .eq('owner_id', session.user.id)
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [], error: null })

      const [wrestlerResult, creatorResult, installsResult, publicCollectionsResult, ownCollectionsResult, profilesResult] = await Promise.all([
      supabase
        .from('wrestlers')
        .select(`
          *,
          attires (
            *,
            attire_images (*)
          ),
          mod_requests (*)
        `)
        .order('wrestler_name', { ascending: true }),
      supabase.from('creators').select('*').order('name', { ascending: true }),
      session?.user?.id
        ? supabase.from('user_installed_attires').select('attire_id').eq('user_id', session.user.id)
        : Promise.resolve({ data: [], error: null }),
      publicCollectionsQuery,
      ownCollectionsQuery,
      supabase.from('profiles').select('*').order('created_at', { ascending: false })
    ])

    if (wrestlerResult.error || creatorResult.error || publicCollectionsResult.error || ownCollectionsResult.error || profilesResult.error) {
      setError(
        wrestlerResult.error?.message ||
        creatorResult.error?.message ||
        publicCollectionsResult.error?.message ||
        ownCollectionsResult.error?.message ||
        profilesResult.error?.message ||
        'Failed to load data.'
      )
      setLoading(false)
      return
    }

    const normalizedWrestlers = (wrestlerResult.data || []).map((wrestler) => ({
      ...wrestler,
      headshot_url: wrestler.headshot_path ? getAssetUrl(wrestler.headshot_path) : (wrestler.headshot_external_url || ''),
      attires: sortAttires((wrestler.attires || []).map((attire) => ({
        ...attire,
        mod_type: attire.mod_type === 'port' ? 'port' : 'original',
        render_dds_url: attire.render_dds_path ? getAssetUrl(attire.render_dds_path) : '',
        attire_images: (attire.attire_images || []).map((img) => ({
          ...img,
          image_url: img.image_path ? getAssetUrl(img.image_path) : ''
        }))
      }))),
      requests: [...(wrestler.mod_requests || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }))

    const collectionMap = new Map()
    ;[...(publicCollectionsResult.data || []), ...(ownCollectionsResult.data || [])].forEach((collection) => {
      const normalizedItems = (collection.collection_items || []).map((item) => ({
        ...item,
        attire: item.attire ? {
          ...item.attire,
          render_dds_url: item.attire.render_dds_path ? getAssetUrl(item.attire.render_dds_path) : '',
          attire_images: (item.attire.attire_images || []).map((img) => ({
            ...img,
            image_url: img.image_path ? getAssetUrl(img.image_path) : ''
          })),
          wrestler: item.attire.wrestler ? {
            ...item.attire.wrestler,
            headshot_url: item.attire.wrestler.headshot_path ? getAssetUrl(item.attire.wrestler.headshot_path) : (item.attire.wrestler.headshot_external_url || '')
          } : null
        } : null
      }))
      collectionMap.set(collection.id, {
        ...collection,
        cover_url: collection.cover_path ? getAssetUrl(collection.cover_path) : '',
        items: normalizedItems
      })
    })

    const mergedCollections = [...collectionMap.values()].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    const slug = new URLSearchParams(window.location.search).get('collection')
    const collectionFromUrl = slug ? mergedCollections.find((item) => item.slug === slug) : null

    const loadedProfiles = profilesResult.data || []
    const myProfile = session
      ? loadedProfiles.find((item) => item.user_id === session.user.id) || null
      : null

    setProfiles(loadedProfiles)
    setCurrentProfile(myProfile)
    setWrestlers(normalizedWrestlers)
    setCreators(creatorResult.data || [])
    setCollections(mergedCollections)
    setSelectedCollection(collectionFromUrl || null)
    setSelectedId((current) => current || normalizedWrestlers[0]?.id || null)
    setInstalledIds(new Set((installsResult.data || []).map((item) => item.attire_id)))
    setLoading(false)
  }

  const filteredWrestlers = useMemo(() => {
    const q = query.toLowerCase().trim()

    return wrestlers
      .map((wrestler) => {
        const filteredAttires = (wrestler.attires || []).filter((attire) => {
          const haystack = [
            wrestler.wrestler_name,
            wrestler.notes,
            ...(wrestler.tags || []),
            attire.name,
            attire.era,
            attire.creator_name,
            attire.notes,
            attire.source_game,
            JSON.stringify(attire.moveset_json || {}),
            JSON.stringify(attire.profile_json || {})
          ].join(' ').toLowerCase()

          const queryOk = !q || haystack.includes(q)
          const creatorOk = creatorFilter === 'all' || attire.creator_name === creatorFilter
          const sourceGameOk = sourceGameFilter === 'all' || attire.source_game === sourceGameFilter
          const installedOk =
            installFilter === 'all' ||
            (installFilter === 'installed' && installedIds.has(attire.id)) ||
            (installFilter === 'not_installed' && !installedIds.has(attire.id))
          const requestInfo = (wrestler.requests || []).filter((request) => request.attire_id === attire.id && request.status === 'open')
          const hasDeadLink = requestInfo.some((request) => request.request_type === 'dead_link')
          const missingDownloadOk = !missingDownloadOnly || !attire.download_url?.trim()
          const deadLinkOk = !deadLinkOnly || hasDeadLink
          return queryOk && creatorOk && sourceGameOk && installedOk && missingDownloadOk && deadLinkOk
        })

        const hasOpenRequests = (wrestler.requests || []).some((request) => request.status === 'open')
        const missingOnlyOk = !showMissingOnly || filteredAttires.some((attire) => attire.status !== 'complete' || !attire.download_url?.trim()) || hasOpenRequests
        const wrestlerQueryOk = !q || [wrestler.wrestler_name, wrestler.notes, ...(wrestler.tags || [])].join(' ').toLowerCase().includes(q)
        const include = missingOnlyOk && (filteredAttires.length > 0 || wrestlerQueryOk)

        return include ? { ...wrestler, attires: filteredAttires } : null
      })
      .filter(Boolean)
  }, [wrestlers, query, showMissingOnly, creatorFilter, sourceGameFilter, installFilter, missingDownloadOnly, deadLinkOnly, installedIds])

  const myCollections = useMemo(() => session ? collections.filter((item) => item.owner_id === session.user.id) : [], [collections, session])
  const selectedWrestler = useMemo(() => filteredWrestlers.find((item) => item.id === selectedId) || filteredWrestlers[0] || null, [filteredWrestlers, selectedId])
  const collectionMemberships = useMemo(() => {
    if (!collectionPicker.attire || !session) return []
    return myCollections.filter((collection) => (collection.items || []).some((item) => item.attire_id === collectionPicker.attire.id)).map((item) => item.id)
  }, [myCollections, collectionPicker, session])

  useEffect(() => {
    if (!selectedId && filteredWrestlers[0]) setSelectedId(filteredWrestlers[0].id)
    if (selectedId && !filteredWrestlers.some((item) => item.id === selectedId)) setSelectedId(filteredWrestlers[0]?.id || null)
  }, [filteredWrestlers, selectedId])

  async function updateProfile(userId, changes) {
    if (!isAdmin) return
    setUpdatingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('user_id', userId)

      if (error) throw error

      openNotice('success', 'User updated', 'The user profile was updated successfully.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not update user', err.message || 'Could not update user.')
    } finally {
      setUpdatingProfile(false)
    }
  }

  async function saveWrestler() {
    if (!isApproved) return
    setSaving(true)
    try {
      if (!wrestlerForm.wrestler_name.trim()) throw new Error('Wrestler name is required.')
      const payload = {
        wrestler_name: wrestlerForm.wrestler_name.trim(),
        notes: wrestlerForm.notes.trim(),
        tags: parseTags(wrestlerForm.tags_text),
        headshot_path: wrestlerForm.headshot_path || '',
        headshot_name: wrestlerForm.headshot_name || '',
        headshot_external_url: wrestlerForm.headshot_external_url || ''
      }
      if (wrestlerForm.id) {
        const { error } = await supabase.from('wrestlers').update(payload).eq('id', wrestlerForm.id)
        if (error) throw error
        openNotice('success', 'Wrestler updated', `${wrestlerForm.wrestler_name} was updated successfully.`)
      } else {
        const { data, error } = await supabase.from('wrestlers').insert(payload).select('id').single()
        if (error) throw error
        setSelectedId(data.id)
        openNotice('success', 'Wrestler added', `${wrestlerForm.wrestler_name} was added to the database.`)
      }
      setWrestlerModalOpen(false)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not save wrestler', err.message || 'Failed to save wrestler.')
    } finally {
      setSaving(false)
    }
  }

  async function saveAttire() {
    if (!isApproved || !attireForm.wrestler_id) return
    setSaving(true)
    try {
      if (!attireForm.name.trim()) throw new Error('Attire name is required.')
      const payload = {
        wrestler_id: attireForm.wrestler_id,
        name: attireForm.name.trim(),
        era: attireForm.era.trim(),
        creator_name: attireForm.creator_name.trim(),
        download_url: attireForm.download_url.trim(),
        source_game: attireForm.source_game,
        mod_type: attireForm.mod_type === 'port' ? 'port' : 'original',
        render_dds_path: attireForm.render_dds_path || '',
        render_dds_name: attireForm.render_dds_name || '',
        notes: attireForm.notes.trim(),
        status: attireForm.status,
        moveset_json: parseJsonOrNull(attireForm.moveset_json_text),
        profile_json: parseJsonOrNull(attireForm.profile_json_text)
      }

      let attireId = attireForm.id
      if (attireForm.persisted) {
        const { error } = await supabase.from('attires').update(payload).eq('id', attireForm.id)
        if (error) throw error
        openNotice('success', 'Attire updated', `${attireForm.name} was updated successfully.`)
      } else {
        const { data, error } = await supabase.from('attires').insert(payload).select('id').single()
        if (error) throw error
        attireId = data.id
        openNotice('success', 'Attire added', `${attireForm.name} was added successfully.`)
      }

      if (Array.isArray(attireForm.pendingImageUploads) && attireForm.pendingImageUploads.length) {
        const inserts = attireForm.pendingImageUploads.map((item) => ({ attire_id: attireId, image_path: item.path, image_name: item.name }))
        const { error } = await supabase.from('attire_images').insert(inserts)
        if (error) throw error
      }

      setAttireModalOpen(false)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not save attire', err.message || 'Failed to save attire.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCollection() {
    if (!isApproved) return
    setSaving(true)
    try {
      const cleanName = collectionForm.name.trim()
      if (!cleanName) throw new Error('Collection name is required.')
      const cleanSlug = slugify(collectionForm.slug || cleanName)
      if (!cleanSlug) throw new Error('Please enter a valid slug using letters and numbers.')
      const payload = {
        name: cleanName,
        slug: cleanSlug,
        description: collectionForm.description.trim(),
        visibility: collectionForm.visibility === 'private' ? 'private' : 'public',
        cover_path: collectionForm.cover_path || '',
        cover_name: collectionForm.cover_name || ''
      }
      if (collectionForm.id) {
        const { error } = await supabase.from('collections').update(payload).eq('id', collectionForm.id)
        if (error) throw error
        openNotice('success', 'Collection updated', `${cleanName} was updated.`)
      } else {
        const { error } = await supabase.from('collections').insert(payload)
        if (error) throw error
        openNotice('success', 'Collection created', `${cleanName} is ready.`)
      }
      setCollectionModalOpen(false)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not save collection', err.message || 'Failed to save collection.')
    } finally {
      setSaving(false)
    }
  }

  async function handleWrestlerHeadshotUpload(file) {
    if (!file || !isApproved) return
    try {
      setUploading(true)
      if (!file.type.startsWith('image/')) throw new Error('Headshot must be an image file.')
      const entityId = wrestlerForm.id || crypto.randomUUID()
      const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file, kind: 'headshot', folder: 'wrestlers' })
      setWrestlerForm((current) => ({ ...current, id: current.id || entityId, headshot_path: path, headshot_name: fileName, headshot_url: getAssetUrl(path), headshot_external_url: '', auto_match_urls: [], auto_match_titles: [] }))
      openNotice('success', 'Headshot uploaded', `${file.name} was uploaded successfully.`)
    } catch (err) {
      openNotice('error', 'Headshot upload failed', err.message || 'Headshot upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCollectionCoverUpload(file) {
    if (!file || !isApproved) return
    try {
      setUploading(true)
      if (!file.type.startsWith('image/')) throw new Error('Cover must be an image file.')
      const entityId = collectionForm.id || crypto.randomUUID()
      const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file, kind: 'cover', folder: 'collections' })
      setCollectionForm((current) => ({ ...current, id: current.id || entityId, cover_path: path, cover_name: fileName, cover_url: getAssetUrl(path) }))
      openNotice('success', 'Cover uploaded', `${file.name} was uploaded successfully.`)
    } catch (err) {
      openNotice('error', 'Cover upload failed', err.message || 'Cover upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAutoMatchHeadshot() {
    if (!isApproved) return
    try {
      setUploading(true)
      const { imageUrl, sourceTitle } = await tryAutoMatchHeadshot(wrestlerForm.wrestler_name, wrestlerForm.auto_match_titles || [], wrestlerForm.auto_match_urls || [])
      setWrestlerForm((current) => ({ ...current, headshot_path: '', headshot_name: `Auto-matched image: ${sourceTitle}`, headshot_url: imageUrl, headshot_external_url: imageUrl, auto_match_titles: [...(current.auto_match_titles || []), sourceTitle], auto_match_urls: [...(current.auto_match_urls || []), imageUrl] }))
      openNotice('success', 'Headshot matched', `Found a public headshot from ${sourceTitle}. Press Try auto-match again for another option.`)
    } catch (err) {
      openNotice('info', 'No alternative image found', err.message || 'Could not auto-match a different headshot.')
    } finally {
      setUploading(false)
    }
  }

  async function removeWrestlerHeadshot() {
    if (!isApproved) return
    try {
      if (wrestlerForm.headshot_path) await removeAssets([wrestlerForm.headshot_path])
      setWrestlerForm((current) => ({ ...current, headshot_path: '', headshot_name: '', headshot_url: '', headshot_external_url: '', auto_match_titles: [], auto_match_urls: [] }))
    } catch (err) {
      openNotice('error', 'Could not remove headshot', err.message || 'Could not remove headshot.')
    }
  }

  async function removeCollectionCover() {
    if (!isApproved) return
    try {
      if (collectionForm.cover_path) await removeAssets([collectionForm.cover_path])
      setCollectionForm((current) => ({ ...current, cover_path: '', cover_url: '', cover_name: '' }))
    } catch (err) {
      openNotice('error', 'Could not remove cover', err.message || 'Could not remove cover.')
    }
  }

  async function handleAssetUpload(filesOrFile, kind) {
    if (!filesOrFile || !isApproved) return
    try {
      setUploading(true)
      if (kind === 'render') {
        const file = filesOrFile
        if (!file.name.toLowerCase().endsWith('.dds')) throw new Error('Render must be a .dds file.')
        const entityId = attireForm.id || crypto.randomUUID()
        const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file, kind: 'render', folder: 'attires' })
        setAttireForm((current) => ({ ...current, id: current.id || entityId, render_dds_path: path, render_dds_name: fileName, render_dds_url: getAssetUrl(path) }))
        openNotice('success', 'DDS uploaded', `${file.name} was uploaded successfully.`)
      }
      if (kind === 'image') {
        const files = filesOrFile
        const entityId = attireForm.id || crypto.randomUUID()
        const uploaded = []
        for (const file of files) {
          if (!file.type.startsWith('image/')) throw new Error('All screenshots must be image files.')
          const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file, kind: 'image', folder: 'attires' })
          uploaded.push({ path, name: fileName, url: getAssetUrl(path) })
        }
        setAttireForm((current) => ({ ...current, id: current.id || entityId, images: [...current.images, ...uploaded], pendingImageUploads: [...(current.pendingImageUploads || []), ...uploaded] }))
        openNotice('success', 'Screenshots uploaded', `${uploaded.length} screenshot${uploaded.length === 1 ? '' : 's'} uploaded successfully.`)
      }
    } catch (err) {
      openNotice('error', 'Upload failed', err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function removeAttireAsset(kind, path) {
    if (!isApproved) return
    try {
      if (path) await removeAssets([path])
      if (kind === 'render') setAttireForm((current) => ({ ...current, render_dds_path: '', render_dds_name: '', render_dds_url: '' }))
      if (kind === 'image') {
        setAttireForm((current) => ({ ...current, images: current.images.filter((img) => img.path !== path), pendingImageUploads: (current.pendingImageUploads || []).filter((img) => img.path !== path) }))
        if (attireForm.persisted) await supabase.from('attire_images').delete().eq('attire_id', attireForm.id).eq('image_path', path)
      }
      openNotice('success', 'Asset removed', 'The selected asset was removed.')
    } catch (err) {
      openNotice('error', 'Could not remove asset', err.message || 'Could not remove asset.')
    }
  }

  async function uploadAttireJsonFile(file, target) {
    if (!file) return
    try {
      const text = await file.text()
      JSON.parse(text)
      if (target === 'moveset') {
        setAttireForm((current) => ({ ...current, moveset_json_text: text }))
        openNotice('success', 'Moveset JSON loaded', `${file.name} was loaded into the editor.`)
      } else {
        setAttireForm((current) => ({ ...current, profile_json_text: text }))
        openNotice('success', 'Profile JSON loaded', `${file.name} was loaded into the editor.`)
      }
    } catch {
      openNotice('error', 'Invalid JSON file', 'That file is not valid JSON.')
    }
  }

  async function addCreator() {
    if (!isApproved) return
    const name = newCreatorName.trim()
    if (!name) return
    setAddingCreator(true)
    try {
      const { data, error } = await supabase.from('creators').insert({ name }).select('*').single()
      if (error) throw error
      setCreators((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
      setAttireForm((current) => ({ ...current, creator_name: data.name }))
      setCreatorFilter(data.name)
      setNewCreatorName('')
      openNotice('success', 'Creator added', `${data.name} is now available in the creator dropdown.`)
    } catch (err) {
      openNotice('error', 'Could not add creator', err.message || 'Could not add creator.')
    } finally {
      setAddingCreator(false)
    }
  }

  async function toggleInstalled(attire, installed) {
    if (!isApproved) return
    try {
      if (installed) {
        const { error } = await supabase.from('user_installed_attires').delete().eq('user_id', session.user.id).eq('attire_id', attire.id)
        if (error) throw error
        openNotice('success', 'Removed from installed', `${attire.name} is no longer marked as installed.`)
      } else {
        const { error } = await supabase.from('user_installed_attires').insert({ user_id: session.user.id, attire_id: attire.id })
        if (error) throw error
        openNotice('success', 'Marked as installed', `${attire.name} is now marked as installed in your game.`)
      }
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not update install status', err.message || 'Could not update install status.')
    }
  }

  function createRequest(wrestlerId, attireId, requestType, wrestlerName, attireName) {
    if (!isApproved) return
    setRequestModal({ open: true, context: { wrestlerId, attireId, requestType, wrestlerName, attireName } })
  }

  async function submitRequest(notes) {
    if (!isApproved || !requestModal.context) return
    setRequestSubmitting(true)
    try {
      const { error } = await supabase.from('mod_requests').insert({ wrestler_id: requestModal.context.wrestlerId, attire_id: requestModal.context.attireId, request_type: requestModal.context.requestType, notes: (notes || '').trim() })
      if (error) throw error
      setRequestModal({ open: false, context: null })
      openNotice('success', 'Request submitted', 'Your request was added successfully.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not submit request', err.message || 'Could not submit request.')
    } finally {
      setRequestSubmitting(false)
    }
  }

  function openResolveLink(wrestler, attire, issueType) {
    if (!isApproved) return
    setResolveModal({
      open: true,
      context: {
        wrestlerId: wrestler.id,
        wrestlerName: wrestler.wrestler_name,
        attireId: attire.id,
        attireName: attire.name,
        issueType,
        currentUrl: attire.download_url || ''
      }
    })
  }

  async function submitResolveLink(url, notes) {
    if (!isApproved || !resolveModal.context) return
    setResolvingLink(true)
    try {
      const cleanUrl = (url || '').trim()
      if (!cleanUrl) throw new Error('A corrected download URL is required.')

      const { error: attireError } = await supabase
        .from('attires')
        .update({ download_url: cleanUrl })
        .eq('id', resolveModal.context.attireId)
      if (attireError) throw attireError

      const requestTypes = resolveModal.context.issueType === 'dead_link'
        ? ['dead_link']
        : ['missing_link', 'dead_link']

      const { error: requestError } = await supabase
        .from('mod_requests')
        .update({
          status: 'fulfilled',
          notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
        })
        .eq('attire_id', resolveModal.context.attireId)
        .eq('status', 'open')
        .in('request_type', requestTypes)
      if (requestError) throw requestError

      setResolveModal({ open: false, context: null })
      openNotice('success', 'Link issue resolved', 'The download link was updated and matching open link requests were marked as resolved.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not resolve link', err.message || 'Could not resolve this link issue.')
    } finally {
      setResolvingLink(false)
    }
  }

  function openAddWrestler() {
    if (!isApproved) return
    setWrestlerForm(emptyWrestler())
    setWrestlerModalOpen(true)
  }

  function openEditWrestler(wrestler) {
    setWrestlerForm(normalizeWrestlerForEditor(wrestler))
    setWrestlerModalOpen(true)
  }

  function openAddAttire(wrestler) {
    if (!isApproved) return
    setAttireForm({ ...emptyAttire(wrestler.id), pendingImageUploads: [] })
    setAttireModalOpen(true)
  }

  function openEditAttire(attire) {
    setAttireForm({ ...normalizeAttireForEditor(attire), pendingImageUploads: [] })
    setAttireModalOpen(true)
  }

  function openCreateCollection() {
    if (!isApproved) return
    setCollectionForm(emptyCollection())
    setCollectionModalOpen(true)
  }

  function openEditCollection(collection) {
    setCollectionForm(normalizeCollectionForEditor(collection))
    setCollectionModalOpen(true)
  }

  function openCollection(collection) {
    setSelectedCollection(collection)
    const next = `${window.location.pathname}?collection=${encodeURIComponent(collection.slug)}`
    window.history.replaceState({}, '', next)
  }

  function closeCollectionView() {
    setSelectedCollection(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  function browseCollections() {
    if (selectedCollection) {
      closeCollectionView()
      requestAnimationFrame(() => {
        document.getElementById('my-collections-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return
    }

    document.getElementById('my-collections-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function shareCollection(collection) {
    const url = `${window.location.origin}${window.location.pathname}?collection=${collection.slug}`
    try {
      await navigator.clipboard.writeText(url)
      openNotice('success', 'Share link copied', 'The public collection link was copied to your clipboard.')
    } catch {
      openNotice('info', 'Collection link', url)
    }
  }

  function openCollectionPicker(attire) {
    if (!isApproved) return
    setCollectionPicker({ open: true, attire })
  }

  async function toggleCollectionMembership(collection, isIn) {
    if (!isApproved || !collectionPicker.attire) return
    setSaving(true)
    try {
      if (isIn) {
        const { error } = await supabase.from('collection_items').delete().eq('collection_id', collection.id).eq('attire_id', collectionPicker.attire.id)
        if (error) throw error
        openNotice('success', 'Removed from collection', `${collectionPicker.attire.name} was removed from ${collection.name}.`)
      } else {
        const { error } = await supabase.from('collection_items').insert({ collection_id: collection.id, attire_id: collectionPicker.attire.id })
        if (error) throw error
        openNotice('success', 'Added to collection', `${collectionPicker.attire.name} was added to ${collection.name}.`)
      }
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not update collection', err.message || 'Could not update collection.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAttire(attire) {
    if (!canManageContent(attire.owner_id)) return
    if (!window.confirm(`Delete ${attire.name}?`)) return
    try {
      const paths = [attire.render_dds_path, ...(attire.attire_images || []).map((img) => img.image_path)]
      await removeAssets(paths)
      const { error } = await supabase.from('attires').delete().eq('id', attire.id)
      if (error) throw error
      openNotice('success', 'Attire deleted', `${attire.name} was deleted.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not delete attire', err.message || 'Could not delete attire.')
    }
  }

  async function deleteWrestler(wrestler) {
    if (!canManageContent(wrestler.owner_id)) return
    if (!window.confirm(`Delete ${wrestler.wrestler_name} and all attire mods?`)) return
    try {
      const assetPaths = [wrestler.headshot_path]
      for (const attire of wrestler.attires || []) {
        if (attire.render_dds_path) assetPaths.push(attire.render_dds_path)
        for (const img of attire.attire_images || []) assetPaths.push(img.image_path)
      }
      await removeAssets(assetPaths)
      const { error } = await supabase.from('wrestlers').delete().eq('id', wrestler.id)
      if (error) throw error
      openNotice('success', 'Wrestler deleted', `${wrestler.wrestler_name} and related attire mods were deleted.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not delete wrestler', err.message || 'Could not delete wrestler.')
    }
  }

  async function deleteCollection(collection) {
    if (!canManageContent(collection.owner_id)) return
    if (!window.confirm(`Delete collection ${collection.name}?`)) return
    try {
      if (collection.cover_path) await removeAssets([collection.cover_path])
      const { error } = await supabase.from('collections').delete().eq('id', collection.id)
      if (error) throw error
      if (selectedCollection?.id === collection.id) closeCollectionView()
      openNotice('success', 'Collection deleted', `${collection.name} was deleted.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not delete collection', err.message || 'Could not delete collection.')
    }
  }

  const stats = computeStats(wrestlers, collections)

  if (!isSupabaseConfigured) {
    return (
      <div className="app-shell">
        <Header
          onAddWrestler={() => {}}
          session={null}
          onBrowseCollections={() => {}}
          activeCollection={null}
          currentProfile={null}
          canContribute={false}
          onBrowseAdmin={() => {}}
        />
        <div className="message error">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before running the app.</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header
        onAddWrestler={openAddWrestler}
        session={session}
        onBrowseCollections={browseCollections}
        activeCollection={selectedCollection}
        currentProfile={currentProfile}
        canContribute={isApproved}
        onBrowseAdmin={() => {
          document.getElementById('admin-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      />
      <AuthPanel session={session} currentProfile={currentProfile} />
      <StatsGrid stats={stats} />
      {error ? <div className="message error">{error}</div> : null}

      {selectedCollection ? (
        <CollectionView collection={selectedCollection} onClose={closeCollectionView} onSelectWrestler={(id) => { closeCollectionView(); setSelectedId(id) }} />
      ) : (
        <>
          <div className="layout-grid">
            <div className="left-column">
              <Filters
                query={query}
                setQuery={setQuery}
                showMissingOnly={showMissingOnly}
                setShowMissingOnly={setShowMissingOnly}
                creatorFilter={creatorFilter}
                setCreatorFilter={setCreatorFilter}
                creators={creators}
                sourceGameFilter={sourceGameFilter}
                setSourceGameFilter={setSourceGameFilter}
                sourceGames={SOURCE_GAMES}
                installFilter={installFilter}
                setInstallFilter={setInstallFilter}
                missingDownloadOnly={missingDownloadOnly}
                setMissingDownloadOnly={setMissingDownloadOnly}
                deadLinkOnly={deadLinkOnly}
                setDeadLinkOnly={setDeadLinkOnly}
                session={session}
                newCreatorName={newCreatorName}
                setNewCreatorName={setNewCreatorName}
                onAddCreator={addCreator}
                addingCreator={addingCreator}
              />

              <WrestlerList
                wrestlers={filteredWrestlers}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={openEditWrestler}
                onDelete={deleteWrestler}
                session={session}
                currentProfile={currentProfile}
                canManageContent={canManageContent}
                viewMode={wrestlerViewMode}
                setViewMode={setWrestlerViewMode}
              />
            </div>

            <DetailPanel
              wrestler={selectedWrestler}
              session={session}
              currentProfile={currentProfile}
              canContribute={isApproved}
              canManageContent={canManageContent}
              installedIds={installedIds}
              onAddAttire={openAddAttire}
              onEditWrestler={openEditWrestler}
              onEditAttire={openEditAttire}
              onDeleteAttire={deleteAttire}
              onToggleInstalled={toggleInstalled}
              onCreateRequest={createRequest}
              onResolveLink={openResolveLink}
              attireViewMode={attireViewMode}
              setAttireViewMode={setAttireViewMode}
              onOpenCollectionPicker={openCollectionPicker}
            />
          </div>

          <ProfileCollections
            sectionId="my-collections-section"
            session={session}
            collections={myCollections}
            onCreate={openCreateCollection}
            onEdit={openEditCollection}
            onDelete={deleteCollection}
            onOpen={openCollection}
            onShare={shareCollection}
          />
        </>
      )}
      <AdminPanel
        session={session}
        currentProfile={currentProfile}
        profiles={profiles}
        onUpdateProfile={updateProfile}
        updating={updatingProfile}
      />
      <WrestlerEditorModal
        open={wrestlerModalOpen}
        form={wrestlerForm}
        setForm={setWrestlerForm}
        onClose={() => setWrestlerModalOpen(false)}
        onSave={saveWrestler}
        onUploadHeadshot={handleWrestlerHeadshotUpload}
        onAutoMatchHeadshot={handleAutoMatchHeadshot}
        onRemoveHeadshot={removeWrestlerHeadshot}
        saving={saving}
        uploading={uploading}
      />

      <AttireEditorModal
        open={attireModalOpen}
        form={attireForm}
        setForm={setAttireForm}
        onClose={() => setAttireModalOpen(false)}
        onSave={saveAttire}
        onUpload={handleAssetUpload}
        onRemoveAsset={removeAttireAsset}
        creatorOptions={creators}
        newCreatorName={newCreatorName}
        setNewCreatorName={setNewCreatorName}
        onAddCreator={addCreator}
        onUploadJson={uploadAttireJsonFile}
        saving={saving}
        uploading={uploading}
        addingCreator={addingCreator}
      />

      <CollectionModal
        open={collectionModalOpen}
        form={collectionForm}
        setForm={setCollectionForm}
        onClose={() => setCollectionModalOpen(false)}
        onSave={saveCollection}
        onUploadCover={handleCollectionCoverUpload}
        onRemoveCover={removeCollectionCover}
        saving={saving}
        uploading={uploading}
      />

      <CollectionPickerModal
        open={collectionPicker.open}
        attire={collectionPicker.attire}
        collections={myCollections}
        memberships={collectionMemberships}
        onClose={() => setCollectionPicker({ open: false, attire: null })}
        onToggle={toggleCollectionMembership}
        saving={saving}
      />

      <RequestModal
        open={requestModal.open}
        context={requestModal.context}
        onClose={() => setRequestModal({ open: false, context: null })}
        onSubmit={submitRequest}
        submitting={requestSubmitting}
      />

      <ResolveLinkModal
        open={resolveModal.open}
        context={resolveModal.context}
        onClose={() => setResolveModal({ open: false, context: null })}
        onSubmit={submitResolveLink}
        submitting={resolvingLink}
      />

      <ModalNotice notice={notice} onClose={() => setNotice(null)} />
      {loading ? <div className="loading-overlay">Loading database…</div> : null}
    </div>
  )
}
