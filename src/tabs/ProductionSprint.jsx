import { useMemo, useState } from 'react'

function clean(value) {
  return String(value || '').trim()
}

function lc(value) {
  return clean(value).toLowerCase()
}

function combinedText(item) {
  return `${item.content_type || ''} ${item.campaign_stage || ''} ${item.ministry_name || ''} ${item.minister_name || ''} ${item.platform || ''} ${item.content_text || ''} ${item.published_by || ''} ${item.external_post_url || ''}`.toLowerCase()
}

function getStatus(item) {
  return lc(item.status)
}

function hasUrl(item) {
  return clean(item.external_post_url).length > 5
}

function isTestOrInternal(item) {
  const text = combinedText(item)
  return [
    'dry run',
    'test post',
    'buffer test',
    'facebook real test',
    'real facebook test',
    'controlled publishing test',
    'demo post',
    'sample post',
    'internal workflow',
    'manual publishing checklist',
    'production note',
    'asset request',
    'caption file',
  ].some((term) => text.includes(term))
}

function isVideoItem(item) {
  const text = combinedText(item)
  return [
    'shorts script',
    'video script',
    'short video',
    'needs video',
    'audio-first',
    'reel script',
    'youtube shorts',
    'tiktok script',
  ].some((term) => text.includes(term)) || lc(item.platform) === 'video'
}

function isDesignItem(item) {
  const text = combinedText(item)
  return [
    'ai poster',
    'poster',
    'image quote',
    'image prompt',
    'design',
    'thumbnail',
    'graphic',
    'needs design',
  ].some((term) => text.includes(term)) || lc(item.platform) === 'ai poster'
}

function isPublished(item) {
  const status = getStatus(item)
  return status === 'published' || status === 'uploaded' || status === 'posted'
}

function isReady(item) {
  const status = getStatus(item)
  const text = combinedText(item)
  if (isTestOrInternal(item)) return false
  if (isPublished(item)) return false
  if (text.includes('needs video') || text.includes('needs design')) return false
  return (
    status === 'ready' ||
    status === 'scheduled' ||
    status === 'approved' ||
    status === 'quality ready' ||
    status === 'ready to upload' ||
    clean(item.approved_for_publishing) === 'true'
  )
}

function needsVideo(item) {
  const status = getStatus(item)
  const text = combinedText(item)
  if (isTestOrInternal(item)) return false
  if (isPublished(item) && hasUrl(item)) return false
  return isVideoItem(item) || status === 'needs video' || text.includes('needs video')
}

function needsDesign(item) {
  const status = getStatus(item)
  const text = combinedText(item)
  if (isTestOrInternal(item)) return false
  if (isPublished(item) && hasUrl(item)) return false
  return isDesignItem(item) || status === 'needs design' || text.includes('needs design')
}

function missingUrl(item) {
  if (isTestOrInternal(item)) return false
  if (isVideoItem(item) || isDesignItem(item)) return false
  return isPublished(item) && !hasUrl(item)
}

function publishedWithUrl(item) {
  if (isTestOrInternal(item)) return false
  return isPublished(item) && hasUrl(item)
}

function getTitle(item) {
  const type = clean(item.content_type) || clean(item.campaign_stage) || 'Content item'
  const minister = clean(item.minister_name) || clean(item.ministry_name) || 'Yearning for God'
  return `${minister} - ${type}`
}

function getPlatform(item) {
  return clean(item.platform) || 'Platform not set'
}

function getSnippet(item) {
  const text = clean(item.content_text)
  if (!text) return 'No caption text available yet.'
  return text.length > 150 ? `${text.slice(0, 150)}...` : text
}

function platformRank(platform) {
  const p = lc(platform)
  if (p.includes('facebook')) return 1
  if (p.includes('instagram')) return 2
  if (p.includes('tiktok')) return 3
  if (p.includes('youtube')) return 4
  if (p.includes('threads')) return 5
  return 9
}

function sortWorkItems(a, b) {
  const pa = platformRank(a.platform)
  const pb = platformRank(b.platform)
  if (pa !== pb) return pa - pb
  const ad = clean(a.scheduled_at || a.created_at || '')
  const bd = clean(b.scheduled_at || b.created_at || '')
  return bd.localeCompare(ad)
}

