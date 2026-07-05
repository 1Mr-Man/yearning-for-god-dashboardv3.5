import { useMemo, useState } from 'react'

function clean(value) {
  return String(value || '').trim()
}

function lc(value) {
  return clean(value).toLowerCase()
}

const PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', match: ['tiktok'], focus: 'Short-form sermon clips, prayer declarations, and worship moments.' },
  { key: 'youtube', label: 'YouTube Shorts', match: ['youtube', 'shorts'], focus: 'Audio-first sermon shorts, birthday honour shorts, and teaching clips.' },
  { key: 'facebook', label: 'Facebook', match: ['facebook'], focus: 'Honour posts, prayers, longer captions, and community engagement.' },
  { key: 'instagram', label: 'Instagram', match: ['instagram', 'reels'], focus: 'Poster graphics, reels, carousels, and quote visuals.' },
  { key: 'threads', label: 'Threads', match: ['thread'], focus: 'Short written reflections, prayers, and conversation starters.' },
]

function platformMatches(item, platform) {
  const p = lc(item.platform)
  if (!p && platform.key === 'facebook') return false
  return platform.match.some((word) => p.includes(word))
}

function isTestOrInternal(item) {
  const text = `${item.minister_name || ''} ${item.ministry_name || ''} ${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''} ${item.published_by || ''}`.toLowerCase()
  const bad = [
    'dry run',
    'test post',
    'facebook real test',
    'real facebook test',
    'controlled publishing test',
    'should not go live',
    'manual publishing checklist',
    'poster design prompt',
    'image prompt',
    'production note',
    'asset request',
    'media asset',
    'caption file',
    'internal workflow',
  ]
  return bad.some((word) => text.includes(word))
}

function isDesignItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('poster') || text.includes('image prompt') || text.includes('design') || text.includes('thumbnail')
}

function isVideoItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('video script') || text.includes('short video') || text.includes('audio-first') || text.includes('reel') || text.includes('shorts')
}

function isReadyToUpload(item) {
  if (item.status === 'published' || item.status === 'failed') return false
  if (isDesignItem(item) || isVideoItem(item)) return false
  const stage = lc(item.campaign_stage)
  return item.status === 'scheduled' || stage.includes('ready') || stage.includes('manual')
}

function getRecords(performanceStats) {
  const records = performanceStats?.records
  return Array.isArray(records) ? records : []
}

function hasPerformance(item, records) {
  return records.some((record) => String(record.content_queue_id || record.queue_id || '') === String(item.id || ''))
}

function getBestContentType(items) {
  const counts = {}
  items.forEach((item) => {
    const key = clean(item.content_type || item.campaign_stage || 'General') || 'General'
    counts[key] = (counts[key] || 0) + 1
  })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? `${top[0]} (${top[1]})` : 'Not enough data yet'
}

function getPlatformRecommendation(stat) {
  if (stat.ready > 0) return `Upload ${stat.ready} ready item${stat.ready === 1 ? '' : 's'} manually, then paste the live link.`
  if (stat.needsVideo > 0) return `Finish ${stat.needsVideo} video asset${stat.needsVideo === 1 ? '' : 's'} before uploading.`
  if (stat.needsDesign > 0) return `Create ${stat.needsDesign} poster or thumbnail asset${stat.needsDesign === 1 ? '' : 's'}.`
  if (stat.missingUrls > 0) return `Paste live URLs for ${stat.missingUrls} published item${stat.missingUrls === 1 ? '' : 's'}.`
  if (stat.missingStats > 0) return `Record growth stats for ${stat.missingStats} published item${stat.missingStats === 1 ? '' : 's'}.`
  if (stat.published > 0) return 'Review recent performance and repeat the strongest content style.'
  return 'Prepare one strong post for this platform.'
}

function getStatusLabel(stat) {
  if (stat.ready > 0) return { label: 'Ready to Upload', color: '#22c55e' }
  if (stat.needsDesign > 0 || stat.needsVideo > 0) return { label: 'Production Needed', color: '#f59e0b' }
  if (stat.missingUrls > 0 || stat.missingStats > 0) return { label: 'Tracking Needed', color: '#38bdf8' }
  if (stat.published > 0) return { label: 'Active', color: '#a78bfa' }
  return { label: 'Needs Content', color: '#94a3b8' }
}

