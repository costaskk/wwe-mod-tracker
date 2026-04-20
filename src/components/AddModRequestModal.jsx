import { useEffect, useMemo, useState } from 'react'
import { OTHER_MOD_SUBTYPES, SOURCE_GAMES, getOtherModSubtypeLabel, getModTypeLabel } from '../lib/utils'

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
    sourceGame: 'WWE 2K25',
    notes: ''
  }
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

  if (!open) return null

  return (
    <div className="modal-backdrop modal-backdrop-front" onClick={onClose}>
      <div className="panel modal-card large-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Request a new mod</h2>
          <p className="subtle-copy">Submit a request for a new attire, arena, title belt, or other mod. No download links are required.</p>
        </div>

        <div className="modal-scroll">
          <div className="form-grid">
            <label>
              Mod type
              <select value={form.modType} onChange={(event) => setForm((current) => ({ ...current, modType: event.target.value, subtype: event.target.value === 'other' ? current.subtype : '' }))}>
                {MOD_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {form.modType === 'other' ? (
              <label>
                Subtype
                <select value={form.subtype} onChange={(event) => setForm((current) => ({ ...current, subtype: event.target.value }))}>
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
                  onChange={(event) => setForm((current) => ({ ...current, wrestlerName: event.target.value }))}
                  placeholder="The Rock"
                />
              </label>
            ) : null}

            <label>
              {titleLabel} name
              <input
                value={form.itemName}
                onChange={(event) => setForm((current) => ({ ...current, itemName: event.target.value }))}
                placeholder={form.modType === 'attire' ? 'Attitude Era 1999' : form.modType === 'arena' ? 'Raw Is War Arena' : form.modType === 'title' ? 'Big Gold World Heavyweight Championship' : 'Referee Pack'}
              />
            </label>

            <label>
              Preferred creator
              <input
                value={form.creatorName}
                onChange={(event) => setForm((current) => ({ ...current, creatorName: event.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label>
              Target game
              <select value={form.sourceGame} onChange={(event) => setForm((current) => ({ ...current, sourceGame: event.target.value }))}>
                {SOURCE_GAMES.filter((game) => game !== 'Other').map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Describe what should be added, any references, era details, or special requests."
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="ghost-button" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => onSubmit({
              modType: form.modType,
              subtype: form.modType === 'other' ? form.subtype : '',
              wrestlerName: form.modType === 'attire' ? form.wrestlerName.trim() : '',
              itemName: form.itemName.trim(),
              creatorName: form.creatorName.trim(),
              sourceGame: form.sourceGame,
              notes: form.notes.trim()
            })}
            disabled={submitting || !form.itemName.trim() || (form.modType === 'attire' && !form.wrestlerName.trim()) || (form.modType === 'other' && !form.subtype)}
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  )
}
