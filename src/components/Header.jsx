
import { supabase } from '../lib/supabase'

export default function Header({ onAddWrestler, session }) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="hero-card hero-card-improved">
      <div>
        <div className="eyebrow">Public community database</div>
        <h1>WWE 2K25 Mod Database</h1>
        <p className="hero-copy">
          Browse wrestler pages, compare attire mods, upload previews and DDS renders, inspect JSON profiles,
          mark what is installed in your own game, and help surface missing or dead links.
        </p>
      </div>

      <div className="hero-side-stack">
        <div className="micro-account-bar">
          <span className="user-chip subtle-chip">
            {session ? 'Contributor mode' : 'Public browse mode'}
          </span>
          {session ? (
            <details className="account-menu">
              <summary>{session.user.email}</summary>
              <button className="ghost-button small-btn" onClick={handleSignOut}>Sign out</button>
            </details>
          ) : null}
        </div>

        <div className="hero-actions">
          <button className="primary-button hero-primary" onClick={onAddWrestler} disabled={!session}>
            Add wrestler
          </button>
        </div>
      </div>
    </header>
  )
}
