import { useEffect, useMemo, useState } from 'react'
import {
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  getOtherModSubtypeLabel,
  getSubtypeIcon,
  findDuplicateOtherMod,
  SOURCE_GAMES,
  OTHER_MOD_SUBTYPES,
  testDownloadLink
} from '../lib/utils'


function normalizeLinkForCheck(link) {
  const value = String(link || '').trim()
  if (!value) return ''

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

export default function OtherModEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUpload,
  onRemoveAsset,
  creatorOptions = [],
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator,
  saving,
  uploading,
  otherMods = []
}) {

  const normalizedName = (form.name || '').trim().toLowerCase()

  const duplicateMod = useMemo(() => {
    if (!normalizedName) return null
    const found = findDuplicateOtherMod(otherMods, form.name)
    if (!found) return null
    if (form.persisted && found.id === form.id) return null
    return found
  }, [otherMods, form.name, form.id, form.persisted, normalizedName])

  const parsedLinks = useMemo(
    () => [...new Set(parseDownloadLinks(form.download_url || ''))],
    [form.download_url]
  )

  const [linkCheckResults, setLinkCheckResults] = useState({})
  const [isCheckingLinks, setIsCheckingLinks] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!parsedLinks.length) {
      setLinkCheckResults({})
      setIsCheckingLinks(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingLinks(true)

      try {
        const results = await Promise.all(
          parsedLinks.map(async (link) => {
            try {
              const result = await testDownloadLink(normalizeLinkForCheck(link))
              return [link, result]
            } catch (error) {
              return [
                link,
                {
                  status: 'error',
                  ok: false,
                  message: error?.message || 'Could not test this link.'
                }
              ]
            }
          })
        )

        if (!cancelled) {
          setLinkCheckResults(Object.fromEntries(results))
        }
      } finally {
        if (!cancelled) {
          setIsCheckingLinks(false)
        }
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [parsedLinks])

  if (!open) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.persisted ? 'Edit other mod' : 'Add other mod'}</h2>
          <p className="subtle-copy">
            Other mods can include screenshots, download links, an optional creator,
            a subtype, notes, and JSON installation profiles.
          </p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid">
                <label>
                  Mod name
                  <input
                    value={form.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Crowd overhaul, referee pack, camera mod..."
                    autoComplete="off"
                  />
                </label>

                {normalizedName ? (
                  <div className="live-check-row">
                    {duplicateMod ? (
                      <div className="exists-banner">
                        <div className="exists-banner-mark">!</div>
                        <div className="exists-banner-copy">
                          <strong>This mod already exists.</strong>
                          <span>
                            Existing entry: <b>{duplicateMod.name}</b>. Edit the current one
                            instead of creating a duplicate.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="live-ok-hint">No duplicate other mod found.</div>
                    )}
                  </div>
                ) : null}

                <div className="form-grid compact-grid">
                  <label>
                    Subcategory
                    <select
                      value={form.subtype || ''}
                      onChange={(e) => updateField('subtype', e.target.value)}
                    >
                      <option value="">Select a subtype</option>
                      {OTHER_MOD_SUBTYPES.map((item) => (
                        <option key={item} value={item}>
                          {getSubtypeIcon(item)} {getOtherModSubtypeLabel(item)}
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
                  Creator
                  <select
                    value={form.creator_name || ''}
                    onChange={(e) => updateField('creator_name', e.target.value)}
                  >
                    <option value="">No creator / unknown</option>
                    {[...(creatorOptions || [])]
                      .filter((item) => item && item.name)
                      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
                      .map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

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
                        const created = await onAddCreator?.()
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
                
                {isCheckingLinks ? (
                  <div className="live-ok-hint">Checking download links…</div>
                ) : null}

                {parsedLinks.length ? (
                  <div className="link-health-list">
                    {parsedLinks.map((link, index) => {
                      const result = linkCheckResults[link]
                      const provider = getDownloadProvider(link)

                      return (
                        <div className="link-health-row" key={`${link}-${index}`}>
                          <div className={`provider-chip provider-${provider}`}>
                            <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
                            <span className="provider-label">{getDownloadProviderLabel(provider)}</span>
                          </div>

                          <div
                            className={`link-health-pill ${
                              result?.ok
                                ? 'link-health-ok'
                                : result?.status === 'dead'
                                  ? 'link-health-dead'
                                  : result?.status === 'error'
                                    ? 'link-health-error'
                                    : 'link-health-pending'
                            }`}
                          >
                            {result?.ok
                              ? 'Link looks good'
                              : result?.status === 'dead'
                                ? 'Link looks dead'
                                : result?.status === 'error'
                                  ? 'Could not verify'
                                  : 'Waiting to test'}
                          </div>
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
                    placeholder="Add compatibility notes, install notes, special instructions, etc."
                  />
                </label>

                <label>
                  JSON profile / install config
                  <textarea
                    value={form.profile_json_text || ''}
                    onChange={(e) => updateField('profile_json_text', e.target.value)}
                    placeholder={'{\n  "install_path": "",\n  "files": []\n}'}
                    className="code-textarea"
                  />
                </label>
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-grid single-column-upload-grid">
                <div className="upload-card premium-upload-card">
                  <div className="upload-card-header">
                    <h5>Mod screenshots</h5>
                    <p>Upload multiple screenshots for this other mod entry.</p>
                  </div>

                  {(form.images || []).length ? (
                    <div className="gallery-grid modal-gallery-grid">
                      {(form.images || []).map((image) => (
                        <div className="gallery-tile" key={image.path || image.id || image.url}>
                          <img
                            className="gallery-img"
                            src={image.url || image.image_url}
                            alt={image.name || 'Mod screenshot'}
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
                    <div className="upload-placeholder">No screenshots uploaded</div>
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
            {duplicateMod
              ? 'Use the existing other mod entry instead of creating a duplicate.'
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
            disabled={saving || uploading || !!duplicateMod}
            type="button"
          >
            {saving ? 'Saving…' : 'Save mod'}
          </button>
        </div>
      </div>
    </div>
  )
}