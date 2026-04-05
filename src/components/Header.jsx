export default function Header({ user, onOpenCreate, onSignOut, onRefresh }) {
  return (
    <header className="hero-card">
      <div>
        <div className="eyebrow">YOUR PRIVATE MOD DATABASE</div>
        <h1>WWE 2K25 Character Mod Tracker</h1>
        <p className="muted hero-text">
          Track every wrestler, every attire, every creator, every JSON profile, and every missing target you still need to port.
        </p>
      </div>

      <div className="hero-actions">
        <div className="user-chip">{user?.email}</div>
        <button className="secondary-button" onClick={onRefresh}>Refresh</button>
        <button className="primary-button" onClick={onOpenCreate}>Add mod</button>
        <button className="ghost-button" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}
