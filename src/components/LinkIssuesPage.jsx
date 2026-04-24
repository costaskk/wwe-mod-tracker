import { useMemo, useState } from 'react'
import {
  requestSummary,
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  getModTypeLabel,
  getOtherModSubtypeLabel,
  getSubtypeIcon
} from '../lib/utils'

function buildVersionEntries(item = {}) {
  const entries = []
  const baseLinks = parseDownloadLinks(item.download_url || '')

  if (baseLinks.length) {
    entries.push({
      id: `base-${item.id || item.name || item.source_game || 'mod'}`,
      source_game: item.source_game || 'Unknown game',
      download_url: baseLinks.join('\n')
    })
  }

  ;(item.mod_version_links || item.version_links || []).forEach((entry, index) => {
    if (!String(entry?.download_url || '').trim()) return

    entries.push({
      id: entry.id || `version-${index}`,
      source_game: entry.source_game || 'Unknown game',
      download_url: entry.download_url || ''
    })
  })

  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${entry.source_game}::${entry.download_url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function CategoryBadge({ modType, modSubtype }) {
  return (
    <div className="wrap-actions">
      <span className="pill subtle-pill">
        {getModTypeLabel(modType)}
      </span>

      {modType === 'other' && modSubtype ? (
        <span className={`pill subtype-pill subtype-${modSubtype}`}>
          <span className="pill-icon">
            {getSubtypeIcon(modSubtype)}
          </span>
          {getOtherModSubtypeLabel(modSubtype)}
        </span>
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
      {links.map((entry, index) => {
        const url = typeof entry === 'string' ? entry : entry.url
        const game = typeof entry === 'string' ? '' : entry.source_game
        const provider = getDownloadProvider(url)

        return (
          <a
            key={`${url}-${game}-${index}`}
            className={`download-link-chip provider-${provider}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            title={url}
          >
            <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
            <span className="provider-label">
              {game ? `${game} · ` : ''}{getDownloadProviderLabel(provider)}
            </span>
          </a>
        )
      })}
    </div>
  )
}

function getPreviewUrls(image = {}) {
  return {
    thumbUrl:
      image.image_thumb_url ||
      image.thumb_url ||
      image.url ||
      image.image_url ||
      '',
    previewUrl:
      image.full_image_url ||
      image.image_medium_url ||
      image.medium_url ||
      image.image_url ||
      image.url ||
      ''
  }
}

function IssueCard({ issue, canManageContent, canContribute }) {
  const canEdit = canManageContent?.(issue.ownerId) && issue.onEdit

  return (
    <article className="collection-item-card enhanced-collection-item-card link-issue-collection-card">
      <div className="collection-item-topbar">
        <div className="wrap-actions">
          <span className={`pill ${issue.issueType === 'dead_link' ? 'danger-pill' : 'warning-pill'}`}>
            {issue.issueType === 'dead_link' ? 'Dead link' : 'Missing link'}
          </span>
          <CategoryBadge modType={issue.modType} modSubtype={issue.modSubtype} />
        </div>
      </div>

      {issue.thumbUrl ? (
        <div className="collection-thumb-button">
          <img
            className="collection-item-thumb"
            src={issue.thumbUrl}
            alt={issue.itemName}
          />
        </div>
      ) : (
        <div className="collection-item-thumb collection-cover-placeholder">
          {(issue.itemName || '?').slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="collection-item-body">
        <div className="muted-text small-text">{issue.parentLabel}</div>

        <h3 title={issue.itemName}>{issue.itemName}</h3>

        <div className="muted-text small-text wrap-actions">
          {issue.sourceGame ? <span>{issue.sourceGame}</span> : null}
          {issue.creatorName ? (
            <span className="creator-badge small-creator-badge">{issue.creatorName}</span>
          ) : null}
        </div>

        <div className="collection-item-meta-row">
          <span className="muted-text small-text">
            {issue.issueType === 'dead_link'
              ? `${issue.requestInfo.deadLinks} dead link report${issue.requestInfo.deadLinks === 1 ? '' : 's'}`
              : 'No working download link added yet'}
          </span>
        </div>

        <ProviderList links={issue.links} />

        <div className="collection-actions wrap-actions">
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
              Submit request
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
  const [query, setQuery] = useState('')

  const issues = useMemo(() => {
    const attireDeadIssues = wrestlers.flatMap((wrestler) =>
      (wrestler.requests || [])
        .filter(
          (request) =>
            request.status === 'open' &&
            request.request_type === 'dead_link' &&
            request.attire_id
        )
        .map((request) => {
          const attire = (wrestler.attires || []).find((item) => item.id === request.attire_id)
          if (!attire) return null

          const attirePreviewImage = (attire.attire_images || [])[0]
          const attirePreview = attirePreviewImage
            ? getPreviewUrls(attirePreviewImage)
            : {
                thumbUrl: wrestler.headshot_thumb_url || wrestler.headshot_url || '',
                previewUrl: wrestler.headshot_full_url || wrestler.headshot_url || ''
              }

          return {
            key: `attire-request-${request.id}`,
            modType: 'attire',
            modSubtype: '',
            parentLabel: wrestler.wrestler_name || 'Unknown wrestler',
            itemName: attire.name || 'Unknown attire',
            ownerId: attire.owner_id,
            creatorName: attire.creator_name || '',
            sourceGame: request.affected_source_game || attire.source_game || '',
            thumbUrl: attirePreview.thumbUrl,
            previewUrl: attirePreview.previewUrl,
            issueType: 'dead_link',
            requestInfo: { total: 1, missingLinks: 0, deadLinks: 1 },
            links: request.affected_url
              ? [{
                  url: request.affected_url,
                  source_game: request.affected_source_game || '',
                  provider: request.affected_provider || ''
                }]
              : [],
            request,
            onEdit: onEditAttire ? () => onEditAttire(attire) : null,
            onFix: onResolveLink ? () => onResolveLink(wrestler, attire, request) : null,
            onRequestNote: null
          }
        })
        .filter(Boolean)
    )

    const attireMissingIssues = wrestlers.flatMap((wrestler) =>
      (wrestler.attires || []).flatMap((attire) => {
        const versionEntries = buildVersionEntries(attire)
        const links = versionEntries.flatMap((entry) =>
          parseDownloadLinks(entry.download_url || '').map((link) => ({
            url: link,
            source_game: entry.source_game || 'Unknown game'
          }))
        )

        if (links.length > 0) return []

        const openMissingRequest =
          (wrestler.requests || []).find(
            (request) =>
              request.status === 'open' &&
              request.request_type === 'missing_link' &&
              request.attire_id === attire.id
          ) || {
            id: null,
            request_type: 'missing_link',
            link_scope: 'base',
            affected_source_game: attire.source_game || 'WWE 2K25',
            affected_url: '',
            affected_provider: '',
            mod_version_link_id: null
          }

        const attirePreviewImage = (attire.attire_images || [])[0]
        const attirePreview = attirePreviewImage
          ? getPreviewUrls(attirePreviewImage)
          : {
              thumbUrl: wrestler.headshot_thumb_url || wrestler.headshot_url || '',
              previewUrl: wrestler.headshot_full_url || wrestler.headshot_url || ''
            }

        return [{
          key: `attire-missing-${attire.id}`,
          modType: 'attire',
          modSubtype: '',
          parentLabel: wrestler.wrestler_name || 'Unknown wrestler',
          itemName: attire.name || 'Unknown attire',
          ownerId: attire.owner_id,
          creatorName: attire.creator_name || '',
          sourceGame: attire.source_game || '',
          thumbUrl: attirePreview.thumbUrl,
          previewUrl: attirePreview.previewUrl,
          issueType: 'missing_link',
          requestInfo: { total: 1, missingLinks: 1, deadLinks: 0 },
          links: [],
          request: openMissingRequest,
          onEdit: onEditAttire ? () => onEditAttire(attire) : null,
          onFix: onResolveLink ? () => onResolveLink(wrestler, attire, openMissingRequest) : null,
          onRequestNote: onCreateRequest
            ? () =>
                onCreateRequest(
                  wrestler.id,
                  attire.id,
                  'missing_link',
                  wrestler.wrestler_name,
                  attire.name,
                  'Please add a working download link.',
                  {
                    link_scope: 'base',
                    affected_source_game: attire.source_game || 'WWE 2K25',
                    affected_url: '',
                    affected_provider: '',
                    mod_version_link_id: null
                  }
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

      const arenaPreview = getPreviewUrls((arena.arena_images || [])[0] || {})

      return [{
        key: `arena-${arena.id}`,
        modType: 'arena',
        modSubtype: '',
        parentLabel: arena.creator_name || 'Arena mod',
        itemName: arena.name || 'Unknown arena',
        ownerId: arena.owner_id,
        creatorName: arena.creator_name || '',
        sourceGame: arena.source_game || '',
        thumbUrl: arenaPreview.thumbUrl,
        previewUrl: arenaPreview.previewUrl,
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
      }]
    })

    const titleIssues = titleBelts.flatMap((titleBelt) => {
      const requestInfo = requestSummary(titleBelt.requests || [], 'title_belt_id', titleBelt.id)
      const links = parseDownloadLinks(titleBelt.download_url || '')
      const missing = links.length === 0
      const dead = requestInfo.deadLinks > 0

      if (!missing && !dead) return []

      const issueType = dead ? 'dead_link' : 'missing_link'

      const titlePreview = getPreviewUrls((titleBelt.title_belt_images || [])[0] || {})

      return [{
        key: `title-${titleBelt.id}`,
        modType: 'title',
        modSubtype: '',
        parentLabel: titleBelt.creator_name || 'Title belt mod',
        itemName: titleBelt.name || 'Unknown title belt',
        ownerId: titleBelt.owner_id,
        creatorName: titleBelt.creator_name || '',
        sourceGame: titleBelt.source_game || '',
        thumbUrl: titlePreview.thumbUrl,
        previewUrl: titlePreview.previewUrl,
        issueType,
        requestInfo,
        links,
        onEdit: onEditTitleBelt ? () => onEditTitleBelt(titleBelt) : null,
        onFix: onResolveTitleBeltLink ? () => onResolveTitleBeltLink(titleBelt, issueType) : null,
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

      const otherPreview = getPreviewUrls((otherMod.other_mod_images || [])[0] || {})

      return [{
        key: `other-${otherMod.id}`,
        modType: 'other',
        modSubtype: otherMod.subtype || '',
        parentLabel: otherMod.creator_name || 'Other mod',
        itemName: otherMod.name || 'Unknown mod',
        ownerId: otherMod.owner_id,
        creatorName: otherMod.creator_name || '',
        sourceGame: otherMod.source_game || '',
        thumbUrl: otherPreview.thumbUrl,
        previewUrl: otherPreview.previewUrl,
        issueType,
        requestInfo,
        links,
        onEdit: onEditOtherMod ? () => onEditOtherMod(otherMod) : null,
        onFix: onResolveOtherModLink ? () => onResolveOtherModLink(otherMod, issueType) : null,
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

    const modTypeOrder = {
      attire: 1,
      arena: 2,
      title: 3,
      other: 4
    }

    return [...attireDeadIssues, ...attireMissingIssues, ...arenaIssues, ...titleIssues, ...otherModIssues].sort((a, b) => {
      if (a.issueType !== b.issueType) {
        return a.issueType === 'dead_link' ? -1 : 1
      }

      const aType = modTypeOrder[a.modType] || 99
      const bType = modTypeOrder[b.modType] || 99

      if (aType !== bType) {
        return aType - bType
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

  const filteredIssues = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return issues

    return issues.filter((issue) => {
      const haystack = [
        issue.parentLabel,
        issue.itemName,
        issue.modType,
        issue.modSubtype,
        issue.sourceGame,
        issue.issueType,
        getModTypeLabel(issue.modType),
        issue.modSubtype ? getOtherModSubtypeLabel(issue.modSubtype) : '',
        ...(issue.links || []).map((entry) =>
          typeof entry === 'string'
            ? entry
            : `${entry.url || ''} ${entry.source_game || ''} ${entry.provider || ''}`
        )
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [issues, query])

  const deadCount = filteredIssues.filter((item) => item.issueType === 'dead_link').length
  const missingCount = filteredIssues.filter((item) => item.issueType === 'missing_link').length

  return (
    <section className="panel detail-hero collection-view-panel">
      <div className="panel-header with-actions">
        <div>
          <div className="eyebrow">Maintenance</div>
          <h2>Link Issues</h2>
          <p className="subtle-copy">
            Browse missing and dead links across attires, arenas, title belts, and other mods.
          </p>
        </div>

        <div className="wrap-actions">
          <span className="pill subtle-pill">{filteredIssues.length} total</span>
          <span className="pill danger-pill">{deadCount} dead</span>
          <span className="pill warning-pill">{missingCount} missing</span>
          {!canContribute ? <span className="pill subtle-pill">View only</span> : null}
        </div>
      </div>

      <div className="panel soft-panel elevated-card">
        <div className="form-grid">
          <label>
            Search issues
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by mod name, category, subtype, source game, creator, or provider"
            />
          </label>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="empty-state small-empty">
          <div>
            <strong>{issues.length === 0 ? 'No issues found' : 'No matching issues'}</strong>
            <div className="muted-text small-text" style={{ marginTop: '8px' }}>
              {issues.length === 0
                ? 'Everything currently looks good.'
                : 'Try a different search term.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="collection-items-grid link-issues-grid">
          {filteredIssues.map((issue) => (
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