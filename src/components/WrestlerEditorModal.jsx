import { useMemo } from 'react'

export default function WrestlerEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUploadHeadshot,
  onAutoMatchHeadshot,
  onRemoveHeadshot,
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
    if (!normalizedName) return []
    return wrestlers
      .filter((item) => {
        const name = (item.wrestler_name || '').trim().toLowerCase()
        return name.includes(normalizedName) && item.id !== form.id
      })
      .slice(0, 6)
  }, [wrestlers, normalizedName, form.id])

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit wrestler' : 'Add wrestler'}</h2>
          <p className="subtle-copy">Create a wrestler page, add notes and tags, and upload or auto-match a headshot.</p>
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
                      <div className="duplicate-hint">
                        Wrestler already exists: <strong>{duplicateWrestler.wrestler_name}</strong>
                      </div>
                    ) : (
                      <div className="live-ok-hint">No duplicate wrestler found.</div>
                    )}
                  </div>
                ) : null}

                {suggestions.length ? (
                  <div className="span-2 autocomplete-box">
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
                    <input type="file" accept="image/*" onChange={(e) => onUploadHeadshot(e.target.files?.[0])} />
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
                    <button className="ghost-button" onClick={onRemoveHeadshot} type="button">
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">
            {duplicateWrestler
              ? 'This wrestler already exists.'
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