import { useEffect, useMemo, useState } from 'react'
import TitleBeltDetailPanel from './TitleBeltDetailPanel'
import TitleBeltEditorModal from './TitleBeltEditorModal'
import TitleBeltFilters from './TitleBeltFilters'
import TitleBeltList from './TitleBeltList'
import {
  emptyTitleBelt,
  findDuplicateTitleBelt,
  normalizeTitleBeltForEditor,
  paginateItems,
  requestSummary,
  SOURCE_GAMES,
  parseDownloadLinks,
  testDownloadLink,
  uid
} from '../lib/utils'
import { getAssetUrl, removeAssets, uploadAsset, uploadImageWithVariants } from '../lib/storage'

function normalizeExternalUrl(value = '') {
  const clean = String(value || '').trim()
  if (!clean) return ''
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
}

function getAudioRecordKey(item = {}) {
  return (
    item.id ||
    item.temp_id ||
    `${item.audio_type || 'generic'}:${item.download_url || item.external_url || item.file_name || ''}`
  )
}

export default function TitleBeltPage({
  titleBelts = [],
  creators = [],
  collections = [],
  session,
  canContribute,
  canDeleteContent,
  canManageContent,
  installedTitleIds,
  setInstalledTitleIds,
  currentProfile,
  supabase,
  fetchAll,
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator,
  openNotice,
  onOpenCollectionPicker,
  titleCreateSignal,
  titleSelectSignal,
  onConsumeTitleCreateSignal,
  openConfirmAction,
  onOpenImageViewer,
  onRequestPort,
  onAddVersionLink
}) {
  const [query, setQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [sourceGameFilter, setSourceGameFilter] = useState('all')
  const [installFilter, setInstallFilter] = useState('all')
  const [missingDownloadOnly, setMissingDownloadOnly] = useState(false)
  const [deadLinkOnly, setDeadLinkOnly] = useState(false)

  const [viewMode, setViewMode] = useState('cards')
  const [titlePage, setTitlePage] = useState(1)
  const titlesPerPage = 14

  const [selectedTitleId, setSelectedTitleId] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyTitleBelt())

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const filteredTitles = useMemo(() => {
    const q = query.toLowerCase().trim()

    return titleBelts.filter((title) => {
      const haystack = [
        title.name,
        title.creator_name,
        title.notes,
        title.source_game
      ].join(' ').toLowerCase()

      const queryOk = !q || haystack.includes(q)
      const creatorOk = creatorFilter === 'all' || title.creator_name === creatorFilter
      const sourceGameOk = sourceGameFilter === 'all' || title.source_game === sourceGameFilter

      const installedOk =
        installFilter === 'all' ||
        (installFilter === 'installed' && installedTitleIds.has(title.id)) ||
        (installFilter === 'not_installed' && !installedTitleIds.has(title.id))

      const summary = requestSummary(title.requests || [], 'title_belt_id', title.id)
      const hasDeadLink = summary.deadLinks > 0

      const missingDownloadOk = !missingDownloadOnly || !String(title.download_url || '').trim()
      const deadLinkOk = !deadLinkOnly || hasDeadLink

      return queryOk && creatorOk && sourceGameOk && installedOk && missingDownloadOk && deadLinkOk
    })
  }, [
    titleBelts,
    query,
    creatorFilter,
    sourceGameFilter,
    installFilter,
    missingDownloadOnly,
    deadLinkOnly,
    installedTitleIds
  ])

  const decoratedTitles = useMemo(() => {
    return filteredTitles.map((title) => {
        const isInstalled = installedTitleIds.has(title.id)

        const matchingCollections = (collections || []).filter((collection) =>
        (collection.items || []).some((entry) => entry.title_id === title.id)
        )

        return {
        ...title,
        isInstalled,
        inCollection: matchingCollections.length > 0,
        collectionCount: matchingCollections.length,
        collectionNames: matchingCollections.map((collection) => collection.name)
        }
    })
  }, [filteredTitles, installedTitleIds, collections])

  const paginated = useMemo(
    () => paginateItems(decoratedTitles, titlePage, titlesPerPage),
    [decoratedTitles, titlePage]
  )

  const visibleTitles = paginated.items

  const selectedTitle = useMemo(
    () => decoratedTitles.find((item) => item.id === selectedTitleId) || visibleTitles[0] || null,
    [decoratedTitles, visibleTitles, selectedTitleId]
  )

  useEffect(() => {
    setTitlePage(1)
  }, [query, creatorFilter, sourceGameFilter, installFilter, missingDownloadOnly, deadLinkOnly])

  useEffect(() => {
    if (titlePage > paginated.totalPages) {
      setTitlePage(paginated.totalPages)
    }
  }, [titlePage, paginated.totalPages])

  useEffect(() => {
    if (!selectedTitleId && visibleTitles[0]) {
      setSelectedTitleId(visibleTitles[0].id)
    }

    if (selectedTitleId && !visibleTitles.some((item) => item.id === selectedTitleId)) {
      setSelectedTitleId(visibleTitles[0]?.id || null)
    }
  }, [visibleTitles, selectedTitleId])

  useEffect(() => {
    if (!titleSelectSignal?.titleId) return

    const index = filteredTitles.findIndex((item) => item.id === titleSelectSignal.titleId)
    if (index >= 0) {
      const nextPage = Math.floor(index / titlesPerPage) + 1
      setTitlePage(nextPage)
      setSelectedTitleId(titleSelectSignal.titleId)
    }
  }, [titleSelectSignal, filteredTitles])


  useEffect(() => {
    if (!titleCreateSignal) return
    openAdd()
    onConsumeTitleCreateSignal?.()
  }, [titleCreateSignal, onConsumeTitleCreateSignal])

  function openAdd() {
    if (!canContribute) return
    setForm({
      ...emptyTitleBelt(),
      images: [],
      pendingImageUploads: [],
      audio_files: [],
      pendingAudioUploads: [],
      temp_upload_id: ''
    })
    setModalOpen(true)
  }

  function openEdit(title) {
    if (!canManageContent(title.owner_id)) return
    setForm(normalizeTitleBeltForEditor(title))
    setModalOpen(true)
  }

  async function save() {
    if (!canContribute) return

    setSaving(true)
    try {
      if (!form.name.trim()) {
        throw new Error('Title belt name is required.')
      }

      const duplicate = findDuplicateTitleBelt(titleBelts, form.name)
      if (duplicate && duplicate.id !== form.id) {
        throw new Error(`Title belt already exists: ${duplicate.name}`)
      }
      
      const normalizedParsedLinks = parseDownloadLinks(form.download_url || '')
        .map((link) => normalizeExternalUrl(link))
        .filter(Boolean)

      const normalizedDownloadUrl = normalizedParsedLinks.join('\n')

      if (normalizedParsedLinks.length) {
        const results = await Promise.all(
          normalizedParsedLinks.map((link) => testDownloadLink(link))
        )

        const deadResults = results.filter(
          (item) => item?.status === 'dead' || item?.ok === false
        )

        if (deadResults.length === normalizedParsedLinks.length) {
          throw new Error('All entered download links appear to be dead. Please correct them before saving.')
        }
      }

      const payload = {
        name: form.name.trim(),
        creator_name: form.creator_name.trim(),
        download_url: normalizedDownloadUrl,
        source_game: form.source_game || 'WWE 2K25',
        notes: form.notes.trim(),
        render_dds_path: form.render_dds_path || '',
        render_dds_name: form.render_dds_name || '',
        render_dds_external_url:
          form.render_dds_external_url ||
          form.render_dds_url ||
          '',
        updated_at: new Date().toISOString()
      }

      let titleId = form.id

      if (form.persisted) {
        const { error } = await supabase
          .from('title_belts')
          .update(payload)
          .eq('id', form.id)

        if (error) throw error

        openNotice('success', 'Title belt updated', `${form.name} was updated successfully.`)
      } else {
        const { data, error } = await supabase
          .from('title_belts')
          .insert(payload)
          .select('id')
          .single()

        if (error) throw error

        titleId = data.id
        setSelectedTitleId(data.id)
        openNotice('success', 'Title belt added', `${form.name} was added successfully.`)
      }

      if (normalizedParsedLinks.length && titleId) {
        const results = await Promise.all(
          normalizedParsedLinks.map((link) => testDownloadLink(link))
        )
        const hasDeadLink = results.some((item) => item?.status === 'dead')

        if (hasDeadLink) {
          const { data: existingDeadRequests, error: existingDeadRequestsError } = await supabase
            .from('title_belt_requests')
            .select('id')
            .eq('title_belt_id', titleId)
            .eq('status', 'open')
            .eq('request_type', 'dead_link')
            .limit(1)

          if (existingDeadRequestsError) throw existingDeadRequestsError

          if (!existingDeadRequests?.length) {
            const { error: insertDeadRequestError } = await supabase
              .from('title_belt_requests')
              .insert({
                title_belt_id: titleId,
                request_type: 'dead_link',
                notes: 'Automatically detected dead link during save.'
              })

            if (insertDeadRequestError) throw insertDeadRequestError
          }
        }
      }

      if (Array.isArray(form.pendingImageUploads) && form.pendingImageUploads.length) {
        const imageInserts = form.pendingImageUploads.map((item) => ({
          title_belt_id: titleId,
          owner_id: session.user.id,
          image_path: item.path,
          image_medium_path: item.medium_path || '',
          image_thumb_path: item.thumb_path || '',
          image_name: item.name,
          external_original_url: item.external_original_url || '',
          external_medium_url: item.external_medium_url || '',
          external_thumb_url: item.external_thumb_url || ''
        }))

        const { error } = await supabase.from('title_belt_images').insert(imageInserts)
        if (error) throw error
      }

      const audioRecords = (form.audio_files || [])
        .map((item) => {
          const resolvedUrl = normalizeExternalUrl(
            item.download_url || item.external_url || item.file_url || ''
          )

          return {
            ...item,
            title_belt_id: titleId,
            owner_id: session.user.id,
            audio_type: item.audio_type || 'generic',
            file_name: String(item.file_name || '').trim(),
            resolved_url: resolvedUrl
          }
        })
        .filter((item) => item.resolved_url)

      const existingAudioRecords = audioRecords.filter(
        (item) => item.id && item.persisted !== false
      )

      const newAudioRecords = audioRecords.filter(
        (item) => !item.id || item.persisted === false
      )

      for (const item of existingAudioRecords) {
        const { error } = await supabase
          .from('title_belt_audio_files')
          .update({
            audio_type: item.audio_type || 'generic',
            file_path: null,
            file_name: item.file_name || '',
            external_url: item.resolved_url,
            download_url: item.resolved_url
          })
          .eq('id', item.id)

        if (error) throw error
      }

      if (newAudioRecords.length) {
        const audioInserts = newAudioRecords.map((item) => ({
          title_belt_id: titleId,
          owner_id: session.user.id,
          audio_type: item.audio_type || 'generic',
          file_path: null,
          file_name: item.file_name || '',
          external_url: item.resolved_url,
          download_url: item.resolved_url
        }))

        const { error } = await supabase.from('title_belt_audio_files').insert(audioInserts)
        if (error) throw error
      }

      setModalOpen(false)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not save title belt', err.message || 'Failed to save title belt.')
    } finally {
      setSaving(false)
    }
  }

  async function touchTitleUpdatedAt(titleId) {
    if (!titleId) return

    const { error } = await supabase
      .from('title_belts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', titleId)

    if (error) throw error
  }

  async function handleUpload(filesOrFile, kind) {
    if (!filesOrFile || !canContribute) return

    try {
      setUploading(true)

      const entityId = form.id || form.temp_upload_id || uid()

      if (kind === 'render') {
        const file = filesOrFile

        if (!file.name.toLowerCase().endsWith('.dds')) {
          throw new Error('Render must be a .dds file.')
        }

        const { path, fileName, externalUrl } = await uploadAsset({
          userId: session.user.id,
          entityId,
          file,
          kind: 'render',
          folder: 'titles'
        })

        setForm((current) => ({
          ...current,
          temp_upload_id: current.temp_upload_id || (!current.persisted ? entityId : ''),
          render_dds_path: path,
          render_dds_name: fileName,
          render_dds_url: externalUrl || getAssetUrl(path),
          render_dds_external_url: externalUrl || ''
        }))

        openNotice('success', 'DDS uploaded', `${file.name} was uploaded successfully.`)
      }

      if (kind === 'image') {
        const files = filesOrFile
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
            folder: 'titles'
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
            thumb_url: externalThumbUrl || getAssetUrl(thumbPath),
            image_url: externalMediumUrl || getAssetUrl(mediumPath),
            medium_url: externalMediumUrl || getAssetUrl(mediumPath),
            full_image_url: externalOriginalUrl || getAssetUrl(originalPath)
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

  function addAudioLink(data = {}) {
    if (!canContribute) return

    const normalizedUrl = normalizeExternalUrl(
      data.download_url || data.external_url || data.file_url || ''
    )

    if (!normalizedUrl) return

    setForm((current) => ({
      ...current,
      audio_files: [
        ...(current.audio_files || []),
        {
          id: null,
          temp_id: uid(),
          persisted: false,
          title_belt_id: current.id || null,
          owner_id: session?.user?.id || '',
          audio_type: data.audio_type || 'generic',
          file_path: '',
          file_name: String(data.file_name || '').trim(),
          file_url: normalizedUrl,
          download_url: normalizedUrl,
          external_url: normalizedUrl
        }
      ]
    }))
  }

  function updateAudioLink(audioKey, changes = {}) {
    setForm((current) => ({
      ...current,
      audio_files: (current.audio_files || []).map((item) =>
        getAudioRecordKey(item) === audioKey
          ? {
              ...item,
              ...changes
            }
          : item
      )
    }))
  }

  async function handleAddTitleCreator() {
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
      if (kind === 'image') {
        const imageToRemove = (form.images || []).find((img) => img.path === path)

        if (imageToRemove) {
          await removeAssets([
            imageToRemove.path,
            imageToRemove.medium_path,
            imageToRemove.thumb_path
          ].filter(Boolean))
        }
      }

      if (kind === 'render') {
        if (path) {
          await removeAssets([path])
        }

        if (form.persisted) {
          const { error } = await supabase
            .from('title_belts')
            .update({
              render_dds_path: '',
              render_dds_name: '',
              render_dds_external_url: '',
              updated_at: new Date().toISOString()
            })
            .eq('id', form.id)

          if (error) throw error
        }

        setForm((current) => ({
          ...current,
          render_dds_path: '',
          render_dds_name: '',
          render_dds_url: '',
          render_dds_external_url: ''
        }))
      }

      if (kind === 'image') {
        setForm((current) => ({
          ...current,
          images: (current.images || []).filter((img) => img.path !== path),
          pendingImageUploads: (current.pendingImageUploads || []).filter((img) => img.path !== path)
        }))

        if (form.persisted) {
          const { error } = await supabase
            .from('title_belt_images')
            .delete()
            .eq('title_belt_id', form.id)
            .eq('image_path', path)

          if (error) throw error

          await touchTitleUpdatedAt(form.id)
        }
      }

      openNotice('success', 'Asset removed', 'The selected asset was removed.')
    } catch (err) {
      openNotice('error', 'Could not remove asset', err.message || 'Could not remove asset.')
    }
  }

  async function removeAudio(audioFile) {
    if (!canDeleteContent || !audioFile) return

    try {
      setUploading(true)

      if (audioFile.id) {
        const { error } = await supabase
          .from('title_belt_audio_files')
          .delete()
          .eq('id', audioFile.id)

        if (error) throw error
      }

      const audioKey = getAudioRecordKey(audioFile)

      setForm((current) => ({
        ...current,
        audio_files: (current.audio_files || []).filter(
          (item) => getAudioRecordKey(item) !== audioKey
        ),
        pendingAudioUploads: []
      }))

      if (form.persisted) {
        await touchTitleUpdatedAt(form.id)
      }

      openNotice('success', 'Audio removed', `${audioFile.file_name || 'Audio link'} was removed.`)
    } catch (err) {
      openNotice('error', 'Could not remove audio', err.message || 'Could not remove title audio.')
    } finally {
      setUploading(false)
    }
  }

  async function toggleInstalled(title) {
    if (!canContribute || !session || !title) return

    const installed = Boolean(title.isInstalled)

    try {
      if (installed) {
        const { error } = await supabase
          .from('user_installed_title_belts')
          .delete()
          .eq('user_id', session.user.id)
          .eq('title_belt_id', title.id)

        if (error) throw error

        openNotice('success', 'Removed from installed', `${title.name} is no longer marked as installed.`)
      } else {
        const { error } = await supabase
          .from('user_installed_title_belts')
          .insert({ user_id: session.user.id, title_belt_id: title.id })

        if (error) throw error

        openNotice('success', 'Marked as installed', `${title.name} is now marked as installed in your game.`)
      }

      const next = new Set(installedTitleIds)
      if (installed) {
        next.delete(title.id)
      } else {
        next.add(title.id)
      }
      setInstalledTitleIds(next)
    } catch (err) {
      openNotice(
        'error',
        'Could not update install status',
        err.message || 'Could not update install status.'
      )
    }
  }

  async function createTitleRequest(titleId, requestType, titleName, prefillNotes = '') {
    if (!canContribute) return

    try {
      const { error } = await supabase.from('title_belt_requests').insert({
        title_belt_id: titleId,
        request_type: requestType,
        notes: (prefillNotes || '').trim()
      })

      if (error) throw error

      openNotice('success', 'Request submitted', `Your request for ${titleName} was added successfully.`)
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not submit request', err.message || 'Could not submit request.')
    }
  }

  async function resolveTitleLink(title, correctedUrl, notes = '') {
    if (!canManageContent(title.owner_id)) return

    try {
      const cleanUrl = normalizeExternalUrl(correctedUrl)
      if (!cleanUrl) {
        throw new Error('A corrected download URL is required.')
      }

      const { error: titleError } = await supabase
        .from('title_belts')
        .update({
          download_url: cleanUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', title.id)

      if (titleError) throw titleError

      const { error: requestError } = await supabase
        .from('title_belt_requests')
        .update({
          status: 'fulfilled',
          notes: notes ? `Resolved: ${notes}` : 'Resolved through link update.'
        })
        .eq('title_belt_id', title.id)
        .eq('status', 'open')
        .in('request_type', ['missing_link', 'dead_link'])

      if (requestError) throw requestError

      openNotice('success', 'Link issue resolved', 'The title belt download link was updated.')
      await fetchAll()
    } catch (err) {
      openNotice('error', 'Could not resolve link', err.message || 'Could not resolve this link issue.')
    }
  }

  function deleteTitle(title) {
    if (!canDeleteContent) return

    openConfirmAction({
        title: 'Delete title belt?',
        message: `This will permanently delete ${title.name}.`,
        confirmLabel: 'Delete title belt',
        tone: 'danger',
        onConfirm: async () => {
        try {
            setSaving(true)

            const imagePaths = (title.title_belt_images || [])
              .flatMap((img) => [
                img.image_path,
                img.image_medium_path,
                img.image_thumb_path
              ])
              .filter(Boolean)

            const paths = [
              title.render_dds_path,
              ...imagePaths
            ].filter(Boolean)

            if (paths.length) {
            await removeAssets(paths)
            }

            const { error } = await supabase
            .from('title_belts')
            .delete()
            .eq('id', title.id)

            if (error) throw error

            openNotice('success', 'Title belt deleted', `${title.name} was deleted.`)
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
          <TitleBeltFilters
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
            onAddCreator={handleAddTitleCreator}
            addingCreator={addingCreator}
          />

          <TitleBeltList
            titleBelts={visibleTitles}
            selectedId={selectedTitleId}
            onSelect={setSelectedTitleId}
            onEdit={openEdit}
            onDelete={canDeleteContent ? deleteTitle : null}
            onAddTitle={openAdd}
            session={session}
            canContribute={canContribute}
            canManageContent={canManageContent}
            viewMode={viewMode}
            setViewMode={setViewMode}
            pagination={paginated}
            onPageChange={setTitlePage}
          />
        </div>

        <TitleBeltDetailPanel
          title={selectedTitle}
          session={session}
          currentProfile={currentProfile}
          canContribute={canContribute}
          canManageContent={canManageContent}
          installedTitleIds={installedTitleIds}
          onAddTitle={openAdd}
          onEditTitle={openEdit}
          onDeleteTitle={deleteTitle}
          onToggleInstalled={toggleInstalled}
          onCreateRequest={createTitleRequest}
          onResolveLink={resolveTitleLink}
          onOpenCollectionPicker={onOpenCollectionPicker}
          onOpenImageViewer={onOpenImageViewer}
          onRequestPort={onRequestPort}
          onAddVersionLink={onAddVersionLink}
        />
      </div>

      <TitleBeltEditorModal
        open={modalOpen}
        form={form}
        setForm={setForm}
        onClose={() => setModalOpen(false)}
        onSave={save}
        onUpload={handleUpload}
        onRemoveAsset={removeAsset}
        onAddAudioLink={addAudioLink}
        onUpdateAudioLink={updateAudioLink}
        onRemoveAudio={removeAudio}
        creatorOptions={creators}
        newCreatorName={newCreatorName}
        setNewCreatorName={setNewCreatorName}
        onAddCreator={handleAddTitleCreator}
        saving={saving}
        uploading={uploading}
        addingCreator={addingCreator}
        titleBelts={titleBelts}
      />
    </>
  )
}