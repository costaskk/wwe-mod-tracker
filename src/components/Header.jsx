export default function Header({ onAddWrestler, session }) {
  return (
    <header className="hero-card">
      <div>
        <div className="eyebrow">Public community database</div>
        <h1>WWE 2K25 Mod Database</h1>
        <p className="hero-copy">
          Browse wrestler pages, compare attire mods, upload previews and DDS renders, mark what is installed in your own game,
          and post requests when a link is missing or dead.
        </p>
      </div>

      <div className="hero-actions">
        <div className="user-chip">{session ? 'Contributor mode' : 'Public browse mode'}</div>
        <button className="primary-button" onClick={onAddWrestler} disabled={!session}>
          Add wrestler
        </button>
      </div>
    </header>
  )
}
