import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Header({
  onAddWrestler = () => {},
  onAddArena = () => {},
  onAddTitle = () => {},
  onAddOtherMod = () => {},
  onBrowseCollections = () => {},
  onBrowseArenas = () => {},
  onBrowseTitles = () => {},
  onBrowseOtherMods = () => {},
  onBrowseAdmin = () => {},
  onBrowseIssues = () => {},
  onBrowseWrestlers = () => {},
  onGoHome = () => {},
  currentPage = 'all_mods',
  session,
  currentProfile,
  canContribute,
  issueCount = 0
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef(null)

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (!addMenuRef.current) return
      if (!addMenuRef.current.contains(event.target)) {
        setAddMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setAddMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const roleLabel = session ? `${currentProfile?.role || 'user'} mode` : 'Public browse mode'
  const approvalLabel = currentProfile?.approval_status || 'pending'
  const isAdmin = currentProfile?.role === 'admin'

  const showAllModsAction = currentPage === 'all_mods'
  const showCharactersAction = currentPage === 'mods'
  const showArenaAction = currentPage === 'arenas'
  const showTitleAction = currentPage === 'titles'
  const showOtherModAction = currentPage === 'other_mods'

  function handleAddOption(action) {
    setAddMenuOpen(false)
    action?.()
  }

  return (
    <header className="hero-card hero-card-improved">
      <div>
        <div className="eyebrow">Public community database</div>
        <h1>WWE 2K26 Mod Database</h1>
        <p className="hero-copy">
          Browse wrestler pages, compare attire, arena, title belt, and other mods, build collections,
          track missing or dead links, and contribute after approval.
        </p>
      </div>

      <div className="hero-side-stack">
        <div className="micro-account-bar">
          <div className="page-nav-chips">
            <button
              type="button"
              className={`nav-chip ${currentPage === 'all_mods' ? 'active' : ''}`}
              onClick={onGoHome}
            >
              All Mods
            </button>

            <button
              type="button"
              className={`nav-chip ${currentPage === 'mods' ? 'active' : ''}`}
              onClick={onBrowseWrestlers}
            >
              Characters
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
              className={`nav-chip ${currentPage === 'titles' ? 'active' : ''}`}
              onClick={onBrowseTitles}
            >
              Titles
            </button>

            <button
              type="button"
              className={`nav-chip ${currentPage === 'other_mods' ? 'active' : ''}`}
              onClick={onBrowseOtherMods}
            >
              Other Mods
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

            <button
              type="button"
              className={`nav-chip has-badge ${currentPage === 'issues' ? 'active' : ''}`}
              onClick={onBrowseIssues}
            >
              Issues
              {issuesCount > 0 ? (
                <span className="nav-chip-badge">
                  {issuesCount > 99 ? '99+' : issuesCount}
                </span>
              ) : null}
            </button>

            {isAdmin ? (
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
            {roleLabel}
          </span>

          {session ? (
            <details className="account-menu">
              <summary>{session.user.email}</summary>

              <div className="account-menu-inner">
                <div className="muted-text small-text">
                  Status: {approvalLabel}
                </div>

                <button
                  className="ghost-button small-btn"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </details>
          ) : null}
        </div>

        <div className="hero-actions">
          {showAllModsAction ? (
            <div className="header-addmod-dropdown" ref={addMenuRef}>
              <button
                className="primary-button hero-primary"
                onClick={() => setAddMenuOpen((current) => !current)}
                disabled={!canContribute}
                type="button"
              >
                Add Mod
              </button>

              {addMenuOpen ? (
                <div className="header-addmod-menu">
                  <button
                    type="button"
                    className="header-addmod-item"
                    onClick={() => handleAddOption(onAddWrestler)}
                  >
                    Add Wrestler
                  </button>

                  <button
                    type="button"
                    className="header-addmod-item"
                    onClick={() => handleAddOption(onAddArena)}
                  >
                    Add Arena
                  </button>

                  <button
                    type="button"
                    className="header-addmod-item"
                    onClick={() => handleAddOption(onAddTitle)}
                  >
                    Add Title
                  </button>

                  <button
                    type="button"
                    className="header-addmod-item"
                    onClick={() => handleAddOption(onAddOtherMod)}
                  >
                    Add Other Mod
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {showCharactersAction ? (
            <button
              className="primary-button hero-primary"
              onClick={onAddWrestler}
              disabled={!canContribute}
              type="button"
            >
              Add wrestler
            </button>
          ) : null}

          {showArenaAction ? (
            <button
              className="primary-button hero-primary"
              onClick={onAddArena}
              disabled={!canContribute}
              type="button"
            >
              Add arena
            </button>
          ) : null}

          {showTitleAction ? (
            <button
              className="primary-button hero-primary"
              onClick={onAddTitle}
              disabled={!canContribute}
              type="button"
            >
              Add title belt
            </button>
          ) : null}

          {showOtherModAction ? (
            <button
              className="primary-button hero-primary"
              onClick={onAddOtherMod}
              disabled={!canContribute}
              type="button"
            >
              Add other mod
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}