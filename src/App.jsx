
import { useEffect, useMemo, useState } from 'react'
import AllModsPage from './components/AllModsPage'
import AdminPanel from './components/AdminPanel'
import AuthPanel from './components/AuthPanel'
import ArenaPage from './components/ArenaPage'
import TitleBeltPage from './components/TitleBeltPage'
import LinkIssuesPage from './components/LinkIssuesPage'
import OtherModPage from './components/OtherModPage'
import AttireEditorModal from './components/AttireEditorModal'
import CollectionModal from './components/CollectionModal'
import CollectionPickerModal from './components/CollectionPickerModal'
import CollectionView from './components/CollectionView'
import ConfirmActionModal from './components/ConfirmActionModal'
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
import { buildUnifiedModsFeed } from './lib/utils' // ✅ make sure this exists
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { getAssetUrl, removeAssets, tryAutoMatchHeadshot, uploadAsset } from './lib/storage'
import { testDownloadLink, parseDownloadLinks } from './lib/utils'
import {
  uid,
  computeStats,
  emptyAttire,
  emptyCollection,
  emptyWrestler,
  emptyTitantron,
  emptyOtherMod,
  normalizeAttireForEditor,
  normalizeCollectionForEditor,
  normalizeWrestlerForEditor,
  normalizeOtherModForEditor,
  parseJsonOrNull,
  parseTags,
  slugify,
  sortAttires,
  SOURCE_GAMES,
  uniqueCollectionSlug,
  paginateItems,
  findDuplicateWrestler,
  findDuplicateAttire,
  findDuplicateOtherMod
} from './lib/utils'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [wrestlers, setWrestlers] = useState([])
  const [arenas, setArenas] = useState([])
  const [creators, setCreators] = useState([])
  const [collections, setCollections] = useState([])
  const [installedIds, setInstalledIds] = useState(new Set())
  const [installedArenaIds, setInstalledArenaIds] = useState(new Set())
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
  const [currentPage, setCurrentPage] = useState('all_mods')
  const [modsPage, setModsPage] = useState(1)
  const modsPerPage = 14

  const [wrestlerModalOpen, setWrestlerModalOpen] = useState(false)
  const [wrestlerForm, setWrestlerForm] = useState(emptyWrestler())
  const [attireModalOpen, setAttireModalOpen] = useState(false)
  const [attireForm, setAttireForm] = useState(emptyAttire())
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [collectionForm, setCollectionForm] = useState(emptyCollection())
  const [collectionPicker, setCollectionPicker] = useState({ open: false, item: null })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newCreatorName, setNewCreatorName] = useState('')
  const [addingCreator, setAddingCreator] = useState(false)
  const [notice, setNotice] = useState(null)
  const [requestModal, setRequestModal] = useState({ open: false, context: null })
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [resolveModal, setResolveModal] = useState({ open: false, context: null })
  const [resolvingLink, setResolvingLink] = useState(false)
  const [confirmAction, setConfirmAction] = useState({ open: false, title: '', message: '', confirmLabel: 'Confirm', tone: 'danger', busy: false, onConfirm: null })

  const isModerator = currentProfile?.role === 'moderator'
  const isAdmin = currentProfile?.role === 'admin'
  const isStaff = isModerator || isAdmin

  const [highlightedAttireId, setHighlightedAttireId] = useState(null)
  
  const [wrestlerSelectSignal, setWrestlerSelectSignal] = useState(null)

  const [arenaCreateSignal, setArenaCreateSignal] = useState(0)
  const [arenaSelectSignal, setArenaSelectSignal] = useState(null)

  const [titleBelts, setTitleBelts] = useState([])
  const [installedTitleIds, setInstalledTitleIds] = useState(new Set())

  const [titleCreateSignal, setTitleCreateSignal] = useState(0)
  const [titleSelectSignal, setTitleSelectSignal] = useState(null)
  
  const [otherMods, setOtherMods] = useState([])
  const [installedOtherModIds, setInstalledOtherModIds] = useState(new Set())

  const [otherModsCreateSignal, setOtherModsCreateSignal] = useState(0)
  const [otherModsSelectSignal, setOtherModsSelectSignal] = useState(null)


  const [visibleModsCount, setVisibleModsCount] = useState(modsPerPage)
  //const isApproved = Boolean(session && currentProfile?.approval_status === 'approved')

  // 🔥 NEW: unified permission flag
  const canContribute = Boolean(
    session && (currentProfile?.approval_status === 'approved' || isStaff)
  )

  const canDeleteContent = Boolean(session && isStaff)

  const [imageViewer, setImageViewer] = useState({
    open: false,
    images: [],
    index: 0
  })

  function canManageContent(ownerId) {
    if (!session) return false
    return session.user.id === ownerId || isStaff
  }

  function openNotice(type, title, message) {
    setNotice({ type, title, message })
  }

  function addTitantron() {
    setWrestlerForm((current) => ({
      ...current,
      titantrons: [
        ...(current.titantrons || []),
        {
          ...emptyTitantron(),
          id: uid(),
          persisted: false,
          wrestler_id: current.id || null,
          title: '',
          download_url: '',
          source_game: 'WWE 2K25',
          screenshots: [],
          pendingScreenshotUploads: []
        }
      ]
    }))
  }

  function updateTitantron(titantronId, changes) {
    setWrestlerForm((current) => ({
      ...current,
      titantrons: (current.titantrons || []).map((item) =>
        item.id === titantronId ? { ...item, ...changes } : item
      )
    }))
  }

  async function handleTitantronScreenshotUpload(titantronId, files) {
    if (!files?.length || !canContribute) return

    try {
      setUploading(true)

      const titantron = (wrestlerForm.titantrons || []).find((item) => item.id === titantronId)
      if (!titantron) throw new Error('Titantron not found.')

      const entityId = wrestlerForm.id || wrestlerForm.temp_upload_id || uid()
      const uploaded = []

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Titantron screenshots must be image files.')
        }

        const optimizedFile = await compressImage(file)

        const { path, fileName } = await uploadAsset({
          userId: session.user.id,
          entityId,
          file: optimizedFile,
          kind: 'titantron_image',
          folder: 'wrestlers'
        })

        uploaded.push({
          id: uid(),
          path,
          name: fileName,
          url: getAssetUrl(path)
        })
      }

      setWrestlerForm((current) => ({
        ...current,
        temp_upload_id: current.temp_upload_id || (!current.id ? entityId : ''),
        titantrons: (current.titantrons || []).map((item) =>
          item.id === titantronId
            ? {
                ...item,
                wrestler_id: current.id || null,
                screenshots: [...(item.screenshots || []), ...uploaded],
                pendingScreenshotUploads: [...(item.pendingScreenshotUploads || []), ...uploaded]
              }
            : item
        )
      }))

      openNotice(
        'success',
        'Titantron screenshots uploaded',
        `${uploaded.length} screenshot${uploaded.length === 1 ? '' : 's'} uploaded successfully.`
      )
    } catch (err) {
      openNotice('error', 'Upload failed', err.message || 'Could not upload titantron screenshots.')
    } finally {
      setUploading(false)
    }
  }

  async function removeTitantronScreenshot(titantronId, screenshotPath) {
    if (!canDeleteContent) return

    try {
      setUploading(true)

      if (screenshotPath) {
        await removeAssets([screenshotPath])
      }

      const titantron = (wrestlerForm.titantrons || []).find((item) => item.id === titantronId)

      setWrestlerForm((current) => ({
        ...current,
        titantrons: (current.titantrons || []).map((item) =>
          item.id === titantronId
            ? {
                ...item,
                screenshots: (item.screenshots || []).filter((img) => img.path !== screenshotPath),
                pendingScreenshotUploads: (item.pendingScreenshotUploads || []).filter((img) => img.path !== screenshotPath)
              }
            : item
        )
      }))

      if (titantron?.persisted) {
        const { error } = await supabase
          .from('titantron_images')
          .delete()
          .eq('wrestler_titantron_id', titantronId)
          .eq('image_path', screenshotPath)

        if (error) throw error
      }

      openNotice('success', 'Titantron screenshot removed', 'The screenshot was removed.')
    } catch (err) {
      openNotice('error', 'Could not remove screenshot', err.message || 'Could not remove titantron screenshot.')
    } finally {
      setUploading(false)
    }
  }

  async function removeTitantron(titantronId) {
    if (!canDeleteContent) return

    const titantron = (wrestlerForm.titantrons || []).find((item) => item.id === titantronId)
    if (!titantron) return

    try {
      setUploading(true)

      const screenshotPaths = (titantron.screenshots || []).map((img) => img.path).filter(Boolean)
      if (screenshotPaths.length) {
        await removeAssets(screenshotPaths)
      }

      if (titantron.persisted) {
        const { error } = await supabase
          .from('wrestler_titantrons')
          .delete()
          .eq('id', titantronId)

        if (error) throw error
      }

      setWrestlerForm((current) => ({
        ...current,
        titantrons: (current.titantrons || []).filter((item) => item.id !== titantronId)
      }))

      openNotice('success', 'Titantron removed', `${titantron.title || 'Titantron'} was removed.`)
    } catch (err) {
      openNotice('error', 'Could not remove titantron', err.message || 'Could not remove titantron.')
    } finally {
      setUploading(false)
    }
  }

  function openConfirmAction(config) {
    setConfirmAction({
      open: true,
      title: config.title || 'Are you sure?',
      message: config.message || '',
      confirmLabel: config.confirmLabel || 'Confirm',
      tone: config.tone || 'danger',
      busy: false,
      onConfirm: config.onConfirm || null
    })
  }

  function openAddArenaFromHeader() {
    if (!canContribute) return
    setCurrentPage('arenas')
    window.history.replaceState({}, '', `${window.location.pathname}?page=arenas`)
    setArenaCreateSignal((current) => current + 1)
  }

  function closeConfirmAction() {
    setConfirmAction((current) => ({ ...current, open: false, busy: false, onConfirm: null }))
  }

  async function runConfirmAction() {
    if (!confirmAction.onConfirm) return
    try {
      setConfirmAction((current) => ({ ...current, busy: true }))
      await confirmAction.onConfirm()
      closeConfirmAction()
    } catch (err) {
      closeConfirmAction()
      openNotice('error', 'Action failed', err.message || 'Something went wrong.')
    }
  }

  function openImageViewer(images, index = 0) {
    if (!images || !images.length) return

    setImageViewer({
      open: true,
      images,
      index
    })
  }

  function closeImageViewer() {
    setImageViewer((prev) => ({ ...prev, open: false }))
  }

  function nextImage() {
    setImageViewer((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length
    }))
  }

  function prevImage() {
    setImageViewer((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length
    }))
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
    if (!imageViewer.open) return

    function handleKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeImageViewer()
      } else if (e.key === 'ArrowRight' && imageViewer.images.length > 1) {
        e.preventDefault()
        nextImage()
      } else if (e.key === 'ArrowLeft' && imageViewer.images.length > 1) {
        e.preventDefault()
        prevImage()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [imageViewer.open, imageViewer.images.length])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    fetchAll()
  }, [session])

  async function fetchCurrentUserProfile() {
    if (!session?.user?.id) return { data: null, error: null }

    return await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
  }

  async function fetchAll() {
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

      if (
        wrestlerResult.error ||
        arenaResult.error ||
        creatorResult.error ||
        titleResult.error ||
        installsResult.error ||
        installedArenasResult.error ||
        installedTitlesResult.error ||
        publicCollectionsResult.error ||
        ownCollectionsResult.error ||
        otherModsResult.error ||
        installedOtherModsResult.error
      ) {
        setError(
          wrestlerResult.error?.message ||
          arenaResult.error?.message ||
          creatorResult.error?.message ||
          titleResult.error?.message ||
          installsResult.error?.message ||
          installedArenasResult.error?.message ||
          installedTitlesResult.error?.message ||
          publicCollectionsResult.error?.message ||
          ownCollectionsResult.error?.message ||
          otherModsResult.error?.message ||
          installedOtherModsResult.error?.message ||
          'Failed to load data.'
        )
        return
      }

      const normalizedWrestlers = (wrestlerResult.data || []).map((wrestler) => ({
        ...wrestler,
        headshot_url: wrestler.headshot_path
          ? getAssetUrl(wrestler.headshot_path, { width: 320, height: 320, quality: 70 })
          : (wrestler.headshot_external_url || ''),
        headshot_full_url: wrestler.headshot_path
          ? getAssetUrl(wrestler.headshot_path)
          : (wrestler.headshot_external_url || ''),
        audio_files: (wrestler.wrestler_audio_files || []).map((file) => ({
          ...file,
          file_url: file.file_path ? getAssetUrl(file.file_path) : ''
        })),
        titantrons: (wrestler.wrestler_titantrons || []).map((item) => ({
          ...item,
          titantron_images: (item.titantron_images || []).map((img) => ({
            ...img,
            image_url: img.image_path
              ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
              : '',
            full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
          }))
        })),
        attires: sortAttires((wrestler.attires || []).map((attire) => ({
          ...attire,
          mod_type: attire.mod_type === 'port' ? 'port' : 'original',
          render_dds_url: attire.render_dds_path
            ? getAssetUrl(attire.render_dds_path, { width: 700, height: 700, quality: 70, resize: 'contain' })
            : '',
          render_dds_full_url: attire.render_dds_path ? getAssetUrl(attire.render_dds_path) : '',
          attire_images: (attire.attire_images || []).map((img) => ({
            ...img,
            image_url: img.image_path
              ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
              : '',
            full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
          }))
        }))),
        requests: [...(wrestler.mod_requests || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }))

      const normalizedArenas = (arenaResult.data || []).map((arena) => ({
        ...arena,
        arena_images: (arena.arena_images || []).map((img) => ({
          ...img,
          image_url: img.image_path
            ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
            : '',
          full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
        })),
        requests: [...(arena.arena_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      }))

      const normalizedTitles = (titleResult.data || []).map((title) => ({
        ...title,
        render_dds_url: title.render_dds_path
          ? getAssetUrl(title.render_dds_path, { width: 700, height: 700, quality: 70, resize: 'contain' })
          : '',
        render_dds_full_url: title.render_dds_path ? getAssetUrl(title.render_dds_path) : '',
        title_belt_images: (title.title_belt_images || []).map((img) => ({
          ...img,
          image_url: img.image_path
            ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
            : '',
          full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
        })),
        audio_files: (title.title_belt_audio_files || []).map((file) => ({
          ...file,
          file_url: file.file_path ? getAssetUrl(file.file_path) : ''
        })),
        requests: [...(title.title_belt_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      }))

      const normalizedOtherMods = (otherModsResult.data || []).map((otherMod) => ({
        ...otherMod,
        other_mod_images: (otherMod.other_mod_images || []).map((img) => ({
          ...img,
          image_url: img.image_path
            ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
            : '',
          full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
        })),
        requests: [...(otherMod.other_mod_requests || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
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
              image_url: img.image_path
                ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
                : '',
              full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
            })),
            wrestler: item.attire.wrestler ? {
              ...item.attire.wrestler,
              headshot_url: item.attire.wrestler.headshot_path
                ? getAssetUrl(item.attire.wrestler.headshot_path)
                : (item.attire.wrestler.headshot_external_url || '')
            } : null
          } : null,

          arena: item.arena ? {
            ...item.arena,
            arena_images: (item.arena.arena_images || []).map((img) => ({
              ...img,
              image_url: img.image_path
                ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
                : '',
              full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
            }))
          } : null,

          title_belt: item.title_belt ? {
            ...item.title_belt,
            render_dds_url: item.title_belt.render_dds_path ? getAssetUrl(item.title_belt.render_dds_path) : '',
            title_belt_images: (item.title_belt.title_belt_images || []).map((img) => ({
              ...img,
              image_url: img.image_path
                ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
                : '',
              full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
            }))
          } : null,

          other_mod: item.other_mod ? {
            ...item.other_mod,
            other_mod_images: (item.other_mod.other_mod_images || []).map((img) => ({
              ...img,
              image_url: img.image_path
                ? getAssetUrl(img.image_path, { width: 640, height: 360, quality: 65 })
                : '',
              full_image_url: img.image_path ? getAssetUrl(img.image_path) : ''
            }))
          } : null
        }))
        collectionMap.set(collection.id, {
          ...collection,
          cover_url: collection.cover_path
            ? getAssetUrl(collection.cover_path, { width: 900, height: 500, quality: 70 })
            : '',
          cover_full_url: collection.cover_path ? getAssetUrl(collection.cover_path) : '',
          items: normalizedItems
        })
      })

      const mergedCollections = [...collectionMap.values()].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
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
      const slug = new URLSearchParams(window.location.search).get('collection')
      const collectionFromUrl = slug ? repairedCollections.find((item) => item.slug === slug) : null

      let loadedProfiles = myProfile ? [myProfile] : []

      if (myProfile?.role === 'admin') {
        const adminProfilesResult = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (adminProfilesResult.error) {
          throw adminProfilesResult.error
        }

        loadedProfiles = adminProfilesResult.data || []
      }

      setProfiles(loadedProfiles)
      setCurrentProfile(myProfile)
      setWrestlers(normalizedWrestlers)
      setArenas(normalizedArenas)
      setTitleBelts(normalizedTitles)
      setCreators(creatorResult.data || [])
      setCollections(repairedCollections)
      setSelectedCollection(collectionFromUrl || null)
      setSelectedId((current) => {
        if (current) return current

        const params = new URLSearchParams(window.location.search)
        const wrestlerFromUrl = params.get('wrestler')

        if (wrestlerFromUrl) return current

        return normalizedWrestlers[0]?.id || null
      })
      setInstalledIds(new Set((installsResult.data || []).map((item) => item.attire_id)))
      setInstalledArenaIds(new Set((installedArenasResult.data || []).map((item) => item.arena_id)))
      setInstalledTitleIds(new Set((installedTitlesResult.data || []).map((item) => item.title_belt_id)))
      setOtherMods(normalizedOtherMods)
      setInstalledOtherModIds(new Set((installedOtherModsResult.data || []).map((item) => item.other_mod_id)))
    } catch (err) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  const filteredWrestlers = useMemo(() => {
    const q = query.toLowerCase().trim()

    const hasAttireLevelFilters =
      creatorFilter !== 'all' ||
      sourceGameFilter !== 'all' ||
      installFilter !== 'all' ||
      missingDownloadOnly ||
      deadLinkOnly

    return wrestlers
      .map((wrestler) => {
        const wrestlerHaystack = [
          wrestler.wrestler_name,
          wrestler.notes,
          ...(wrestler.tags || [])
        ]
          .join(' ')
          .toLowerCase()

        const wrestlerMatchesQuery = !q || wrestlerHaystack.includes(q)

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
          ]
            .join(' ')
            .toLowerCase()

          const queryOk = !q || haystack.includes(q)
          const creatorOk =
            creatorFilter === 'all' || attire.creator_name === creatorFilter
          const sourceGameOk =
            sourceGameFilter === 'all' || attire.source_game === sourceGameFilter
          const installedOk =
            installFilter === 'all' ||
            (installFilter === 'installed' && installedIds.has(attire.id)) ||
            (installFilter === 'not_installed' && !installedIds.has(attire.id))

          const requestInfo = (wrestler.requests || []).filter(
            (request) =>
              request.attire_id === attire.id &&
              request.status === 'open'
          )

          const hasDeadLink = requestInfo.some(
            (request) => request.request_type === 'dead_link'
          )

          const missingDownloadOk =
            !missingDownloadOnly || !attire.download_url?.trim()

          const deadLinkOk =
            !deadLinkOnly || hasDeadLink

          return (
            queryOk &&
            creatorOk &&
            sourceGameOk &&
            installedOk &&
            missingDownloadOk &&
            deadLinkOk
          )
        })

        const hasOpenRequests = (wrestler.requests || []).some(
          (request) => request.status === 'open'
        )

        const missingOnlyOk =
          !showMissingOnly ||
          filteredAttires.some(
            (attire) =>
              attire.status !== 'complete' || !attire.download_url?.trim()
          ) ||
          hasOpenRequests

        const hasAttires = (wrestler.attires || []).length > 0

        if (missingOnlyOk && filteredAttires.length > 0) {
          return {
            ...wrestler,
            attires: filteredAttires
          }
        }

        if (!hasAttires) {
          const shouldShowEmptyWrestler =
            wrestlerMatchesQuery &&
            !hasAttireLevelFilters &&
            !showMissingOnly

          if (shouldShowEmptyWrestler) {
            return {
              ...wrestler,
              attires: []
            }
          }
        }

        return null
      })
      .filter(Boolean)
  }, [
    wrestlers,
    query,
    showMissingOnly,
    creatorFilter,
    sourceGameFilter,
    installFilter,
    missingDownloadOnly,
    deadLinkOnly,
    installedIds
  ])


  const visibleWrestlers = useMemo(() => {
    return filteredWrestlers.slice(0, visibleModsCount)
  }, [filteredWrestlers, visibleModsCount])

  const paginatedMods = useMemo(() => {
    return {
      page: 1,
      totalPages: Math.max(1, Math.ceil(filteredWrestlers.length / modsPerPage)),
      totalItems: filteredWrestlers.length,
      items: visibleWrestlers
    }
  }, [filteredWrestlers, visibleWrestlers, modsPerPage])

  useEffect(() => {
    setModsPage(1)
  }, [query, creatorFilter, sourceGameFilter, installFilter, missingDownloadOnly, deadLinkOnly, showMissingOnly])

  useEffect(() => {
    if (modsPage > paginatedMods.totalPages) {
      setModsPage(paginatedMods.totalPages)
    }
  }, [modsPage, paginatedMods.totalPages])

  useEffect(() => {
    setVisibleModsCount(modsPerPage)
  }, [query, creatorFilter, sourceGameFilter, installFilter, missingDownloadOnly, deadLinkOnly, showMissingOnly])


  function loadMoreWrestlers() {
    setVisibleModsCount((current) =>
      Math.min(current + modsPerPage, filteredWrestlers.length)
    )
  }

  const myCollections = useMemo(
    () => session ? collections.filter((item) => item.owner_id === session.user.id) : [],
    [collections, session]
  )

  const selectedWrestler = useMemo(
    () => filteredWrestlers.find((item) => item.id === selectedId) || visibleWrestlers[0] || null,
    [filteredWrestlers, visibleWrestlers, selectedId]
  )

  const decoratedSelectedWrestler = useMemo(() => {
    if (!selectedWrestler) return null

    return {
      ...selectedWrestler,
      attires: (selectedWrestler.attires || []).map((attire) => {
        const isInstalled = installedIds.has(attire.id)

        const matchingCollections = (collections || []).filter((collection) =>
          (collection.items || []).some((entry) => entry.attire_id === attire.id)
        )

        return {
          ...attire,
          isInstalled,
          inCollection: matchingCollections.length > 0,
          collectionCount: matchingCollections.length,
          collectionNames: matchingCollections.map((collection) => collection.name)
        }
      })
    }
  }, [selectedWrestler, installedIds, collections])

  const collectionMemberships = useMemo(() => {
    if (!collectionPicker.item || !session) return []

    return myCollections
      .filter((collection) =>
        (collection.items || []).some((entry) => {
          if (collectionPicker.item.modType === 'attire') {
            return entry.attire_id === collectionPicker.item.id
          }
          if (collectionPicker.item.modType === 'arena') {
            return entry.arena_id === collectionPicker.item.id
          }
          if (collectionPicker.item.modType === 'title') {
            return entry.title_id === collectionPicker.item.id
          }
          if (collectionPicker.item.modType === 'other') {
            return entry.other_mod_id === collectionPicker.item.id
          }
          return false
        })
      )
      .map((item) => item.id)
  }, [myCollections, collectionPicker, session])

  useEffect(() => {
    if (wrestlerSelectSignal?.wrestlerId) return

    if (!selectedId && filteredWrestlers[0]) {
      setSelectedId(filteredWrestlers[0].id)
      return
    }

    if (
      selectedId &&
      !filteredWrestlers.some((item) => item.id === selectedId)
    ) {
      setSelectedId(filteredWrestlers[0]?.id || null)
      setHighlightedAttireId(null)
    }
  }, [filteredWrestlers, selectedId, wrestlerSelectSignal])

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
    if (!canContribute) return
    setSaving(true)
    try {
      if (!wrestlerForm.wrestler_name.trim()) throw new Error('Wrestler name is required.')
      const duplicateWrestler = findDuplicateWrestler(wrestlers, wrestlerForm.wrestler_name)
      if (duplicateWrestler && duplicateWrestler.id !== wrestlerForm.id) throw new Error(`Wrestler already exists: ${duplicateWrestler.wrestler_name}`)
      const payload = {
        wrestler_name: wrestlerForm.wrestler_name.trim(),
        notes: wrestlerForm.notes.trim(),
        tags: parseTags(wrestlerForm.tags_text),
        headshot_path: wrestlerForm.headshot_path || '',
        headshot_name: wrestlerForm.headshot_name || '',
        headshot_external_url: wrestlerForm.headshot_external_url || ''
      }


      let wrestlerId = wrestlerForm.id

      if (wrestlerForm.id) {
        const { error } = await supabase.from('wrestlers').update(payload).eq('id', wrestlerForm.id)
        if (error) throw error
        openNotice('success', 'Wrestler updated', `${wrestlerForm.wrestler_name} was updated successfully.`)
      } else {
        const { data, error } = await supabase.from('wrestlers').insert(payload).select('id').single()
        if (error) throw error
        wrestlerId = data.id
        setSelectedId(data.id)
        openNotice('success', 'Wrestler added', `${wrestlerForm.wrestler_name} was added to the database.`)
      }

      if (Array.isArray(wrestlerForm.pendingAudioUploads) && wrestlerForm.pendingAudioUploads.length) {
        const inserts = wrestlerForm.pendingAudioUploads.map((item) => ({
          wrestler_id: wrestlerId,
          owner_id: session.user.id,
          audio_type: item.audio_type,
          file_path: item.file_path,
          file_name: item.file_name
        }))

        const { error } = await supabase.from('wrestler_audio_files').insert(inserts)
        if (error) throw error
      }


      const titantrons = wrestlerForm.titantrons || []

      for (const titantron of titantrons) {
        const payload = {
          wrestler_id: wrestlerId,
          owner_id: session.user.id,
          title: (titantron.title || '').trim(),
          download_url: (titantron.download_url || '').trim(),
          source_game: titantron.source_game || 'WWE 2K25'
        }

        let titantronRowId = titantron.id

        if (titantron.persisted) {
          const { error } = await supabase
            .from('wrestler_titantrons')
            .update(payload)
            .eq('id', titantron.id)

          if (error) throw error
        } else {
          const { data, error } = await supabase
            .from('wrestler_titantrons')
            .insert(payload)
            .select('id')
            .single()

          if (error) throw error
          titantronRowId = data.id
        }

        if (Array.isArray(titantron.pendingScreenshotUploads) && titantron.pendingScreenshotUploads.length) {
          const imageRows = titantron.pendingScreenshotUploads.map((img) => ({
            wrestler_titantron_id: titantronRowId,
            owner_id: session.user.id,
            image_path: img.path,
            image_name: img.name
          }))

          const { error } = await supabase.from('titantron_images').insert(imageRows)
          if (error) throw error
        }
      }

      setWrestlerModalOpen(false)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not save wrestler', err.message || 'Failed to save wrestler.')
    } finally {
      setSaving(false)
    }
  }

  async function handleWrestlerAudioUpload(files, kind) {
    if (!files?.length || !canContribute) return

    try {
      setUploading(true)

      const entityId = wrestlerForm.id || wrestlerForm.temp_upload_id || uid()
      const uploadedRows = []

      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.wem')) {
          throw new Error('Only .wem files are allowed.')
        }

        const optimizedFile = await compressImage(file)

        const { path, fileName } = await uploadAsset({
          userId: session.user.id,
          entityId,
          file: optimizedFile,
          kind,
          folder: 'wrestlers'
        })

        uploadedRows.push({
          id: uid(),
          wrestler_id: wrestlerForm.id || null,
          owner_id: session.user.id,
          audio_type: kind,
          file_path: path,
          file_name: fileName,
          file_url: getAssetUrl(path)
        })
      }

      setWrestlerForm((current) => ({
        ...current,
        temp_upload_id: current.temp_upload_id || (!current.id ? entityId : ''),
        audio_files: [...(current.audio_files || []), ...uploadedRows],
        pendingAudioUploads: [...(current.pendingAudioUploads || []), ...uploadedRows]
      }))

      openNotice(
        'success',
        kind === 'entrance_music' ? 'Entrance music uploaded' : 'Callname uploaded',
        `${uploadedRows.length} file${uploadedRows.length === 1 ? '' : 's'} uploaded successfully.`
      )
    } catch (err) {
      openNotice('error', 'Audio upload failed', err.message || 'Could not upload wrestler audio.')
    } finally {
      setUploading(false)
    }
  }

  async function saveAttire() {
    if (!canContribute || !attireForm.wrestler_id) return
    setSaving(true)
    try {
      if (!attireForm.name.trim()) throw new Error('Attire name is required.')
      const parentWrestler = wrestlers.find((item) => item.id === attireForm.wrestler_id)
      const duplicateAttire = findDuplicateAttire(parentWrestler?.attires || [], attireForm.name)

      const parsedLinks = parseDownloadLinks(attireForm.download_url || '')

      if (parsedLinks.length) {
        const results = await Promise.all(parsedLinks.map((link) => testDownloadLink(link)))
        const deadResults = results.filter((item) => item?.status === 'dead' || item?.ok === false)

        if (deadResults.length === parsedLinks.length) {
          throw new Error('All entered download links appear to be dead. Please correct them before saving.')
        }
      }

      if (duplicateAttire && duplicateAttire.id !== attireForm.id) throw new Error(`Attire already exists for this wrestler: ${duplicateAttire.name}`)
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

      if (parsedLinks.length) {
        const results = await Promise.all(parsedLinks.map((link) => testDownloadLink(link)))
        const hasDeadLink = results.some((item) => item?.status === 'dead')

        if (hasDeadLink) {
          const { data: existingDeadRequests } = await supabase
            .from('mod_requests')
            .select('id')
            .eq('attire_id', attireId)
            .eq('status', 'open')
            .eq('request_type', 'dead_link')
            .limit(1)

          if (!existingDeadRequests?.length) {
            await supabase.from('mod_requests').insert({
              wrestler_id: attireForm.wrestler_id,
              attire_id: attireId,
              request_type: 'dead_link',
              notes: 'Automatically detected dead link during save.'
            })
          }
        }
      }

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
    if (!canContribute) return
    setSaving(true)
    try {
      const cleanName = collectionForm.name.trim()
      if (!cleanName) throw new Error('Collection name is required.')
        const baseSlug = slugify(cleanName)
        const ownerIdFragment = (session.user.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase()

        const shouldRegenerateSlug =
          !collectionForm.slug ||
          collectionForm.slug === baseSlug ||
          !collectionForm.slug.includes(ownerIdFragment)

        const cleanSlug =
          shouldRegenerateSlug
            ? uniqueCollectionSlug(cleanName, session.user.id)
            : collectionForm.slug
      if (!cleanSlug) throw new Error('Please enter a valid slug using letters and numbers.')
      const payload = {
        name: cleanName,
        slug: cleanSlug,
        description: collectionForm.description.trim(),
        visibility: collectionForm.visibility === 'private' ? 'private' : 'public',
        cover_path: collectionForm.cover_path || '',
        cover_name: collectionForm.cover_name || ''
      }
      if (collectionForm.persisted && collectionForm.id) {
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
    if (!file || !canContribute) return

    try {
      setUploading(true)

      if (!file.type.startsWith('image/')) {
        throw new Error('Headshot must be an image file.')
      }

      const entityId = wrestlerForm.id || wrestlerForm.temp_upload_id || uid()

      const optimizedFile = await compressImage(file)

      const { path, fileName } = await uploadAsset({
        userId: session.user.id,
        entityId,
        file: optimizedFile,
        kind: 'headshot',
        folder: 'wrestlers'
      })

      setWrestlerForm((current) => ({
        ...current,
        temp_upload_id: current.temp_upload_id || (!current.id ? entityId : ''),
        headshot_path: path,
        headshot_name: fileName,
        headshot_url: getAssetUrl(path),
        headshot_external_url: '',
        auto_match_urls: [],
        auto_match_titles: []
      }))

      openNotice('success', 'Headshot uploaded', `${file.name} was uploaded successfully.`)
    } catch (err) {
      openNotice('error', 'Headshot upload failed', err.message || 'Headshot upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCollectionCoverUpload(file) {
    if (!file || !canContribute) return

    try {
      setUploading(true)
      if (!file.type.startsWith('image/')) throw new Error('Cover must be an image file.')

      const entityId = collectionForm.id || collectionForm.temp_upload_id || uid()

      const optimizedFile = await compressImage(file)

      const { path, fileName } = await uploadAsset({
        userId: session.user.id,
        entityId,
        file: optimizedFile,
        kind: 'cover',
        folder: 'collections'
      })

      setCollectionForm((current) => ({
        ...current,
        temp_upload_id: current.temp_upload_id || (!current.persisted ? entityId : ''),
        cover_path: path,
        cover_name: fileName,
        cover_url: getAssetUrl(path)
      }))

      openNotice('success', 'Cover uploaded', `${file.name} was uploaded successfully.`)
    } catch (err) {
      openNotice('error', 'Cover upload failed', err.message || 'Cover upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAutoMatchHeadshot() {
    if (!canContribute) return
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
    if (!canDeleteContent) return
    try {
      if (wrestlerForm.headshot_path) await removeAssets([wrestlerForm.headshot_path])
      setWrestlerForm((current) => ({ ...current, headshot_path: '', headshot_name: '', headshot_url: '', headshot_external_url: '', auto_match_titles: [], auto_match_urls: [] }))
    } catch (err) {
      openNotice('error', 'Could not remove headshot', err.message || 'Could not remove headshot.')
    }
  }

  async function removeCollectionCover() {
    if (!canDeleteContent) return
    try {
      if (collectionForm.cover_path) await removeAssets([collectionForm.cover_path])
      setCollectionForm((current) => ({ ...current, cover_path: '', cover_url: '', cover_name: '' }))
    } catch (err) {
      openNotice('error', 'Could not remove cover', err.message || 'Could not remove cover.')
    }
  }

  async function removeWrestlerAudio(audioFile) {
    if (!canDeleteContent || !audioFile) return

    try {
      setUploading(true)

      if (audioFile.file_path) {
        await removeAssets([audioFile.file_path])
      }

      if (audioFile.id) {
        const { error } = await supabase
          .from('wrestler_audio_files')
          .delete()
          .eq('id', audioFile.id)

        if (error) throw error
      }

      setWrestlerForm((current) => ({
        ...current,
        audio_files: (current.audio_files || []).filter((item) => item.file_path !== audioFile.file_path),
        pendingAudioUploads: (current.pendingAudioUploads || []).filter((item) => item.file_path !== audioFile.file_path)
      }))

      setWrestlers((current) =>
        current.map((wrestler) => {
          if (wrestler.id !== (wrestlerForm.id || audioFile.wrestler_id)) return wrestler

          return {
            ...wrestler,
            audio_files: (wrestler.audio_files || []).filter((item) => item.file_path !== audioFile.file_path)
          }
        })
      )

      openNotice('success', 'Audio removed', `${audioFile.file_name || 'Audio file'} was removed.`)
    } catch (err) {
      openNotice('error', 'Could not remove audio', err.message || 'Could not remove wrestler audio.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAssetUpload(filesOrFile, kind) {
    if (!filesOrFile || !canContribute) return
    try {
      setUploading(true)
      if (kind === 'render') {
        const file = filesOrFile
        if (!file.name.toLowerCase().endsWith('.dds')) throw new Error('Render must be a .dds file.')
        const entityId = attireForm.id || uid()
        const optimizedFile = await compressImage(file)
        const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file: optimizedFile, kind: 'render', folder: 'attires' })
        setAttireForm((current) => ({ ...current, id: current.id || entityId, render_dds_path: path, render_dds_name: fileName, render_dds_url: getAssetUrl(path) }))
        openNotice('success', 'DDS uploaded', `${file.name} was uploaded successfully.`)
      }
      if (kind === 'image') {
        const files = filesOrFile
        const entityId = attireForm.id || uid()
        const uploaded = []
        for (const file of files) {
          if (!file.type.startsWith('image/')) throw new Error('All screenshots must be image files.')
          const optimizedFile = await compressImage(file)
          const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file: optimizedFile, kind: 'image', folder: 'attires' })
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
    if (!canDeleteContent) return

    try {
      if (path) {
        await removeAssets([path])
      }

      if (kind === 'render') {
        if (attireForm.persisted) {
          const { error } = await supabase
            .from('attires')
            .update({
              render_dds_path: '',
              render_dds_name: ''
            })
            .eq('id', attireForm.id)

          if (error) throw error
        }

        setAttireForm((current) => ({
          ...current,
          render_dds_path: '',
          render_dds_name: '',
          render_dds_url: ''
        }))

        setWrestlers((current) =>
          current.map((wrestler) => ({
            ...wrestler,
            attires: (wrestler.attires || []).map((attire) =>
              attire.id === attireForm.id
                ? {
                    ...attire,
                    render_dds_path: '',
                    render_dds_name: '',
                    render_dds_url: ''
                  }
                : attire
            )
          }))
        )
      }

      if (kind === 'image') {
        setAttireForm((current) => ({
          ...current,
          images: (current.images || []).filter((img) => img.path !== path),
          pendingImageUploads: (current.pendingImageUploads || []).filter((img) => img.path !== path)
        }))

        if (attireForm.persisted) {
          const { error } = await supabase
            .from('attire_images')
            .delete()
            .eq('attire_id', attireForm.id)
            .eq('image_path', path)

          if (error) throw error
        }

        setWrestlers((current) =>
          current.map((wrestler) => ({
            ...wrestler,
            attires: (wrestler.attires || []).map((attire) =>
              attire.id === attireForm.id
                ? {
                    ...attire,
                    attire_images: (attire.attire_images || []).filter((img) => img.image_path !== path)
                  }
                : attire
            )
          }))
        )
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

  async function addAttireCreator() {
    if (!canContribute) return
    const name = newCreatorName.trim()
    if (!name) return

    setAddingCreator(true)
    try {
      const { data, error } = await supabase
        .from('creators')
        .insert({ name })
        .select('*')
        .single()

      if (error) throw error

      setCreators((current) => {
        const exists = current.some((item) => item.id === data.id || item.name === data.name)
        if (exists) return current
        return [...current, data].sort((a, b) => a.name.localeCompare(b.name))
      })

      setAttireForm((current) => ({
        ...current,
        creator_name: data.name
      }))

      setCreatorFilter(data.name)
      setNewCreatorName('')

      openNotice(
        'success',
        'Creator added',
        `${data.name} is now available in the creator dropdown.`
      )
    } catch (err) {
      openNotice('error', 'Could not add creator', err.message || 'Could not add creator.')
    } finally {
      setAddingCreator(false)
    }
  }

  async function addArenaCreator() {
    if (!canContribute) return null

    const name = newCreatorName.trim()
    if (!name) return null

    setAddingCreator(true)
    try {
      const { data, error } = await supabase
        .from('creators')
        .insert({ name })
        .select('*')
        .single()

      if (error) throw error

      setCreators((current) => {
        const exists = current.some((item) => item.id === data.id || item.name === data.name)
        if (exists) return current
        return [...current, data].sort((a, b) => a.name.localeCompare(b.name))
      })

      setNewCreatorName('')

      openNotice(
        'success',
        'Creator added',
        `${data.name} is now available in the creator dropdown.`
      )

      return data
    } catch (err) {
      openNotice('error', 'Could not add creator', err.message || 'Could not add creator.')
      return null
    } finally {
      setAddingCreator(false)
    }
  }

  async function toggleInstalled(attire, installed) {
    if (!canContribute) return
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

  function createRequest(wrestlerId, attireId, requestType, wrestlerName, attireName, prefillNotes = '') {
    if (!canContribute) return
    setRequestModal({
      open: true,
      context: { wrestlerId, attireId, requestType, wrestlerName, attireName, prefillNotes }
    })
  }

  async function submitRequest(notes) {
    if (!canContribute || !requestModal.context) return
    setRequestSubmitting(true)

    try {
      if (requestModal.context.modCategory === 'arena') {
        const { error } = await supabase.from('arena_requests').insert({
          arena_id: requestModal.context.arenaId,
          request_type: requestModal.context.requestType,
          notes: (notes || '').trim()
        })

        if (error) throw error
      } else if (requestModal.context.modCategory === 'title') {
        const { error } = await supabase.from('title_belt_requests').insert({
          title_belt_id: requestModal.context.titleId,
          request_type: requestModal.context.requestType,
          notes: (notes || '').trim()
        })

        if (error) throw error
      } else if (requestModal.context.modCategory === 'other') {
        const { error } = await supabase.from('other_mod_requests').insert({
          other_mod_id: requestModal.context.otherModId,
          request_type: requestModal.context.requestType,
          notes: (notes || '').trim()
        })

        if (error) throw error
      } else {
        const { error } = await supabase.from('mod_requests').insert({
          wrestler_id: requestModal.context.wrestlerId,
          attire_id: requestModal.context.attireId,
          request_type: requestModal.context.requestType,
          notes: (notes || '').trim()
        })

        if (error) throw error
      }

      setRequestModal({ open: false, context: null })
      openNotice('success', 'Request submitted', 'Your request was added successfully.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not submit request', err.message || 'Could not submit request.')
    } finally {
      setRequestSubmitting(false)
    }
  }

  function openArenaIssueRequest(arena, requestType, prefillNotes = '') {
    if (!canContribute) return

    setRequestModal({
      open: true,
      context: {
        modCategory: 'arena',
        arenaId: arena.id,
        requestType,
        arenaName: arena.name,
        prefillNotes
      }
    })
  }

  function openTitleBeltIssueRequest(titleBelt, requestType, prefillNotes = '') {
    if (!canContribute) return

    setRequestModal({
      open: true,
      context: {
        modCategory: 'title',
        titleId: titleBelt.id,
        requestType,
        titleName: titleBelt.name,
        prefillNotes
      }
    })
  }

  function openOtherModIssueRequest(otherMod, requestType, prefillNotes = '') {
    if (!canContribute) return

    setRequestModal({
      open: true,
      context: {
        modCategory: 'other',
        otherModId: otherMod.id,
        requestType,
        otherModName: otherMod.name,
        prefillNotes
      }
    })
  }

  function openResolveArenaLink(arena, issueType) {
    if (!canContribute) return

    setResolveModal({
      open: true,
      context: {
        modCategory: 'arena',
        arenaId: arena.id,
        arenaName: arena.name,
        issueType,
        currentUrl: arena.download_url || ''
      }
    })
  }

  function openResolveTitleBeltLink(titleBelt, issueType) {
    if (!canContribute) return

    setResolveModal({
      open: true,
      context: {
        modCategory: 'title',
        titleId: titleBelt.id,
        titleName: titleBelt.name,
        issueType,
        currentUrl: titleBelt.download_url || ''
      }
    })
  }

  function openResolveOtherModLink(otherMod, issueType) {
    if (!canContribute) return

    setResolveModal({
      open: true,
      context: {
        modCategory: 'other',
        otherModId: otherMod.id,
        otherModName: otherMod.name,
        otherModSubtype: otherMod.subtype || '',
        issueType,
        currentUrl: otherMod.download_url || ''
      }
    })
  }

  function openResolveLink(wrestler, attire, issueType) {
    if (!canContribute) return
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
    if (!canContribute || !resolveModal.context) return
    setResolvingLink(true)

    try {
      const cleanUrl = (url || '').trim()
      if (!cleanUrl) throw new Error('A corrected download URL is required.')

      if (resolveModal.context.modCategory === 'arena') {
        const { error: arenaError } = await supabase
          .from('arenas')
          .update({ download_url: cleanUrl })
          .eq('id', resolveModal.context.arenaId)

        if (arenaError) throw arenaError

        const requestTypes =
          resolveModal.context.issueType === 'dead_link'
            ? ['dead_link']
            : ['missing_link', 'dead_link']

        const { error: requestError } = await supabase
          .from('arena_requests')
          .update({
            status: 'fulfilled',
            notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
          })
          .eq('arena_id', resolveModal.context.arenaId)
          .eq('status', 'open')
          .in('request_type', requestTypes)

        if (requestError) throw requestError
      } else if (resolveModal.context.modCategory === 'title') {
        const { error: titleError } = await supabase
          .from('title_belts')
          .update({ download_url: cleanUrl })
          .eq('id', resolveModal.context.titleId)

        if (titleError) throw titleError

        const requestTypes =
          resolveModal.context.issueType === 'dead_link'
            ? ['dead_link']
            : ['missing_link', 'dead_link']

        const { error: requestError } = await supabase
          .from('title_belt_requests')
          .update({
            status: 'fulfilled',
            notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
          })
          .eq('title_belt_id', resolveModal.context.titleId)
          .eq('status', 'open')
          .in('request_type', requestTypes)

        if (requestError) throw requestError
      } else if (resolveModal.context.modCategory === 'other') {
        const { error: otherError } = await supabase
          .from('other_mods')
          .update({ download_url: cleanUrl })
          .eq('id', resolveModal.context.otherModId)

        if (otherError) throw otherError

        const requestTypes =
          resolveModal.context.issueType === 'dead_link'
            ? ['dead_link']
            : ['missing_link', 'dead_link']

        const { error: requestError } = await supabase
          .from('other_mod_requests')
          .update({
            status: 'fulfilled',
            notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
          })
          .eq('other_mod_id', resolveModal.context.otherModId)
          .eq('status', 'open')
          .in('request_type', requestTypes)

        if (requestError) throw requestError
      } else {
        const { error: attireError } = await supabase
          .from('attires')
          .update({ download_url: cleanUrl })
          .eq('id', resolveModal.context.attireId)

        if (attireError) throw attireError

        const requestTypes =
          resolveModal.context.issueType === 'dead_link'
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
      }

      setResolveModal({ open: false, context: null })
      openNotice(
        'success',
        'Link issue resolved',
        'The download link was updated and matching open link requests were marked as resolved.'
      )
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not resolve link', err.message || 'Could not resolve this link issue.')
    } finally {
      setResolvingLink(false)
    }
  }

  function openAddWrestler() {
    if (!canContribute) return
    setWrestlerForm(emptyWrestler())
    setWrestlerModalOpen(true)
  }

  function openEditWrestler(wrestler) {
    if (!canManageContent(wrestler.owner_id)) return
    setWrestlerForm(normalizeWrestlerForEditor(wrestler))
    setWrestlerModalOpen(true)
  }

  function openAddAttire(wrestler) {
    if (!canContribute) return
    setAttireForm({ ...emptyAttire(wrestler.id), pendingImageUploads: [] })
    setAttireModalOpen(true)
  }

  function openEditAttire(attire) {
    if (!canManageContent(attire.owner_id)) return

    const normalized = normalizeAttireForEditor(attire)

    setAttireForm({
      ...normalized,
      images: normalized.images || [],
      pendingImageUploads: [] 
    })

    setAttireModalOpen(true)
  }

  function openEditArenaFromIssues(arena) {
    if (!arena?.id) return

    setArenaSelectSignal({
      arenaId: arena.id,
      ts: Date.now()
    })

    setCurrentPage('arenas')
    window.history.replaceState({}, '', `${window.location.pathname}?page=arenas`)

    openNotice(
      'info',
      'Arena selected',
      `Go to the Arenas section and edit "${arena.name}".`
    )
  }

  function openEditTitleBeltFromIssues(titleBelt) {
    if (!titleBelt?.id) return

    setTitleSelectSignal({
      titleId: titleBelt.id,
      ts: Date.now()
    })

    setCurrentPage('titles')
    window.history.replaceState({}, '', `${window.location.pathname}?page=titles`)

    openNotice(
      'info',
      'Title belt selected',
      `Go to the Titles section and edit "${titleBelt.name}".`
    )
  }

  function openEditOtherModFromIssues(otherMod) {
    if (!otherMod?.id) return

    setOtherModsSelectSignal({
      otherModId: otherMod.id,
      ts: Date.now()
    })

    setCurrentPage('other_mods')
    window.history.replaceState({}, '', `${window.location.pathname}?page=other_mods`)

    openNotice(
      'info',
      'Other mod selected',
      `Go to the Other Mods section and edit "${otherMod.name}".`
    )
  }

  function openCreateCollection() {
    if (!canContribute) return
    setCollectionForm(emptyCollection())
    setCollectionModalOpen(true)
  }

  function openEditCollection(collection) {
    if (!canManageContent(collection.owner_id)) return
    setCollectionForm(normalizeCollectionForEditor(collection))
    setCollectionModalOpen(true)
  }

  function openCollection(collection) {
    setSelectedCollection(collection)
    setCurrentPage('collections')
    const next = `${window.location.pathname}?page=collections&collection=${encodeURIComponent(collection.slug)}`
    window.history.replaceState({}, '', next)
  }

  function closeCollectionView() {
    setSelectedCollection(null)
    window.history.replaceState({}, '', `${window.location.pathname}?page=collections`)
  }

  function goHome() {
    setSelectedCollection(null)
    setCurrentPage('all_mods')
    window.history.replaceState({}, '', window.location.pathname)
  }

  function goAllModsPage() {
    setSelectedCollection(null)
    setCurrentPage('all_mods')
    window.history.replaceState({}, '', `${window.location.pathname}?page=all_mods`)
  }

  function goWrestlersPage() {
    setSelectedCollection(null)
    setHighlightedAttireId(null)
    setCurrentPage('mods')
    setVisibleModsCount(modsPerPage)
    window.history.replaceState({}, '', `${window.location.pathname}?page=mods`)
  }

  function goCollectionsPage() {
    setSelectedCollection(null)
    setCurrentPage('collections')
    window.history.replaceState({}, '', `${window.location.pathname}?page=collections`)
  }

  function goArenasPage() {
    setSelectedCollection(null)
    setCurrentPage('arenas')
    window.history.replaceState({}, '', `${window.location.pathname}?page=arenas`)
  }

  function goTitlesPage() {
    setSelectedCollection(null)
    setCurrentPage('titles')
    window.history.replaceState({}, '', `${window.location.pathname}?page=titles`)
  }

  function goOtherModsPage() {
    setSelectedCollection(null)
    setCurrentPage('other_mods')
    window.history.replaceState({}, '', `${window.location.pathname}?page=other_mods`)
  }

  function openAddTitleFromHeader() {
    if (!canContribute) return
    setCurrentPage('titles')
    window.history.replaceState({}, '', `${window.location.pathname}?page=titles`)
    setTitleCreateSignal((current) => current + 1)
  }

  function openAddOtherModFromHeader() {
    if (!canContribute) return

    setCurrentPage('other_mods')

    window.history.replaceState({}, '', `${window.location.pathname}?page=other_mods`)

    setOtherModsCreateSignal((current) => current + 1)
  }

  function openAttireFromAllMods(item) {
    const wrestlerId = item?.raw?.wrestler_id
    const attireId = item?.entityId || item?.raw?.id

    if (!wrestlerId) return

    setWrestlerSelectSignal({
      wrestlerId,
      attireId,
      forceGallery: true,
      ts: Date.now()
    })

    setCurrentPage('mods')

    const params = new URLSearchParams()
    params.set('page', 'mods')
    params.set('wrestler', wrestlerId)
    if (attireId) {
      params.set('attire', attireId)
    }

    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
  }

  function openArenaFromAllMods(item) {
    const arenaId = item?.entityId
    if (!arenaId) return

    setArenaSelectSignal({
      arenaId,
      ts: Date.now()
    })

    setCurrentPage('arenas')
    window.history.replaceState({}, '', `${window.location.pathname}?page=arenas`)
  }

  function openTitleFromAllMods(item) {
    const titleId = item?.entityId
    if (!titleId) return

    setTitleSelectSignal({
      titleId,
      ts: Date.now()
    })

    setCurrentPage('titles')
    window.history.replaceState({}, '', `${window.location.pathname}?page=titles`)
  }

  function openOtherModFromAllMods(item) {
    const otherModId = item?.entityId
    if (!otherModId) return

    setOtherModsSelectSignal({
      otherModId,
      ts: Date.now()
    })

    setCurrentPage('other_mods')
    window.history.replaceState({}, '', `${window.location.pathname}?page=other_mods`)
  }

  function goIssuesPage() {
    setSelectedCollection(null)
    setCurrentPage('issues')
    window.history.replaceState({}, '', `${window.location.pathname}?page=issues`)
  }

  function goAdminPage() {
    setSelectedCollection(null)
    setCurrentPage('admin')
    window.history.replaceState({}, '', `${window.location.pathname}?page=admin`)
  }

  useEffect(() => {
    if (!wrestlerSelectSignal?.wrestlerId) return
    if (currentPage !== 'mods') return
    if (!filteredWrestlers.length) return

    const { wrestlerId, attireId, forceGallery } = wrestlerSelectSignal

    const index = filteredWrestlers.findIndex((w) => w.id === wrestlerId)

    if (index === -1) {
      setWrestlerSelectSignal(null)
      return
    }

    const neededVisibleCount = Math.max(modsPerPage, index + 1)

    if (visibleModsCount < neededVisibleCount) {
      setVisibleModsCount(neededVisibleCount)
    }

    if (selectedId !== wrestlerId) {
      setSelectedId(wrestlerId)
    }

    if (forceGallery && attireViewMode !== 'gallery') {
      setAttireViewMode('gallery')
    }

    setHighlightedAttireId(attireId || null)

    setWrestlerSelectSignal(null)
  }, [
    wrestlerSelectSignal,
    currentPage,
    filteredWrestlers,
    visibleModsCount,
    modsPerPage,
    selectedId,
    attireViewMode
  ])

  useEffect(() => {
    if (currentPage !== 'mods') return
    if (!selectedId) return

    const params = new URLSearchParams(window.location.search)
    params.set('page', 'mods')
    params.set('wrestler', selectedId)

    if (highlightedAttireId) {
      params.set('attire', highlightedAttireId)
    } else {
      params.delete('attire')
    }

    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }, [currentPage, selectedId, highlightedAttireId])

  useEffect(() => {
    function syncModsStateFromUrl() {
      const params = new URLSearchParams(window.location.search)

      const page = params.get('page')
      const slug = params.get('collection')
      const wrestlerId = params.get('wrestler')
      const attireId = params.get('attire')

      if (slug || page === 'collections') {
        setCurrentPage('collections')

        if (slug) {
          const found = collections.find((item) => item.slug === slug)
          setSelectedCollection(found || null)
        } else {
          setSelectedCollection(null)
        }

        return
      }

      setSelectedCollection(null)

      if (page === 'mods') {
        setCurrentPage('mods')

        if (wrestlerId) {
          setWrestlerSelectSignal({
            wrestlerId,
            attireId: attireId || null,
            forceGallery: Boolean(attireId),
            ts: Date.now()
          })
        } else {
          setHighlightedAttireId(null)
        }

        return
      }

      if (page === 'arenas') {
        setCurrentPage('arenas')
        return
      }

      if (page === 'titles') {
        setCurrentPage('titles')
        return
      }

      if (page === 'other_mods') {
        setCurrentPage('other_mods')
        return
      }

      if (page === 'issues') {
        setCurrentPage('issues')
        return
      }

      if (page === 'admin') {
        setCurrentPage('admin')
        return
      }

      if (page === 'all_mods') {
        setCurrentPage('all_mods')
        return
      }

      setCurrentPage('all_mods')
    }

    syncModsStateFromUrl()
    window.addEventListener('popstate', syncModsStateFromUrl)

    return () => {
      window.removeEventListener('popstate', syncModsStateFromUrl)
    }
  }, [collections])

  async function shareCollection(collection) {
    const url = `${window.location.origin}${window.location.pathname}?page=collections&collection=${collection.slug}`
    try {
      await navigator.clipboard.writeText(url)
      openNotice('success', 'Share link copied', 'The public collection link was copied to your clipboard.')
    } catch {
      openNotice('info', 'Collection link', url)
    }
  }

  function openCollectionPicker(item) {
    if (!canContribute) return
    setCollectionPicker({ open: true, item })
  }

  async function toggleCollectionMembership(collection, isIn) {
    if (!canContribute || !collectionPicker.item) return
    setSaving(true)

    try {
      const item = collectionPicker.item

      if (item.modType === 'attire') {
        if (isIn) {
          const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collection.id)
            .eq('attire_id', item.id)

          if (error) throw error

          openNotice('success', 'Removed from collection', `${item.name} was removed from ${collection.name}.`)
        } else {
          const { error } = await supabase
            .from('collection_items')
            .insert({
              collection_id: collection.id,
              mod_type: 'attire',
              mod_subtype: '',
              attire_id: item.id
            })

          if (error) throw error

          openNotice('success', 'Added to collection', `${item.name} was added to ${collection.name}.`)
        }
      } else if (item.modType === 'arena') {
        if (isIn) {
          const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collection.id)
            .eq('arena_id', item.id)

          if (error) throw error

          openNotice('success', 'Removed from collection', `${item.name} was removed from ${collection.name}.`)
        } else {
          const { error } = await supabase
            .from('collection_items')
            .insert({
              collection_id: collection.id,
              mod_type: 'arena',
              mod_subtype: '',
              arena_id: item.id
            })

          if (error) throw error

          openNotice('success', 'Added to collection', `${item.name} was added to ${collection.name}.`)
        }
      } else if (item.modType === 'title') {
        if (isIn) {
          const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collection.id)
            .eq('title_id', item.id)

          if (error) throw error

          openNotice('success', 'Removed from collection', `${item.name} was removed from ${collection.name}.`)
        } else {
          const { error } = await supabase
            .from('collection_items')
            .insert({
              collection_id: collection.id,
              mod_type: 'title',
              mod_subtype: '',
              title_id: item.id
            })

          if (error) throw error

          openNotice('success', 'Added to collection', `${item.name} was added to ${collection.name}.`)
        }
      } else if (item.modType === 'other') {
        if (isIn) {
          const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collection.id)
            .eq('other_mod_id', item.id)

          if (error) throw error

          openNotice('success', 'Removed from collection', `${item.name} was removed from ${collection.name}.`)
        } else {
          const { error } = await supabase
            .from('collection_items')
            .insert({
              collection_id: collection.id,
              mod_type: 'other',
              mod_subtype: item.subtype || '',
              other_mod_id: item.id
            })

          if (error) throw error

          openNotice('success', 'Added to collection', `${item.name} was added to ${collection.name}.`)
        }
      }
      
      else {
        throw new Error(`Unsupported collection item type: ${item.modType}`)
      }

      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not update collection', err.message || 'Could not update collection.')
    } finally {
      setSaving(false)
    }
  }
  
  function deleteAttire(attire) {
    if (!canDeleteContent) return

    openConfirmAction({
      title: 'Delete attire mod?',
      message: `This will permanently delete ${attire.name}.`,
      confirmLabel: 'Delete attire',
      tone: 'danger',
      onConfirm: async () => {
        const paths = [
          attire.render_dds_path,
          ...(attire.attire_images || []).map((img) => img.image_path)
        ].filter(Boolean)

        if (paths.length) {
          await removeAssets(paths)
        }

        const { error } = await supabase
          .from('attires')
          .delete()
          .eq('id', attire.id)

        if (error) throw error

        openNotice('success', 'Attire deleted', `${attire.name} was deleted.`)
        await fetchAll()
      }
    })
  }

  function deleteWrestler(wrestler) {
    if (!canDeleteContent) return

    openConfirmAction({
      title: 'Delete wrestler?',
      message: `This will permanently delete ${wrestler.wrestler_name} and all related attire mods.`,
      confirmLabel: 'Delete wrestler',
      tone: 'danger',
      onConfirm: async () => {
        const assetPaths = [wrestler.headshot_path]
        for (const audio of wrestler.audio_files || []) {
          if (audio.file_path) assetPaths.push(audio.file_path)
        }

        for (const titantron of wrestler.titantrons || []) {
          for (const img of titantron.titantron_images || []) {
            if (img.image_path) assetPaths.push(img.image_path)
          }
        }
        for (const attire of wrestler.attires || []) {
          if (attire.render_dds_path) assetPaths.push(attire.render_dds_path)
          for (const img of attire.attire_images || []) {
            if (img.image_path) assetPaths.push(img.image_path)
          }
        }
        await removeAssets(assetPaths)
        const { error } = await supabase.from('wrestlers').delete().eq('id', wrestler.id)
        if (error) throw error
        openNotice('success', 'Wrestler deleted', `${wrestler.wrestler_name} and related attire mods were deleted.`)
        await fetchAll()
      }
    })
  }

  function deleteCollection(collection) {
    if (!canDeleteContent) return

    openConfirmAction({
      title: 'Delete collection?',
      message: `This will permanently delete the collection "${collection.name}".`,
      confirmLabel: 'Delete collection',
      tone: 'danger',
      onConfirm: async () => {
        if (collection.cover_path) await removeAssets([collection.cover_path])
        const { error } = await supabase.from('collections').delete().eq('id', collection.id)
        if (error) throw error
        if (selectedCollection?.id === collection.id) closeCollectionView()
        openNotice('success', 'Collection deleted', `${collection.name} was deleted.`)
        await fetchAll()
      }
    })
  }

  const stats = computeStats(wrestlers, collections, arenas, titleBelts, otherMods)

  const { deadLinksCount, missingLinksCount } = useMemo(() => {
    const unified = buildUnifiedModsFeed({
      wrestlers,
      arenas,
      titleBelts,
      otherMods
    })

    const dead = unified.reduce(
      (sum, item) => sum + (item.openDeadLinks || 0),
      0
    )

    const missing = unified.reduce(
      (sum, item) => sum + (item.hasMissingLink ? 1 : 0),
      0
    )

    return {
      deadLinksCount: dead,
      missingLinksCount: missing
    }
  }, [wrestlers, arenas, titleBelts, otherMods])

  if (!isSupabaseConfigured) {
    return (
      <div className="app-shell">
        <Header
          onAddWrestler={() => {}}
          onAddArena={() => {}}
          onAddTitle={() => {}}
          onAddOtherMod={() => {}}
          session={null}
          onBrowseCollections={() => {}}
          onBrowseArenas={() => {}}
          onBrowseTitles={() => {}}
          onBrowseOtherMods={() => {}}
          onBrowseWrestlers={() => {}}
          onBrowseIssues={goIssuesPage}
          onGoHome={() => {}}
          currentPage="mods"
          currentProfile={null}
          canContribute={false}
          onBrowseAdmin={() => {}}
          deadLinksCount={0}
          missingLinksCount={0}
        />
        <div className="message error">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before running the app.</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header
        onAddWrestler={openAddWrestler}
        onAddArena={openAddArenaFromHeader}
        onAddTitle={openAddTitleFromHeader}
        onAddOtherMod={openAddOtherModFromHeader}
        session={session}
        onGoHome={goAllModsPage}
        onBrowseWrestlers={goWrestlersPage}
        onBrowseCollections={goCollectionsPage}
        onBrowseArenas={goArenasPage}
        onBrowseTitles={goTitlesPage}
        onBrowseOtherMods={goOtherModsPage}
        onBrowseIssues={goIssuesPage}
        currentPage={currentPage}
        currentProfile={currentProfile}
        canContribute={canContribute}
        onBrowseAdmin={goAdminPage} 
        deadLinksCount={deadLinksCount}
        missingLinksCount={missingLinksCount}
      />
      <AuthPanel session={session} currentProfile={currentProfile} />
      <StatsGrid stats={stats} />
      {error ? <div className="message error">{error}</div> : null}

        {currentPage === 'collections' ? (
          canContribute ? (
            selectedCollection ? (
              <CollectionView
                collection={selectedCollection}
                canContribute={canContribute}
                canManageCollection={canManageContent(selectedCollection?.owner_id)}
                onClose={goCollectionsPage}
                onSelectWrestler={(payload) => {
                  const wrestlerId = payload?.wrestlerId
                  if (!wrestlerId) return

                  setQuery('')
                  setShowMissingOnly(false)
                  setCreatorFilter('all')
                  setSourceGameFilter('all')
                  setInstallFilter('all')
                  setMissingDownloadOnly(false)
                  setDeadLinkOnly(false)

                  const index = wrestlers.findIndex((item) => item.id === wrestlerId)
                  if (index >= 0) {
                    const nextPage = Math.floor(index / modsPerPage) + 1
                    setModsPage(nextPage)
                  }

                  setSelectedId(wrestlerId)
                  goHome()
                }}
                onSelectArena={(payload) => {
                  const arenaId = payload?.arenaId
                  if (!arenaId) return

                  setArenaSelectSignal({
                    arenaId,
                    ts: Date.now()
                  })

                  setCurrentPage('arenas')
                  window.history.replaceState({}, '', `${window.location.pathname}?page=arenas`)
                }}

                onSelectTitle={(payload) => {
                  const titleId = payload?.titleId
                  if (!titleId) return

                  setTitleSelectSignal({
                    titleId,
                    ts: Date.now()
                  })

                  setCurrentPage('titles')
                  window.history.replaceState({}, '', `${window.location.pathname}?page=titles`)
                }}

                onSelectOtherMod={(payload) => {
                  const otherModId = payload?.otherModId
                  if (!otherModId) return

                  setOtherModsSelectSignal({
                    otherModId,
                    ts: Date.now()
                  })

                  setCurrentPage('other_mods')
                  window.history.replaceState({}, '', `${window.location.pathname}?page=other_mods`)
                }}

                onRemoveItem={async (item) => {
                  if (!canManageContent(selectedCollection?.owner_id)) return

                  const { error } = await supabase
                    .from('collection_items')
                    .delete()
                    .eq('id', item.id)

                  if (error) {
                    openNotice('error', 'Could not remove item', error.message || 'Failed to remove item.')
                    return
                  }

                  openNotice('success', 'Item removed', 'The mod was removed from the collection.')
                  await fetchAll()
                }}
                onBulkRemoveItems={async (itemIds) => {
                  if (!canManageContent(selectedCollection?.owner_id) || !itemIds?.length) return

                  const { error } = await supabase
                    .from('collection_items')
                    .delete()
                    .in('id', itemIds)

                  if (error) {
                    openNotice('error', 'Could not remove items', error.message || 'Failed to remove selected items.')
                    return
                  }

                  openNotice('success', 'Items removed', `${itemIds.length} item(s) were removed from the collection.`)
                  await fetchAll()
                }}
              />
            ) : (
              <ProfileCollections
                sectionId="my-collections-section"
                session={session}
                collections={myCollections}
                onCreate={openCreateCollection}
                onEdit={openEditCollection}
                onDelete={canDeleteContent ? deleteCollection : null}
                onOpen={openCollection}
                onShare={shareCollection}
              />
            )
          ) : (
            <div className="message error">
              You must be an approved user to access collections.
            </div>
          )
        ) : currentPage === 'arenas' ? (
          <ArenaPage
            arenas={arenas}
            creators={creators}
            session={session}
            collections={collections}
            canContribute={canContribute}
            canDeleteContent={canDeleteContent}
            canManageContent={canManageContent}
            installedArenaIds={installedArenaIds}
            setInstalledArenaIds={setInstalledArenaIds}
            currentProfile={currentProfile}
            supabase={supabase}
            fetchAll={fetchAll}
            newCreatorName={newCreatorName}
            setNewCreatorName={setNewCreatorName}
            onAddCreator={addArenaCreator}
            addingCreator={addingCreator}
            openNotice={openNotice}
            onOpenCollectionPicker={openCollectionPicker}
            openConfirmAction={openConfirmAction}
            arenaCreateSignal={arenaCreateSignal}
            arenaSelectSignal={arenaSelectSignal}
            onConsumeArenaCreateSignal={() => setArenaCreateSignal(0)}
            onOpenImageViewer={openImageViewer}
          />
        ) : currentPage === 'all_mods' ? (
          <AllModsPage
            wrestlers={wrestlers}
            arenas={arenas}
            titleBelts={titleBelts}
            otherMods={otherMods}
            creators={creators}
            session={session}
            collections={myCollections}
            canContribute={canContribute}
            supabase={supabase}
            openNotice={openNotice}
            installedIds={installedIds}
            setInstalledIds={setInstalledIds}
            installedArenaIds={installedArenaIds}
            setInstalledArenaIds={setInstalledArenaIds}
            installedTitleIds={installedTitleIds}
            setInstalledTitleIds={setInstalledTitleIds}
            installedOtherModIds={installedOtherModIds}
            setInstalledOtherModIds={setInstalledOtherModIds}
            onOpenAttire={openAttireFromAllMods}
            onOpenArena={openArenaFromAllMods}
            onOpenTitle={openTitleFromAllMods}
            onOpenOtherMod={openOtherModFromAllMods}
            onOpenCollectionPicker={openCollectionPicker}
          />
        ) : currentPage === 'titles' ? (
          <TitleBeltPage
            titleBelts={titleBelts}
            creators={creators}
            session={session}
            collections={collections}
            canContribute={canContribute}
            canDeleteContent={canDeleteContent}
            canManageContent={canManageContent}
            installedTitleIds={installedTitleIds}
            setInstalledTitleIds={setInstalledTitleIds}
            currentProfile={currentProfile}
            supabase={supabase}
            fetchAll={fetchAll}
            newCreatorName={newCreatorName}
            setNewCreatorName={setNewCreatorName}
            onAddCreator={addAttireCreator}
            addingCreator={addingCreator}
            openNotice={openNotice}
            openConfirmAction={openConfirmAction}
            onOpenCollectionPicker={openCollectionPicker}
            titleCreateSignal={titleCreateSignal}
            titleSelectSignal={titleSelectSignal}
            onConsumeTitleCreateSignal={() => setTitleCreateSignal(0)}
            onOpenImageViewer={openImageViewer}
          />
        ) : currentPage === 'other_mods' ? (
          <OtherModPage
            otherMods={otherMods}
            creators={creators}
            session={session}
            collections={collections}
            canContribute={canContribute}
            canDeleteContent={canDeleteContent}
            canManageContent={canManageContent}
            installedOtherModIds={installedOtherModIds}
            setInstalledOtherModIds={setInstalledOtherModIds}
            currentProfile={currentProfile}
            supabase={supabase}
            fetchAll={fetchAll}
            newCreatorName={newCreatorName}
            setNewCreatorName={setNewCreatorName}
            onAddCreator={addArenaCreator}
            addingCreator={addingCreator}
            openNotice={openNotice}
            openConfirmAction={openConfirmAction}
            onOpenCollectionPicker={openCollectionPicker}
            otherModsCreateSignal={otherModsCreateSignal}
            otherModsSelectSignal={otherModsSelectSignal}
            onConsumeOtherModsCreateSignal={() => setOtherModsCreateSignal(0)}
            onOpenImageViewer={openImageViewer}
          />
        ) : currentPage === 'admin' ? (
          <AdminPanel
            session={session}
            currentProfile={currentProfile}
            profiles={profiles}
            onUpdateProfile={updateProfile}
            updating={updatingProfile}
          />
        ) : currentPage === 'issues' ? (
          <LinkIssuesPage
            wrestlers={wrestlers}
            arenas={arenas}
            titleBelts={titleBelts}
            otherMods={otherMods}
            onResolveLink={openResolveLink}
            onResolveArenaLink={openResolveArenaLink}
            onResolveTitleBeltLink={openResolveTitleBeltLink}
            onResolveOtherModLink={openResolveOtherModLink}
            onCreateRequest={createRequest}
            onCreateArenaRequest={openArenaIssueRequest}
            onCreateTitleBeltRequest={openTitleBeltIssueRequest}
            onCreateOtherModRequest={openOtherModIssueRequest}
            canManageContent={canManageContent}
            canContribute={canContribute}
            onEditAttire={openEditAttire}
            onEditArena={openEditArenaFromIssues}
            onEditTitleBelt={openEditTitleBeltFromIssues}
            onEditOtherMod={openEditOtherModFromIssues}
          />
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
                canContribute={canContribute}
                newCreatorName={newCreatorName}
                setNewCreatorName={setNewCreatorName}
                onAddCreator={addAttireCreator}
                addingCreator={addingCreator}
              />

              <WrestlerList
                wrestlers={visibleWrestlers}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id)
                  setHighlightedAttireId(null)
                }}
                onEdit={openEditWrestler}
                onDelete={canDeleteContent ? deleteWrestler : null}
                session={session}
                currentProfile={currentProfile}
                canManageContent={canManageContent}
                viewMode={wrestlerViewMode}
                setViewMode={setWrestlerViewMode}
                pagination={paginatedMods}
                onPageChange={setModsPage}
                onLoadMore={loadMoreWrestlers}
                hasMore={visibleModsCount < filteredWrestlers.length}
              />
            </div>

            <DetailPanel
              wrestler={decoratedSelectedWrestler}
              session={session}
              currentProfile={currentProfile}
              canContribute={canContribute}
              canManageContent={canManageContent}
              installedIds={installedIds}
              onAddAttire={openAddAttire}
              onEditWrestler={openEditWrestler}
              onEditAttire={openEditAttire}
              onDeleteAttire={canDeleteContent ? deleteAttire : null}
              onToggleInstalled={toggleInstalled}
              onCreateRequest={createRequest}
              onResolveLink={openResolveLink}
              attireViewMode={attireViewMode}
              setAttireViewMode={setAttireViewMode}
              onOpenCollectionPicker={openCollectionPicker}
              onOpenImageViewer={openImageViewer}
              highlightedAttireId={highlightedAttireId}
              onHighlightAttire={setHighlightedAttireId}
              onClearHighlightedAttire={() => setHighlightedAttireId(null)}
            />
          </div>
        </>
      )}
      <WrestlerEditorModal
        open={wrestlerModalOpen}
        form={wrestlerForm}
        setForm={setWrestlerForm}
        onClose={() => setWrestlerModalOpen(false)}
        onSave={saveWrestler}
        onUploadHeadshot={handleWrestlerHeadshotUpload}
        onAutoMatchHeadshot={handleAutoMatchHeadshot}
        onRemoveHeadshot={removeWrestlerHeadshot}
        onUploadAudio={handleWrestlerAudioUpload}
        onRemoveAudio={removeWrestlerAudio}
        onAddTitantron={addTitantron}
        onUpdateTitantron={updateTitantron}
        onRemoveTitantron={removeTitantron}
        onUploadTitantronScreenshots={handleTitantronScreenshotUpload}
        onRemoveTitantronScreenshot={removeTitantronScreenshot}
        saving={saving}
        uploading={uploading}
        wrestlers={wrestlers}
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
        onAddCreator={addAttireCreator}
        onUploadJson={uploadAttireJsonFile}
        saving={saving}
        uploading={uploading}
        addingCreator={addingCreator}
        wrestlers={wrestlers}
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
        item={collectionPicker.item}
        collections={myCollections}
        memberships={collectionMemberships}
        onClose={() => setCollectionPicker({ open: false, item: null })}
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

      <ConfirmActionModal
        open={confirmAction.open}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmLabel={confirmAction.confirmLabel}
        tone={confirmAction.tone}
        busy={confirmAction.busy}
        onConfirm={runConfirmAction}
        onClose={closeConfirmAction}
      />

      <ModalNotice notice={notice} onClose={() => setNotice(null)} />
        {imageViewer.open ? (
          <div
            className="image-modal-backdrop image-modal-backdrop-open"
            onClick={closeImageViewer}
          >
            <div
              className="image-modal-content image-modal-content-open"
              onClick={(e) => e.stopPropagation()}
            >
              {imageViewer.images.length > 1 ? (
                <button
                  type="button"
                  className="ghost-button small-btn image-nav-btn image-nav-left"
                  onClick={prevImage}
                >
                  ←
                </button>
              ) : null}

              <img
                src={imageViewer.images[imageViewer.index]}
                alt={`Preview ${imageViewer.index + 1}`}
              />

              {imageViewer.images.length > 1 ? (
                <button
                  type="button"
                  className="ghost-button small-btn image-nav-btn image-nav-right"
                  onClick={nextImage}
                >
                  →
                </button>
              ) : null}

              <button
                type="button"
                className="ghost-button small-btn image-close-btn"
                onClick={closeImageViewer}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
        {loading ? <div className="loading-overlay">Loading database…</div> : null}
    </div>

  )
}
