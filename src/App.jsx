import { useEffect, useMemo, useState } from 'react'
import AuthPanel from './components/AuthPanel'
import AttireEditorModal from './components/AttireEditorModal'
import DetailPanel from './components/DetailPanel'
import Filters from './components/Filters'
import Header from './components/Header'
import StatsGrid from './components/StatsGrid'
import WrestlerEditorModal from './components/WrestlerEditorModal'
import WrestlerList from './components/WrestlerList'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { getAssetUrl, removeAssets, uploadAsset } from './lib/storage'
import {
  computeStats,
  emptyAttire,
  emptyWrestler,
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
  const [installedIds, setInstalledIds] = useState(new Set())
  const [selectedId, setSelectedId] = useState(null)

  const [query, setQuery] = useState('')
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const [wrestlerModalOpen, setWrestlerModalOpen] = useState(false)
  const [wrestlerForm, setWrestlerForm] = useState(emptyWrestler())
  const [attireModalOpen, setAttireModalOpen] = useState(false)
  const [attireForm, setAttireForm] = useState(emptyAttire())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState('')

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

    const { data, error: fetchError } = await supabase
      .from('wrestlers')
      .select(`
        *,
        attires (*),
        mod_requests (*)
      `)
      .order('wrestler_name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const normalized = (data || []).map((wrestler) => ({
      ...wrestler,
      attires: sortAttires((wrestler.attires || []).map((attire) => ({
        ...attire,
        preview_image_url: attire.preview_image_path ? getAssetUrl(attire.preview_image_path) : '',
        render_dds_url: attire.render_dds_path ? getAssetUrl(attire.render_dds_path) : ''
      }))),
      requests: [...(wrestler.mod_requests || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }))

    setWrestlers(normalized)
    setSelectedId((current) => current || normalized[0]?.id || null)

    if (session?.user?.id) {
      const { data: installs } = await supabase.from('user_installed_attires').select('attire_id').eq('user_id', session.user.id)
      setInstalledIds(new Set((installs || []).map((item) => item.attire_id)))
    } else {
      setInstalledIds(new Set())
    }

    setLoading(false)
  }

  const filteredWrestlers = useMemo(() => {
    return wrestlers.filter((wrestler) => {
      const haystack = [
        wrestler.wrestler_name,
        wrestler.notes,
        ...(wrestler.tags || []),
        ...(wrestler.attires || []).flatMap((attire) => [
          attire.name, attire.era, attire.creator_name, attire.notes, attire.source_game, attire.mod_type
        ])
      ].join(' ').toLowerCase()

      const queryOk = haystack.includes(query.toLowerCase())
      const sourceOk = sourceFilter === 'all' || (wrestler.attires || []).some((attire) => attire.source_game === sourceFilter)
      const typeOk = typeFilter === 'all' || (wrestler.attires || []).some((attire) => attire.mod_type === typeFilter)
      const hasIncomplete = (wrestler.attires || []).some((attire) => attire.status !== 'complete')
      const hasOpenRequests = (wrestler.requests || []).some((request) => request.status === 'open')
      const missingOk = !showMissingOnly || wrestler.is_missing_target || hasIncomplete || hasOpenRequests

      return queryOk && sourceOk && typeOk && missingOk
    })
  }, [wrestlers, query, showMissingOnly, sourceFilter, typeFilter])

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
    setSaveError('')
    setSaving(true)

    try {
      if (!wrestlerForm.wrestler_name.trim()) throw new Error('Wrestler name is required.')

      const payload = {
        wrestler_name: wrestlerForm.wrestler_name.trim(),
        target_attire_count: Number(wrestlerForm.target_attire_count) || 0,
        is_missing_target: Boolean(wrestlerForm.is_missing_target),
        notes: wrestlerForm.notes.trim(),
        tags: parseTags(wrestlerForm.tags_text),
        moveset_json: parseJsonOrNull(wrestlerForm.moveset_json_text),
        profile_json: parseJsonOrNull(wrestlerForm.profile_json_text)
      }

      if (wrestlerForm.id) {
        const { error } = await supabase.from('wrestlers').update(payload).eq('id', wrestlerForm.id).eq('owner_id', session.user.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('wrestlers').insert(payload).select('id').single()
        if (error) throw error
        setSelectedId(data.id)
      }

      setWrestlerModalOpen(false)
      await fetchAll()
    } catch (err) {
      setSaveError(err.message || 'Failed to save wrestler.')
    } finally {
      setSaving(false)
    }
  }

  async function saveAttire() {
    if (!session || !attireForm.wrestler_id) return
    setSaveError('')
    setSaving(true)

    try {
      if (!attireForm.name.trim()) throw new Error('Attire name is required.')

      const payload = {
        wrestler_id: attireForm.wrestler_id,
        name: attireForm.name.trim(),
        slot_name: attireForm.slot_name.trim(),
        era: attireForm.era.trim(),
        creator_name: attireForm.creator_name.trim(),
        download_url: attireForm.download_url.trim(),
        source_game: attireForm.source_game,
        game_version: attireForm.game_version.trim(),
        mod_type: attireForm.mod_type,
        preview_image_path: attireForm.preview_image_path || '',
        preview_image_name: attireForm.preview_image_name || '',
        render_dds_path: attireForm.render_dds_path || '',
        render_dds_name: attireForm.render_dds_name || '',
        notes: attireForm.notes.trim(),
        status: attireForm.status
      }

      if (attireForm.persisted) {
        const { error } = await supabase.from('attires').update(payload).eq('id', attireForm.id).eq('owner_id', session.user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('attires').insert(payload)
        if (error) throw error
      }

      setAttireModalOpen(false)
      await fetchAll()
    } catch (err) {
      setSaveError(err.message || 'Failed to save attire.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssetUpload(file, kind) {
    if (!file || !session) return
    try {
      setUploading(true)
      if (kind === 'preview' && !file.type.startsWith('image/')) {
        throw new Error('Preview must be an image file.')
      }
      if (kind === 'render' && !file.name.toLowerCase().endsWith('.dds')) {
        throw new Error('Render must be a .dds file.')
      }

      const { path, fileName } = await uploadAsset({
        userId: session.user.id,
        attireId: attireForm.id,
        file,
        kind
      })

      setAttireForm((current) => ({
        ...current,
        ...(kind === 'preview'
          ? { preview_image_path: path, preview_image_name: fileName, preview_image_url: getAssetUrl(path) }
          : { render_dds_path: path, render_dds_name: fileName, render_dds_url: getAssetUrl(path) })
      }))
    } catch (err) {
      setSaveError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAssetRemove(kind) {
    const path = kind === 'preview' ? attireForm.preview_image_path : attireForm.render_dds_path
    if (path) await removeAssets([path])
    setAttireForm((current) => ({
      ...current,
      ...(kind === 'preview'
        ? { preview_image_path: '', preview_image_name: '', preview_image_url: '' }
        : { render_dds_path: '', render_dds_name: '', render_dds_url: '' })
    }))
  }

  async function deleteWrestler(wrestler) {
    if (!session || wrestler.owner_id !== session.user.id) return
    if (!window.confirm(`Delete ${wrestler.wrestler_name} and all attires?`)) return

    const assetPaths = (wrestler.attires || []).flatMap((attire) => [attire.preview_image_path, attire.render_dds_path]).filter(Boolean)
    const { error } = await supabase.from('wrestlers').delete().eq('id', wrestler.id).eq('owner_id', session.user.id)
    if (error) return window.alert(error.message)
    if (assetPaths.length) await removeAssets(assetPaths)
    await fetchAll()
  }

  async function deleteAttire(attire) {
    if (!session || attire.owner_id !== session.user.id) return
    if (!window.confirm(`Delete attire "${attire.name}"?`)) return

    const assets = [attire.preview_image_path, attire.render_dds_path].filter(Boolean)
    const { error } = await supabase.from('attires').delete().eq('id', attire.id).eq('owner_id', session.user.id)
    if (error) return window.alert(error.message)
    if (assets.length) await removeAssets(assets)
    await fetchAll()
  }

  function openAddWrestler() {
    setSaveError('')
    setWrestlerForm(emptyWrestler())
    setWrestlerModalOpen(true)
  }

  function openEditWrestler(wrestler) {
    setSaveError('')
    setWrestlerForm(normalizeWrestlerForEditor(wrestler))
    setWrestlerModalOpen(true)
  }

  function openAddAttire(wrestler) {
    setSaveError('')
    setAttireForm({ ...emptyAttire(wrestler.id), wrestler_id: wrestler.id, persisted: false })
    setAttireModalOpen(true)
  }

  function openEditAttire(wrestler, attire) {
    setSaveError('')
    setAttireForm({ ...normalizeAttireForEditor(attire), wrestler_id: wrestler.id, persisted: true })
    setAttireModalOpen(true)
  }

  async function toggleInstalled(attire) {
    if (!session) return
    const alreadyInstalled = installedIds.has(attire.id)

    if (alreadyInstalled) {
      const { error } = await supabase
        .from('user_installed_attires')
        .delete()
        .eq('user_id', session.user.id)
        .eq('attire_id', attire.id)

      if (!error) {
        const next = new Set(installedIds)
        next.delete(attire.id)
        setInstalledIds(next)
      }
      return
    }

    const { error } = await supabase.from('user_installed_attires').insert({ attire_id: attire.id })
    if (!error) {
      const next = new Set(installedIds)
      next.add(attire.id)
      setInstalledIds(next)
    }
  }

  async function createRequest(attire, requestType) {
    if (!session) return
    const notes = window.prompt(
      requestType === 'dead_link'
        ? 'Describe the dead/broken link or issue.'
        : 'Add a note for the missing link request.'
    ) || ''

    const { error } = await supabase.from('mod_requests').insert({
      wrestler_id: attire.wrestler_id,
      attire_id: attire.id,
      request_type: requestType,
      notes
    })

    if (error) {
      window.alert(error.message)
      return
    }

    await fetchAll()
  }

  const stats = computeStats(wrestlers)

  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell">
        <section className="panel soft-panel">
          <h1>Supabase is not configured</h1>
          <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env.local</code>.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <Header onAddWrestler={openAddWrestler} session={session} />
      <StatsGrid stats={stats} />
      <AuthPanel session={session} />

      <div className="layout-grid">
        <div className="left-column">
          <Filters
            query={query}
            setQuery={setQuery}
            showMissingOnly={showMissingOnly}
            setShowMissingOnly={setShowMissingOnly}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
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

        <div className="right-column">
          {loading ? (
            <section className="panel soft-panel empty-state">Loading database…</section>
          ) : error ? (
            <section className="panel soft-panel">
              <div className="message error">{error}</div>
            </section>
          ) : (
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
          )}
        </div>
      </div>

      <WrestlerEditorModal
        open={wrestlerModalOpen}
        form={wrestlerForm}
        setForm={setWrestlerForm}
        onClose={() => setWrestlerModalOpen(false)}
        onSave={saveWrestler}
        saving={saving}
        error={saveError}
      />

      <AttireEditorModal
        open={attireModalOpen}
        form={attireForm}
        setForm={setAttireForm}
        onClose={() => setAttireModalOpen(false)}
        onSave={saveAttire}
        onUpload={handleAssetUpload}
        onRemoveAsset={handleAssetRemove}
        saving={saving}
        uploading={uploading}
        error={saveError}
      />
    </main>
  )
}
