
import { useEffect, useMemo, useState } from 'react'
import AuthPanel from './components/AuthPanel'
import AttireEditorModal from './components/AttireEditorModal'
import DetailPanel from './components/DetailPanel'
import Filters from './components/Filters'
import Header from './components/Header'
import ModalNotice from './components/ModalNotice'
import RequestModal from './components/RequestModal'
import StatsGrid from './components/StatsGrid'
import WrestlerEditorModal from './components/WrestlerEditorModal'
import WrestlerList from './components/WrestlerList'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { getAssetUrl, removeAssets, tryAutoMatchHeadshot, uploadAsset } from './lib/storage'
import {
  computeStats,
  emptyAttire,
  emptyWrestler,
  SOURCE_GAMES,
  normalizeAttireForEditor,
  normalizeWrestlerForEditor,
  parseJsonOrNull,
  parseTags,
  sortAttires
} from './lib/utils'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wrestlers, setWrestlers] = useState([])
  const [creators, setCreators] = useState([])
  const [installedIds, setInstalledIds] = useState(new Set())
  const [selectedId, setSelectedId] = useState(null)

  const [query, setQuery] = useState('')
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [sourceGameFilter, setSourceGameFilter] = useState('all')
  const [installFilter, setInstallFilter] = useState('all')
  const [missingDownloadOnly, setMissingDownloadOnly] = useState(false)

  const [wrestlerModalOpen, setWrestlerModalOpen] = useState(false)
  const [wrestlerForm, setWrestlerForm] = useState(emptyWrestler())
  const [attireModalOpen, setAttireModalOpen] = useState(false)
  const [attireForm, setAttireForm] = useState(emptyAttire())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newCreatorName, setNewCreatorName] = useState('')
  const [addingCreator, setAddingCreator] = useState(false)
  const [notice, setNotice] = useState(null)
  const [requestModal, setRequestModal] = useState({ open: false, context: null })
  const [requestSubmitting, setRequestSubmitting] = useState(false)

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

  async function fetchAll() {
    setLoading(true)
    setError('')

    const [wrestlerResult, creatorResult, installsResult] = await Promise.all([
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
        : Promise.resolve({ data: [], error: null })
    ])

    if (wrestlerResult.error) {
      setError(wrestlerResult.error.message)
      setLoading(false)
      return
    }
    if (creatorResult.error) {
      setError(creatorResult.error.message)
      setLoading(false)
      return
    }

    const normalized = (wrestlerResult.data || []).map((wrestler) => ({
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

    setWrestlers(normalized)
    setCreators(creatorResult.data || [])
    setSelectedId((current) => current || normalized[0]?.id || null)
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
          const missingDownloadOk = !missingDownloadOnly || !attire.download_url?.trim()
          return queryOk && creatorOk && sourceGameOk && installedOk && missingDownloadOk
        })

        const hasOpenRequests = (wrestler.requests || []).some((request) => request.status === 'open')
        const missingOnlyOk = !showMissingOnly || wrestler.is_missing_target || filteredAttires.some((attire) => attire.status !== 'complete' || !attire.download_url?.trim()) || hasOpenRequests
        const wrestlerQueryOk = !q || [wrestler.wrestler_name, wrestler.notes, ...(wrestler.tags || [])].join(' ').toLowerCase().includes(q)
        const include = missingOnlyOk && (filteredAttires.length > 0 || wrestlerQueryOk)

        return include ? { ...wrestler, attires: filteredAttires } : null
      })
      .filter(Boolean)
  }, [wrestlers, query, showMissingOnly, creatorFilter, sourceGameFilter, installFilter, missingDownloadOnly, installedIds])

  useEffect(() => {
    if (!selectedId && filteredWrestlers[0]) setSelectedId(filteredWrestlers[0].id)
    if (selectedId && !filteredWrestlers.some((item) => item.id === selectedId)) {
      setSelectedId(filteredWrestlers[0]?.id || null)
    }
  }, [filteredWrestlers, selectedId])

  const selectedWrestler = useMemo(
    () => filteredWrestlers.find((item) => item.id === selectedId) || filteredWrestlers[0] || null,
    [filteredWrestlers, selectedId]
  )

  async function saveWrestler() {
    if (!session) return
    setSaving(true)

    try {
      if (!wrestlerForm.wrestler_name.trim()) throw new Error('Wrestler name is required.')

      const payload = {
        wrestler_name: wrestlerForm.wrestler_name.trim(),
        target_attire_count: Number(wrestlerForm.target_attire_count) || 0,
        is_missing_target: Boolean(wrestlerForm.is_missing_target),
        notes: wrestlerForm.notes.trim(),
        tags: parseTags(wrestlerForm.tags_text),
        headshot_path: wrestlerForm.headshot_path || '',
        headshot_name: wrestlerForm.headshot_name || '',
        headshot_external_url: wrestlerForm.headshot_external_url || ''
      }

      if (wrestlerForm.id) {
        const { error } = await supabase.from('wrestlers').update(payload).eq('id', wrestlerForm.id).eq('owner_id', session.user.id)
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
    if (!session || !attireForm.wrestler_id) return
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
        const { error } = await supabase.from('attires').update(payload).eq('id', attireForm.id).eq('owner_id', session.user.id)
        if (error) throw error
        openNotice('success', 'Attire updated', `${attireForm.name} was updated successfully.`)
      } else {
        const { data, error } = await supabase.from('attires').insert(payload).select('id').single()
        if (error) throw error
        attireId = data.id
        openNotice('success', 'Attire added', `${attireForm.name} was added successfully.`)
      }

      if (Array.isArray(attireForm.pendingImageUploads) && attireForm.pendingImageUploads.length) {
        const inserts = attireForm.pendingImageUploads.map((item) => ({
          attire_id: attireId,
          image_path: item.path,
          image_name: item.name
        }))
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

  async function handleWrestlerHeadshotUpload(file) {
    if (!file || !session) return
    try {
      setUploading(true)
      if (!file.type.startsWith('image/')) throw new Error('Headshot must be an image file.')
      const entityId = wrestlerForm.id || crypto.randomUUID()
      const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file, kind: 'headshot', folder: 'wrestlers' })
      setWrestlerForm((current) => ({
        ...current,
        id: current.id || entityId,
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

  async function handleAutoMatchHeadshot() {
    try {
      setUploading(true)
      const { imageUrl, sourceTitle } = await tryAutoMatchHeadshot(
        wrestlerForm.wrestler_name,
        wrestlerForm.auto_match_titles || [],
        wrestlerForm.auto_match_urls || []
      )
      setWrestlerForm((current) => ({
        ...current,
        headshot_path: '',
        headshot_name: `Auto-matched image: ${sourceTitle}`,
        headshot_url: imageUrl,
        headshot_external_url: imageUrl,
        auto_match_titles: [...(current.auto_match_titles || []), sourceTitle],
        auto_match_urls: [...(current.auto_match_urls || []), imageUrl]
      }))
      openNotice('success', 'Headshot matched', `Found a public headshot from ${sourceTitle}. Press Try auto-match again for another option.`)
    } catch (err) {
      openNotice('info', 'No alternative image found', err.message || 'Could not auto-match a different headshot.')
    } finally {
      setUploading(false)
    }
  }

  async function removeWrestlerHeadshot() {
    try {
      if (wrestlerForm.headshot_path) await removeAssets([wrestlerForm.headshot_path])
      setWrestlerForm((current) => ({ ...current, headshot_path: '', headshot_name: '', headshot_url: '', headshot_external_url: '', auto_match_titles: [], auto_match_urls: [] }))
    } catch (err) {
      openNotice('error', 'Could not remove headshot', err.message || 'Could not remove headshot.')
    }
  }

  async function handleAssetUpload(filesOrFile, kind) {
    if (!filesOrFile || !session) return

    try {
      setUploading(true)
      if (kind === 'render') {
        const file = filesOrFile
        if (!file.name.toLowerCase().endsWith('.dds')) throw new Error('Render must be a .dds file.')
        const entityId = attireForm.id || crypto.randomUUID()
        const { path, fileName } = await uploadAsset({ userId: session.user.id, entityId, file, kind: 'render', folder: 'attires' })
        setAttireForm((current) => ({
          ...current,
          id: current.id || entityId,
          render_dds_path: path,
          render_dds_name: fileName,
          render_dds_url: getAssetUrl(path)
        }))
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
        setAttireForm((current) => ({
          ...current,
          id: current.id || entityId,
          images: [...current.images, ...uploaded],
          pendingImageUploads: [...(current.pendingImageUploads || []), ...uploaded]
        }))
        openNotice('success', 'Screenshots uploaded', `${uploaded.length} screenshot${uploaded.length === 1 ? '' : 's'} uploaded successfully.`)
      }
    } catch (err) {
      openNotice('error', 'Upload failed', err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function removeAttireAsset(kind, path) {
    try {
      if (path) await removeAssets([path])
      if (kind === 'render') {
        setAttireForm((current) => ({ ...current, render_dds_path: '', render_dds_name: '', render_dds_url: '' }))
      }
      if (kind === 'image') {
        setAttireForm((current) => ({
          ...current,
          images: current.images.filter((img) => img.path !== path),
          pendingImageUploads: (current.pendingImageUploads || []).filter((img) => img.path !== path)
        }))
        if (attireForm.persisted) {
          await supabase.from('attire_images').delete().eq('attire_id', attireForm.id).eq('image_path', path)
        }
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
    if (!session) return
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
    if (!session) return
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
    if (!session) return
    setRequestModal({
      open: true,
      context: { wrestlerId, attireId, requestType, wrestlerName, attireName }
    })
  }

  async function submitRequest(notes) {
    if (!session || !requestModal.context) return
    setRequestSubmitting(true)
    try {
      const { error } = await supabase.from('mod_requests').insert({
        wrestler_id: requestModal.context.wrestlerId,
        attire_id: requestModal.context.attireId,
        request_type: requestModal.context.requestType,
        notes: (notes || '').trim()
      })
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

  function openAddWrestler() {
    setWrestlerForm(emptyWrestler())
    setWrestlerModalOpen(true)
  }

  function openEditWrestler(wrestler) {
    setWrestlerForm(normalizeWrestlerForEditor(wrestler))
    setWrestlerModalOpen(true)
  }

  function openAddAttire(wrestler) {
    setAttireForm({ ...emptyAttire(wrestler.id), pendingImageUploads: [] })
    setAttireModalOpen(true)
  }

  function openEditAttire(attire) {
    setAttireForm({ ...normalizeAttireForEditor(attire), pendingImageUploads: [] })
    setAttireModalOpen(true)
  }

  async function deleteAttire(attire) {
    if (!session || session.user.id !== attire.owner_id) return
    if (!window.confirm(`Delete ${attire.name}?`)) return

    try {
      const paths = [attire.render_dds_path, ...(attire.attire_images || []).map((img) => img.image_path)]
      await removeAssets(paths)
      const { error } = await supabase.from('attires').delete().eq('id', attire.id).eq('owner_id', session.user.id)
      if (error) throw error
      openNotice('success', 'Attire deleted', `${attire.name} was deleted.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not delete attire', err.message || 'Could not delete attire.')
    }
  }

  async function deleteWrestler(wrestler) {
    if (!session || session.user.id !== wrestler.owner_id) return
    if (!window.confirm(`Delete ${wrestler.wrestler_name} and all attire mods?`)) return

    try {
      const assetPaths = [wrestler.headshot_path]
      for (const attire of wrestler.attires || []) {
        if (attire.render_dds_path) assetPaths.push(attire.render_dds_path)
        for (const img of attire.attire_images || []) assetPaths.push(img.image_path)
      }
      await removeAssets(assetPaths)
      const { error } = await supabase.from('wrestlers').delete().eq('id', wrestler.id).eq('owner_id', session.user.id)
      if (error) throw error
      openNotice('success', 'Wrestler deleted', `${wrestler.wrestler_name} and related attire mods were deleted.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not delete wrestler', err.message || 'Could not delete wrestler.')
    }
  }

  const stats = computeStats(wrestlers)

  if (!isSupabaseConfigured) {
    return (
      <div className="app-shell">
        <Header onAddWrestler={() => {}} session={null} />
        <div className="message error">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before running the app.</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header onAddWrestler={openAddWrestler} session={session} />
      <AuthPanel session={session} />
      <StatsGrid stats={stats} />
      {error ? <div className="message error">{error}</div> : null}

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
          />
        </div>

        <DetailPanel
          wrestler={selectedWrestler}
          session={session}
          installedIds={installedIds}
          onAddAttire={openAddAttire}
          onEditWrestler={openEditWrestler}
          onEditAttire={openEditAttire}
          onDeleteAttire={deleteAttire}
          onToggleInstalled={toggleInstalled}
          onCreateRequest={createRequest}
        />
      </div>

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

      <RequestModal
        open={requestModal.open}
        context={requestModal.context}
        onClose={() => setRequestModal({ open: false, context: null })}
        onSubmit={submitRequest}
        submitting={requestSubmitting}
      />

      <ModalNotice notice={notice} onClose={() => setNotice(null)} />

      {loading ? <div className="loading-overlay">Loading database…</div> : null}
    </div>
  )
}
