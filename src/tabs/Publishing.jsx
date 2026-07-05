import { useMemo, useState } from 'react'

function clean(value) {
  return String(value || '').trim()
}

function lc(value) {
  return clean(value).toLowerCase()
}

function getCombinedText(item) {
  return `${item.content_type || ''} ${item.campaign_stage || ''} ${item.ministry_name || ''} ${item.minister_name || ''} ${item.platform || ''} ${item.content_text || ''} ${item.published_by || ''} ${item.external_post_id || ''} ${item.external_post_url || ''}`.toLowerCase()
}

function isTestOrDryRunItem(item) {
  const text = getCombinedText(item)
  const testTerms = [
    'dry run',
    'test post',
    'facebook real test',
    'real facebook test',
    'controlled publishing test',
    'should not go live',
    'demo post',
    'sample post',
  ]
  return testTerms.some((term) => text.includes(term))
}

function isBirthdayPack(item) {
  const text = getCombinedText(item)
  return text.includes('birthday') || text.includes('campaign pack')
}

function isDesignItem(item) {
  const text = getCombinedText(item)
  const stage = lc(item.campaign_stage)
  return stage.includes('needs design') || text.includes('poster') || text.includes('image quote') || text.includes('image prompt') || text.includes('design') || text.includes('thumbnail') || lc(item.platform).includes('ai poster')
}

function isVideoItem(item) {
  const text = getCombinedText(item)
  const stage = lc(item.campaign_stage)
  return stage.includes('needs video') || text.includes('video script') || text.includes('short video') || text.includes('audio-first') || text.includes('reel') || text.includes('shorts') || lc(item.platform) === 'video'
}

function isChecklistItem(item) {
  const text = getCombinedText(item)
  return text.includes('checklist')
}

function isInternalWorkflowItem(item) {
  const text = getCombinedText(item)
  const stage = lc(item.campaign_stage)

  // Once a cleanup action intentionally moves an item into a production lane,
  // keep it visible under Needs Design or Needs Video instead of hiding it as internal.
  if (stage.includes('needs design') || stage.includes('needs video')) return false

  const internalTerms = [
    'manual publishing checklist',
    'production checklist',
    'poster design prompt',
    'design prompt',
    'image prompt',
    'asset request',
    'media asset',
    'caption file',
    'production note',
    'internal workflow',
    'source note: needs source review',
    'this is a reminder to prepare',
  ]
  return isChecklistItem(item) || internalTerms.some((term) => text.includes(term))
}

function isPublicContentItem(item) {
  return !isTestOrDryRunItem(item) && !isInternalWorkflowItem(item)
}

function hasLiveUrl(item) {
  return clean(item.external_post_url).length > 6 || clean(item.live_post_url).length > 6
}

function isPublished(item) {
  return item.status === 'published'
}

function isUploadedManual(item) {
  return isPublished(item) && lc(item.published_by).includes('manual')
}

function isPublishedMissingUrl(item) {
  return isPublished(item) && isPublicContentItem(item) && !hasLiveUrl(item)
}

function isReadyToUpload(item) {
  if (item.status === 'published' || item.status === 'failed') return false
  if (!isPublicContentItem(item)) return false
  if (isDesignItem(item) || isVideoItem(item)) return false
  return item.status === 'scheduled' || lc(item.campaign_stage).includes('ready') || lc(item.campaign_stage).includes('upload')
}

function isNotActuallyPosted(item) {
  if (!isPublishedMissingUrl(item)) return false
  const text = getCombinedText(item)
  return text.includes('manual-review') || text.includes('browser-auto') || text.includes('auto publisher') || text.includes('scheduled monitor')
}

function getPlatformLabel(platform) {
  const p = lc(platform)
  if (p.includes('youtube')) return 'YouTube Shorts'
  if (p.includes('tiktok')) return 'TikTok'
  if (p.includes('facebook')) return 'Facebook'
  if (p.includes('instagram')) return 'Instagram'
  if (p.includes('thread')) return 'Threads'
  return clean(platform) || 'Platform'
}

function getDateLabel(value) {
  if (!value) return 'Not scheduled'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleString()
}