function countByPlatform(items) {
  return items.reduce((acc, item) => {
    const platform = getPlatform(item)
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {})
}

function buildPrompt(plan, counts) {
  const lines = [
    'You are a Christian media production manager for Yearning for God.',
    '',
    'Create a realistic production sprint for one person using a phone.',
    '',
    'Current counts:',
    `Ready to upload: ${counts.ready}`,
    `Needs video: ${counts.video}`,
    `Needs design: ${counts.design}`,
    `Missing live URLs: ${counts.missingUrl}`,
    `Published with URL: ${counts.publishedUrl}`,
    '',
    'Recommended daily target:',
    'Upload 4 posts, create 2 designs, create 2 videos, paste URLs immediately, and track stats tomorrow.',
    '',
    'Today upload candidates:',
    ...plan.upload.map((item, index) => `${index + 1}. ${getPlatform(item)} - ${getTitle(item)}`),
    '',
    'Design candidates:',
    ...plan.design.map((item, index) => `${index + 1}. ${getTitle(item)}`),
    '',
    'Video candidates:',
    ...plan.video.map((item, index) => `${index + 1}. ${getTitle(item)}`),
    '',
    'Return:',
    '1. Today priority order',
    '2. 4-post upload schedule',
    '3. 2 design tasks',
    '4. 2 video tasks',
    '5. What to track tomorrow',
  ]
  return lines.join('\n')
}

export default function ProductionSprint({ queue = [], performanceStats = [], setActiveTab, styles = {} }) {
  const [copied, setCopied] = useState('')
  const safeQueue = Array.isArray(queue) ? queue : []

  const sprint = useMemo(() => {
    const visible = safeQueue.filter((item) => !isTestOrInternal(item))
    const ready = visible.filter(isReady).sort(sortWorkItems)
    const video = visible.filter(needsVideo).sort(sortWorkItems)
    const design = visible.filter(needsDesign).sort(sortWorkItems)
    const url = visible.filter(missingUrl).sort(sortWorkItems)
    const publishedUrl = visible.filter(publishedWithUrl).sort(sortWorkItems)

    const plan = {
      upload: ready.slice(0, 4),
      design: design.slice(0, 3),
      video: video.slice(0, 3),
      url: url.slice(0, 5),
    }

    const counts = {
      ready: ready.length,
      video: video.length,
      design: design.length,
      missingUrl: url.length,
      publishedUrl: publishedUrl.length,
    }

    const platformCounts = countByPlatform(ready)
    const topPlatform =
      Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Facebook'

    let nextMove = 'Upload the first ready post.'
    if (ready.length === 0 && design.length > 0) nextMove = 'Create the first needed design.'
    if (ready.length === 0 && design.length === 0 && video.length > 0) nextMove = 'Produce the first needed video.'
    if (ready.length === 0 && design.length === 0 && video.length === 0 && url.length > 0) nextMove = 'Paste live URLs for published posts.'

    return {
      visible,
      ready,
      video,
      design,
      url,
      publishedUrl,
      plan,
      counts,
      topPlatform,
      nextMove,
      prompt: buildPrompt(plan, counts),
    }
  }, [safeQueue])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(sprint.prompt)
      setCopied('Production sprint prompt copied.')
    } catch (error) {
      setCopied('Copy failed. Long press the prompt area if your browser blocks clipboard access.')
    }
  }

  const card = styles.card || {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  }

  const button = styles.button || {
    border: '0',
    borderRadius: 12,
    padding: '12px 16px',
    fontWeight: 800,
    cursor: 'pointer',
  }

  const sectionTitle = {
    margin: '0 0 10px',
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 900,
  }

  const muted = {
    color: '#94a3b8',
    lineHeight: 1.5,
  }

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
    margin: '18px 0',
  }

  const countCard = {
    ...card,
    textAlign: 'center',
    marginBottom: 0,
  }

  function openTab(tab) {
    if (typeof setActiveTab === 'function') setActiveTab(tab)
  }

  function WorkList({ title, items, emptyText, actionLabel, actionTab }) {
    return (
      <div style={card}>
        <h3 style={sectionTitle}>{title}</h3>
        {items.length === 0 ? (
          <p style={muted}>{emptyText}</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((item, index) => (
              <div
                key={item.id || `${title}-${index}`}
                style={{
                  background: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ color: '#38bdf8', fontWeight: 900, marginBottom: 6 }}>
                  {index + 1}. {getPlatform(item)}
                </div>
                <div style={{ color: '#f8fafc', fontWeight: 900 }}>{getTitle(item)}</div>
                <p style={{ ...muted, margin: '8px 0 0' }}>{getSnippet(item)}</p>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => openTab(actionTab)}
          style={{ ...button, marginTop: 14, background: '#1d4ed8', color: 'white' }}
        >
          {actionLabel}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 style={styles.title || { color: '#f8fafc' }}>Production Sprint Board</h1>
      <p style={styles.subtitle || muted}>
        Daily production command center for uploads, designs, videos, URL cleanup, and follow-up tracking.
      </p>

      <div style={{ ...card, borderColor: '#38bdf8', background: '#082f49' }}>
        <h2 style={sectionTitle}>Recommended next move</h2>
        <p style={{ color: '#f8fafc', fontSize: 26, fontWeight: 900, margin: '10px 0' }}>
          {sprint.nextMove}
        </p>
        <p style={muted}>Best current platform focus: {sprint.topPlatform}.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button
            type="button"
            onClick={() => openTab('publishing')}
            style={{ ...button, background: '#22c55e', color: '#052e16' }}
          >
            Open Publishing Center
          </button>
          <button
            type="button"
            onClick={() => openTab('queue')}
            style={{ ...button, background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}
          >
            Open Queue
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            style={{ ...button, background: '#111827', color: '#f8fafc', border: '1px solid #334155' }}
          >
            Copy Sprint Prompt
          </button>
        </div>
        {copied && <p style={{ color: '#facc15', fontWeight: 800 }}>{copied}</p>}
      </div>

      <div style={grid}>
        <div style={countCard}>
          <div style={{ color: '#94a3b8', fontWeight: 900, letterSpacing: 1 }}>READY</div>
          <div style={{ color: '#22c55e', fontSize: 42, fontWeight: 900 }}>{sprint.counts.ready}</div>
        </div>
        <div style={countCard}>
          <div style={{ color: '#94a3b8', fontWeight: 900, letterSpacing: 1 }}>NEEDS VIDEO</div>
          <div style={{ color: '#a78bfa', fontSize: 42, fontWeight: 900 }}>{sprint.counts.video}</div>
        </div>
        <div style={countCard}>
          <div style={{ color: '#94a3b8', fontWeight: 900, letterSpacing: 1 }}>NEEDS DESIGN</div>
          <div style={{ color: '#f472b6', fontSize: 42, fontWeight: 900 }}>{sprint.counts.design}</div>
        </div>
        <div style={countCard}>
          <div style={{ color: '#94a3b8', fontWeight: 900, letterSpacing: 1 }}>MISSING URL</div>
          <div style={{ color: '#f59e0b', fontSize: 42, fontWeight: 900 }}>{sprint.counts.missingUrl}</div>
        </div>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>Today sprint target</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={muted}>1. Upload 4 ready posts.</div>
          <div style={muted}>2. Create 2 simple Canva designs.</div>
          <div style={muted}>3. Produce 2 short videos or audio-first clips.</div>
          <div style={muted}>4. Paste live URLs immediately after posting.</div>
          <div style={muted}>5. Tomorrow, record views, likes, comments, shares, and saves.</div>
        </div>
      </div>

      <WorkList
        title="Upload first today"
        items={sprint.plan.upload}
        emptyText="No ready upload items found. Create designs or videos first."
        actionLabel="Open Publishing Center"
        actionTab="publishing"
      />

      <WorkList
        title="Design first"
        items={sprint.plan.design}
        emptyText="No design blockers found."
        actionLabel="Open Queue"
        actionTab="queue"
      />

      <WorkList
        title="Video first"
        items={sprint.plan.video}
        emptyText="No video blockers found."
        actionLabel="Open Queue"
        actionTab="queue"
      />

      <WorkList
        title="URL cleanup first"
        items={sprint.plan.url}
        emptyText="No missing live URL items found. Good cleanup."
        actionLabel="Open Publishing Center"
        actionTab="publishing"
      />

      <div style={card}>
        <h2 style={sectionTitle}>Phone workflow</h2>
        <p style={muted}>
          Keep the workflow simple: Queue caption, create asset, upload manually, copy live URL,
          paste URL into Publishing Center, then check stats tomorrow.
        </p>
      </div>
    </div>
  )
}