export default function CollectionModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUploadCover,
  onRemoveCover,
  saving,
  uploading
}) {
  if (!open) return null

  const busy = saving || uploading
  const shareUrl = form.slug
    ? `${window.location.origin}/?page=collections&collection=${encodeURIComponent(form.slug)}`
    : 'A unique public share link will be generated automatically when you save.'

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.persisted ? 'Edit collection' : 'Create collection'}</h2>
          <p className="subtle-copy">
            Build a personal mod pack, add a cover image, and choose whether it stays private or can be shared publicly.
          </p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid single-editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid compact-grid">
                <label>
                  Collection name
                  <input
                    value={form.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="My Attitude Era Pack"
                    disabled={busy}
                  />
                </label>

                <label>
                  Share link
                  <input
                    value={shareUrl}
                    readOnly
                    disabled
                  />
                </label>

                <label className="span-2">
                  Description
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe what this collection is for, what kind of mods it includes, or any notes you want to remember."
                    disabled={busy}
                  />
                </label>

                <label>
                  Visibility
                  <select
                    value={form.visibility || 'public'}
                    onChange={(e) => updateField('visibility', e.target.value)}
                    disabled={busy}
                  >
                    <option value="public">Public / shareable</option>
                    <option value="private">Private / profile only</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-card premium-upload-card">
                <div className="upload-card-header">
                  <h5>Collection cover</h5>
                  <p>Optional banner image for your profile and public collection page.</p>
                </div>

                {form.cover_url ? (
                  <img
                    className="upload-preview cover-preview spotlight-image"
                    src={form.cover_url}
                    alt={form.name || 'Collection cover'}
                  />
                ) : (
                  <div className="upload-placeholder">
                    No cover uploaded
                  </div>
                )}

                <div className="upload-actions wrap-actions">
                  <label className="secondary-button inline-file file-button">
                    Upload cover
                    <input
                      type="file"
                      accept="image/*"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onUploadCover(file)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>

                  {(form.cover_path || form.cover_url) ? (
                    <button
                      className="ghost-button"
                      onClick={onRemoveCover}
                      type="button"
                      disabled={busy}
                    >
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
            {uploading ? 'Uploading cover…' : saving ? 'Saving collection…' : ''}
          </div>

          <button
            className="ghost-button"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={onSave}
            disabled={busy || !String(form.name || '').trim()}
            type="button"
          >
            {saving ? 'Saving…' : 'Save collection'}
          </button>
        </div>
      </div>
    </div>
  )
}