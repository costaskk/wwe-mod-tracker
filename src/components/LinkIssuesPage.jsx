import { useMemo } from 'react'
import {
  requestSummary,
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  getModTypeLabel,
  getOtherModSubtypeLabel
} from '../lib/utils'

function CategoryBadge({ modType, modSubtype }) {
  return (
    <div className="link-issue-category-row wrap-actions">
      <span className="pill subtle-pill">{getModTypeLabel(modType)}</span>
      {modType === 'other' && modSubtype ? (
        <span className="pill subtle-pill">{getOtherModSubtypeLabel(modSubtype)}</span>
      ) : null}
    </div>
  )
}

function ProviderList({ links = [] }) {
  if (!links.length) {
    return <span className="muted-text small-text">No link added yet.</span>
  }

  return (
    <div className="download-links-list">
      {links.map((link, index) => {
        const provider = getDownloadProvider(link)

        return (
          <a
            key={`${link}-${index}`}
            className={`download-link-chip provider-${provider}`}
            href={link}
            target="_blank"
            rel="noreferrer"
            title={link}
          >
            <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
            <span className="provider-label">{getDownloadProviderLabel(provider)}</span>
          </a>
        )
      })}
    </div>
  )
}

function IssueCard({ issue, canManageContent, canContribute }) {
  const canEdit = canManageContent?.(issue.ownerId) && issue.onEdit

  return (
    <article className="link-issue-card elevated-card">
      <div className="link-issue-main">
        <div className="link-issue-title-row">
          <strong>{issue.parentLabel}</strong>

          <span className={`pill ${issue.issueType === 'dead_link' ? 'danger-pill' : 'warning-pill'}`}>
            {issue.issueType === 'dead_link' ? 'Dead link' : 'Missing link'}
          </span>
        </div>

        <CategoryBadge modType={issue.modType} modSubtype={issue.modSubtype} />

        <h3>{issue.itemName}</h3>

        <div className="muted-text small-text">
          {issue.issueType === 'dead_link'
            ? `${issue.requestInfo.deadLinks} dead link report${issue.requestInfo.deadLinks === 1 ? '' : 's'}`
            : 'No working download link added yet'}
        </div>

        <ProviderList links={issue.links} />
      </div>

      <div className="link-issue-actions">
        {canContribute && issue.onFix ? (
          <button
            type="button"
            className="secondary-button small-btn"
            onClick={issue.onFix}
          >
            Fix
          </button>
        ) : null}

        {canContribute && issue.onRequestNote ? (
          <button
            type="button"
            className="ghost-button small-btn"
            onClick={issue.onRequestNote}
          >
            Add note
          </button>
        ) : null}

        {canEdit ? (
          <button
            type="button"
            className="ghost-button small-btn"
            onClick={issue.onEdit}
          >
            Edit
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default function LinkIssuesPage({
  wrestlers = [],
  arenas = [],
  titleBelts = [],
  otherMods = [],
  onResolveLink,
  onResolveArenaLink,
  onResolveTitleBeltLink,
  onResolveOtherModLink,
  onCreateRequest,
  onCreateArenaRequest,
  onCreateTitleBeltRequest,
  onCreateOtherModRequest,
  canManageContent,
  canContribute,
  onEditAttire,
  onEditArena,
  onEditTitleBelt,
  onEditOtherMod
}) {
  const issues = useMemo(() => {
    const attireIssues = wrestlers.flatMap((wrestler) =>
      (wrestler.attires || []).flatMap((attire) => {
        const requestInfo = requestSummary(wrestler.requests || [], 'attire_id', attire.id)
        const links = parseDownloadLinks(attire.download_url || '')
        const missing = links.length === 0
        const dead = requestInfo.deadLinks > 0

        if (!missing && !dead) return []

        const issueType = dead ? 'dead_link' : 'missing_link'

        return [{
          key: `attire-${attire.id}`,
          modType: 'attire',
          modSubtype: '',
          parentLabel: wrestler.wrestler_name || 'Unknown wrestler',
          item: attire,
          itemName: attire.name || 'Unknown attire',
          ownerId: attire.owner_id,
          sourceGame: attire.source_game || '',
          issueType,
          requestInfo,
          links,
          onEdit: onEditAttire
            ? () => onEditAttire(attire)
            : null,
          onFix: onResolveLink
            ? () => onResolveLink(wrestler, attire, issueType)
            : null,
          onRequestNote: onCreateRequest
            ? () =>
                onCreateRequest(
                  wrestler.id,
                  attire.id,
                  issueType,
                  wrestler.wrestler_name,
                  attire.name,
                  issueType === 'dead_link'
                    ? 'Please review the reported dead link(s).'
                    : 'Please add a working download link.'
                )
            : null
        }]
      })
    )

    const arenaIssues = arenas.flatMap((arena) => {
      const requestInfo = requestSummary(arena.requests || [], 'arena_id', arena.id)
      const links = parseDownloadLinks(arena.download_url || '')
      const missing = links.length === 0
      const dead = requestInfo.deadLinks > 0

      if (!missing && !dead) return []

      const issueType = dead ? 'dead_link' : 'missing_link'

      return [{
        key: `arena-${arena.id}`,
        modType: 'arena',
        modSubtype: '',
        parentLabel: arena.creator_name || 'Arena mod',
        itemName: arena.name || 'Unknown arena',
        ownerId: arena.owner_id,
        sourceGame: attire.source_game || '',
        issueType,
        requestInfo,
        links,
        onEdit: onEditArena
          ? () => onEditArena(arena)
          : null,
        onFix: onResolveArenaLink
          ? () => onResolveArenaLink(arena, issueType)
          : null,
        onRequestNote: onCreateArenaRequest
          ? () =>
              onCreateArenaRequest(
                arena,
                issueType,
                issueType === 'dead_link'
                  ? 'Please review the reported dead link(s).'
                  : 'Please add a working download link.'
              )
          : null
      }]
    })

    const titleIssues = titleBelts.flatMap((titleBelt) => {
      const requestInfo = requestSummary(titleBelt.requests || [], 'title_belt_id', titleBelt.id)
      const links = parseDownloadLinks(titleBelt.download_url || '')
      const missing = links.length === 0
      const dead = requestInfo.deadLinks > 0

      if (!missing && !dead) return []

      const issueType = dead ? 'dead_link' : 'missing_link'

      return [{
        key: `title-${titleBelt.id}`,
        modType: 'title',
        modSubtype: '',
        parentLabel: titleBelt.creator_name || 'Title belt mod',
        itemName: titleBelt.name || 'Unknown title belt',
        ownerId: titleBelt.owner_id,
        sourceGame: attire.source_game || '',
        issueType,
        requestInfo,
        links,
        onEdit: onEditTitleBelt
          ? () => onEditTitleBelt(titleBelt)
          : null,
        onFix: onResolveTitleBeltLink
          ? () => onResolveTitleBeltLink(titleBelt, issueType)
          : null,
        onRequestNote: onCreateTitleBeltRequest
          ? () =>
              onCreateTitleBeltRequest(
                titleBelt,
                issueType,
                issueType === 'dead_link'
                  ? 'Please review the reported dead link(s).'
                  : 'Please add a working download link.'
              )
          : null
      }]
    })

    const otherModIssues = otherMods.flatMap((otherMod) => {
      const requestInfo = requestSummary(otherMod.requests || [], 'other_mod_id', otherMod.id)
      const links = parseDownloadLinks(otherMod.download_url || '')
      const missing = links.length === 0
      const dead = requestInfo.deadLinks > 0

      if (!missing && !dead) return []

      const issueType = dead ? 'dead_link' : 'missing_link'

      return [{
        key: `other-${otherMod.id}`,
        modType: 'other',
        modSubtype: otherMod.subtype || '',
        parentLabel: otherMod.creator_name || 'Other mod',
        itemName: otherMod.name || 'Unknown mod',
        ownerId: otherMod.owner_id,
        sourceGame: attire.source_game || '',
        issueType,
        requestInfo,
        links,
        onEdit: onEditOtherMod
          ? () => onEditOtherMod(otherMod)
          : null,
        onFix: onResolveOtherModLink
          ? () => onResolveOtherModLink(otherMod, issueType)
          : null,
        onRequestNote: onCreateOtherModRequest
          ? () =>
              onCreateOtherModRequest(
                otherMod,
                issueType,
                issueType === 'dead_link'
                  ? 'Please review the reported dead link(s).'
                  : 'Please add a working download link.'
              )
          : null
      }]
    })

    return [...attireIssues, ...arenaIssues, ...titleIssues, ...otherModIssues].sort((a, b) => {
      if (a.issueType !== b.issueType) {
        return a.issueType === 'dead_link' ? -1 : 1
      }
      return a.itemName.localeCompare(b.itemName)
    })
  }, [
    wrestlers,
    arenas,
    titleBelts,
    otherMods,
    onResolveLink,
    onResolveArenaLink,
    onResolveTitleBeltLink,
    onResolveOtherModLink,
    onCreateRequest,
    onCreateArenaRequest,
    onCreateTitleBeltRequest,
    onCreateOtherModRequest,
    onEditAttire,
    onEditArena,
    onEditTitleBelt,
    onEditOtherMod
  ])

  const deadCount = issues.filter((item) => item.issueType === 'dead_link').length
  const missingCount = issues.filter((item) => item.issueType === 'missing_link').length

  return (
    <section className="panel soft-panel">
      <div className="panel-header with-actions">
        <div>
          <div className="eyebrow">Maintenance</div>
          <h2>Link Issues</h2>
          <p className="subtle-copy">
            Browse missing and dead links across attires, arenas, title belts, and other mods.
          </p>
        </div>

        <div className="wrap-actions">
          <span className="pill subtle-pill">{issues.length} total</span>
          <span className="pill danger-pill">{deadCount} dead</span>
          <span className="pill warning-pill">{missingCount} missing</span>
          {!canContribute ? (
            <span className="pill subtle-pill">View only</span>
          ) : null}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div>
            <strong>No issues found</strong>
            <div className="muted-text small-text" style={{ marginTop: '8px' }}>
              Everything currently looks good.
            </div>
          </div>
        </div>
      ) : (
        <div className="link-issues-list">
          {issues.map((issue) => (
            <IssueCard
              key={issue.key}
              issue={issue}
              canManageContent={canManageContent}
              canContribute={canContribute}
            />
          ))}
        </div>
      )}
    </section>
  )
}