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
          mark what is installed in your own game, and post requests when a link is missing or dead.
        </p>
      </div>

      <div className="hero-side-stack">
        <div className="session-mini-bar">
          <div className="user-chip subtle-chip">{session ? 'Contributor mode' : 'Public browse mode'}</div>
          {session ? (
            <>
              <div className="account-mini">{session.user.email}</div>
              <button className="ghost-button small-btn" onClick={handleSignOut}>Sign out</button>
            </>
          ) : null}
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onAddWrestler} disabled={!session}>
            Add wrestler
          </button>
        </div>
      </div>
    </header>
  )
}
