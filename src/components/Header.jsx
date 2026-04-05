import { supabase } from '../lib/supabase'

export default function Header({
  onAddWrestler,
  onBrowseCollections,
  onBrowseAdmin,
  session,
  currentProfile,
  canContribute
}) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="hero-card hero-card-improved">
      <div>
        <div className="eyebrow">Public community database</div>
        <h1>WWE 2K25 Mod Database</h1>
        <p className="hero-copy">
          Browse wrestler pages, compare attire mods, build collections, track missing or dead links,
          and contribute only after approval.
        </p>
      </div>

      <div className="hero-side-stack">
        <div className="micro-account-bar">
          <span className="user-chip subtle-chip">
            {session ? `${currentProfile?.role || 'user'} mode` : 'Public browse mode'}
          </span>

          {session ? (
            <details className="account-menu">
              <summary>{session.user.email}</summary>
              <div className="account-menu-inner">
                <div className="muted-text small-text">
                  Status: {currentProfile?.approval_status || 'pending'}
                </div>
                <button className="ghost-button small-btn" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </details>
          ) : null}
        </div>

        <div className="hero-actions">
          {session ? (
            <button className="secondary-button hero-secondary" onClick={onBrowseCollections}>
              My collections
            </button>
          ) : null}

          {currentProfile?.role === 'admin' ? (
            <button className="secondary-button hero-secondary" onClick={onBrowseAdmin}>
              Admin
            </button>
          ) : null}

          <button className="primary-button hero-primary" onClick={onAddWrestler} disabled={!canContribute}>
            Add wrestler
          </button>
        </div>
      </div>
    </header>
  )
}