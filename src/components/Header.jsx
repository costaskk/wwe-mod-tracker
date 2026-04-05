export default function Header({ user, onOpenCreate, onSignOut, onRefresh }) {
  return (
    <header className="hero-card">
      <div>
        <div className="eyebrow">PRIVATE MOD ARCHIVE</div>
        <h1>WWE 2K25 Character Mod Database</h1>
        <p className="muted hero-text">
          Built for tracking what already exists, what attire slots are still missing, and which ports still need to be made from older WWE games.
        </p>
      </div>

      <div className="hero-actions">
        <div className="user-chip">{user?.email}</div>
        <button className="secondary-button" onClick={onRefresh}>Refresh</button>
        <button className="primary-button" onClick={onOpenCreate}>Add wrestler</button>
        <button className="ghost-button" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}
