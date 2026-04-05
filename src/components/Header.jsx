
import { supabase } from '../lib/supabase'

export default function Header({ onAddWrestler, session, onOpenCollectionManager, activeCollection }) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="hero-card hero-card-improved">
      <div>
        <div className="eyebrow">Public community database</div>
        <h1>WWE 2K25 Mod Database</h1>
        <p className="hero-copy">
          Browse wrestler pages, compare attire mods in database or gallery views, build personal collections,
          share public packs with others, and help surface missing or dead links.
        </p>
        {activeCollection ? <div className="hero-collection-pill">Viewing shared collection: <strong>{activeCollection.name}</strong></div> : null}
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
          <button className="secondary-button hero-secondary" onClick={onOpenCollectionManager} disabled={!session}>
            My collections
          </button>
          <button className="primary-button hero-primary" onClick={onAddWrestler} disabled={!session}>
            Add wrestler
          </button>
        </div>
      </div>
    </header>
  )
}
