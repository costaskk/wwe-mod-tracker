import { useEffect, useMemo, useRef, useState } from 'react'
import ArenaDetailPanel from './ArenaDetailPanel'
import ArenaEditorModal from './ArenaEditorModal'
import ArenaFilters from './ArenaFilters'
import ArenaList from './ArenaList'
import {
  emptyArena,
  findDuplicateArena,
  normalizeArenaForEditor,
  paginateItems,
  parseJsonOrNull,
  requestSummary,
  SOURCE_GAMES,
  uid,
} from '../lib/utils'
import { getAssetUrl, removeAssets, uploadAsset } from '../lib/storage'

export default function ArenaPage({
  arenas = [],
  creators = [],
  session,
  canContribute,
  canDeleteContent,
  canManageContent,
  installedArenaIds,
  setInstalledArenaIds,
  currentProfile,
  supabase,
  fetchAll,
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator,
  openNotice,
  onOpenCollectionPicker,
  arenaCreateSignal,
  arenaSelectSignal,
  onConsumeArenaCreateSignal
}) {
  const [query, setQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [sourceGameFilter, setSourceGameFilter] = useState('all')
  const [installFilter, setInstallFilter] = useState('all')
  const [missingDownloadOnly, setMissingDownloadOnly] = useState(false)
  const [deadLinkOnly, setDeadLinkOnly] = useState(false)

  const [arenaViewMode, setArenaViewMode] = useState('cards')
  const [arenaPage, setArenaPage] = useState(1)
  const arenasPerPage = 14

  const [selectedArenaId, setSelectedArenaId] = useState(null)

  const [arenaModalOpen, setArenaModalOpen] = useState(false)
  const [arenaForm, setArenaForm] = useState(emptyArena())

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const filteredArenas = useMemo(() => {
    const q = query.toLowerCase().trim()

    return arenas.filter((arena) => {
      const haystack = [
        arena.name,
        arena.creator_name,
        arena.notes,
        arena.source_game,
        JSON.stringify(arena.profile_json || {})
      ]
        .join(' ')
        .toLowerCase()

      const queryOk = !q || haystack.includes(q)
      const creatorOk = creatorFilter === 'all' || arena.creator_name === creatorFilter
      const sourceGameOk = sourceGameFilter === 'all' || arena.source_game === sourceGameFilter
      const installedOk =
        installFilter === 'all' ||
        (installFilter === 'installed' && installedArenaIds.has(arena.id)) ||
        (installFilter === 'not_installed' && !installedArenaIds.has(arena.id))

      const summary = requestSummary(arena.requests || [], 'arena_id', arena.id)
      const hasDeadLink = summary.deadLinks > 0
      const missingDownloadOk = !missingDownloadOnly || !String(arena.download_url || '').trim()
      const deadLinkOk = !deadLinkOnly || hasDeadLink

      return queryOk && creatorOk && sourceGameOk && installedOk && missingDownloadOk && deadLinkOk
    })
  }, [
    arenas,
    query,
    creatorFilter,
    sourceGameFilter,
    installFilter,
    missingDownloadOnly,
    deadLinkOnly,
    installedArenaIds
  ])

  const paginatedArenas = useMemo(
    () => paginateItems(filteredArenas, arenaPage, arenasPerPage),
    [filteredArenas, arenaPage]
  )

  const visibleArenas = paginatedArenas.items

  const selectedArena = useMemo(
    () => filteredArenas.find((item) => item.id === selectedArenaId) || visibleArenas[0] || null,
    [filteredArenas, visibleArenas, selectedArenaId]
  )

  useEffect(() => {
    setArenaPage(1)
  }, [query, creatorFilter, sourceGameFilter, installFilter, missingDownloadOnly, deadLinkOnly])

  useEffect(() => {
    if (arenaPage > paginatedArenas.totalPages) {
      setArenaPage(paginatedArenas.totalPages)
    }
  }, [arenaPage, paginatedArenas.totalPages])

  useEffect(() => {
    if (!selectedArenaId && visibleArenas[0]) {
      setSelectedArenaId(visibleArenas[0].id)
    }

    if (selectedArenaId && !visibleArenas.some((item) => item.id === selectedArenaId)) {
      setSelectedArenaId(visibleArenas[0]?.id || null)
    }
  }, [visibleArenas, selectedArenaId])

  useEffect(() => {
    if (!arenaSelectSignal?.arenaId) return

    const arenaIndex = filteredArenas.findIndex((item) => item.id === arenaSelectSignal.arenaId)
    if (arenaIndex >= 0) {
        const nextPage = Math.floor(arenaIndex / arenasPerPage) + 1
        setArenaPage(nextPage)
        setSelectedArenaId(arenaSelectSignal.arenaId)
    }
  }, [arenaSelectSignal, filteredArenas, arenasPerPage])

  useEffect(() => {
    if (!arenaCreateSignal) return
    openAddArena()
    onConsumeArenaCreateSignal?.()
  }, [arenaCreateSignal, onConsumeArenaCreateSignal])

  function openAddArena() {
    if (!canContribute) return
    setArenaForm({
        ...emptyArena(),
        images: [],
        pendingImageUploads: [],
        temp_upload_id: '',
        profile_json_text: ''
    })
    setArenaModalOpen(true)
  }

  function openEditArena(arena) {
    if (!canManageContent(arena.owner_id)) return
    setArenaForm(normalizeArenaForEditor(arena))
    setArenaModalOpen(true)
  }

  async function saveArena() {
    if (!canContribute) return

    setSaving(true)
    try {
      if (!arenaForm.name.trim()) {
        throw new Error('Arena name is required.')
      }

      const duplicateArena = findDuplicateArena(arenas, arenaForm.name)
      if (duplicateArena && duplicateArena.id !== arenaForm.id) {
        throw new Error(`Arena already exists: ${duplicateArena.name}`)
      }

      const payload = {
        name: arenaForm.name.trim(),
        creator_name: arenaForm.creator_name.trim(),
        download_url: arenaForm.download_url.trim(),
        source_game: arenaForm.source_game || 'WWE 2K25',
        notes: arenaForm.notes.trim(),
        profile_json: parseJsonOrNull(arenaForm.profile_json_text)
      }

      let arenaId = arenaForm.id

      if (arenaForm.persisted) {
        const { error } = await supabase
          .from('arenas')
          .update(payload)
          .eq('id', arenaForm.id)

        if (error) throw error

        openNotice('success', 'Arena updated', `${arenaForm.name} was updated successfully.`)
      } else {
        const { data, error } = await supabase
          .from('arenas')
          .insert(payload)
          .select('id')
          .single()

        if (error) throw error

        arenaId = data.id
        setSelectedArenaId(data.id)
        openNotice('success', 'Arena added', `${arenaForm.name} was added successfully.`)
      }

      if (Array.isArray(arenaForm.pendingImageUploads) && arenaForm.pendingImageUploads.length) {
        const inserts = arenaForm.pendingImageUploads.map((item) => ({
          arena_id: arenaId,
          owner_id: session.user.id,
          image_path: item.path,
          image_name: item.name
        }))

        const { error } = await supabase.from('arena_images').insert(inserts)
        if (error) throw error
      }

      setArenaModalOpen(false)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not save arena', err.message || 'Failed to save arena.')
    } finally {
      setSaving(false)
    }
  }

  async function handleArenaAssetUpload(filesOrFile, kind) {
    if (!filesOrFile || !canContribute) return

    try {
      setUploading(true)

      if (kind === 'image') {
        const files = filesOrFile
        const entityId = arenaForm.id || arenaForm.temp_upload_id || uid()
        const uploaded = []

        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            throw new Error('All screenshots must be image files.')
          }

          const { path, fileName } = await uploadAsset({
            userId: session.user.id,
            entityId,
            file,
            kind: 'image',
            folder: 'arenas'
          })

          uploaded.push({
            path,
            name: fileName,
            url: getAssetUrl(path)
          })
        }

        setArenaForm((current) => ({
          ...current,
          temp_upload_id: current.temp_upload_id || entityId,
          images: [...(current.images || []), ...uploaded],
          pendingImageUploads: [...(current.pendingImageUploads || []), ...uploaded]
        }))

        openNotice(
          'success',
          'Screenshots uploaded',
          `${uploaded.length} screenshot${uploaded.length === 1 ? '' : 's'} uploaded successfully.`
        )
      }
    } catch (err) {
      openNotice('error', 'Upload failed', err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAddArenaCreator() {
    const created = await onAddCreator()
    if (created?.name) {
        setArenaForm((current) => ({
        ...current,
        creator_name: created.name
        }))
    }
  }

  async function removeArenaAsset(kind, path) {
    if (!canDeleteContent) return

    try {
      if (path) {
        await removeAssets([path])
      }

      if (kind === 'image') {
        setArenaForm((current) => ({
          ...current,
          images: (current.images || []).filter((img) => img.path !== path),
          pendingImageUploads: (current.pendingImageUploads || []).filter((img) => img.path !== path)
        }))

        if (arenaForm.persisted) {
          const { error } = await supabase
            .from('arena_images')
            .delete()
            .eq('arena_id', arenaForm.id)
            .eq('image_path', path)

          if (error) throw error
        }
      }

      openNotice('success', 'Asset removed', 'The selected asset was removed.')
    } catch (err) {
      openNotice('error', 'Could not remove asset', err.message || 'Could not remove asset.')
    }
  }

  async function uploadArenaJsonFile(file) {
    if (!file) return

    try {
      const text = await file.text()
      JSON.parse(text)

      setArenaForm((current) => ({
        ...current,
        profile_json_text: text
      }))

      openNotice('success', 'Arena profile JSON loaded', `${file.name} was loaded into the editor.`)
    } catch (err) {
      openNotice('error', 'Invalid JSON file', err.message || 'That file is not valid JSON.')
    }
  }

  async function toggleInstalled(arena, installed) {
    if (!canContribute) return

    try {
      if (installed) {
        const { error } = await supabase
          .from('user_installed_arenas')
          .delete()
          .eq('user_id', session.user.id)
          .eq('arena_id', arena.id)

        if (error) throw error

        openNotice('success', 'Removed from installed', `${arena.name} is no longer marked as installed.`)
      } else {
        const { error } = await supabase
          .from('user_installed_arenas')
          .insert({ user_id: session.user.id, arena_id: arena.id })

        if (error) throw error

        openNotice('success', 'Marked as installed', `${arena.name} is now marked as installed in your game.`)
      }

      const next = new Set(installedArenaIds)
      if (installed) {
        next.delete(arena.id)
      } else {
        next.add(arena.id)
      }
      setInstalledArenaIds(next)
    } catch (err) {
      openNotice('error', 'Could not update install status', err.message || 'Could not update install status.')
    }
  }

  async function createArenaRequest(arenaId, requestType, arenaName, prefillNotes = '') {
    if (!canContribute) return

    try {
      const { error } = await supabase.from('arena_requests').insert({
        arena_id: arenaId,
        request_type: requestType,
        notes: (prefillNotes || '').trim()
      })

      if (error) throw error

      openNotice('success', 'Request submitted', `Your request for ${arenaName} was added successfully.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not submit request', err.message || 'Could not submit request.')
    }
  }

  async function resolveArenaLink(arena, correctedUrl, notes = '') {
    if (!canManageContent(arena.owner_id)) return

    try {
      const cleanUrl = String(correctedUrl || '').trim()
      if (!cleanUrl) {
        throw new Error('A corrected download URL is required.')
      }

      const { error: arenaError } = await supabase
        .from('arenas')
        .update({ download_url: cleanUrl })
        .eq('id', arena.id)

      if (arenaError) throw arenaError

      const { error: requestError } = await supabase
        .from('arena_requests')
        .update({
          status: 'fulfilled',
          notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
        })
        .eq('arena_id', arena.id)
        .eq('status', 'open')
        .in('request_type', ['missing_link', 'dead_link'])

      if (requestError) throw requestError

      openNotice('success', 'Link issue resolved', 'The arena download link was updated.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not resolve link', err.message || 'Could not resolve this link issue.')
    }
  }

  async function deleteArena(arena) {
    if (!canDeleteContent) return

    try {
      setSaving(true)

      const paths = (arena.arena_images || [])
        .map((img) => img.image_path)
        .filter(Boolean)

      if (paths.length) {
        await removeAssets(paths)
      }

      const { error } = await supabase
        .from('arenas')
        .delete()
        .eq('id', arena.id)

      if (error) throw error

      openNotice('success', 'Arena deleted', `${arena.name} was deleted.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not delete arena', err.message || 'Could not delete arena.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="layout-grid">
        <div className="left-column">
          <ArenaFilters
            query={query}
            setQuery={setQuery}
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
            onAddCreator={handleAddArenaCreator}
            addingCreator={addingCreator}
          />

          <ArenaList
            arenas={visibleArenas}
            selectedId={selectedArenaId}
            onSelect={setSelectedArenaId}
            onEdit={openEditArena}
            onDelete={canDeleteContent ? deleteArena : null}
            onAddArena={openAddArena}
            session={session}
            canContribute={canContribute}
            canManageContent={canManageContent}
            viewMode={arenaViewMode}
            setViewMode={setArenaViewMode}
            pagination={paginatedArenas}
            onPageChange={setArenaPage}
          />
        </div>

        <ArenaDetailPanel
          arena={selectedArena}
          session={session}
          currentProfile={currentProfile}
          canContribute={canContribute}
          canManageContent={canManageContent}
          installedArenaIds={installedArenaIds}
          onAddArena={openAddArena}
          onEditArena={openEditArena}
          onDeleteArena={deleteArena}
          onToggleInstalled={toggleInstalled}
          onCreateRequest={createArenaRequest}
          onResolveLink={resolveArenaLink}
          onOpenCollectionPicker={onOpenCollectionPicker}
        />
      </div>

      <ArenaEditorModal
        open={arenaModalOpen}
        form={arenaForm}
        setForm={setArenaForm}
        onClose={() => setArenaModalOpen(false)}
        onSave={saveArena}
        onUpload={handleArenaAssetUpload}
        onRemoveAsset={removeArenaAsset}
        onUploadJson={uploadArenaJsonFile}
        creatorOptions={creators}
        newCreatorName={newCreatorName}
        setNewCreatorName={setNewCreatorName}
        onAddCreator={handleAddArenaCreator}
        saving={saving}
        uploading={uploading}
        addingCreator={addingCreator}
        arenas={arenas}
      />
    </>
  )
}