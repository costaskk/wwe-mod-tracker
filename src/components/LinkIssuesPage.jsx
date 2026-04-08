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
    <div className="link-issue-category-row">
      <span className="pill subtle-pill">{getModTypeLabel(modType)}</span>
      {modType === 'other' && modSubtype ? (
        <span className="pill subtle-pill">{getOtherModSubtypeLabel(modSubtype)}</span>
      ) : null}
    </div>
  )
}

export default function LinkIssuesPage({
  wrestlers = [],
  arenas = [],
  titleBelts = [],
  otherMods = [],
  onResolveLink,
  onResolveArenaLink,
  onCreateRequest,
  onCreateArenaRequest,
  canManageContent,
  onEditAttire,
  onEditArena,
  onEditTitleBelt,
  onEditOtherMod
}) {
  const attireIssues = wrestlers.flatMap((wrestler) =>
    (wrestler.attires || []).flatMap((attire) => {
      const requestInfo = requestSummary(wrestler.requests || [], 'attire_id', attire.id)
      const links = parseDownloadLinks(attire.download_url || '')
      const missing = links.length === 0
      const dead = requestInfo.deadLinks > 0

      if (!missing && !dead) return []

      return [
        {
          key: `attire-${attire.id}`,
          modType: 'attire',
          modSubtype: '',
          parentLabel: wrestler.wrestler_name,
          item: attire,
          ownerId: attire.owner_id,
          issueType: dead ? 'dead_link' : 'missing_link',
          requestInfo,
          links,
          onEdit: onEditAttire
            ? () => onEditAttire(attire)
            : null,
          onFix: () => onResolveLink(wrestler, attire, dead ? 'dead_link' : 'missing_link'),
          onRequestNote: () =>
            onCreateRequest(
              wrestler.id,
              attire.id,
              dead ? 'dead_link' : 'missing_link',
              wrestler.wrestler_name,
              attire.name,
              dead
                ? 'Please review the reported dead link(s).'
                : 'Please add a working download link.'
            )
        }
      ]
    })
  )

  const arenaIssues = arenas.flatMap((arena) => {
    const requestInfo = requestSummary(arena.requests || [], 'arena_id', arena.id)
    const links = parseDownloadLinks(arena.download_url || '')
    const missing = links.length === 0
    const dead = requestInfo.deadLinks > 0

    if (!missing && !dead) return []

    const issueType = dead ? 'dead_link' : 'missing_link'

    return [
      {
        key: `arena-${arena.id}`,
        modType: 'arena',
        modSubtype: '',
        parentLabel: arena.creator_name || 'Arena mod',
        item: arena,
        ownerId: arena.owner_id,
        issueType,
        requestInfo,
        links,
        onEdit: onEditArena ? () => onEditArena(arena) : null,
        onFix: onResolveArenaLink ? () => onResolveArenaLink(arena, issueType) : null,
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
      }
    ]
  })

  const titleIssues = titleBelts.flatMap((titleBelt) => {
    const requestInfo = requestSummary(titleBelt.requests || [], 'title_belt_id', titleBelt.id)
    const links = parseDownloadLinks(titleBelt.download_url || '')
    const missing = links.length === 0
    const dead = requestInfo.deadLinks > 0

    if (!missing && !dead) return []

    return [
      {
        key: `title-${titleBelt.id}`,
        modType: 'title',
        modSubtype: '',
        parentLabel: titleBelt.creator_name || 'Title belt mod',
        item: titleBelt,
        ownerId: titleBelt.owner_id,
        issueType: dead ? 'dead_link' : 'missing_link',
        requestInfo,
        links,
        onEdit: onEditTitleBelt
          ? () => onEditTitleBelt(titleBelt)
          : null,
        onFix: () => onResolveLink(titleBelt, dead ? 'dead_link' : 'missing_link'),
        onRequestNote: () =>
          onCreateRequest(
            titleBelt.id,
            dead ? 'dead_link' : 'missing_link',
            titleBelt.name,
            dead
              ? 'Please review the reported dead link(s).'
              : 'Please add a working download link.'
          )
      }
    ]
  })

  const otherModIssues = otherMods.flatMap((otherMod) => {
    const requestInfo = requestSummary(otherMod.requests || [], 'other_mod_id', otherMod.id)
    const links = parseDownloadLinks(otherMod.download_url || '')
    const missing = links.length === 0
    const dead = requestInfo.deadLinks > 0

    if (!missing && !dead) return []

    return [
      {
        key: `other-${otherMod.id}`,
        modType: 'other',
        modSubtype: otherMod.subtype || '',
        parentLabel: otherMod.creator_name || 'Other mod',
        item: otherMod,
        ownerId: otherMod.owner_id,
        issueType: dead ? 'dead_link' : 'missing_link',
        requestInfo,
        links,
        onEdit: onEditOtherMod
          ? () => onEditOtherMod(otherMod)
          : null,
        onFix: () => onResolveLink(otherMod, dead ? 'dead_link' : 'missing_link'),
        onRequestNote: () =>
          onCreateRequest(
            otherMod.id,
            dead ? 'dead_link' : 'missing_link',
            otherMod.name,
            dead
              ? 'Please review the reported dead link(s).'
              : 'Please add a working download link.'
          )
      }
    ]
  })

  const issues = [
    ...attireIssues,
    ...arenaIssues,
    ...titleIssues,
    ...otherModIssues
  ]

  return (
    <section className="panel soft-panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Maintenance</div>
          <h2>Link Issues</h2>
          <p className="subtle-copy">
            Browse missing and dead links across attires, arenas, title belts, and other mods.
          </p>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">No issues found 🎉</div>
      ) : (
        <div className="link-issues-list">
          {issues.map((item) => (
            <div className="link-issue-card" key={item.key}>
              <div className="link-issue-main">
                <div className="link-issue-title-row">
                  <strong>{item.parentLabel}</strong>
                  <span className={`pill ${item.issueType === 'dead_link' ? 'danger-pill' : ''}`}>
                    {item.issueType === 'dead_link' ? 'Dead link' : 'Missing link'}
                  </span>
                </div>

                <CategoryBadge modType={item.modType} modSubtype={item.modSubtype} />

                <h3>{item.item.name}</h3>

                <div className="muted-text small-text">
                  {item.requestInfo.deadLinks > 0
                    ? `${item.requestInfo.deadLinks} dead link report${item.requestInfo.deadLinks === 1 ? '' : 's'}`
                    : 'No download link added'}
                </div>

                <div className="download-links-list">
                  {item.links.length ? (
                    item.links.map((link, index) => {
                      const provider = getDownloadProvider(link)
                      return (
                        <div
                          className={`download-link-chip provider-${provider}`}
                          key={`${link}-${index}`}
                        >
                          <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
                          <span className="provider-label">
                            {getDownloadProviderLabel(provider)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <span className="muted-text">No link</span>
                  )}
                </div>
              </div>

              <div className="link-issue-actions">
                {item.onFix ? (
                  <button
                    type="button"
                    className="secondary-button small-btn"
                    onClick={item.onFix}
                  >
                    Fix
                  </button>
                ) : null}

                {item.onRequestNote ? (
                  <button
                    type="button"
                    className="ghost-button small-btn"
                    onClick={item.onRequestNote}
                  >
                    Add note
                  </button>
                ) : null}

                {canManageContent(item.ownerId) && item.onEdit ? (
                  <button
                    type="button"
                    className="ghost-button small-btn"
                    onClick={item.onEdit}
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}