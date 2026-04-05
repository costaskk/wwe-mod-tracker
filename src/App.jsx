import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import StatsGrid from './components/StatsGrid'
import Filters from './components/Filters'
import ModList from './components/ModList'
import DetailPanel from './components/DetailPanel'
import ModEditor from './components/ModEditor'
import { demoData } from './data/demoData'

const STORAGE_KEY = 'wwe2k25_mod_tracker_v1'

const createId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const createEmptyAttire = () => ({
  id: createId(),
  name: '',
  slot: '',
  era: '',
  creator: '',
  imageUrl: '',
  downloadUrl: '',
  notes: '',
  status: 'Complete',
})

const createDefaultForm = () => ({
  wrestlerName: '',
  modCreator: '',
  gameVersion: '1.00',
  sourceGame: 'WWE 2K25',
  modType: 'Original',
  isMissingTarget: false,
  targetAttireCount: 1,
  imagesText: '',
  downloadLinksText: '',
  notes: '',
  tagsText: '',
  attires: [createEmptyAttire()],
  movesetJson: null,
  hypeProfileJson: null,
  dcProfileJson: null,
})

function parseLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function App() {
  const [mods, setMods] = useState([])
  const [query, setQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [expandedCards, setExpandedCards] = useState({})
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(createDefaultForm())

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setMods(parsed)
        return
      } catch (error) {
        console.error('Could not parse saved tracker data.', error)
      }
    }

    setMods(demoData)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mods))
  }, [mods])

  const creators = useMemo(() => {
    return [...new Set(mods.map((mod) => mod.modCreator).filter(Boolean))].sort()
  }, [mods])

  const filteredMods = useMemo(() => {
    return mods.filter((mod) => {
      const haystack = [
        mod.wrestlerName,
        mod.modCreator,
        mod.gameVersion,
        mod.sourceGame,
        mod.modType,
        mod.notes,
        ...(mod.tags || []),
        ...mod.attires.map((attire) => `${attire.name} ${attire.era || ''} ${attire.status}`),
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = haystack.includes(query.toLowerCase())
      const matchesCreator = creatorFilter === 'all' || mod.modCreator === creatorFilter
      const matchesType = typeFilter === 'all' || mod.modType === typeFilter
      const matchesSource = sourceFilter === 'all' || mod.sourceGame === sourceFilter
      const matchesMissing = !showMissingOnly || mod.isMissingTarget || mod.attires.some((attire) => attire.status !== 'Complete')

      return matchesQuery && matchesCreator && matchesType && matchesSource && matchesMissing
    })
  }, [mods, query, creatorFilter, typeFilter, sourceFilter, showMissingOnly])

  const selectedMod = useMemo(() => {
    return mods.find((mod) => mod.id === selectedId) || filteredMods[0] || null
  }, [mods, selectedId, filteredMods])

  useEffect(() => {
    if (!selectedId && filteredMods[0]) {
      setSelectedId(filteredMods[0].id)
      return
    }

    if (selectedId && !filteredMods.some((mod) => mod.id === selectedId)) {
      setSelectedId(filteredMods[0]?.id || null)
    }
  }, [filteredMods, selectedId])

  const stats = useMemo(() => {
    const totalAttires = mods.reduce((sum, mod) => sum + mod.attires.length, 0)
    const incompleteAttires = mods.reduce(
      (sum, mod) => sum + mod.attires.filter((attire) => attire.status !== 'Complete').length,
      0,
    )
    const missingWrestlers = mods.filter((mod) => mod.isMissingTarget).length
    const totalTargetsGap = mods.reduce((sum, mod) => sum + Math.max(0, mod.targetAttireCount - mod.attires.length), 0)

    return [
      { label: 'Wrestlers', value: mods.length },
      { label: 'Attires', value: totalAttires },
      { label: 'Incomplete Attires', value: incompleteAttires },
      { label: 'Missing Targets', value: missingWrestlers },
      { label: 'Attire Gap', value: totalTargetsGap },
    ]
  }, [mods])

  function openCreate() {
    setEditingId(null)
    setForm(createDefaultForm())
    setIsEditorOpen(true)
  }

  function openEdit(mod) {
    setEditingId(mod.id)
    setForm({
      wrestlerName: mod.wrestlerName,
      modCreator: mod.modCreator,
      gameVersion: mod.gameVersion,
      sourceGame: mod.sourceGame,
      modType: mod.modType,
      isMissingTarget: mod.isMissingTarget,
      targetAttireCount: mod.targetAttireCount,
      imagesText: (mod.images || []).join('\n'),
      downloadLinksText: (mod.downloadLinks || []).join('\n'),
      notes: mod.notes || '',
      tagsText: (mod.tags || []).join(', '),
      attires: mod.attires.length ? mod.attires : [createEmptyAttire()],
      movesetJson: mod.movesetJson || null,
      hypeProfileJson: mod.hypeProfileJson || null,
      dcProfileJson: mod.dcProfileJson || null,
    })
    setIsEditorOpen(true)
  }

  function saveForm() {
    if (!form.wrestlerName.trim()) return

    const now = new Date().toISOString()
    const payload = {
      id: editingId || createId(),
      wrestlerName: form.wrestlerName.trim(),
      modCreator: form.modCreator.trim(),
      gameVersion: form.gameVersion.trim(),
      sourceGame: form.sourceGame,
      modType: form.modType,
      isMissingTarget: form.isMissingTarget,
      targetAttireCount: Number(form.targetAttireCount) || 0,
      images: parseLines(form.imagesText),
      downloadLinks: parseLines(form.downloadLinksText),
      notes: form.notes.trim(),
      tags: form.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      attires: form.attires.filter((attire) => attire.name.trim()),
      movesetJson: form.movesetJson || null,
      hypeProfileJson: form.hypeProfileJson || null,
      dcProfileJson: form.dcProfileJson || null,
      createdAt: editingId ? mods.find((mod) => mod.id === editingId)?.createdAt || now : now,
      updatedAt: now,
    }

    setMods((currentMods) => {
      const exists = currentMods.some((mod) => mod.id === payload.id)
      return exists ? currentMods.map((mod) => (mod.id === payload.id ? payload : mod)) : [payload, ...currentMods]
    })

    setSelectedId(payload.id)
    setIsEditorOpen(false)
  }

  function deleteMod(id) {
    setMods((currentMods) => currentMods.filter((mod) => mod.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function updateAttire(attireId, patch) {
    setForm((currentForm) => ({
      ...currentForm,
      attires: currentForm.attires.map((attire) => (attire.id === attireId ? { ...attire, ...patch } : attire)),
    }))
  }

  function addAttire() {
    setForm((currentForm) => ({
      ...currentForm,
      attires: [...currentForm.attires, createEmptyAttire()],
    }))
  }

  function removeAttire(attireId) {
    setForm((currentForm) => ({
      ...currentForm,
      attires: currentForm.attires.filter((attire) => attire.id !== attireId),
    }))
  }

  function handleJsonUpload(event, key) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result || '')
      setForm((currentForm) => ({
        ...currentForm,
        [key]: {
          filename: file.name,
          content,
        },
      }))
    }
    reader.readAsText(file)
  }

  function exportDatabase() {
    const blob = new Blob([JSON.stringify(mods, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'wwe-2k25-mod-database.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function importDatabase(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]'))
        if (Array.isArray(parsed)) {
          setMods(parsed)
        }
      } catch (error) {
        console.error('Invalid import file.', error)
        alert('That JSON file could not be imported. Please use a valid exported database file.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function toggleExpanded(id) {
    setExpandedCards((current) => ({ ...current, [id]: !current[id] }))
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <Header onCreate={openCreate} onExport={exportDatabase} onImport={importDatabase} />
        <StatsGrid stats={stats} />

        <main className="main-grid">
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
              filteredMods={filteredMods}
              selectedId={selectedMod?.id}
              setSelectedId={setSelectedId}
              expandedCards={expandedCards}
              toggleExpanded={toggleExpanded}
              onEdit={openEdit}
              onDelete={deleteMod}
            />
          </div>

          <DetailPanel selectedMod={selectedMod} />
        </main>

        <div className="footer-actions">
          <button className="button button-secondary" onClick={openCreate}>
            Add another mod
          </button>
          <button className="button button-secondary" onClick={exportDatabase}>
            Backup database
          </button>
          <button
            className="button button-danger"
            onClick={() => {
              if (window.confirm('Clear all local data from this browser?')) {
                setMods([])
                setSelectedId(null)
                localStorage.removeItem(STORAGE_KEY)
              }
            }}
          >
            Clear all local data
          </button>
        </div>
      </div>

      <ModEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={saveForm}
        form={form}
        setForm={setForm}
        updateAttire={updateAttire}
        addAttire={addAttire}
        removeAttire={removeAttire}
        handleJsonUpload={handleJsonUpload}
        editingId={editingId}
      />
    </div>
  )
}
