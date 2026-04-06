import { useMemo, useState } from 'react'

function WemAudioList({ title, items = [], type, onUploadAudio, onRemoveAudio, uploading }) {
  const [failedIds, setFailedIds] = useState({})

  return (
    <div className="upload-card premium-upload-card">
      <div className="upload-card-header">
        <h5>{title}</h5>
        <p>Upload one or more .wem files. The app will try to play them in-browser when possible.</p>
      </div>

      {items.length ? (
        <div className="wrestler-audio-list">
          {items.map((item, index) => {
            const key = item.id || item.file_path || `${type}-${index}`
            const failed = failedIds[key]

            return (
              <div className="wrestler-audio-row" key={key}>
                <div className="wrestler-audio-main">
                  <div className="wrestler-audio-name">{item.file_name || 'Unnamed .wem file'}</div>

                  {!failed && item.file_url ? (
                    <audio
                      className="wrestler-audio-player"
                      controls
                      preload="none"
                      onError={() => setFailedIds((current) => ({ ...current, [key]: true }))}
                    >
                      <source src={item.file_url} />
                    </audio>
                  ) : (
                    <div className="muted-text small-text">
                      Browser playback is not available for this WEM file.
                    </div>
                  )}
                </div>

                <div className="wrestler-audio-actions">
                  {item.file_url ? (
                    <a
                      className="ghost-button small-btn"
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open / download
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="ghost-button small-btn"
                    onClick={() => onRemoveAudio(item)}
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="upload-placeholder">No files uploaded yet</div>
      )}

      <div className="upload-actions wrap-actions">
        <label className="secondary-button inline-file file-button">
          Upload .wem file(s)
          <input
            type="file"
            accept=".wem"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              onUploadAudio(files, type)
              e.target.value = ''
            }}
          />
        </label>
        {uploading ? <span className="muted-text small-text">Uploading…</span> : null}
      </div>
    </div>
  )
}

export default function WrestlerEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUploadHeadshot,
  onAutoMatchHeadshot,
  onRemoveHeadshot,
  onUploadAudio,
  onRemoveAudio,
  saving,
  uploading,
  wrestlers = []
}) {
  const normalizedName = (form.wrestler_name || '').trim().toLowerCase()

  const duplicateWrestler = useMemo(() => {
    if (!normalizedName) return null
    return (
      wrestlers.find(
        (item) =>
          (item.wrestler_name || '').trim().toLowerCase() === normalizedName &&
          item.id !== form.id
      ) || null
    )
  }, [wrestlers, normalizedName, form.id])

  const suggestions = useMemo(() => {
    if (!normalizedName || duplicateWrestler) return []
    return wrestlers
      .filter((item) => {
        const name = (item.wrestler_name || '').trim().toLowerCase()
        return name.includes(normalizedName) && item.id !== form.id
      })
      .slice(0, 6)
  }, [wrestlers, normalizedName, form.id, duplicateWrestler])

  const entranceMusicFiles = (form.audio_files || []).filter((item) => item.audio_type === 'entrance_music')
  const callnameFiles = (form.audio_files || []).filter((item) => item.audio_type === 'callname')

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit wrestler' : 'Add wrestler'}</h2>
          <p className="subtle-copy">
            Create a wrestler page, add notes and tags, upload or auto-match a headshot, and attach wrestler-level audio files.
          </p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid single-editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid compact-grid">
                <label className="span-2">
                  Wrestler name
                  <input
                    value={form.wrestler_name}
                    onChange={(e) => setForm((current) => ({ ...current, wrestler_name: e.target.value }))}
                    placeholder="Adam Cole"
                    autoComplete="off"
                  />
                </label>

                {normalizedName ? (
                  <div className="span-2 live-check-row">
                    {duplicateWrestler ? (
                      <div className="exists-banner">
                        <div className="exists-banner-mark">!</div>
                        <div className="exists-banner-copy">
                          <strong>This wrestler is already in the database.</strong>
                          <span>
                            Existing entry: <b>{duplicateWrestler.wrestler_name}</b>. You do not need to create another one.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="live-ok-hint">No duplicate wrestler found.</div>
                    )}
                  </div>
                ) : null}

                {suggestions.length ? (
                  <div className="span-2 autocomplete-box">
                    <div className="autocomplete-title">Possible matches</div>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="autocomplete-item"
                        onClick={() =>
                          setForm((current) => ({ ...current, wrestler_name: item.wrestler_name }))
                        }
                      >
                        {item.wrestler_name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <label>
                  Tags
                  <input
                    value={form.tags_text}
                    onChange={(e) => setForm((current) => ({ ...current, tags_text: e.target.value }))}
                    placeholder="Legend, WCW, 1997"
                  />
                </label>

                <label className="span-2">
                  Notes
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                  />
                </label>
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-grid single-column-upload-grid">
                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>Wrestler headshot</h5>
                    <p>Upload a headshot, or try a public auto-match. Press the button again to look for an alternative image.</p>
                  </div>

                  {form.headshot_url ? (
                    <img className="upload-preview portrait-preview spotlight-image" src={form.headshot_url} alt="Headshot" />
                  ) : (
                    <div className="upload-placeholder">No wrestler image saved</div>
                  )}

                  <div className="upload-actions wrap-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload headshot
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          onUploadHeadshot(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <button
                      className="ghost-button"
                      onClick={onAutoMatchHeadshot}
                      disabled={!form.wrestler_name.trim() || uploading}
                      type="button"
                    >
                      Try auto-match
                    </button>
                    {(form.headshot_path || form.headshot_external_url) ? (
                      <button className="ghost-button" onClick={onRemoveHeadshot} type="button" disabled={uploading}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>

                <WemAudioList
                  title="Entrance music (.wem)"
                  items={entranceMusicFiles}
                  type="entrance_music"
                  onUploadAudio={onUploadAudio}
                  onRemoveAudio={onRemoveAudio}
                  uploading={uploading}
                />

                <WemAudioList
                  title="Announce callnames (.wem)"
                  items={callnameFiles}
                  type="callname"
                  onUploadAudio={onUploadAudio}
                  onRemoveAudio={onRemoveAudio}
                  uploading={uploading}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">
            {duplicateWrestler
              ? 'Use the existing wrestler entry instead of creating a duplicate.'
              : uploading
                ? 'Uploading asset…'
                : ''}
          </div>
          <button className="ghost-button" onClick={onClose} type="button">Cancel</button>
          <button
            className="primary-button"
            onClick={onSave}
            disabled={saving || uploading || !!duplicateWrestler}
            type="button"
          >
            {saving ? 'Saving…' : 'Save wrestler'}
          </button>
        </div>
      </div>
    </div>
  )
}