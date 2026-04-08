import { useMemo } from 'react'
import {
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  findDuplicateTitleBelt,
  SOURCE_GAMES
} from '../lib/utils'

function AudioFilesSection({ files = [], onRemoveAudio, uploading }) {
  return (
    <div className="upload-card premium-upload-card">
      <div className="upload-card-header">
        <h5>Title audio (.wem)</h5>
        <p>Upload championship audio files in WEM format.</p>
      </div>

      {files.length ? (
        <div className="wrestler-audio-list">
          {files.map((file) => (
            <div
              key={file.id || file.file_path || file.file_url}
              className="wrestler-audio-row"
            >
              <div className="wrestler-audio-main">
                <div className="wrestler-audio-name">
                  {file.file_name || 'Audio file'}
                </div>
                <div className="muted-text small-text">
                  {file.audio_type || 'generic'}
                </div>
              </div>

              <div className="wrestler-audio-actions">
                {file.file_url ? (
                  <audio className="wrestler-audio-player" controls src={file.file_url} />
                ) : null}

                <button
                  type="button"
                  className="ghost-button small-btn"
                  disabled={uploading}
                  onClick={() => onRemoveAudio?.(file)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="upload-placeholder">No audio uploaded</div>
      )}
    </div>
  )
}

export default function TitleBeltEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUpload,
  onRemoveAsset,
  onUploadAudio,
  onRemoveAudio,
  creatorOptions = [],
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator,
  saving,
  uploading,
  titleBelts = []
}) {
  const normalizedName = (form.name || '').trim().toLowerCase()

  const duplicateTitle = useMemo(() => {
    if (!normalizedName) return null
    const found = findDuplicateTitleBelt(titleBelts, form.name)
    if (!found) return null
    if (form.persisted && found.id === form.id) return null
    return found
  }, [titleBelts, form.name, form.id, form.persisted, normalizedName])

  const parsedLinks = useMemo(
    () => parseDownloadLinks(form.download_url || ''),
    [form.download_url]
  )

  if (!open) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.persisted ? 'Edit title belt mod' : 'Add title belt mod'}</h2>
          <p className="subtle-copy">
            Title belt mods can include a DDS render, screenshots, download links, notes,
            creator, source game, and WEM audio files.
          </p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid">
                <label>
                  Title belt name
                  <input
                    value={form.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="World Heavyweight Championship, ECW Championship..."
                    autoComplete="off"
                  />
                </label>

                {normalizedName ? (
                  <div className="live-check-row">
                    {duplicateTitle ? (
                      <div className="exists-banner">
                        <div className="exists-banner-mark">!</div>
                        <div className="exists-banner-copy">
                          <strong>This title belt already exists.</strong>
                          <span>
                            Existing entry: <b>{duplicateTitle.name}</b>. Edit the current one
                            instead of creating a duplicate.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="live-ok-hint">No duplicate title belt found.</div>
                    )}
                  </div>
                ) : null}

                <div className="form-grid compact-grid">
                  <label>
                    Creator
                    <select
                      value={form.creator_name || ''}
                      onChange={(e) => updateField('creator_name', e.target.value)}
                    >
                      <option value="">Select a creator</option>
                      {creatorOptions.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Source game
                    <select
                      value={form.source_game || 'WWE 2K25'}
                      onChange={(e) => updateField('source_game', e.target.value)}
                    >
                      {SOURCE_GAMES.map((item) => (
                        <option key={item} value={item}>
                          {item === 'WWE 2K26' ? 'WWE 2K26 • NEW' : item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Add creator
                  <div className="inline-stack creator-inline-stack">
                    <input
                      value={newCreatorName}
                      onChange={(e) => setNewCreatorName(e.target.value)}
                      placeholder="New creator name"
                    />
                    <button
                      type="button"
                      className="secondary-button small-btn"
                      onClick={async () => {
                        const created = await onAddCreator()
                        if (created?.name) {
                          updateField('creator_name', created.name)
                        }
                      }}
                      disabled={addingCreator || !newCreatorName.trim()}
                    >
                      {addingCreator ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </label>

                <label>
                  Download links
                  <textarea
                    value={form.download_url || ''}
                    onChange={(e) => updateField('download_url', e.target.value)}
                    placeholder={'Paste one link per line\nhttps://www.mediafire.com/...\nhttps://mega.nz/...'}
                  />
                </label>

                {parsedLinks.length ? (
                  <div className="download-provider-preview">
                    {parsedLinks.map((link, index) => {
                      const provider = getDownloadProvider(link)
                      return (
                        <div className={`provider-chip provider-${provider}`} key={`${link}-${index}`}>
                          <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
                          <span className="provider-label">{getDownloadProviderLabel(provider)}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                <label>
                  Notes / description
                  <textarea
                    value={form.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Add title details, compatibility notes, install notes, etc."
                  />
                </label>
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-grid single-column-upload-grid">
                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>DDS render</h5>
                    <p>Upload a title render in DDS format.</p>
                  </div>

                  {form.render_dds_url ? (
                    <div className="dds-preview-wrap">
                      <img
                        className="upload-preview dds-preview"
                        src={form.render_dds_url}
                        alt={form.render_dds_name || 'Title render'}
                      />
                      <div className="muted-text small-text">
                        {form.render_dds_name || 'DDS render uploaded'}
                      </div>
                    </div>
                  ) : (
                    <div className="render-placeholder">
                      <div className="render-badge">DDS</div>
                      <div className="muted-text">No DDS render uploaded</div>
                    </div>
                  )}

                  <div className="upload-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload DDS
                      <input
                        type="file"
                        accept=".dds"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) onUpload(file, 'render')
                          e.target.value = ''
                        }}
                      />
                    </label>

                    {(form.render_dds_path || form.render_dds_url) ? (
                      <button
                        className="ghost-button"
                        onClick={() => onRemoveAsset('render', form.render_dds_path)}
                        type="button"
                        disabled={uploading}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>Title screenshots</h5>
                    <p>Upload multiple screenshots for this title belt mod.</p>
                  </div>

                  {(form.images || []).length ? (
                    <div className="gallery-grid modal-gallery-grid">
                      {(form.images || []).map((image) => (
                        <div className="gallery-tile" key={image.path || image.id || image.url}>
                          <img
                            className="gallery-img"
                            src={image.url || image.image_url}
                            alt={image.name || 'Title screenshot'}
                          />
                          <button
                            className="ghost-button small-btn gallery-remove"
                            type="button"
                            disabled={uploading}
                            onClick={() => onRemoveAsset('image', image.path)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="upload-placeholder">No title screenshots uploaded</div>
                  )}

                  <div className="upload-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload image(s)
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploading}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length) {
                            onUpload(files, 'image')
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </div>

                <AudioFilesSection
                  files={form.audio_files || []}
                  onRemoveAudio={onRemoveAudio}
                  uploading={uploading}
                />

                <div className="upload-actions">
                  <label className="secondary-button inline-file file-button">
                    Upload WEM audio
                    <input
                      type="file"
                      accept=".wem"
                      multiple
                      disabled={uploading}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length) {
                          onUploadAudio(files)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">
            {duplicateTitle
              ? 'Use the existing title belt entry instead of creating a duplicate.'
              : uploading
                ? 'Uploading asset…'
                : ''}
          </div>

          <button
            className="ghost-button"
            onClick={onClose}
            type="button"
            disabled={saving || uploading}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={onSave}
            disabled={saving || uploading || !!duplicateTitle}
            type="button"
          >
            {saving ? 'Saving…' : 'Save title belt'}
          </button>
        </div>
      </div>
    </div>
  )
}