function getWorkflowLabel(item) {
  if (isTestOrDryRunItem(item)) return { label: 'Test / Ignored', color: '#64748b' }
  if (isInternalWorkflowItem(item)) return { label: 'Internal / Ignored', color: '#38bdf8' }
  if (item.status === 'published' && hasLiveUrl(item)) return { label: 'Published with URL', color: '#22c55e' }
  if (isPublishedMissingUrl(item)) return { label: 'Missing Live URL', color: '#f59e0b' }
  if (item.status === 'published') return { label: 'Published', color: '#22c55e' }
  if (item.status === 'failed') return { label: 'Needs Rework', color: '#ef4444' }
  if (isDesignItem(item)) return { label: 'Needs Design', color: '#f472b6' }
  if (isVideoItem(item)) return { label: 'Needs Video', color: '#a78bfa' }
  if (isReadyToUpload(item)) return { label: 'Ready to Upload', color: '#22c55e' }
  if (item.status === 'scheduled') return { label: 'Ready / Scheduled', color: '#f59e0b' }
  return { label: 'Draft Review', color: '#94a3b8' }
}

function truncate(text, limit = 180) {
  const value = clean(text)
  if (value.length <= limit) return value
  return `${value.slice(0, limit)}...`
}

function getLiveUrlValue(item, liveUrls) {
  return clean(liveUrls[item.id]) || clean(item.external_post_url) || clean(item.live_post_url)
}

