import { useEffect, useMemo, useState } from 'react'
import OtherModDetailPanel from './OtherModDetailPanel'
import OtherModEditorModal from './OtherModEditorModal'
import OtherModFilters from './OtherModFilters'
import OtherModList from './OtherModList'
import {
  OTHER_MOD_SUBTYPES,
  emptyOtherMod,
  findDuplicateOtherMod,
  normalizeOtherModForEditor,
  paginateItems,
  requestSummary,
  SOURCE_GAMES,
  parseDownloadLinks,
  testDownloadLink,
  uid
} from '../lib/utils'
import { getAssetUrl, removeAssets, uploadImageWithVariants } from '../lib/storage'

export default function OtherModPage({
  otherMods = [],
  creators = [],
  collections = [],
  session,
  canContribute,
  canDeleteContent,
  canManageContent,
  installedOtherModIds,
  setInstalledOtherModIds,
  currentProfile,
  supabase,
  fetchAll,
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator,
  openNotice,
  onOpenCollectionPicker,
  otherModsCreateSignal,
  otherModsSelectSignal,
  onConsumeOtherModsCreateSignal,
  openConfirmAction,
  onOpenImageViewer,
  onRequestPort,
  onAddVersionLink
}) {
  const [query, setQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [sourceGameFilter, setSourceGameFilter] = useState('all')
  const [subtypeFilter, setSubtypeFilter] = useState('all')
  const [installFilter, setInstallFilter] = useState('all')
  const [missingDownloadOnly, setMissingDownloadOnly] = useState(false)
  const [deadLinkOnly, setDeadLinkOnly] = useState(false)

  const [viewMode, setViewMode] = useState('cards')
  const [otherModsPage, setOtherModsPage] = useState(1)
  const otherModsPerPage = 14

  const [selectedOtherModId, setSelectedOtherModId] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyOtherMod())

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const filteredOtherMods = useMemo(() => {
    const q = query.toLowerCase().trim()

    return otherMods.filter((otherMod) => {
      const haystack = [
        otherMod.name,
        otherMod.creator_name,
        otherMod.notes,
        otherMod.source_game,
        otherMod.subtype,
        JSON.stringify(otherMod.profile_json || {})
      ].join(' ').toLowerCase()

      const queryOk = !q || haystack.includes(q)
      const creatorOk = creatorFilter === 'all' || otherMod.creator_name === creatorFilter
      const sourceGameOk = sourceGameFilter === 'all' || otherMod.source_game === sourceGameFilter
      const subtypeOk = subtypeFilter === 'all' || otherMod.subtype === subtypeFilter

      const installedOk =
        installFilter === 'all' ||
        (installFilter === 'installed' && installedOtherModIds.has(otherMod.id)) ||
        (installFilter === 'not_installed' && !installedOtherModIds.has(otherMod.id))

      const summary = requestSummary(otherMod.requests || [], 'other_mod_id', otherMod.id)
      const hasDeadLink = summary.deadLinks > 0

      const missingDownloadOk = !missingDownloadOnly || !String(otherMod.download_url || '').trim()
      const deadLinkOk = !deadLinkOnly || hasDeadLink

      return (
        queryOk &&
        creatorOk &&
        sourceGameOk &&
        subtypeOk &&
        installedOk &&
        missingDownloadOk &&
        deadLinkOk
      )
    })
  }, [
    otherMods,
    query,
    creatorFilter,
    sourceGameFilter,
    subtypeFilter,
    installFilter,
    missingDownloadOnly,
    deadLinkOnly,
    installedOtherModIds
  ])

  const decoratedOtherMods = useMemo(() => {
    return filteredOtherMods.map((otherMod) => {
        const isInstalled = installedOtherModIds.has(otherMod.id)

        const matchingCollections = (collections || []).filter((collection) =>
        (collection.items || []).some((entry) => entry.other_mod_id === otherMod.id)
        )

        return {
        ...otherMod,
        isInstalled,
        inCollection: matchingCollections.length > 0,
        collectionCount: matchingCollections.length,
        collectionNames: matchingCollections.map((collection) => collection.name)
        }
    })
  }, [filteredOtherMods, installedOtherModIds, collections])

  const paginated = useMemo(
    () => paginateItems(decoratedOtherMods, otherModsPage, otherModsPerPage),
    [decoratedOtherMods, otherModsPage]
  )

  const visibleOtherMods = paginated.items

  const selectedOtherMod = useMemo(
    () => decoratedOtherMods.find((item) => item.id === selectedOtherModId) || visibleOtherMods[0] || null,
    [decoratedOtherMods, visibleOtherMods, selectedOtherModId]
  )

  useEffect(() => {
    setOtherModsPage(1)
  }, [
    query,
    creatorFilter,
    sourceGameFilter,
    subtypeFilter,
    installFilter,
    missingDownloadOnly,
    deadLinkOnly
  ])

  useEffect(() => {
    if (otherModsPage > paginated.totalPages) {
      setOtherModsPage(paginated.totalPages)
    }
  }, [otherModsPage, paginated.totalPages])

  useEffect(() => {
    if (!selectedOtherModId && visibleOtherMods[0]) {
      setSelectedOtherModId(visibleOtherMods[0].id)
    }

    if (selectedOtherModId && !visibleOtherMods.some((item) => item.id === selectedOtherModId)) {
      setSelectedOtherModId(visibleOtherMods[0]?.id || null)
    }
  }, [visibleOtherMods, selectedOtherModId])

  useEffect(() => {
    if (!otherModsSelectSignal?.otherModId) return

    const index = filteredOtherMods.findIndex((item) => item.id === otherModsSelectSignal.otherModId)
    if (index >= 0) {
        const nextPage = Math.floor(index / otherModsPerPage) + 1
        setOtherModsPage(nextPage)
        setSelectedOtherModId(otherModsSelectSignal.otherModId)
    }
  }, [otherModsSelectSignal, filteredOtherMods])

  useEffect(() => {
    if (!otherModsCreateSignal) return
    openAdd()
    onConsumeOtherModsCreateSignal?.()
  }, [otherModsCreateSignal, onConsumeOtherModsCreateSignal])

  function openAdd() {
    if (!canContribute) return

    setForm({
      ...emptyOtherMod(),
      images: [],
      pendingImageUploads: [],
      temp_upload_id: ''
    })

    setModalOpen(true)
  }

  function openEdit(otherMod) {
    if (!canManageContent(otherMod.owner_id)) return
    setForm(normalizeOtherModForEditor(otherMod))
    setModalOpen(true)
  }

  async function save() {
  if (!canContribute) return

  setSaving(true)
  try {
    if (!form.name.trim()) {
      throw new Error('Other mod name is required.')
    }

    if (!form.subtype.trim()) {
      throw new Error('A subcategory is required.')
    }

    const duplicate = findDuplicateOtherMod(otherMods, form.name)
    if (duplicate && duplicate.id !== form.id) {
      throw new Error(`Other mod already exists: ${duplicate.name}`)
    }

    let profileJson = null

    if (String(form.profile_json_text || '').trim()) {
      try {
        profileJson = JSON.parse(form.profile_json_text)
      } catch {
        throw new Error('JSON profile must be valid JSON.')
      }
    }

    const parsedLinks = parseDownloadLinks(form.download_url || '')

    if (parsedLinks.length) {
      const results = await Promise.all(parsedLinks.map((link) => testDownloadLink(link)))
      const deadResults = results.filter((item) => item?.status === 'dead' || item?.ok === false)

      if (deadResults.length === parsedLinks.length) {
        throw new Error('All entered download links appear to be dead. Please correct them before saving.')
      }
    }

    const payload = {
      name: form.name.trim(),
      creator_name: (form.creator_name || '').trim(),
      subtype: form.subtype.trim(),
      download_url: form.download_url.trim(),
      source_game: form.source_game || 'WWE 2K25',
      notes: form.notes.trim(),
      profile_json: profileJson,
      updated_at: new Date().toISOString()
    }

    let otherModId = form.id

    if (form.persisted) {
      const { error } = await supabase
        .from('other_mods')
        .update(payload)
        .eq('id', form.id)

      if (error) throw error

      openNotice('success', 'Other mod updated', `${form.name} was updated successfully.`)
    } else {
      const { data, error } = await supabase
        .from('other_mods')
        .insert(payload)
        .select('id')
        .single()

      if (error) throw error

      otherModId = data.id
      setSelectedOtherModId(data.id)
      openNotice('success', 'Other mod added', `${form.name} was added successfully.`)
    }

    if (parsedLinks.length && otherModId) {
      const results = await Promise.all(parsedLinks.map((link) => testDownloadLink(link)))
      const hasDeadLink = results.some((item) => item?.status === 'dead')

      if (hasDeadLink) {
        const { data: existingDeadRequests, error: existingDeadRequestsError } = await supabase
          .from('other_mod_requests')
          .select('id')
          .eq('other_mod_id', otherModId)
          .eq('status', 'open')
          .eq('request_type', 'dead_link')
          .limit(1)

        if (existingDeadRequestsError) throw existingDeadRequestsError

        if (!existingDeadRequests?.length) {
          const { error: insertDeadRequestError } = await supabase
            .from('other_mod_requests')
            .insert({
              other_mod_id: otherModId,
              request_type: 'dead_link',
              notes: 'Automatically detected dead link during save.'
            })

          if (insertDeadRequestError) throw insertDeadRequestError
        }
      }
    }

    if (Array.isArray(form.pendingImageUploads) && form.pendingImageUploads.length) {
      const imageInserts = form.pendingImageUploads.map((item) => ({
        other_mod_id: otherModId,
        owner_id: session.user.id,
        image_path: item.path,
        image_medium_path: item.medium_path || '',
        image_thumb_path: item.thumb_path || '',
        image_name: item.name,
        external_original_url: item.external_original_url || '',
        external_medium_url: item.external_medium_url || '',
        external_thumb_url: item.external_thumb_url || ''
      }))

      const { error } = await supabase.from('other_mod_images').insert(imageInserts)
      if (error) throw error
    }

    setModalOpen(false)
    await fetchAll()
  } catch (err) {
    openNotice('error', 'Could not save other mod', err.message || 'Failed to save other mod.')
  } finally {
    setSaving(false)
  }
}

  async function handleUpload(files, kind) {
    if (!files || !canContribute) return

    try {
      setUploading(true)

      const entityId = form.id || form.temp_upload_id || uid()

      if (kind === 'image') {
        const uploaded = []

        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            throw new Error('All screenshots must be image files.')
          }

          const {
            originalPath,
            mediumPath,
            thumbPath,
            fileName,
            externalOriginalUrl,
            externalMediumUrl,
            externalThumbUrl
          } = await uploadImageWithVariants({
            userId: session.user.id,
            entityId,
            file,
            kind: 'image',
            folder: 'other-mods'
          })

          uploaded.push({
            path: originalPath,
            medium_path: mediumPath,
            thumb_path: thumbPath,
            name: fileName,
            external_original_url: externalOriginalUrl || '',
            external_medium_url: externalMediumUrl || '',
            external_thumb_url: externalThumbUrl || '',
            url: externalThumbUrl || getAssetUrl(thumbPath),
            image_url: externalMediumUrl || getAssetUrl(mediumPath),
            full_image_url: externalOriginalUrl || getAssetUrl(originalPath),
            thumb_url: externalThumbUrl || getAssetUrl(thumbPath),
            medium_url: externalMediumUrl || getAssetUrl(mediumPath)
          })
        }

        setForm((current) => ({
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

  async function touchOtherModUpdatedAt(otherModId) {
    if (!otherModId) return

    const { error } = await supabase
      .from('other_mods')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', otherModId)

    if (error) throw error
  }

  async function handleAddOtherModCreator() {
    const created = await onAddCreator()
    if (created?.name) {
      setForm((current) => ({
        ...current,
        creator_name: created.name
      }))
    }
    return created
  }

  async function removeAsset(kind, path) {
    if (!canDeleteContent) return

    try {
      const targetImage = (form.images || []).find((img) => img.path === path)

      await removeAssets([
        targetImage?.path,
        targetImage?.medium_path,
        targetImage?.thumb_path
      ].filter(Boolean))

      if (kind === 'image') {
        setForm((current) => ({
          ...current,
          images: (current.images || []).filter((img) => img.path !== path),
          pendingImageUploads: (current.pendingImageUploads || []).filter((img) => img.path !== path)
        }))

        if (form.persisted) {
          const { error } = await supabase
            .from('other_mod_images')
            .delete()
            .eq('other_mod_id', form.id)
            .eq('image_path', path)

          if (error) throw error

          await touchOtherModUpdatedAt(form.id)
        }
      }

      openNotice('success', 'Asset removed', 'The selected asset was removed.')
    } catch (err) {
      openNotice('error', 'Could not remove asset', err.message || 'Could not remove asset.')
    }
  }

  async function toggleInstalled(otherMod) {
    if (!canContribute) return
    const installed = installedOtherModIds.has(otherMod.id)
    try {
      if (installed) {
        const { error } = await supabase
          .from('user_installed_other_mods')
          .delete()
          .eq('user_id', session.user.id)
          .eq('other_mod_id', otherMod.id)

        if (error) throw error

        openNotice('success', 'Removed from installed', `${otherMod.name} is no longer marked as installed.`)
      } else {
        const { error } = await supabase
          .from('user_installed_other_mods')
          .insert({ user_id: session.user.id, other_mod_id: otherMod.id })

        if (error) throw error

        openNotice('success', 'Marked as installed', `${otherMod.name} is now marked as installed in your game.`)
      }

      const next = new Set(installedOtherModIds)
      if (installed) {
        next.delete(otherMod.id)
      } else {
        next.add(otherMod.id)
      }
      setInstalledOtherModIds(next)
    } catch (err) {
      openNotice(
        'error',
        'Could not update install status',
        err.message || 'Could not update install status.'
      )
    }
  }

  async function createOtherModRequest(otherMod, requestType, prefillNotes = '') {
    if (!canContribute) return

    try {
      const { error } = await supabase.from('other_mod_requests').insert({
        other_mod_id: otherMod.id,
        request_type: requestType,
        notes: (prefillNotes || '').trim()
      })

      if (error) throw error

      openNotice('success', 'Request submitted', `Your request for ${otherMod.name} was added successfully.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not submit request', err.message || 'Could not submit request.')
    }
  }

  async function resolveOtherModLink(otherMod, issueType, correctedUrl, notes = '') {
    if (!canManageContent(otherMod.owner_id)) return

    try {
      const cleanUrl = String(correctedUrl || '').trim()
      if (!cleanUrl) {
        throw new Error('A corrected download URL is required.')
      }

      const { error: otherModError } = await supabase
        .from('other_mods')
        .update({
          download_url: cleanUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', otherMod.id)

      if (otherModError) throw otherModError

      const requestTypes =
        issueType === 'dead_link'
          ? ['dead_link']
          : ['missing_link', 'dead_link']

      const { error: requestError } = await supabase
        .from('other_mod_requests')
        .update({
          status: 'fulfilled',
          notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
        })
        .eq('other_mod_id', otherMod.id)
        .eq('status', 'open')
        .in('request_type', requestTypes)

      if (requestError) throw requestError

      openNotice('success', 'Link issue resolved', 'The other mod download link was updated.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not resolve link', err.message || 'Could not resolve this link issue.')
    }
  }

  function deleteOtherMod(otherMod) {
    if (!canDeleteContent) return

    openConfirmAction({
        title: 'Delete other mod?',
        message: `This will permanently delete ${otherMod.name}.`,
        confirmLabel: 'Delete mod',
        tone: 'danger',
        onConfirm: async () => {
        try {
            setSaving(true)

            const imagePaths = (otherMod.other_mod_images || otherMod.images || [])
              .flatMap((img) => [
                img.image_path || img.path,
                img.image_medium_path || img.medium_path,
                img.image_thumb_path || img.thumb_path
              ])
              .filter(Boolean)

            if (imagePaths.length) {
            await removeAssets(imagePaths)
            }

            const { error } = await supabase
            .from('other_mods')
            .delete()
            .eq('id', otherMod.id)

            if (error) throw error

            openNotice('success', 'Other mod deleted', `${otherMod.name} was deleted.`)
            await fetchAll()
        } finally {
            setSaving(false)
        }
        }
    })
    }

  return (
    <>
      <div className="layout-grid">
        <div className="left-column">
          <OtherModFilters
            query={query}
            setQuery={setQuery}
            creatorFilter={creatorFilter}
            setCreatorFilter={setCreatorFilter}
            creators={creators}
            sourceGameFilter={sourceGameFilter}
            setSourceGameFilter={setSourceGameFilter}
            subtypeFilter={subtypeFilter}
            setSubtypeFilter={setSubtypeFilter}
            subtypeOptions={OTHER_MOD_SUBTYPES}
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
            onAddCreator={handleAddOtherModCreator}
            addingCreator={addingCreator}
          />

          <OtherModList
            otherMods={visibleOtherMods}
            selectedId={selectedOtherModId}
            onSelect={setSelectedOtherModId}
            onEdit={openEdit}
            onDelete={canDeleteContent ? deleteOtherMod : null}
            onAddOtherMod={openAdd}
            session={session}
            canContribute={canContribute}
            canManageContent={canManageContent}
            viewMode={viewMode}
            setViewMode={setViewMode}
            pagination={paginated}
            onPageChange={setOtherModsPage}
          />
        </div>

        <OtherModDetailPanel
            mod={selectedOtherMod}
            session={session}
            currentProfile={currentProfile}
            canContribute={canContribute}
            canManageContent={canManageContent}
            installedOtherModIds={installedOtherModIds}
            onAddMod={openAdd}
            onEditMod={openEdit}
            onDeleteMod={deleteOtherMod}
            onToggleInstalled={toggleInstalled}
            onCreateRequest={createOtherModRequest}
            onResolveLink={resolveOtherModLink}
            onOpenCollectionPicker={onOpenCollectionPicker}
              onOpenImageViewer={onOpenImageViewer}
            onRequestPort={onRequestPort}
            onAddVersionLink={onAddVersionLink}
          />
        </div>

        <OtherModEditorModal
            open={modalOpen}
            form={form}
            setForm={setForm}
            onClose={() => setModalOpen(false)}
            onSave={save}
            onUpload={handleUpload}
            onRemoveAsset={removeAsset}
            creatorOptions={creators}
            newCreatorName={newCreatorName}
            setNewCreatorName={setNewCreatorName}
            onAddCreator={handleAddOtherModCreator}
            saving={saving}
            uploading={uploading}
            addingCreator={addingCreator}
            otherMods={otherMods}
        />
    </>
  )
}