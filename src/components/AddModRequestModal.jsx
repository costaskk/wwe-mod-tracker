import { useEffect, useMemo, useState } from 'react'
import {
  OTHER_MOD_SUBTYPES,
  SOURCE_GAMES,
  getOtherModSubtypeLabel,
  getModTypeLabel
} from '../lib/utils'

const MOD_TYPE_OPTIONS = [
  { value: 'attire', label: 'Attire' },
  { value: 'arena', label: 'Arena' },
  { value: 'title', label: 'Title belt' },
  { value: 'other', label: 'Other mod' }
]

function emptyForm() {
  return {
    modType: 'attire',
    subtype: '',
    wrestlerName: '',
    itemName: '',
    creatorName: '',
    creatorUrl: '',
    referenceUrl: '',
    screenshotUrlsText: '',
    sourceGame: 'WWE 2K25',
    notes: ''
  }
}

function normalizeUrl(value = '') {
  const clean = String(value || '').trim()
  if (!clean) return ''
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
}

function parseScreenshotUrls(value = '') {
  return [...new Set(
    String(value || '')
      .split(/\r?\n|,/)
      .map((item) => normalizeUrl(item))
      .filter(Boolean)
  )]
}

export default function AddModRequestModal({
  open,
  onClose,
  onSubmit,
  submitting
}) {
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (!open) {
      setForm(emptyForm())
    }
  }, [open])

  const titleLabel = useMemo(() => getModTypeLabel(form.modType), [form.modType])

  const screenshotUrls = useMemo(
    () => parseScreenshotUrls(form.screenshotUrlsText),
    [form.screenshotUrlsText]
  )

  if (!open) return null

  const submitDisabled =
    submitting ||
    !form.itemName.trim() ||
    (form.modType === 'attire' && !form.wrestlerName.trim()) ||
    (form.modType === 'other' && !form.subtype)

  return (
    <div className="modal-backdrop modal-backdrop-front" onClick={onClose}>
      <div
        className="panel modal-card large-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Request a new mod</h2>
          <p className="subtle-copy">
            Submit a detailed request for a new attire, arena, title belt, or other mod.
            Add creator info, reference links, and screenshot URLs so staff can turn it directly into a real mod entry.
          </p>
        </div>

        <div className="modal-scroll">
          <div className="form-grid">
            <div className="compact-grid">
              <label>
                Mod type
                <select
                  value={form.modType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      modType: event.target.value,
                      subtype: event.target.value === 'other' ? current.subtype : ''
                    }))
                  }
                >
                  {MOD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Target game
                <select
                  value={form.sourceGame}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sourceGame: event.target.value }))
                  }
                >
                  {SOURCE_GAMES.filter((game) => game !== 'Other').map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {form.modType === 'other' ? (
              <label>
                Subtype
                <select
                  value={form.subtype}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subtype: event.target.value }))
                  }
                >
                  <option value="">Select a subtype</option>
                  {OTHER_MOD_SUBTYPES.map((subtype) => (
                    <option key={subtype} value={subtype}>
                      {getOtherModSubtypeLabel(subtype)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {form.modType === 'attire' ? (
              <label>
                Wrestler name
                <input
                  value={form.wrestlerName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, wrestlerName: event.target.value }))
                  }
                  placeholder="The Rock"
                />
              </label>
            ) : null}

            <label>
              {titleLabel} name
              <input
                value={form.itemName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, itemName: event.target.value }))
                }
                placeholder={
                  form.modType === 'attire'
                    ? 'Attitude Era 1999'
                    : form.modType === 'arena'
                      ? 'Raw Is War Arena'
                      : form.modType === 'title'
                        ? 'Big Gold World Heavyweight Championship'
                        : 'Referee Pack'
                }
              />
            </label>

            <div className="compact-grid">
              <label>
                Preferred creator
                <input
                  value={form.creatorName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, creatorName: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Creator link
                <input
                  type="url"
                  value={form.creatorUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, creatorUrl: event.target.value }))
                  }
                  placeholder="https://patreon.com/... or creator profile link"
                />
              </label>
            </div>

            <label>
              Reference link
              <input
                type="url"
                value={form.referenceUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, referenceUrl: event.target.value }))
                }
                placeholder="https://example.com/reference-page"
              />
            </label>

            <label>
              Screenshot URLs
              <textarea
                value={form.screenshotUrlsText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, screenshotUrlsText: event.target.value }))
                }
                placeholder={'Paste one image URL per line or separate them with commas.\nhttps://...\nhttps://...'}
              />
            </label>

            {screenshotUrls.length ? (
              <div className="live-ok-hint">
                {screenshotUrls.length} screenshot URL{screenshotUrls.length === 1 ? '' : 's'} ready to submit.
              </div>
            ) : null}

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Describe what should be added, era details, creator notes, compatibility info, or anything staff should know."
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="ghost-button"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() =>
              onSubmit({
                modType: form.modType,
                subtype: form.modType === 'other' ? form.subtype : '',
                wrestlerName: form.modType === 'attire' ? form.wrestlerName.trim() : '',
                itemName: form.itemName.trim(),
                creatorName: form.creatorName.trim(),
                creatorUrl: normalizeUrl(form.creatorUrl),
                referenceUrl: normalizeUrl(form.referenceUrl),
                screenshotUrls,
                sourceGame: form.sourceGame,
                notes: form.notes.trim()
              })
            }
            disabled={submitDisabled}
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  )
}