export default function Publishing({
  queue = [],
  setActiveTab,
  updateManualPublishingStatus,
  nextPostCountdown,
  nextPosts = [],
  lastPublishedPost,
  sessionPublishedCount,
  duePostsCount,
  publishingStats = {},
  autoPublishEnabled,
  setAutoPublishEnabled,
  publishingPaused,
  setPublishingPaused,
  publishingTimezone,
  publishingInterval,
  setPublishingInterval,
  publisherDebug,
  publisherLog = [],
  setPublisherLog,
  todayTimeline = [],
  busy,
  savePublishingSettings,
  checkDuePostsNow,
  refreshDuePostsCount,
  publishNextPostNow,
  publishAllDuePostsNow,
  clearOldDuePosts,
  markNextPostFailed,
  retryFailedPosts,
  styles = {},
}) {
  const [filter, setFilter] = useState('missing-url')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [liveUrls, setLiveUrls] = useState({})
  const [notes, setNotes] = useState({})
  const [showIgnored, setShowIgnored] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [cleanupMessage, setCleanupMessage] = useState('No items selected yet.')

  const card = styles.card || { background: '#0f172a', border: '1px solid #334155', borderRadius: 18, padding: 18, marginBottom: 16 }
  const smallButton = styles.smallButton || { padding: '9px 12px', borderRadius: 12, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', fontWeight: 800 }
  const activeButton = styles.activeFilterButton || { padding: '9px 12px', borderRadius: 12, border: '1px solid #22c55e', background: '#22c55e', color: '#052e16', fontWeight: 900 }
  const actionButton = styles.actionButton || { padding: 12, borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 900 }
  const deleteButton = styles.deleteButton || { padding: '9px 12px', borderRadius: 12, border: '1px solid #7f1d1d', background: '#dc2626', color: '#fff', fontWeight: 900 }
  const searchStyle = styles.search || { width: '100%', padding: 14, borderRadius: 14, border: '1px solid #334155', background: '#020617', color: '#f8fafc' }
  const textarea = styles.textarea || { width: '100%', minHeight: 120, padding: 12, borderRadius: 12, border: '1px solid #334155', background: '#020617', color: '#f8fafc' }
  const calendarItem = styles.calendarItem || { padding: 12, border: '1px solid #334155', borderRadius: 12, marginBottom: 10, background: '#0b1220' }

  const realPublicItems = useMemo(() => queue.filter(isPublicContentItem), [queue])
  const ignoredItems = useMemo(() => queue.filter((item) => !isPublicContentItem(item)), [queue])

  const stats = useMemo(() => {
    const birthdayPack = realPublicItems.filter(isBirthdayPack).length
    const needsDesign = realPublicItems.filter((item) => item.status !== 'published' && isDesignItem(item)).length
    const needsVideo = realPublicItems.filter((item) => item.status !== 'published' && isVideoItem(item)).length
    const ready = realPublicItems.filter(isReadyToUpload).length
    const uploadedManual = realPublicItems.filter(isUploadedManual).length
    const publishedWithUrl = realPublicItems.filter((item) => isPublished(item) && hasLiveUrl(item)).length
    const missingUrl = realPublicItems.filter(isPublishedMissingUrl).length
    const notActuallyPosted = realPublicItems.filter(isNotActuallyPosted).length
    const rework = realPublicItems.filter((item) => item.status === 'failed').length
    return { birthdayPack, needsDesign, needsVideo, ready, uploadedManual, publishedWithUrl, missingUrl, notActuallyPosted, rework, ignored: ignoredItems.length }
  }, [realPublicItems, ignoredItems.length])

  const manualItems = useMemo(() => {
    const q = lc(search)
    const source = showIgnored ? queue : realPublicItems

    return source
      .filter((item) => {
        if (filter === 'ready') return isReadyToUpload(item)
        if (filter === 'birthday') return isBirthdayPack(item)
        if (filter === 'design') return isDesignItem(item)
        if (filter === 'video') return isVideoItem(item)
        if (filter === 'missing-url') return isPublishedMissingUrl(item)
        if (filter === 'with-url') return isPublished(item) && hasLiveUrl(item)
        if (filter === 'not-posted') return isNotActuallyPosted(item)
        if (filter === 'uploaded') return isUploadedManual(item)
        if (filter === 'published') return isPublished(item)
        if (filter === 'rework') return item.status === 'failed'
        if (filter === 'ignored') return !isPublicContentItem(item)
        return true
      })
      .filter((item) => {
        if (!q) return true
        return `${item.minister_name || ''} ${item.platform || ''} ${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''} ${item.external_post_url || ''}`.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const ad = new Date(a.published_at || a.scheduled_at || a.updated_at || a.created_at || 0).getTime()
        const bd = new Date(b.published_at || b.scheduled_at || b.updated_at || b.created_at || 0).getTime()
        return bd - ad
      })
  }, [queue, realPublicItems, filter, search, showIgnored])


  function getItemById(id) {
    return queue.find((item) => String(item.id) === String(id))
  }

  function isSelected(item) {
    return selectedIds.includes(String(item.id))
  }

  function toggleSelected(item) {
    const id = String(item.id)
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function showSelectionMessage(label, ids) {
    const message = `${ids.length} item(s) selected: ${label}`
    setCleanupMessage(message)
  }

  function selectVisibleItems() {
    const ids = manualItems.map((item) => String(item.id))
    setSelectedIds(ids)
    showSelectionMessage('visible items', ids)
  }

  function clearSelection() {
    setSelectedIds([])
    setCleanupMessage('Selection cleared.')
  }

  function selectShortsScripts() {
    const ids = queue
      .filter((item) => item.status === 'published' && isVideoItem(item) && !hasLiveUrl(item))
      .map((item) => String(item.id))
    setSelectedIds(ids)
    showSelectionMessage('Shorts Scripts / Video items', ids)
  }

  function selectDesignItems() {
    const ids = queue
      .filter((item) => item.status === 'published' && isDesignItem(item) && !isVideoItem(item) && !hasLiveUrl(item))
      .map((item) => String(item.id))
    setSelectedIds(ids)
    showSelectionMessage('Design / Poster items', ids)
  }

  function selectTestAndInternalItems() {
    const ids = queue
      .filter((item) => item.status === 'published' && (isTestOrDryRunItem(item) || isInternalWorkflowItem(item)) && !hasLiveUrl(item))
      .map((item) => String(item.id))
    setSelectedIds(ids)
    showSelectionMessage('Test / Internal items', ids)
  }

  function selectMissingUrlRealPosts() {
    const ids = queue
      .filter((item) => isPublishedMissingUrl(item) && !isDesignItem(item) && !isVideoItem(item) && !isTestOrDryRunItem(item))
      .map((item) => String(item.id))
    setSelectedIds(ids)
    showSelectionMessage('real public posts missing URLs', ids)
  }

  async function runBulkCleanup(action) {
    const selectedItems = selectedIds.map(getItemById).filter(Boolean)
    if (selectedItems.length === 0) {
      setCleanupMessage('No selected items. Tap a Select button first.')
      alert('Select at least one item first.')
      return
    }

    const labelMap = {
      'needs-video': 'Needs Video',
      'needs-design': 'Needs Design',
      internal: 'Internal/Test',
      ready: 'Ready/Scheduled',
      draft: 'Draft',
    }
    const label = labelMap[action] || action
    const ok = confirm(`Apply "${label}" to ${selectedItems.length} selected item(s)?`)
    if (!ok) return

    for (const item of selectedItems) {
      const note = `Bulk cleanup: moved to ${label}.`
      if (action === 'needs-video') await updateManualPublishingStatus(item.id, 'needs-video', { note })
      else if (action === 'needs-design') await updateManualPublishingStatus(item.id, 'needs-design', { note })
      else if (action === 'internal') await updateManualPublishingStatus(item.id, 'internal', { note })
      else if (action === 'ready') await updateManualPublishingStatus(item.id, 'ready', {})
      else if (action === 'draft') await updateManualPublishingStatus(item.id, 'draft', {})
    }

    setSelectedIds([])
    setCleanupMessage(`Bulk cleanup finished: ${selectedItems.length} item(s) moved to ${label}. Refreshing list...`)
    alert(`Bulk cleanup finished. ${selectedItems.length} item(s) moved to ${label}.`)
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || '')
      alert('Copied')
    } catch {
      alert('Copy failed. Open item and copy manually.')
    }
  }

  async function markUploaded(item) {
    const liveUrl = getLiveUrlValue(item, liveUrls)
    if (!liveUrl) {
      alert('Paste the live post URL first.')
      return
    }
    await updateManualPublishingStatus(item.id, 'uploaded', {
      liveUrl,
      platform: item.platform,
      note: clean(notes[item.id]),
    })
  }

  async function saveLiveUrl(item) {
    const liveUrl = getLiveUrlValue(item, liveUrls)
    if (!liveUrl) {
      alert('Paste the live post URL first.')
      return
    }
    await updateManualPublishingStatus(item.id, 'uploaded', {
      liveUrl,
      platform: item.platform,
      note: clean(notes[item.id]) || 'Live URL saved after manual upload.',
    })
  }

  async function moveBackToReady(item) {
    const ok = confirm('Move this item back to Ready/Scheduled because it was not actually posted?')
    if (!ok) return
    await updateManualPublishingStatus(item.id, 'ready', {})
  }

  async function markNeedsRework(item) {
    const note = clean(notes[item.id])
    if (!note) {
      alert('Add a short rework note first.')
      return
    }
    await updateManualPublishingStatus(item.id, 'rework', { note })
  }

  async function copyUrlCleanupPrompt() {
    const missing = realPublicItems.filter(isPublishedMissingUrl).slice(0, 40)
    const rows = missing.map((item, index) => {
      return `${index + 1}. ID ${item.id} - ${getPlatformLabel(item.platform)} - ${item.minister_name || 'General'} - ${item.content_type || item.campaign_stage || 'Content'}`
    }).join('\n')

    const prompt = `You are helping manage the Yearning for God Christian media dashboard.

We need to clean the manual publishing records. These posts are marked published but do not have live post URLs yet.

Tasks:
1. Identify which posts are likely truly published and need a URL pasted.
2. Identify which posts look like they should be moved back to Ready/Scheduled.
3. Identify anything that looks internal or not public-facing.
4. Give a practical cleanup order for today.

Missing URL items:
${rows || 'No missing URL items found.'}

Return a short action plan.`

    await copyText(prompt)
  }

  const filterButtons = [
    ['missing-url', `Missing Live URL (${stats.missingUrl})`],
    ['ready', `Ready to Upload (${stats.ready})`],
    ['with-url', `Published with URL (${stats.publishedWithUrl})`],
    ['not-posted', `Not Actually Posted (${stats.notActuallyPosted})`],
    ['birthday', `Birthday Pack (${stats.birthdayPack})`],
    ['design', `Needs Design (${stats.needsDesign})`],
    ['video', `Needs Video (${stats.needsVideo})`],
    ['uploaded', `Uploaded Manual (${stats.uploadedManual})`],
    ['rework', `Needs Rework (${stats.rework})`],
    ['all', 'All Real Content'],
    ['ignored', `Ignored/Internal (${stats.ignored})`],
  ]

  return (
    <div>
      <h2>Manual Publishing Center v5</h2>
      <p style={{ color: '#94a3b8' }}>
        Complete live post URLs, separate real published content from internal items, and keep manual upload records clean.
      </p>

      <div style={{ ...card, borderColor: '#38bdf8', background: 'linear-gradient(135deg, rgba(14,165,233,.16), rgba(15,23,42,.88))' }}>
        <strong style={{ color: '#bae6fd' }}>Live URL Completion Workflow</strong>
        <p style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 0 }}>
          Upload manually on the platform, paste the live post URL, then mark Uploaded/Published. Items without live URLs should be cleaned here before growth tracking.
        </p>
      </div>

      <div style={styles.missionGrid || { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 15 }}>
        {[
          { label: 'Missing Live URLs', value: stats.missingUrl, color: '#f59e0b', icon: 'URL' },
          { label: 'Published with URL', value: stats.publishedWithUrl, color: '#22c55e', icon: 'OK' },
          { label: 'Ready to Upload', value: stats.ready, color: '#22c55e', icon: 'UP' },
          { label: 'Needs Video', value: stats.needsVideo, color: '#a78bfa', icon: 'VID' },
          { label: 'Needs Design', value: stats.needsDesign, color: '#f472b6', icon: 'IMG' },
          { label: 'Ignored/Internal', value: stats.ignored, color: '#64748b', icon: 'IGN' },
        ].map((stat) => (
          <div key={stat.label} style={styles.missionCard || card}>
            <div style={styles.missionIcon || { fontSize: 18, marginBottom: 6 }}>{stat.icon}</div>
            <div style={styles.missionLabel || { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 850 }}>{stat.label}</div>
            <div style={{ ...(styles.missionValue || { fontSize: 24, fontWeight: 900 }), color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3>Manual URL cleanup controls</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <button style={smallButton} onClick={() => setActiveTab?.('queue')}>Open Queue</button>
          <button style={smallButton} onClick={() => setActiveTab?.('media-library')}>Open Media Library</button>
          <button style={smallButton} onClick={() => setActiveTab?.('growth-tracker')}>Open Growth Tracker</button>
          <button style={actionButton} onClick={copyUrlCleanupPrompt}>Copy URL Cleanup Prompt</button>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={showIgnored}
            onChange={(e) => setShowIgnored(e.target.checked)}
          />
          Include ignored internal/test items in the list
        </label>
      </div>

      <div style={{ ...card, borderColor: '#f59e0b', background: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(15,23,42,.88))' }}>
        <h3 style={{ marginTop: 0 }}>Bulk cleanup actions</h3>
        <p style={{ color: '#cbd5e1', fontSize: 13 }}>
          Use this to quickly repair false published records. Select items first, then move them to the correct production stage.
        </p>
        <div style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(250,204,21,.55)', background: 'rgba(250,204,21,.10)', color: '#facc15', fontWeight: 900, marginBottom: 12 }}>
          Selected items: {selectedIds.length}
          <div style={{ color: '#fde68a', fontSize: 13, fontWeight: 700, marginTop: 4 }}>{cleanupMessage}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <button style={smallButton} onClick={selectVisibleItems}>Select Visible ({manualItems.length})</button>
          <button style={smallButton} onClick={selectMissingUrlRealPosts}>Select Real Missing URLs</button>
          <button style={smallButton} onClick={selectShortsScripts}>Select Shorts Scripts</button>
          <button style={smallButton} onClick={selectDesignItems}>Select Design/Poster Items</button>
          <button style={smallButton} onClick={selectTestAndInternalItems}>Select Test/Internal</button>
          <button style={smallButton} onClick={clearSelection}>Clear Selection</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <button style={activeButton} disabled={busy} onClick={() => runBulkCleanup('needs-video')}>Move Selected to Needs Video</button>
          <button style={activeButton} disabled={busy} onClick={() => runBulkCleanup('needs-design')}>Move Selected to Needs Design</button>
          <button style={smallButton} disabled={busy} onClick={() => runBulkCleanup('ready')}>Move Selected to Ready/Scheduled</button>
          <button style={smallButton} disabled={busy} onClick={() => runBulkCleanup('draft')}>Move Selected to Draft</button>
          <button style={deleteButton} disabled={busy} onClick={() => runBulkCleanup('internal')}>Mark Selected Internal/Test</button>
        </div>
        <p style={{ color: selectedIds.length ? '#facc15' : '#94a3b8', fontWeight: 800, marginBottom: 0 }}>
          Bottom check - selected items: {selectedIds.length}
        </p>
      </div>

      <div style={card}>
        <h3>Manual publishing list</h3>
        <div style={styles.filterBox || { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {filterButtons.map(([key, label]) => (
            <button
              key={key}
              style={filter === key ? activeButton : smallButton}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          style={searchStyle}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by minister, platform, campaign, content, or URL..."
        />

        <p style={{ color: '#94a3b8' }}>Showing {manualItems.length} items</p>

        {manualItems.length === 0 && (
          <div style={calendarItem}>
            <p style={{ color: '#94a3b8', margin: 0 }}>No items in this filter.</p>
          </div>
        )}

        {manualItems.slice(0, 160).map((item) => {
          const workflow = getWorkflowLabel(item)
          const isOpen = openId === item.id
          const liveValue = getLiveUrlValue(item, liveUrls)
          const missingUrl = isPublishedMissingUrl(item)

          return (
            <div key={item.id} style={{ ...calendarItem, borderColor: workflow.color }}>
              <div onClick={() => setOpenId(isOpen ? null : item.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 220 }}>
                    <input
                      type="checkbox"
                      checked={isSelected(item)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelected(item)}
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#f8fafc' }}>{item.content_type || 'Content Item'}</strong>
                    <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                      {item.minister_name || 'General'} - {getPlatformLabel(item.platform)} - {getDateLabel(item.published_at || item.scheduled_at)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                      {item.campaign_stage || item.status || 'No stage'} - ID {item.id}
                    </div>
                    </div>
                  </div>
                  <div style={{ color: workflow.color, fontWeight: 900, textAlign: 'right' }}>{workflow.label}</div>
                </div>

                {missingUrl && (
                  <p style={{ color: '#fbbf24', fontSize: 13, margin: '8px 0 0' }}>
                    This item is marked published but has no live URL. Paste the live link, or move it back to Ready if it was not truly posted.
                  </p>
                )}

                <p style={{ color: '#cbd5e1', fontSize: 13 }}>{truncate(item.content_text)}</p>
              </div>

              {isOpen && (
                <div style={{ marginTop: 12, borderTop: '1px solid rgba(51,65,85,.75)', paddingTop: 12 }}>
                  <textarea readOnly value={item.content_text || ''} style={{ ...textarea, minHeight: 160 }} />

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <button style={smallButton} onClick={() => copyText(item.content_text || '')}>Copy Caption/Text</button>
                    <button style={smallButton} onClick={() => setActiveTab?.('media-library')}>Open Assets</button>
                    <button style={smallButton} onClick={() => setActiveTab?.('queue')}>Open Queue</button>
                    {liveValue && (
                      <button style={smallButton} onClick={() => window.open(liveValue, '_blank')}>Open Live Post</button>
                    )}
                  </div>

                  <input
                    style={searchStyle}
                    value={liveUrls[item.id] !== undefined ? liveUrls[item.id] : (item.external_post_url || '')}
                    onChange={(e) => setLiveUrls({ ...liveUrls, [item.id]: e.target.value })}
                    placeholder="Paste live post URL after manual upload"
                  />

                  <textarea
                    style={{ ...textarea, minHeight: 90 }}
                    value={notes[item.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                    placeholder="Upload note or cleanup note e.g. Posted to Facebook at 7:10 AM / Not actually posted yet"
                  />

                  {item.external_post_url && (
                    <p style={{ color: '#38bdf8', fontSize: 13, wordBreak: 'break-all' }}>Saved URL: {item.external_post_url}</p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button style={actionButton} disabled={busy} onClick={() => markUploaded(item)}>
                      Mark Uploaded / Published
                    </button>
                    <button style={smallButton} disabled={busy} onClick={() => saveLiveUrl(item)}>
                      Save Live URL
                    </button>
                    <button style={smallButton} disabled={busy} onClick={() => moveBackToReady(item)}>
                      Move Back to Ready
                    </button>
                    <button style={smallButton} disabled={busy} onClick={() => updateManualPublishingStatus(item.id, 'needs-video', { note: 'Moved to Needs Video from Publishing Center cleanup.' })}>
                      Move to Needs Video
                    </button>
                    <button style={smallButton} disabled={busy} onClick={() => updateManualPublishingStatus(item.id, 'needs-design', { note: 'Moved to Needs Design from Publishing Center cleanup.' })}>
                      Move to Needs Design
                    </button>
                    <button style={smallButton} disabled={busy} onClick={() => updateManualPublishingStatus(item.id, 'draft', {})}>
                      Back to Draft
                    </button>
                    <button style={smallButton} disabled={busy} onClick={() => updateManualPublishingStatus(item.id, 'internal', { note: 'Marked internal/test from Publishing Center cleanup.' })}>
                      Mark Internal/Test
                    </button>
                    <button style={deleteButton} disabled={busy} onClick={() => markNeedsRework(item)}>
                      Needs Rework
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={card}>
        <h3>Monitor-only publisher status</h3>
        <p style={{ color: '#94a3b8' }}>
          Online auto-publishing remains off. This section is only for monitoring old due-post logic.
        </p>
        <div style={styles.statsBar || { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
          <div style={styles.statPill || smallButton}><span style={{ color: '#94a3b8' }}>Waiting</span><strong style={{ color: '#f59e0b', marginLeft: 8 }}>{publishingStats.waiting || 0}</strong></div>
          <div style={styles.statPill || smallButton}><span style={{ color: '#94a3b8' }}>Due Now</span><strong style={{ color: duePostsCount > 0 ? '#ef4444' : '#22c55e', marginLeft: 8 }}>{duePostsCount || 0}</strong></div>
          <div style={styles.statPill || smallButton}><span style={{ color: '#94a3b8' }}>Published Today</span><strong style={{ color: '#22c55e', marginLeft: 8 }}>{publishingStats.publishedToday || 0}</strong></div>
          <div style={styles.statPill || smallButton}><span style={{ color: '#94a3b8' }}>Failed</span><strong style={{ color: '#ef4444', marginLeft: 8 }}>{publishingStats.failed || 0}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={smallButton} onClick={async () => { await checkDuePostsNow?.(); await refreshDuePostsCount?.() }}>Check Due Posts</button>
          <button style={smallButton} onClick={async () => { setAutoPublishEnabled?.(false); await savePublishingSettings?.({ autoPublishEnabled: false }) }}>
            Keep Auto Publishing OFF
          </button>
        </div>
        <p style={{ color: autoPublishEnabled ? '#ef4444' : '#22c55e', fontWeight: 900 }}>
          Auto Publishing: {autoPublishEnabled ? 'ON - turn off unless testing' : 'OFF - safe'}
        </p>
        {publisherDebug && <p style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{publisherDebug}</p>}
      </div>

      <div style={card}>
        <h3>Recent manual/auto activity</h3>
        {publisherLog.length === 0 ? (
          <p style={{ color: '#64748b' }}>No activity log yet.</p>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {publisherLog.map((log, index) => (
              <p key={index} style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12, margin: '4px 0' }}>{log}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}