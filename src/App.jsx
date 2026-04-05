import { useEffect, useMemo, useState } from 'react'
import AuthPanel from './components/AuthPanel'
import DetailPanel from './components/DetailPanel'
import Filters from './components/Filters'
import Header from './components/Header'
import ModEditor from './components/ModEditor'
import ModList from './components/ModList'
import StatsGrid from './components/StatsGrid'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  computeDashboardStats,
  emptyMod,
  normalizeModForEditor,
  parseTags,
  splitLines,
  tryParseJson
} from './lib/utils'

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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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

    const normalized = (data || []).map((mod) => ({
      ...mod,
      attires: [...(mod.attires || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    }))

    setMods(normalized)
    setSelectedId((current) => current || data?.[0]?.id || null)
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

  async function handleSave() {
    setSaveError('')
    setSaving(true)

    try {
      if (!form.wrestler_name.trim()) {
        throw new Error('Wrestler name is required.')
      }

      const modPayload = {
        wrestler_name: form.wrestler_name.trim(),
        mod_creator_name: form.mod_creator_name.trim(),
        game_version: form.game_version.trim(),
        source_game: form.source_game,
        mod_type: form.mod_type,
        is_missing_target: Boolean(form.is_missing_target),
        target_attire_count: Number(form.target_attire_count) || 0,
        notes: form.notes.trim(),
        tags: parseTags(form.tags_text),
        image_urls: splitLines(form.image_urls_text),
        download_links: splitLines(form.download_links_text),
        moveset_json: tryParseJson(form.moveset_json_text),
        hype_profile_json: tryParseJson(form.hype_profile_json_text),
        dc_profile_json: tryParseJson(form.dc_profile_json_text)
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
          image_url: attire.image_url.trim(),
          download_url: attire.download_url.trim(),
          notes: attire.notes.trim(),
          status: attire.status,
          sort_order: index
        }))

      const { data: existingAttires, error: existingError } = await supabase
        .from('attires')
        .select('id')
        .eq('mod_id', modId)

      if (existingError) throw existingError

      const existingIds = new Set((existingAttires || []).map((item) => item.id))
      const nextIds = new Set(cleanedAttires.map((item) => item.id))
      const idsToDelete = [...existingIds].filter((id) => !nextIds.has(id))

      if (idsToDelete.length) {
        const { error } = await supabase.from('attires').delete().in('id', idsToDelete)
        if (error) throw error
      }

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
    const confirmed = window.confirm('Delete this mod entry and all of its attires?')
    if (!confirmed) return

    const { error } = await supabase.from('mods').delete().eq('id', modId)
    if (error) {
      window.alert(error.message)
      return
    }

    if (selectedId === modId) setSelectedId(null)
    await fetchMods()
  }

  const creators = useMemo(
    () => [...new Set(mods.map((mod) => mod.mod_creator_name).filter(Boolean))].sort(),
    [mods]
  )

  const filteredMods = useMemo(() => {
    return mods.filter((mod) => {
      const haystack = [
        mod.wrestler_name,
        mod.mod_creator_name,
        mod.game_version,
        mod.source_game,
        mod.mod_type,
        mod.notes,
        ...(mod.tags || []),
        ...(mod.attires || []).map((attire) => `${attire.name} ${attire.era || ''} ${attire.status || ''}`)
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = haystack.includes(query.toLowerCase())
      const matchesCreator = creatorFilter === 'all' || mod.mod_creator_name === creatorFilter
      const matchesType = typeFilter === 'all' || mod.mod_type === typeFilter
      const matchesSource = sourceFilter === 'all' || mod.source_game === sourceFilter
      const matchesMissing =
        !showMissingOnly || mod.is_missing_target || mod.attires?.some((attire) => attire.status !== 'complete')

      return matchesQuery && matchesCreator && matchesType && matchesSource && matchesMissing
    })
  }, [mods, query, creatorFilter, typeFilter, sourceFilter, showMissingOnly])

  const selectedMod = useMemo(
    () => mods.find((mod) => mod.id === selectedId) || filteredMods[0] || null,
    [mods, selectedId, filteredMods]
  )

  const stats = useMemo(() => computeDashboardStats(mods), [mods])

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Supabase not configured</h1>
          <p className="muted">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to your
            <code>.env.local</code> file first.
          </p>
        </div>
      </div>
    )
  }

  if (loading && !session) {
    return <div className="app-loader">Loading…</div>
  }

  if (!session) {
    return <AuthPanel />
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <Header user={session.user} onOpenCreate={openCreate} onSignOut={handleSignOut} onRefresh={fetchMods} />
        <StatsGrid stats={stats} />

        {loadError ? <div className="message error page-message">{loadError}</div> : null}

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

            <ModList
              mods={filteredMods}
              selectedId={selectedMod?.id}
              onSelect={setSelectedId}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>

          <DetailPanel mod={selectedMod} />
        </div>

        <ModEditor
          open={editorOpen}
          form={form}
          setForm={setForm}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      </div>
    </div>
  )
}
