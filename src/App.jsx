import { useEffect, useMemo, useState } from 'react'
import AuthPanel from './components/AuthPanel'
import DetailPanel from './components/DetailPanel'
import Filters from './components/Filters'
import Header from './components/Header'
import ModEditor from './components/ModEditor'
import ModList from './components/ModList'
import StatsGrid from './components/StatsGrid'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { createSignedUrls, removeAssets, uploadAsset } from './lib/storage'
import { computeDashboardStats, emptyMod, normalizeModForEditor, parseTags, tryParseJson } from './lib/utils'

export default function App() {
  const [session, setSession] = useState(null)
  const [mods, setMods] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [form, setForm] = useState(emptyMod())
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

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
    if (!session) {
      setMods([])
      return
    }
    fetchMods()
  }, [session])

  async function fetchMods() {
    setLoading(true)
    setLoadError('')

    const { data, error } = await supabase
      .from('mods')
      .select('*, attires(*)')
      .order('updated_at', { ascending: false })

    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }

    const paths = []
    ;(data || []).forEach((mod) => {
      ;(mod.attires || []).forEach((attire) => {
        if (attire.preview_image_path) paths.push(attire.preview_image_path)
        if (attire.render_dds_path) paths.push(attire.render_dds_path)
      })
    })

    const signedUrls = await createSignedUrls(paths)

    const normalized = (data || []).map((mod) => ({
      ...mod,
      attires: [...(mod.attires || [])]
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((attire) => ({
          ...attire,
          preview_image_url: attire.preview_image_path ? signedUrls[attire.preview_image_path] || '' : '',
          render_dds_url: attire.render_dds_path ? signedUrls[attire.render_dds_path] || '' : ''
        }))
    }))

    setMods(normalized)
    setSelectedId((current) => current || normalized?.[0]?.id || null)
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function openCreate() {
    setForm(emptyMod())
    setSaveError('')
    setEditorOpen(true)
  }

  function openEdit(mod) {
    setForm({ id: mod.id, ...normalizeModForEditor(mod) })
    setSaveError('')
    setEditorOpen(true)
  }

  async function handleUpload(attireId, file, kind) {
    if (!file) return
    if (!session?.user?.id) return

    try {
      setUploading(true)
      if (kind === 'preview' && !file.type.startsWith('image/')) {
        throw new Error('Preview upload must be an image file.')
      }
      if (kind === 'render' && !file.name.toLowerCase().endsWith('.dds')) {
        throw new Error('Render upload must be a .dds file.')
      }

      const { path, fileName } = await uploadAsset({ userId: session.user.id, attireId, file, kind })
      const urlMap = await createSignedUrls([path])
      const signedUrl = urlMap[path] || ''

      setForm((current) => ({
        ...current,
        attires: current.attires.map((attire) => {
          if (attire.id !== attireId) return attire
          return kind === 'preview'
            ? { ...attire, preview_image_path: path, preview_image_url: signedUrl, preview_image_name: fileName }
            : { ...attire, render_dds_path: path, render_dds_url: signedUrl, render_dds_name: fileName }
        })
      }))
    } catch (error) {
      setSaveError(error.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function removeAttireAsset(attireId, kind) {
    const attire = form.attires.find((item) => item.id === attireId)
    const path = kind === 'preview' ? attire?.preview_image_path : attire?.render_dds_path
    if (path) await removeAssets([path])

    setForm((current) => ({
      ...current,
      attires: current.attires.map((item) => {
        if (item.id !== attireId) return item
        return kind === 'preview'
          ? { ...item, preview_image_path: '', preview_image_url: '', preview_image_name: '' }
          : { ...item, render_dds_path: '', render_dds_url: '', render_dds_name: '' }
      })
    }))
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)

    try {
      if (!form.wrestler_name.trim()) throw new Error('Wrestler name is required.')

      const modPayload = {
        wrestler_name: form.wrestler_name.trim(),
        game_version: form.game_version.trim(),
        source_game: form.source_game,
        mod_type: form.mod_type,
        is_missing_target: Boolean(form.is_missing_target),
        target_attire_count: Number(form.target_attire_count) || 0,
        notes: form.notes.trim(),
        tags: parseTags(form.tags_text),
        moveset_json: tryParseJson(form.moveset_json_text),
        profile_json: tryParseJson(form.profile_json_text)
      }

      let modId = form.id

      if (modId) {
        const { error } = await supabase.from('mods').update(modPayload).eq('id', modId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('mods').insert(modPayload).select('id').single()
        if (error) throw error
        modId = data.id
      }

      const cleanedAttires = form.attires
        .filter((attire) => attire.name.trim())
        .map((attire, index) => ({
          id: attire.id,
          mod_id: modId,
          name: attire.name.trim(),
          slot_name: attire.slot_name.trim(),
          era: attire.era.trim(),
          creator_name: attire.creator_name.trim(),
          download_url: attire.download_url.trim(),
          preview_image_path: attire.preview_image_path || '',
          preview_image_name: attire.preview_image_name || '',
          render_dds_path: attire.render_dds_path || '',
          render_dds_name: attire.render_dds_name || '',
          notes: attire.notes.trim(),
          status: attire.status,
          sort_order: index
        }))

      const { data: existingAttires, error: existingError } = await supabase.from('attires').select('id, preview_image_path, render_dds_path').eq('mod_id', modId)
      if (existingError) throw existingError

      const existingIds = new Set((existingAttires || []).map((item) => item.id))
      const nextIds = new Set(cleanedAttires.map((item) => item.id))
      const idsToDelete = [...existingIds].filter((id) => !nextIds.has(id))
      const assetsToDelete = (existingAttires || []).filter((item) => idsToDelete.includes(item.id)).flatMap((item) => [item.preview_image_path, item.render_dds_path]).filter(Boolean)

      if (idsToDelete.length) {
        const { error } = await supabase.from('attires').delete().in('id', idsToDelete)
        if (error) throw error
      }
      if (assetsToDelete.length) await removeAssets(assetsToDelete)

      if (cleanedAttires.length) {
        const { error } = await supabase.from('attires').upsert(cleanedAttires)
        if (error) throw error
      }

      setEditorOpen(false)
      await fetchMods()
      setSelectedId(modId)
    } catch (error) {
      setSaveError(error.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(modId) {
    const confirmed = window.confirm('Delete this wrestler entry and all of its attires?')
    if (!confirmed) return

    const mod = mods.find((item) => item.id === modId)
    const assetPaths = (mod?.attires || []).flatMap((attire) => [attire.preview_image_path, attire.render_dds_path]).filter(Boolean)

    const { error } = await supabase.from('mods').delete().eq('id', modId)
    if (error) {
      window.alert(error.message)
      return
    }

    if (assetPaths.length) await removeAssets(assetPaths)

    if (selectedId === modId) setSelectedId(null)
    await fetchMods()
  }

  const creators = useMemo(() => {
    const values = mods.flatMap((mod) => (mod.attires || []).map((attire) => attire.creator_name)).filter(Boolean)
    return [...new Set(values)].sort()
  }, [mods])

  const filteredMods = useMemo(() => {
    return mods.filter((mod) => {
      const attireCreators = (mod.attires || []).map((attire) => attire.creator_name).filter(Boolean)
      const haystack = [
        mod.wrestler_name,
        mod.game_version,
        mod.source_game,
        mod.mod_type,
        mod.notes,
        ...(mod.tags || []),
        ...(mod.attires || []).map((attire) => `${attire.name} ${attire.era || ''} ${attire.status || ''} ${attire.creator_name || ''}`)
      ].join(' ').toLowerCase()

      const matchesQuery = haystack.includes(query.toLowerCase())
      const matchesCreator = creatorFilter === 'all' || attireCreators.includes(creatorFilter)
      const matchesType = typeFilter === 'all' || mod.mod_type === typeFilter
      const matchesSource = sourceFilter === 'all' || mod.source_game === sourceFilter
      const matchesMissing = !showMissingOnly || mod.is_missing_target || (mod.attires || []).some((attire) => attire.status !== 'complete')
      return matchesQuery && matchesCreator && matchesType && matchesSource && matchesMissing
    })
  }, [mods, query, creatorFilter, typeFilter, sourceFilter, showMissingOnly])

  const selectedMod = useMemo(() => mods.find((mod) => mod.id === selectedId) || filteredMods[0] || null, [mods, selectedId, filteredMods])

  useEffect(() => {
    if (!selectedId && filteredMods[0]) setSelectedId(filteredMods[0].id)
    if (selectedId && !filteredMods.some((mod) => mod.id === selectedId)) setSelectedId(filteredMods[0]?.id || null)
  }, [filteredMods, selectedId])

  const stats = computeDashboardStats(mods)

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Supabase is not configured</h1>
          <p className="muted">Create a <code>.env.local</code> file with your Supabase URL and publishable key, then restart the dev server.</p>
        </div>
      </div>
    )
  }

  if (!session) return <AuthPanel />

  return (
    <div className="app-shell">
      <div className="app-container">
        <Header user={session.user} onOpenCreate={openCreate} onSignOut={handleSignOut} onRefresh={fetchMods} />
        <StatsGrid stats={stats} />

        {loadError ? <div className="message error standalone-message">{loadError}</div> : null}
        {loading ? <div className="panel empty-state">Loading your database…</div> : null}

        {!loading ? (
          <div className="layout-grid">
            <div className="left-column">
              <Filters
                query={query}
                setQuery={setQuery}
                creatorFilter={creatorFilter}
                setCreatorFilter={setCreatorFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                sourceFilter={sourceFilter}
                setSourceFilter={setSourceFilter}
                showMissingOnly={showMissingOnly}
                setShowMissingOnly={setShowMissingOnly}
                creators={creators}
              />
              <ModList mods={filteredMods} selectedId={selectedId} onSelect={setSelectedId} onEdit={openEdit} onDelete={handleDelete} />
            </div>
            <DetailPanel mod={selectedMod} />
          </div>
        ) : null}
      </div>

      <ModEditor
        open={editorOpen}
        form={form}
        setForm={setForm}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        saving={saving}
        error={saveError}
        uploading={uploading}
        onUploadPreview={(attireId, file) => handleUpload(attireId, file, 'preview')}
        onUploadRender={(attireId, file) => handleUpload(attireId, file, 'render')}
        onRemovePreview={(attireId) => removeAttireAsset(attireId, 'preview')}
        onRemoveRender={(attireId) => removeAttireAsset(attireId, 'render')}
      />
    </div>
  )
}
