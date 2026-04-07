import { useMemo, useState } from 'react'
import { ATTIRE_STATUSES, MOD_TYPES, SOURCE_GAMES, titleCase, parseDownloadLinks, getDownloadProvider, getDownloadProviderLabel, getDownloadProviderMark } from '../lib/utils'

function JsonEditor({ title, value, onChange, onUpload, filenameHint }) {
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
                onUpload(file)
                e.target.value = ''
              }}
            />
          </label>
          <button type="button" className="ghost-button small-btn" onClick={() => setExpanded((v) => !v)}>
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

function DdsPreview({ url, name }) {
  const [failed, setFailed] = useState(false)
  if (!url) return <div className="upload-placeholder">No DDS render uploaded</div>

  return (
    <div className="dds-preview-wrap">
      {!failed ? (
        <img className="upload-preview dds-preview" src={url} alt={name || 'DDS render'} onError={() => setFailed(true)} />
      ) : (
        <div className="render-tile">
          <div className="render-badge">DDS</div>
          <div className="render-name">This browser cannot render DDS directly. You can still open or download the file.</div>
        </div>
      )}
      <a className="secondary-button inline-btn small-btn" href={url} target="_blank" rel="noreferrer">Open / download DDS</a>
    </div>
  )
}

export default function AttireEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUpload,
  onRemoveAsset,
  creatorOptions,
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  onUploadJson,
  saving,
  uploading,
  addingCreator,
  wrestlers = []
}) {
  const parentWrestler = useMemo(() => {
    return wrestlers.find((item) => item.id === form.wrestler_id) || null
  }, [wrestlers, form.wrestler_id])

  const normalizedAttireName = (form.name || '').trim().toLowerCase()

  const duplicateAttire = useMemo(() => {
    if (!parentWrestler || !normalizedAttireName) return null
    return (parentWrestler.attires || []).find(
      (item) =>
        (item.name || '').trim().toLowerCase() === normalizedAttireName &&
        item.id !== form.id
    ) || null
  }, [parentWrestler, normalizedAttireName, form.id])

  const attireSuggestions = useMemo(() => {
    if (!parentWrestler || !normalizedAttireName || duplicateAttire) return []
    return (parentWrestler.attires || [])
      .filter((item) => {
        const name = (item.name || '').trim().toLowerCase()
        return name.includes(normalizedAttireName) && item.id !== form.id
      })
      .slice(0, 6)
  }, [parentWrestler, normalizedAttireName, form.id, duplicateAttire])

  const parsedLinks = useMemo(() => parseDownloadLinks(form.download_url || ''), [form.download_url])

  if (!open) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.persisted ? 'Edit attire mod' : 'Add attire mod'}</h2>
          <p className="subtle-copy">Each attire stores its own creator, link, screenshots, DDS render, moveset JSON, and hype / DC profile JSON.</p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid">
                <label>
                  Attire name
                  <input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Black and Gold 2021"
                    autoComplete="off"
                  />
                </label>

                {normalizedAttireName ? (
                  <div className="live-check-row">
                    {duplicateAttire ? (
                      <div className="exists-banner">
                        <div className="exists-banner-mark">!</div>
                        <div className="exists-banner-copy">
                          <strong>This attire is already saved for this wrestler.</strong>
                          <span>
                            Existing entry: <b>{duplicateAttire.name}</b>. Edit the current one instead of creating a duplicate.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="live-ok-hint">No duplicate attire found for this wrestler.</div>
                    )}
                  </div>
                ) : null}

                {attireSuggestions.length ? (
                  <div className="autocomplete-box">
                    <div className="autocomplete-title">Existing attire names for this wrestler</div>
                    <div className="autocomplete-grid">
                      {attireSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="autocomplete-item autocomplete-item-rich"
                          onClick={() => updateField('name', item.name)}
                        >
                          <span className="autocomplete-main">{item.name}</span>
                          <span className="autocomplete-subtle">
                            {item.era || 'No era'} · {item.source_game || 'Unknown game'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="form-grid compact-grid">
                  <label>
                    Era / appearance date hint
                    <input
                      value={form.era}
                      onChange={(e) => updateField('era', e.target.value)}
                      placeholder="1997 WCW, March 2001, Ruthless Aggression"
                    />
                  </label>

                  <label>
                    Status
                    <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                      {ATTIRE_STATUSES.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
                    </select>
                  </label>
                </div>

                <div className="form-grid compact-grid">
                  <label>
                    Creator
                    <select value={form.creator_name} onChange={(e) => updateField('creator_name', e.target.value)}>
                      <option value="">Select a creator</option>
                      {creatorOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </label>

                  <label>
                    Add creator
                    <div className="inline-stack creator-inline-stack">
                      <input value={newCreatorName} onChange={(e) => setNewCreatorName(e.target.value)} placeholder="New creator name" />
                      <button type="button" className="secondary-button small-btn" onClick={onAddCreator} disabled={addingCreator || !newCreatorName.trim()}>
                        {addingCreator ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="form-grid compact-grid">
                  <label>
                    Source game
                    <select value={form.source_game} onChange={(e) => updateField('source_game', e.target.value)}>
                      {SOURCE_GAMES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>

                  <label>
                    Mod type
                    <select value={form.mod_type} onChange={(e) => updateField('mod_type', e.target.value)}>
                      {MOD_TYPES.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
                    </select>
                  </label>
                </div>

                <label>
                  Download links
                  <textarea
                    value={form.download_url}
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
                  Notes
                  <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
                </label>

                <JsonEditor
                  title="Moveset / animations JSON"
                  value={form.moveset_json_text}
                  onChange={(value) => updateField('moveset_json_text', value)}
                  onUpload={(file) => onUploadJson(file, 'moveset')}
                  filenameHint="moveset JSON"
                />

                <JsonEditor
                  title="Hype / DC profile JSON"
                  value={form.profile_json_text}
                  onChange={(value) => updateField('profile_json_text', value)}
                  onUpload={(file) => onUploadJson(file, 'profile')}
                  filenameHint="profile JSON"
                />
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-grid single-column-upload-grid">
                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>Attire screenshots</h5>
                    <p>Upload multiple screenshots for this attire.</p>
                  </div>

                  {form.images.length ? (
                    <div className="gallery-grid modal-gallery-grid">
                      {form.images.map((image) => (
                        <div className="gallery-tile" key={image.path || image.id}>
                          <img className="gallery-img" src={image.url} alt={image.name || 'Attire screenshot'} />
                          <button className="ghost-button small-btn gallery-remove" type="button" onClick={() => onRemoveAsset('image', image.path)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="upload-placeholder">No attire images uploaded</div>
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
                          onUpload(Array.from(e.target.files || []), 'image')
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>DDS render</h5>
                    <p>Character select render. The app tries to preview it, then falls back to a download link if the browser cannot decode DDS.</p>
                  </div>

                  <DdsPreview url={form.render_dds_url} name={form.render_dds_name} />

                  <div className="upload-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload DDS
                      <input type="file" accept=".dds" onChange={(e) => onUpload(e.target.files?.[0], 'render')} />
                    </label>
                    {form.render_dds_path ? <button className="ghost-button" type="button" onClick={() => onRemoveAsset('render', form.render_dds_path)}>Remove</button> : null}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">
            {duplicateAttire
              ? 'Use the existing attire entry instead of creating a duplicate.'
              : uploading
                ? 'Uploading asset…'
                : ''}
          </div>
          <button className="ghost-button" onClick={onClose} type="button">Cancel</button>
          <button
            className="primary-button"
            onClick={onSave}
            disabled={saving || uploading || !!duplicateAttire}
            type="button"
          >
            {saving ? 'Saving…' : 'Save attire'}
          </button>
        </div>
      </div>
    </div>
  )
}