import { Download, Plus, Upload } from 'lucide-react'

export default function Header({ onCreate, onExport, onImport }) {
  return (
    <div className="header-grid">
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Personal WWE mod archive</p>
          <h1>WWE 2K25 Mod Tracker</h1>
          <p className="muted intro-copy">
            Track wrestler mods, attire gaps, creators, download links, images, movesets, hype profiles,
            DC profiles, and missing targets you still want to port from older games.
          </p>
        </div>
        <div className="button-row wrap">
          <button className="button button-primary" onClick={onCreate}>
            <Plus size={18} /> Add mod
          </button>
          <button className="button button-secondary" onClick={onExport}>
            <Download size={18} /> Export database
          </button>
          <label className="button button-secondary file-button">
            <Upload size={18} /> Import database
            <input type="file" accept="application/json" onChange={onImport} hidden />
          </label>
        </div>
      </section>

      <section className="panel side-panel">
        <p className="eyebrow">Built for clarity</p>
        <h2>See what exists and what is missing</h2>
        <p className="muted">
          Use target attire counts, incomplete statuses, and search filters to spot roster gaps fast.
        </p>
      </section>
    </div>
  )
}
