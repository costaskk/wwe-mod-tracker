import { useMemo, useState } from 'react'
import {
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  findDuplicateArena,
  SOURCE_GAMES
} from '../lib/utils'

function JsonEditor({ title, value, onChange, onUpload, filenameHint, uploading }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="json-editor-card elevated-card">
      <div className="json-editor-head">
        <div>
          <h5>{title}</h5>
          <p>Upload a JSON file or paste raw JSON code.</p>
        </div>

        <div className="hero-actions">
          <label className="secondary-button inline-file file-button small-btn">
            Upload JSON
            <input
              type="file"
              accept="application/json,.json"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ''
              }}
            />
          </label>

          <button
            type="button"
            className="ghost-button small-btn"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Hide code' : 'Browse code'}
          </button>
        </div>
      </div>

      {expanded ? (
        <textarea
          className="json-editor-area"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Paste ${filenameHint || 'JSON'} here...`}
        />
      ) : null}
    </div>
  )
}

export default function ArenaEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUpload,
  onRemoveAsset,
  onUploadJson,
  creatorOptions = [],
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator,
  saving,
  uploading,
  arenas = []
}) {
  const normalizedName = (form.name || '').trim().toLowerCase()

  const duplicateArena = useMemo(() => {
    if (!normalizedName) return null
    const found = findDuplicateArena(arenas, form.name)
    if (!found) return null
    if (form.persisted && found.id === form.id) return null
    return found
  }, [arenas, form.name, form.id, form.persisted, normalizedName])

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
          <h2>{form.persisted ? 'Edit arena mod' : 'Add arena mod'}</h2>
          <p className="subtle-copy">
            Arena mods can include multiple screenshots, download links, notes, source game, creator, and a profile JSON.
          </p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid">
                <label>
                  Arena name
                  <input
                    value={form.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="WrestleMania 23, Raw 2002, ECW One Night Stand"
                    autoComplete="off"
                  />
                </label>

                {normalizedName ? (
                  <div className="live-check-row">
                    {duplicateArena ? (
                      <div className="exists-banner">
                        <div className="exists-banner-mark">!</div>
                        <div className="exists-banner-copy">
                          <strong>This arena already exists.</strong>
                          <span>
                            Existing entry: <b>{duplicateArena.name}</b>. Edit the current one instead of creating a duplicate.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="live-ok-hint">No duplicate arena found.</div>
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
                    placeholder="Add helpful notes, installation info, arena details, or compatibility notes."
                  />
                </label>

                <JsonEditor
                  title="Arena profile JSON"
                  value={form.profile_json_text || ''}
                  onChange={(value) => updateField('profile_json_text', value)}
                  onUpload={onUploadJson}
                  filenameHint="arena profile JSON"
                  uploading={uploading}
                />
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-grid single-column-upload-grid">
                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>Arena screenshots</h5>
                    <p>Upload multiple screenshots for this arena mod.</p>
                  </div>

                  {(form.images || []).length ? (
                    <div className="gallery-grid modal-gallery-grid">
                      {(form.images || []).map((image) => (
                        <div className="gallery-tile" key={image.path || image.id || image.url}>
                          <img
                            className="gallery-img"
                            src={image.url || image.image_url}
                            alt={image.name || 'Arena screenshot'}
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
                    <div className="upload-placeholder">No arena screenshots uploaded</div>
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
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">
            {duplicateArena
              ? 'Use the existing arena entry instead of creating a duplicate.'
              : uploading
                ? 'Uploading asset…'
                : ''}
          </div>

          <button className="ghost-button" onClick={onClose} type="button" disabled={saving || uploading}>
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={onSave}
            disabled={saving || uploading || !!duplicateArena}
            type="button"
          >
            {saving ? 'Saving…' : 'Save arena'}
          </button>
        </div>
      </div>
    </div>
  )
}