export default function PlatformReadiness({
  queue = [],
  performanceStats = {},
  setActiveTab,
  styles = {},
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [showDetails, setShowDetails] = useState(true)

  const card = styles.card || { background: '#0f172a', border: '1px solid #24324a', borderRadius: 18, padding: 18, marginBottom: 18 }
  const smallButton = styles.smallButton || { padding: '8px 12px', borderRadius: 12, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', fontWeight: 800 }
  const activeButton = styles.activeFilterButton || { padding: '8px 12px', borderRadius: 12, border: '1px solid #22c55e', background: '#22c55e', color: '#052e16', fontWeight: 900 }

  const records = getRecords(performanceStats)
  const realQueue = useMemo(() => queue.filter((item) => !isTestOrInternal(item)), [queue])

  const platformStats = useMemo(() => {
    return PLATFORMS.map((platform) => {
      const items = realQueue.filter((item) => platformMatches(item, platform))
      const publishedItems = items.filter((item) => item.status === 'published')
      const readyItems = items.filter(isReadyToUpload)
      const needsDesign = items.filter((item) => item.status !== 'published' && isDesignItem(item)).length
      const needsVideo = items.filter((item) => item.status !== 'published' && isVideoItem(item)).length
      const missingUrls = publishedItems.filter((item) => !clean(item.external_post_url)).length
      const missingStats = publishedItems.filter((item) => !hasPerformance(item, records)).length
      const status = getStatusLabel({ ready: readyItems.length, needsDesign, needsVideo, missingUrls, missingStats, published: publishedItems.length })

      return {
        ...platform,
        total: items.length,
        ready: readyItems.length,
        published: publishedItems.length,
        scheduled: items.filter((item) => item.status === 'scheduled').length,
        drafts: items.filter((item) => item.status === 'draft').length,
        failed: items.filter((item) => item.status === 'failed').length,
        needsDesign,
        needsVideo,
        missingUrls,
        missingStats,
        bestContentType: getBestContentType(publishedItems.length ? publishedItems : items),
        recommendation: getPlatformRecommendation({ ready: readyItems.length, needsDesign, needsVideo, missingUrls, missingStats, published: publishedItems.length }),
        status,
        items,
        readyItems,
        publishedItems,
      }
    })
  }, [realQueue, records])

  const visibleStats = selectedPlatform === 'all'
    ? platformStats
    : platformStats.filter((item) => item.key === selectedPlatform)

  const totals = platformStats.reduce((sum, item) => ({
    ready: sum.ready + item.ready,
    needsDesign: sum.needsDesign + item.needsDesign,
    needsVideo: sum.needsVideo + item.needsVideo,
    missingUrls: sum.missingUrls + item.missingUrls,
    missingStats: sum.missingStats + item.missingStats,
    published: sum.published + item.published,
  }), { ready: 0, needsDesign: 0, needsVideo: 0, missingUrls: 0, missingStats: 0, published: 0 })

  const topPlatform = [...platformStats].sort((a, b) => {
    const aScore = a.ready * 5 + a.published * 2 - a.needsDesign - a.needsVideo
    const bScore = b.ready * 5 + b.published * 2 - b.needsDesign - b.needsVideo
    return bScore - aScore
  })[0]

  const topTask = (() => {
    const ready = platformStats.find((item) => item.ready > 0)
    if (ready) return { text: `Upload ready content to ${ready.label}.`, tab: 'publishing' }
    const design = platformStats.find((item) => item.needsDesign > 0 || item.needsVideo > 0)
    if (design) return { text: `Finish media assets for ${design.label}.`, tab: 'media-library' }
    const stats = platformStats.find((item) => item.missingStats > 0)
    if (stats) return { text: `Record growth stats for ${stats.label}.`, tab: 'growth-tracker' }
    return { text: 'Prepare one new strong post for your best platform.', tab: 'queue' }
  })()

  async function copyPlatformPlan() {
    const lines = platformStats.map((item) => (
      `${item.label}: ready ${item.ready}, published ${item.published}, needs design ${item.needsDesign}, needs video ${item.needsVideo}, missing URLs ${item.missingUrls}, missing stats ${item.missingStats}. Recommended action: ${item.recommendation}`
    )).join('\n')

    const prompt = `You are a Christian media growth strategist for Yearning for God.\n\nReview this platform readiness report and create a practical 7-day manual publishing plan.\n\n${lines}\n\nRules:\n- Prioritize TikTok, YouTube Shorts, Facebook, Instagram, and Threads.\n- Keep the plan realistic for one person working mostly on mobile.\n- Focus on Christian short-form growth, birthday campaigns, sermon clips, prayer posts, and worship content.\n- Give a daily action list and what to post first.\n- Do not recommend paid tools unless clearly optional.\n\nReturn:\n1. Best platform to focus on today\n2. 7-day platform posting plan\n3. What to prepare in Media Library\n4. What to upload manually\n5. What stats to track afterward`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Platform plan prompt copied')
    } catch {
      alert('Copy failed. Select and copy manually.')
    }
  }

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 6 }}>Platform Readiness Center</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Manage manual posting readiness across TikTok, YouTube Shorts, Facebook, Instagram, and Threads.
      </p>

      <div style={{ ...card, borderColor: '#38bdf8', background: 'linear-gradient(135deg, rgba(14,165,233,.16), rgba(15,23,42,.9))' }}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Recommended next move</h3>
        <p style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 900, margin: '8px 0' }}>{topTask.text}</p>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>
          Best current focus: {topPlatform ? topPlatform.label : 'Not enough data yet'}.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button style={activeButton} onClick={() => setActiveTab?.(topTask.tab)}>Open Recommended Task</button>
          <button style={smallButton} onClick={copyPlatformPlan}>Copy Platform Plan Prompt</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Ready to Upload', value: totals.ready, color: '#22c55e' },
          { label: 'Needs Design', value: totals.needsDesign, color: '#f472b6' },
          { label: 'Needs Video', value: totals.needsVideo, color: '#a78bfa' },
          { label: 'Missing URLs', value: totals.missingUrls, color: '#f59e0b' },
          { label: 'Missing Stats', value: totals.missingStats, color: '#38bdf8' },
          { label: 'Published', value: totals.published, color: '#22c55e' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: 30, fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Platform filter</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button style={selectedPlatform === 'all' ? activeButton : smallButton} onClick={() => setSelectedPlatform('all')}>All Platforms</button>
          {PLATFORMS.map((platform) => (
            <button key={platform.key} style={selectedPlatform === platform.key ? activeButton : smallButton} onClick={() => setSelectedPlatform(platform.key)}>
              {platform.label}
            </button>
          ))}
          <button style={smallButton} onClick={() => setShowDetails(!showDetails)}>{showDetails ? 'Hide Details' : 'Show Details'}</button>
        </div>
      </div>

      {visibleStats.map((platform) => (
        <div key={platform.key} style={{ ...card, borderColor: platform.status.color }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: '#f8fafc', marginTop: 0, marginBottom: 6 }}>{platform.label}</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>{platform.focus}</p>
            </div>
            <div style={{ color: platform.status.color, fontWeight: 900 }}>{platform.status.label}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 10, marginTop: 14 }}>
            {[
              ['Ready', platform.ready, '#22c55e'],
              ['Published', platform.published, '#22c55e'],
              ['Drafts', platform.drafts, '#94a3b8'],
              ['Design', platform.needsDesign, '#f472b6'],
              ['Video', platform.needsVideo, '#a78bfa'],
              ['No URL', platform.missingUrls, '#f59e0b'],
              ['No Stats', platform.missingStats, '#38bdf8'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'rgba(2,6,23,.55)', border: '1px solid rgba(51,65,85,.75)', borderRadius: 14, padding: 10 }}>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900 }}>{label}</div>
                <div style={{ color, fontSize: 22, fontWeight: 900 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: 'rgba(2,6,23,.45)', border: '1px solid rgba(51,65,85,.75)' }}>
            <strong style={{ color: '#f8fafc' }}>Recommended action</strong>
            <p style={{ color: '#cbd5e1', margin: '6px 0' }}>{platform.recommendation}</p>
            <p style={{ color: '#94a3b8', margin: 0 }}>Best content type so far: {platform.bestContentType}</p>
          </div>

          {showDetails && platform.items.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <strong style={{ color: '#f8fafc' }}>Recent items</strong>
              {platform.items.slice(0, 5).map((item) => (
                <div key={item.id} style={{ marginTop: 8, padding: 10, borderRadius: 12, background: 'rgba(15,23,42,.6)', border: '1px solid rgba(51,65,85,.65)' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 800 }}>{item.content_type || item.campaign_stage || 'Content item'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.minister_name || 'Yearning for God'} - {item.status || 'draft'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}