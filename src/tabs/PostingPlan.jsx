import { useMemo } from 'react'

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function clean(value) {
  return String(value || '').trim()
}

function lower(value) {
  return clean(value).toLowerCase()
}

function getCombinedText(item) {
  return [
    item?.content_type,
    item?.campaign_stage,
    item?.ministry_name,
    item?.minister_name,
    item?.content_text,
    item?.published_by,
  ].map(clean).join(' ').toLowerCase()
}

function isInternalOrTest(item) {
  const text = getCombinedText(item)
  const blocked = [
    'dry run',
    'test post',
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
    'checklist',
  ]
  return blocked.some((word) => text.includes(word))
}

function isDesignItem(item) {
  const text = getCombinedText(item)
  return text.includes('poster') || text.includes('image prompt') || text.includes('design') || text.includes('thumbnail')
}

function isVideoItem(item) {
  const text = getCombinedText(item)
  return text.includes('video script') || text.includes('short video') || text.includes('audio-first') || text.includes('reel') || text.includes('shorts')
}

function isBirthdayItem(item) {
  return getCombinedText(item).includes('birthday')
}

function getPlatform(item) {
  const p = lower(item?.platform)
  if (p.includes('tiktok')) return 'TikTok'
  if (p.includes('youtube')) return 'YouTube Shorts'
  if (p.includes('facebook')) return 'Facebook'
  if (p.includes('instagram')) return 'Instagram'
  if (p.includes('thread')) return 'Threads'
  return clean(item?.platform) || 'General'
}

function isReadyToUpload(item) {
  if (!item || isInternalOrTest(item)) return false
  if (item.status === 'published') return false
  if (isDesignItem(item) || isVideoItem(item)) return false
  const status = lower(item.status)
  const stage = lower(item.campaign_stage)
  return status === 'scheduled' || status === 'ready' || stage.includes('ready')
}

function shortText(item, limit = 130) {
  const text = clean(item?.content_text || item?.content_type || item?.campaign_stage || 'No content preview')
  return text.length > limit ? text.slice(0, limit) + '...' : text
}

function priorityScore(item) {
  let score = 0
  if (isBirthdayItem(item)) score += 35
  const platform = lower(item?.platform)
  if (platform.includes('tiktok') || platform.includes('youtube')) score += 25
  if (platform.includes('facebook')) score += 15
  if (lower(item?.content_type).includes('prayer')) score += 10
  if (lower(item?.content_type).includes('sermon') || lower(item?.content_type).includes('short')) score += 10

  if (item?.scheduled_at) {
    const d = new Date(item.scheduled_at)
    if (!Number.isNaN(d.getTime())) {
      const hours = (d.getTime() - Date.now()) / 36e5
      if (hours <= 0) score += 30
      else if (hours <= 24) score += 20
      else if (hours <= 72) score += 10
    }
  }
  return score
}

function makePlan(queue) {
  const ready = safeArray(queue)
    .filter(isReadyToUpload)
    .map((item) => ({ ...item, _platform: getPlatform(item), _score: priorityScore(item) }))
    .sort((a, b) => b._score - a._score)

  const slots = [
    { time: '7:00 AM', label: 'Morning post' },
    { time: '12:00 PM', label: 'Midday encouragement' },
    { time: '6:00 PM', label: 'Evening short-form post' },
    { time: '9:00 PM', label: 'Night reflection' },
  ]

  const selected = []
  const usedPlatforms = new Set()

  ready.forEach((item) => {
    if (selected.length >= 4) return
    if (!usedPlatforms.has(item._platform)) {
      selected.push(item)
      usedPlatforms.add(item._platform)
    }
  })

  ready.forEach((item) => {
    if (selected.length >= 4) return
    if (!selected.some((x) => String(x.id) === String(item.id))) selected.push(item)
  })

  return selected.map((item, index) => ({ item, slot: slots[index] || { time: 'Flexible', label: 'Extra post' } }))
}

