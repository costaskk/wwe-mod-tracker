import { supabase } from '../lib/supabase'

export default function Header({
  onAddWrestler,
  onBrowseCollections,
  onBrowseArenas,
  onBrowseAdmin,
  onBrowseIssues,
  onGoHome,
  currentPage = 'mods',
  session,
  currentProfile,
  canContribute
}) {
  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  return (
    <header className="hero-card hero-card-improved">
      <div>
        <div className="eyebrow">Public community database</div>
        <h1>WWE 2K26 Mod Database</h1>
        <p className="hero-copy">
          Browse wrestler pages, compare attire and arena mods, build collections, track missing or dead links,
          and contribute after approval.
        </p>
      </div>

      <div className="hero-side-stack">
        <div className="micro-account-bar">
          <div className="page-nav-chips">
            <button
              type="button"
              className={`nav-chip ${currentPage === 'mods' ? 'active' : ''}`}
              onClick={onGoHome}
            >
              Mod list
            </button>

            <button
              type="button"
              className={`nav-chip ${currentPage === 'arenas' ? 'active' : ''}`}
              onClick={onBrowseArenas}
            >
              Arenas
            </button>

            <button
              type="button"
              className={`nav-chip ${currentPage === 'issues' ? 'active' : ''}`}
              onClick={onBrowseIssues}
            >
              Issues
            </button>

            {session ? (
              <button
                type="button"
                className={`nav-chip ${currentPage === 'collections' ? 'active' : ''}`}
                onClick={onBrowseCollections}
              >
                Collections
              </button>
            ) : null}

            {currentProfile?.role === 'admin' ? (
              <button
                type="button"
                className={`nav-chip ${currentPage === 'admin' ? 'active' : ''}`}
                onClick={onBrowseAdmin}
              >
                Admin
              </button>
            ) : null}
          </div>

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
                <button className="ghost-button small-btn" onClick={handleSignOut} type="button">
                  Sign out
                </button>
              </div>
            </details>
          ) : null}
        </div>

        <div className="hero-actions">
          {currentPage === 'mods' && (
            <button
              className="primary-button hero-primary"
              onClick={onAddWrestler}
              disabled={!canContribute}
              type="button"
            >
              Add wrestler
            </button>
          )}
        </div>
      </div>
    </header>
  )
}