export default function PostingPlan({ queue = [], performanceStats = [], setActiveTab, styles = {} }) {
  const safeQueue = safeArray(queue)
  const safeStats = safeArray(performanceStats)

  const card = styles.card || { background: '#0f172a', border: '1px solid #24324a', borderRadius: 18, padding: 18, marginBottom: 18 }
  const smallButton = styles.smallButton || { padding: '9px 12px', borderRadius: 12, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', fontWeight: 800 }
  const actionButton = styles.actionButton || { padding: 12, borderRadius: 14, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 900 }

  const readyItems = safeQueue.filter(isReadyToUpload)
  const designItems = safeQueue.filter((item) => item?.status !== 'published' && isDesignItem(item) && !isInternalOrTest(item))
  const videoItems = safeQueue.filter((item) => item?.status !== 'published' && isVideoItem(item) && !isInternalOrTest(item))
  const missingUrls = safeQueue.filter((item) => item?.status === 'published' && !clean(item?.external_post_url) && !isInternalOrTest(item))
  const missingStats = safeQueue.filter((item) => {
    if (item?.status !== 'published' || isInternalOrTest(item)) return false
    return !safeStats.some((p) => String(p.queue_id || p.content_queue_id || p.post_id || '') === String(item.id))
  })

  const plan = useMemo(() => makePlan(safeQueue), [safeQueue])

  let topMove = 'Prepare new content opportunities from birthdays, sermons, and prayer themes.'
  let targetTab = 'dashboard'
  if (readyItems.length > 0) { topMove = 'Upload the first ready post in today posting plan.'; targetTab = 'publishing' }
  else if (designItems.length > 0 || videoItems.length > 0) { topMove = 'Finish the design or video assets blocking publication.'; targetTab = 'media-library' }
  else if (missingUrls.length > 0) { topMove = 'Paste missing live URLs in Publishing Center.'; targetTab = 'publishing' }
  else if (missingStats.length > 0) { topMove = 'Record performance stats for real published posts.'; targetTab = 'growth-tracker' }

  async function copyPostingPlanPrompt() {
    const planText = plan.length
      ? plan.map((entry, index) => {
          const item = entry.item
          return `${index + 1}. ${entry.slot.time} - ${item._platform} - ${item.minister_name || 'Yearning for God'} - ${item.content_type || item.campaign_stage || 'Content'} - ${shortText(item, 160)}`
        }).join('\n')
      : 'No ready posts are currently available.'

    const prompt = `You are a Christian media growth strategist for Yearning for God.\n\nCreate a practical manual posting plan for today using this summary.\n\nCurrent top move:\n${topMove}\n\nSuggested plan:\n${planText}\n\nCounts:\nReady to upload: ${readyItems.length}\nNeeds design: ${designItems.length}\nNeeds video: ${videoItems.length}\nMissing live URLs: ${missingUrls.length}\nMissing stats: ${missingStats.length}\n\nRules:\n- Keep it realistic for one person using a phone.\n- Prioritize spiritual impact and consistency.\n- Do not recommend online auto-publishing.\n\nReturn:\n1. Priority order\n2. Posting schedule\n3. Asset tasks\n4. Caption reminders\n5. What to track after posting`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Posting plan prompt copied')
    } catch {
      alert('Copy failed. Please copy manually.')
    }
  }

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 6 }}>Daily Posting Plan</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>Simple manual posting schedule from ready queue items and production needs.</p>

      <div style={{ ...card, borderColor: '#38bdf8', background: 'linear-gradient(135deg, rgba(14,165,233,.16), rgba(15,23,42,.88))' }}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Recommended next move</h3>
        <p style={{ color: '#e2e8f0', fontSize: 23, fontWeight: 900, margin: '8px 0 16px' }}>{topMove}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button style={actionButton} onClick={() => setActiveTab && setActiveTab(targetTab)}>Open Recommended Task</button>
          <button style={smallButton} onClick={copyPostingPlanPrompt}>Copy Posting Plan Prompt</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Ready to Upload', value: readyItems.length, color: '#22c55e' },
          { label: 'Needs Design', value: designItems.length, color: '#f472b6' },
          { label: 'Needs Video', value: videoItems.length, color: '#a78bfa' },
          { label: 'Missing URLs', value: missingUrls.length, color: '#f59e0b' },
          { label: 'Missing Stats', value: missingStats.length, color: '#38bdf8' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: 30, fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Today's Posting Plan</h3>
        {plan.length === 0 && <p style={{ color: '#94a3b8' }}>No ready-to-upload public posts found yet. Finish assets or move reviewed items to Ready/Scheduled.</p>}
        {plan.map((entry) => {
          const item = entry.item
          return (
            <div key={item.id} style={{ border: '1px solid rgba(51,65,85,.82)', background: 'rgba(2,6,23,.5)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <div style={{ color: '#38bdf8', fontSize: 13, fontWeight: 900 }}>{entry.slot.time} - {entry.slot.label}</div>
              <h4 style={{ color: '#f8fafc', margin: '6px 0' }}>{item._platform} - {item.content_type || item.campaign_stage || 'Ready Content'}</h4>
              <p style={{ color: '#94a3b8', margin: '3px 0' }}>{item.minister_name || 'Yearning for God'}</p>
              <p style={{ color: '#cbd5e1', fontSize: 13 }}>{shortText(item, 190)}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button style={smallButton} onClick={() => setActiveTab && setActiveTab('publishing')}>Open Publishing</button>
                <button style={smallButton} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue</button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={card}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Production blockers</h3>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>Fix these before expecting the posting plan to be full.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button style={smallButton} onClick={() => setActiveTab && setActiveTab('media-library')}>Open Media Library for design/video tasks</button>
          <button style={smallButton} onClick={() => setActiveTab && setActiveTab('publishing')}>Open Publishing Center for missing live URLs</button>
          <button style={smallButton} onClick={() => setActiveTab && setActiveTab('growth-tracker')}>Open Growth Tracker for missing stats</button>
          <button style={smallButton} onClick={() => setActiveTab && setActiveTab('platform-readiness')}>Open Platform Readiness</button>
        </div>
      </div>
    </div>
  )
}