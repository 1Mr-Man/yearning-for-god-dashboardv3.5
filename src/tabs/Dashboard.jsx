import { useEffect, useMemo, useState } from 'react'

function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function clean(value) {
  return String(value || '').trim()
}

function hasUsableDate(value) {
  if (isEmpty(value)) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime())
}

function profileScore(minister) {
  const bio = clean(minister.biography || minister.bio || minister.about || minister.description)
  const birthdayExact = hasUsableDate(minister.birthday) || hasUsableDate(minister.date_of_birth)
  const birthdayText = !birthdayExact && !isEmpty(minister.birthday_text)
  const verification = clean(minister.verification_status).toLowerCase()
  const source = clean(minister.source_note || minister.source_url || minister.website || minister.official_website)
  const image = clean(minister.profile_image_url || minister.image_url || minister.photo_url)
  const social = clean(minister.facebook_url || minister.instagram_url || minister.youtube_url || minister.tiktok_url || minister.social_links)

  const checks = [
    { max: 10, points: !isEmpty(minister.minister_name || minister.name) ? 10 : 0 },
    { max: 10, points: !isEmpty(minister.ministry_name || minister.ministry) ? 10 : 0 },
    { max: 8, points: !isEmpty(minister.country) ? 8 : 0 },
    { max: 15, points: birthdayExact ? 15 : birthdayText ? 8 : 0 },
    { max: 20, points: bio.length >= 250 ? 20 : bio.length >= 100 ? 14 : bio.length >= 30 ? 8 : 0 },
    { max: 5, points: !isEmpty(minister.status) ? 5 : 0 },
    { max: 10, points: source.length >= 15 ? 10 : source.length > 0 ? 5 : 0 },
    { max: 10, points: verification === 'verified' ? 10 : verification === 'needs review' ? 5 : 0 },
    { max: 6, points: image ? 6 : 0 },
    { max: 6, points: social ? 6 : 0 },
  ]

  const total = checks.reduce((sum, item) => sum + item.max, 0)
  const earned = checks.reduce((sum, item) => sum + item.points, 0)
  return Math.round((earned / total) * 100)
}

const MEDIA_STORAGE_KEY = 'yfg_media_library_assets_v1'

function loadMediaAssetsFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return []
    const parsed = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function queueText(item) {
  return `${item?.minister_name || ''} ${item?.platform || ''} ${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.content_text || ''}`.toLowerCase()
}


function isTestPost(item) {
  const text = queueText(item)
  return (
    text.includes('dry run') ||
    text.includes('test post') ||
    text.includes('real facebook test') ||
    text.includes('controlled publishing test') ||
    text.includes('should not go live')
  )
}


function isInternalWorkflowItem(item) {
  const text = queueText(item)
  return (
    text.includes('manual publishing checklist') ||
    text.includes('checklist') ||
    text.includes('poster design prompt') ||
    text.includes('image prompt') ||
    text.includes('design prompt') ||
    text.includes('production note') ||
    text.includes('asset request') ||
    text.includes('media asset') ||
    text.includes('caption file') ||
    text.includes('internal workflow') ||
    text.includes('source note: needs source review') ||
    text.includes('this is a reminder to prepare')
  )
}

function isRealPublicPublishedPost(item) {
  if (!item || item.status !== 'published') return false
  if (isTestPost(item)) return false
  if (isInternalWorkflowItem(item)) return false

  const text = queueText(item)
  if (!text || text.length < 20) return false
  return true
}

function recordText(record) {
  return `${record?.platform || ''} ${record?.content_type || ''} ${record?.minister_name || ''} ${record?.notes || ''}`.toLowerCase()
}

function isTestRecord(record, queueMap) {
  const linkedPost = queueMap.get(String(record?.content_queue_id || ''))
  if (linkedPost && isTestPost(linkedPost)) return true
  const text = recordText(record)
  return (
    text.includes('dry run') ||
    text.includes('test post') ||
    text.includes('real facebook test') ||
    text.includes('controlled publishing test') ||
    text.includes('should not go live') ||
    text.includes('dummy post') ||
    text.includes('sample post')
  )
}

function isInternalRecord(record, queueMap) {
  const linkedPost = queueMap.get(String(record?.content_queue_id || ''))
  if (linkedPost && isInternalWorkflowItem(linkedPost)) return true
  const text = recordText(record)
  return (
    text.includes('manual publishing checklist') ||
    text.includes('poster design prompt') ||
    text.includes('image prompt') ||
    text.includes('production note') ||
    text.includes('asset request') ||
    text.includes('internal workflow')
  )
}

function aggregateRecords(records) {
  const toNum = (v) => Number(v || 0)
  const totals = records.reduce((acc, record) => {
    acc.views += toNum(record.views)
    acc.likes += toNum(record.likes)
    acc.comments += toNum(record.comments)
    acc.shares += toNum(record.shares)
    acc.saves += toNum(record.saves)
    acc.followers += toNum(record.followers_gained)
    return acc
  }, { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0 })

  const byPlatform = {}
  const byContentType = {}
  records.forEach((record) => {
    const platform = record.platform || 'Unknown'
    const type = record.content_type || 'Unknown'
    byPlatform[platform] = byPlatform[platform] || { views: 0, count: 0 }
    byContentType[type] = byContentType[type] || { views: 0, count: 0 }
    byPlatform[platform].views += toNum(record.views)
    byPlatform[platform].count += 1
    byContentType[type].views += toNum(record.views)
    byContentType[type].count += 1
  })

  const bestPost = [...records].sort((a, b) => toNum(b.views) - toNum(a.views))[0] || null

  return { totals, byPlatform, byContentType, bestPost }
}

function isBirthdayPackItem(item) {
  return queueText(item).includes('birthday')
}

function isDesignItem(item) {
  const text = queueText(item)
  return text.includes('poster') || text.includes('design') || text.includes('thumbnail') || text.includes('image prompt') || text.includes('graphic')
}

function isVideoItem(item) {
  const text = queueText(item)
  return text.includes('video') || text.includes('short') || text.includes('audio-first') || text.includes('reel')
}

function isChecklistItem(item) {
  return queueText(item).includes('checklist')
}

function daysFromNow(dateValue) {
  if (!dateValue) return null
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return null
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Dashboard({
  loading,
  ministers = [],
  queue = [],
  todayPrayerPackExists,
  todayPrayerPostCount,
  nextScheduledPost,
  birthdayOpportunities = [],
  busy,
  setActiveTab,
  generateAllUpcomingCampaigns,
  generateBirthdayCampaign,
  getMinisterName,
  getBirthdayColor,
  campaignAlreadyGenerated,
  performanceStats = {},
  styles,
}) {
  const card = styles?.card || { background: '#0f172a', border: '1px solid #24324a', borderRadius: 18, padding: 20, marginBottom: 18 }
  const actionButton = styles?.actionButton || { padding: '10px 14px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 800 }
  const smallButton = styles?.smallButton || { padding: '8px 10px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', fontWeight: 800 }

  const [mediaAssets, setMediaAssets] = useState([])

  useEffect(() => {
    function refreshAssets() {
      setMediaAssets(loadMediaAssetsFromStorage())
    }
    refreshAssets()
    window.addEventListener('focus', refreshAssets)
    window.addEventListener('storage', refreshAssets)
    return () => {
      window.removeEventListener('focus', refreshAssets)
      window.removeEventListener('storage', refreshAssets)
    }
  }, [])

  const scheduled = queue.filter((p) => p.status === 'scheduled').length
  const draft = queue.filter((p) => p.status === 'draft').length
  const published = queue.filter((p) => p.status === 'published').length
  const failed = queue.filter((p) => p.status === 'failed').length
  const audioFirstDrafts = queue.filter((p) => String(p.content_type || '').toLowerCase().includes('audio-first')).length
  const manualClipDrafts = queue.filter((p) => String(p.campaign_stage || '').toLowerCase().includes('audio-first') || String(p.campaign_stage || '').toLowerCase().includes('manual ai')).length

  const production = useMemo(() => {
    const birthdayItems = queue.filter(isBirthdayPackItem)
    const draftBirthdayItems = birthdayItems.filter((item) => item.status === 'draft')
    const designItems = birthdayItems.filter((item) => item.status !== 'published' && isDesignItem(item))
    const videoItems = birthdayItems.filter((item) => item.status !== 'published' && isVideoItem(item))
    const checklistItems = birthdayItems.filter(isChecklistItem)
    const mediaNeeded = mediaAssets.filter((asset) => asset.status === 'Needed')
    const mediaInProgress = mediaAssets.filter((asset) => asset.status === 'In Progress')
    const mediaReady = mediaAssets.filter((asset) => asset.status === 'Ready')
    const linkedAssets = mediaAssets.filter((asset) => asset.related_queue_id)
    const overdueScheduled = queue.filter((item) => {
      if (item.status !== 'scheduled' || !item.scheduled_at) return false
      const scheduledAt = new Date(item.scheduled_at)
      return !Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() < Date.now()
    })
    const readyToUpload = queue.filter((item) => item.status === 'scheduled' && !overdueScheduled.some((overdue) => overdue.id === item.id))
    const nextBirthday = [...birthdayOpportunities].sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0))[0]

    let recommendedAction = 'Review drafts and create media assets.'
    let recommendedTab = 'queue'
    if (birthdayOpportunities.length > 0 && birthdayItems.length === 0) {
      recommendedAction = 'Generate birthday campaign packs from Birthday Center.'
      recommendedTab = 'birthdays'
    } else if (mediaNeeded.length > 0) {
      recommendedAction = 'Produce the needed poster/video assets in Media Library.'
      recommendedTab = 'media-library'
    } else if (mediaReady.length > 0) {
      recommendedAction = 'Use ready assets to prepare uploads and mark queue items ready.'
      recommendedTab = 'queue'
    } else if (readyToUpload.length > 0) {
      recommendedAction = 'Manually upload ready posts and mark them published.'
      recommendedTab = 'queue'
    }

    return {
      birthdayItems,
      draftBirthdayItems,
      designItems,
      videoItems,
      checklistItems,
      mediaNeeded,
      mediaInProgress,
      mediaReady,
      linkedAssets,
      overdueScheduled,
      readyToUpload,
      nextBirthday,
      recommendedAction,
      recommendedTab,
    }
  }, [queue, mediaAssets, birthdayOpportunities])

  const strongProfiles = ministers.filter((m) => profileScore(m) >= 75).length
  const usableProfiles = ministers.filter((m) => profileScore(m) >= 50).length
  const weakProfiles = Math.max(0, ministers.length - usableProfiles)
  const avgProfileScore = ministers.length ? Math.round(ministers.reduce((sum, m) => sum + profileScore(m), 0) / ministers.length) : 0
  const readinessParts = [
    ministers.length > 0,
    queue.length > 0,
    scheduled > 0 || draft > 0,
    usableProfiles > 0,
    audioFirstDrafts > 0 || manualClipDrafts > 0,
    failed === 0,
  ]
  const readinessScore = Math.round((readinessParts.filter(Boolean).length / readinessParts.length) * 100)

  const growth = useMemo(() => {
    const rawRecords = Array.isArray(performanceStats.records) ? performanceStats.records : []
    const queueMap = new Map(queue.map((item) => [String(item.id), item]))
    const records = rawRecords.filter((record) => !isTestRecord(record, queueMap) && !isInternalRecord(record, queueMap))
    const summary = aggregateRecords(records)
    const totals = summary.totals
    const engagement = totals.likes + totals.comments + totals.shares + totals.saves
    const engagementRate = totals.views > 0 ? Math.round((engagement / totals.views) * 1000) / 10 : 0
    const topPlatform = Object.entries(summary.byPlatform).sort((a, b) => (b[1]?.views || 0) - (a[1]?.views || 0))[0]
    const topContentType = Object.entries(summary.byContentType).sort((a, b) => (b[1]?.views || 0) - (a[1]?.views || 0))[0]
    const bestPost = summary.bestPost
    const publishedWithoutStats = queue.filter((item) => {
      if (!isRealPublicPublishedPost(item)) return false
      return !records.some((r) => String(r.content_queue_id) === String(item.id))
    })

    let nextMove = 'Publish at least one real public post, then record its performance.'
    let nextTab = 'publishing'
    if (publishedWithoutStats.length > 0) {
      nextMove = `Record performance for ${publishedWithoutStats.length} real public published post(s).`
      nextTab = 'growth'
    } else if (records.length > 0 && topContentType) {
      nextMove = `Create more content like "${topContentType[0]}" because it is your strongest recorded format.`
      nextTab = 'queue'
    } else if (production.readyToUpload.length > 0) {
      nextMove = 'Upload ready posts manually, paste the live URLs, then record performance tomorrow.'
      nextTab = 'publishing'
    }

    return {
      records,
      totals,
      engagementRate,
      topPlatform,
      topContentType,
      bestPost,
      publishedWithoutStats,
      nextMove,
      nextTab,
    }
  }, [performanceStats, queue, production.readyToUpload.length])

  const opportunityEngine = useMemo(() => {
    const rawRecords = Array.isArray(performanceStats.records) ? performanceStats.records : []
    const queueMap = new Map(queue.map((item) => [String(item.id), item]))
    const records = rawRecords.filter((record) => !isTestRecord(record, queueMap) && !isInternalRecord(record, queueMap))
    const hasStats = (item) => records.some((record) => String(record.content_queue_id) === String(item.id))

    const pendingBirthdayCampaigns = birthdayOpportunities
      .filter((item) => {
        try {
          return !campaignAlreadyGenerated(item.minister, item.daysRemaining)
        } catch {
          return true
        }
      })
      .sort((a, b) => (Number(a.daysRemaining || 0) - Number(b.daysRemaining || 0)))

    const urgentBirthdays = pendingBirthdayCampaigns.filter((item) => Number(item.daysRemaining || 0) <= 1)
    const realPublishedWithoutStats = queue.filter((item) => isRealPublicPublishedPost(item) && !hasStats(item))
    const nonTestReadyToUpload = production.readyToUpload.filter((item) => !isTestPost(item))
    const nonTestOverdue = production.overdueScheduled.filter((item) => !isTestPost(item))
    const weakMinisterProfiles = ministers.filter((minister) => profileScore(minister) < 75)

    const opportunities = []

    urgentBirthdays.forEach((item) => {
      opportunities.push({
        priority: 100 - Number(item.daysRemaining || 0),
        level: 'Urgent',
        title: Number(item.daysRemaining || 0) === 0 ? 'Publish birthday honour post today' : 'Prepare birthday post for tomorrow',
        detail: `${getMinisterName(item.minister)} - ${Number(item.daysRemaining || 0) === 0 ? 'birthday today' : `${item.daysRemaining} day(s) remaining`}`,
        tab: 'birthdays',
        action: 'Open Birthdays',
      })
    })

    pendingBirthdayCampaigns
      .filter((item) => Number(item.daysRemaining || 0) > 1)
      .slice(0, 4)
      .forEach((item) => {
        opportunities.push({
          priority: 88 - Number(item.daysRemaining || 0),
          level: 'High',
          title: 'Generate upcoming birthday campaign',
          detail: `${getMinisterName(item.minister)} - ${item.daysRemaining} day(s) remaining`,
          tab: 'birthdays',
          action: 'Generate Campaign',
        })
      })

    if (production.mediaNeeded.length > 0) {
      opportunities.push({
        priority: 84,
        level: 'High',
        title: 'Produce needed media assets',
        detail: `${production.mediaNeeded.length} asset request(s) still marked Needed`,
        tab: 'media-library',
        action: 'Open Media Library',
      })
    }

    if (production.designItems.length > 0) {
      opportunities.push({
        priority: 78,
        level: 'High',
        title: 'Create poster/design assets',
        detail: `${production.designItems.length} queue item(s) need poster, thumbnail, or design work`,
        tab: 'queue',
        action: 'Open Queue',
      })
    }

    if (production.videoItems.length > 0) {
      opportunities.push({
        priority: 74,
        level: 'Medium',
        title: 'Create short video assets',
        detail: `${production.videoItems.length} queue item(s) need short video or audio-first production`,
        tab: 'queue',
        action: 'Open Queue',
      })
    }

    if (nonTestReadyToUpload.length > 0) {
      opportunities.push({
        priority: 90,
        level: 'High',
        title: 'Upload ready content manually',
        detail: `${nonTestReadyToUpload.length} item(s) are ready/scheduled for manual posting`,
        tab: 'publishing',
        action: 'Open Publishing',
      })
    }

    if (nonTestOverdue.length > 0) {
      opportunities.push({
        priority: 92,
        level: 'Urgent',
        title: 'Resolve overdue scheduled items',
        detail: `${nonTestOverdue.length} scheduled item(s) are past time and need attention`,
        tab: 'queue',
        action: 'Open Queue',
      })
    }

    if (realPublishedWithoutStats.length > 0) {
      opportunities.push({
        priority: 72,
        level: 'Medium',
        title: 'Record performance stats',
        detail: `${realPublishedWithoutStats.length} real published post(s) are missing growth data`,
        tab: 'growth',
        action: 'Open Growth Tracker',
      })
    }

    if (weakMinisterProfiles.length > 0) {
      opportunities.push({
        priority: 55,
        level: 'Low',
        title: 'Improve minister profile quality',
        detail: `${weakMinisterProfiles.length} profile(s) are below 75 percent quality`,
        tab: 'minister-updates',
        action: 'Open Minister Updates',
      })
    }

    if (opportunities.length === 0) {
      opportunities.push({
        priority: 40,
        level: 'Stable',
        title: 'No urgent production blockers',
        detail: 'Review Growth Tracker and create the next content batch.',
        tab: 'growth',
        action: 'Open Growth Tracker',
      })
    }

    const sorted = opportunities.sort((a, b) => b.priority - a.priority)
    return {
      opportunities: sorted,
      top: sorted[0],
      urgentCount: sorted.filter((item) => item.level === 'Urgent').length,
      highCount: sorted.filter((item) => item.level === 'High').length,
      productionCount: production.mediaNeeded.length + production.designItems.length + production.videoItems.length,
      statsMissingCount: realPublishedWithoutStats.length,
    }
  }, [
    birthdayOpportunities,
    campaignAlreadyGenerated,
    getMinisterName,
    ministers,
    performanceStats,
    production.designItems,
    production.mediaNeeded,
    production.overdueScheduled,
    production.readyToUpload,
    production.videoItems,
    queue,
  ])

  async function copyOpportunityReviewPrompt() {
    const lines = opportunityEngine.opportunities.slice(0, 10).map((item, index) => {
      return `${index + 1}. [${item.level}] ${item.title} - ${item.detail}`
    }).join('\n')

    const prompt = `You are a Christian media growth strategist for "Yearning for God".

Review this daily opportunity list and give me a practical 7-day action plan.

Current opportunities:
${lines}

Rules:
- Prioritize urgent birthdays, manual publishing, media assets, and growth tracking.
- Keep it practical for a mobile-first workflow.
- Recommend what to do today, tomorrow, and this week.
- Do not suggest online auto-publishing. The system is manual-first for now.
- Keep the plan focused on TikTok, YouTube Shorts, Facebook, Instagram, and Threads.

Return:
1. Today's top 3 tasks
2. This week's production plan
3. Which platform to focus on first
4. What to avoid
5. Next 10 content ideas`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Opportunity review prompt copied')
    } catch {
      alert('Copy failed. Please copy the opportunity list manually.')
    }
  }

  const statCards = [
    { label: 'Launch Readiness', value: `${readinessScore}%`, sub: 'manual-first system', tab: 'sunday-workflow' },
    { label: 'Ministers', value: loading ? '...' : ministers.length, sub: `${strongProfiles} strong - ${weakProfiles} weak`, tab: 'minister-updates' },
    { label: 'Profile Quality', value: `${avgProfileScore}%`, sub: 'average database score', tab: 'minister-updates' },
    { label: 'Queue Items', value: queue.length, sub: `${scheduled} scheduled - ${draft} drafts`, tab: 'queue' },
    { label: 'Audio-First Drafts', value: audioFirstDrafts || manualClipDrafts, sub: 'clip drafts ready for production', tab: 'youtube-sermons' },
    { label: 'Failed Posts', value: failed, sub: failed ? 'needs cleanup' : 'none detected', tab: 'queue' },
    { label: 'Growth Records', value: growth.records.length, sub: `${growth.totals.views.toLocaleString()} views logged`, tab: 'growth' },
  ]

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 8 }}>Command Dashboard</h2>
      <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: 18 }}>Manual-first launch control for Yearning for God.</p>

      <div style={{ ...card, background: 'linear-gradient(135deg, #312e81, #0f172a)', borderColor: '#6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff' }}>System Mode: Manual Upload + Audio-First Shorts</h3>
            <p style={{ marginBottom: 0, color: '#cbd5e1' }}>Online auto-publishing is paused. Use the dashboard to prepare, track, and publish manually.</p>
          </div>
          <div style={{ color: readinessScore >= 80 ? '#22c55e' : readinessScore >= 50 ? '#f59e0b' : '#ef4444', fontSize: 34, fontWeight: 900 }}>{readinessScore}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        {statCards.map((item) => (
          <div key={item.label} style={{ ...card, marginBottom: 0, cursor: 'pointer' }} onClick={() => setActiveTab(item.tab)}>
            <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 800 }}>{item.label}</div>
            <div style={{ color: '#f8fafc', fontSize: 30, fontWeight: 900, marginTop: 8 }}>{item.value}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, borderColor: '#38bdf8', background: 'linear-gradient(135deg, rgba(14,116,144,0.28), rgba(15,23,42,0.94))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Content Opportunity Engine</h3>
            <p style={{ color: '#cbd5e1', margin: '6px 0 0' }}>Daily priority list across birthdays, queue, media, publishing, and growth tracking.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button style={{ ...smallButton, background: '#0ea5e9', borderColor: '#7dd3fc', color: '#082f49' }} onClick={() => setActiveTab(opportunityEngine.top.tab)}>
              Open Top Task
            </button>
            <button style={smallButton} onClick={copyOpportunityReviewPrompt}>Copy Review Prompt</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Urgent', value: opportunityEngine.urgentCount, color: '#ef4444' },
            { label: 'High Priority', value: opportunityEngine.highCount, color: '#f59e0b' },
            { label: 'Production Tasks', value: opportunityEngine.productionCount, color: '#38bdf8' },
            { label: 'Stats Missing', value: opportunityEngine.statsMissingCount, color: '#a78bfa' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'rgba(2,6,23,0.52)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 14, padding: 12 }}>
              <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900 }}>{stat.label}</div>
              <div style={{ color: stat.color, fontSize: 24, fontWeight: 900, marginTop: 5 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: 13, borderRadius: 16, border: '1px solid rgba(125,211,252,0.45)', background: 'rgba(2,6,23,0.55)' }}>
          <div style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Top Opportunity</div>
          <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 17, marginTop: 4 }}>{opportunityEngine.top.title}</div>
          <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{opportunityEngine.top.detail}</div>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {opportunityEngine.opportunities.slice(0, 6).map((item, index) => (
            <div key={`${item.title}-${index}`} style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 14, padding: 13, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: item.level === 'Urgent' ? '#fca5a5' : item.level === 'High' ? '#fbbf24' : '#cbd5e1', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>{item.level} - Priority {index + 1}</div>
                <strong style={{ color: '#f8fafc' }}>{item.title}</strong>
                <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 12 }}>{item.detail}</p>
              </div>
              <button style={smallButton} onClick={() => setActiveTab(item.tab)}>{item.action}</button>
            </div>
          ))}
        </div>
      </div>


      <div style={{ ...card, borderColor: '#7c3aed', background: 'linear-gradient(135deg, rgba(88,28,135,0.45), rgba(15,23,42,0.92))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff' }}>Production Status Dashboard</h3>
            <p style={{ color: '#cbd5e1', marginBottom: 0 }}>What needs design, video, assets, upload, or attention today.</p>
          </div>
          <button style={{ ...smallButton, background: '#7c3aed', borderColor: '#a78bfa' }} onClick={() => setActiveTab(production.recommendedTab)}>Open Recommended Task</button>
        </div>
        <div style={{ marginTop: 14, padding: 13, borderRadius: 16, border: '1px solid rgba(167,139,250,0.45)', background: 'rgba(2,6,23,0.55)' }}>
          <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Today's Best Move</div>
          <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 17, marginTop: 4 }}>{production.recommendedAction}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Birthday Pack', value: production.birthdayItems.length, sub: 'queue items', color: '#f472b6', tab: 'queue' },
          { label: 'Needs Design', value: production.designItems.length, sub: 'poster/graphic tasks', color: '#f59e0b', tab: 'queue' },
          { label: 'Needs Video', value: production.videoItems.length, sub: 'short/video tasks', color: '#38bdf8', tab: 'queue' },
          { label: 'Media Needed', value: production.mediaNeeded.length, sub: 'asset requests', color: '#ef4444', tab: 'media-library' },
          { label: 'Assets Ready', value: production.mediaReady.length, sub: 'ready to use', color: '#22c55e', tab: 'media-library' },
          { label: 'Ready Upload', value: production.readyToUpload.length, sub: 'scheduled/manual', color: '#a78bfa', tab: 'queue' },
          { label: 'Overdue', value: production.overdueScheduled.length, sub: 'needs attention', color: '#fb7185', tab: 'queue' },
          { label: 'Next Birthday', value: production.nextBirthday ? `${production.nextBirthday.daysRemaining}d` : '-', sub: production.nextBirthday ? getMinisterName(production.nextBirthday.minister) : 'none in 30 days', color: '#facc15', tab: 'birthdays' },
        ].map((item) => (
          <div key={item.label} style={{ ...card, marginBottom: 0, cursor: 'pointer' }} onClick={() => setActiveTab(item.tab)}>
            <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: 28, fontWeight: 900, marginTop: 8 }}>{item.value}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Production Today</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { label: '1. Generate Campaigns', done: birthdayOpportunities.length === 0 || production.birthdayItems.length > 0, action: 'Birthdays', tab: 'birthdays' },
            { label: '2. Create Design/Video Assets', done: production.mediaNeeded.length > 0 || production.linkedAssets.length > 0, action: 'Queue', tab: 'queue' },
            { label: '3. Produce Assets', done: production.mediaReady.length > 0 || production.mediaNeeded.length === 0, action: 'Media Library', tab: 'media-library' },
            { label: '4. Upload Manually', done: production.readyToUpload.length > 0, action: 'Queue', tab: 'queue' },
          ].map((step) => (
            <div key={step.label} style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 14, padding: 13 }}>
              <div style={{ color: step.done ? '#22c55e' : '#94a3b8', fontWeight: 900 }}>{step.done ? 'Done' : 'Next'} {step.label}</div>
              <button style={{ ...smallButton, marginTop: 9 }} onClick={() => setActiveTab(step.tab)}>Open {step.action}</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, borderColor: growth.records.length > 0 ? '#22c55e' : '#334155', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(15,23,42,0.92))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f1f5f9' }}>Growth Intelligence</h3>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>What is working after manual publishing.</p>
          </div>
          <button style={smallButton} onClick={() => setActiveTab('growth')}>Open Growth Tracker</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Views Logged', value: growth.totals.views.toLocaleString(), color: '#60a5fa' },
            { label: 'Engagement Rate', value: `${growth.engagementRate}%`, color: '#a78bfa' },
            { label: 'Followers Gained', value: growth.totals.followers.toLocaleString(), color: '#22c55e' },
            { label: 'Posts Missing Stats', value: growth.publishedWithoutStats.length, color: growth.publishedWithoutStats.length ? '#f59e0b' : '#22c55e' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 14, padding: 13 }}>
              <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: 22, fontWeight: 900, marginTop: 6 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: 13, borderRadius: 14, background: '#0b1220', border: '1px solid #334155' }}>
          <div style={{ color: '#facc15', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>Recommended Growth Move</div>
          <p style={{ margin: '6px 0 10px', color: '#e2e8f0', fontWeight: 800 }}>{growth.nextMove}</p>
          <button style={actionButton} onClick={() => setActiveTab(growth.nextTab)}>Open Recommended Area</button>
        </div>

        {(growth.topPlatform || growth.topContentType) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 12 }}>
            {growth.topPlatform && (
              <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 14, padding: 13 }}>
                <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>Top Platform</div>
                <div style={{ color: '#60a5fa', fontSize: 18, fontWeight: 900, marginTop: 5 }}>{growth.topPlatform[0]}</div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{Number(growth.topPlatform[1]?.views || 0).toLocaleString()} views</div>
              </div>
            )}
            {growth.topContentType && (
              <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 14, padding: 13 }}>
                <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>Top Format</div>
                <div style={{ color: '#a78bfa', fontSize: 18, fontWeight: 900, marginTop: 5 }}>{growth.topContentType[0]}</div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{Number(growth.topContentType[1]?.views || 0).toLocaleString()} views</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Tonight's Priority Path</h3>
        <ol style={{ paddingLeft: 20, margin: 0, color: '#cbd5e1', fontSize: 14, lineHeight: 2 }}>
          <li>Improve incomplete ministers in <strong>Minister Updates</strong>.</li>
          <li>Create Audio-First sermon clip drafts in <strong>YouTube Sermons</strong>.</li>
          <li>Review drafts in <strong>Posting Queue</strong>.</li>
          <li>Produce shorts with image + sermon audio manually or with FFmpeg.</li>
          <li>Upload manually to TikTok and YouTube Shorts.</li>
          <li>Record results in <strong>Growth Tracker</strong>.</li>
        </ol>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Launch Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { label: 'Core System', status: 'Stable' },
            { label: 'Supabase Database', status: 'Connected' },
            { label: 'Weekly Planner', status: 'Ready' },
            { label: 'Audio-First Clip Studio', status: 'Working' },
            { label: 'Queue System', status: 'Ready' },
            { label: 'Publishing Center', status: 'Monitor Only' },
            { label: 'Online Auto Publishing', status: 'Disabled' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#cbd5e1', fontSize: 14 }}>{item.label}</span>
              <span style={{ fontWeight: 'bold', fontSize: 13, color: item.status === 'Disabled' ? '#f59e0b' : '#22c55e' }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Next Scheduled Post</h3>
        {nextScheduledPost ? (
          <>
            <p style={{ color: '#cbd5e1' }}><strong>{nextScheduledPost.platform}</strong> - {nextScheduledPost.content_type}</p>
            <p style={{ color: '#94a3b8' }}>{new Date(nextScheduledPost.scheduled_at).toLocaleString()}</p>
          </>
        ) : <p style={{ color: '#94a3b8' }}>No upcoming scheduled post.</p>}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Birthday Opportunities</h3>
        {birthdayOpportunities.length === 0 && <p style={{ color: '#94a3b8' }}>No upcoming birthdays detected.</p>}
        {birthdayOpportunities.length > 0 && <button style={actionButton} disabled={busy} onClick={generateAllUpcomingCampaigns}>{busy ? 'Working...' : 'Generate All Upcoming Campaigns'}</button>}
        {[...birthdayOpportunities].sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 8).map((item, index) => (
          <div key={index} style={{ marginTop: 10, padding: 12, border: '1px solid #334155', borderRadius: 12, background: '#0b1220' }}>
            <strong style={{ color: '#f1f5f9' }}>{getMinisterName(item.minister)}</strong>
            <p style={{ color: getBirthdayColor(item.daysRemaining), fontWeight: 'bold' }}>{item.daysRemaining === 0 ? 'Birthday Today' : `${item.daysRemaining} Days Remaining`}</p>
            {campaignAlreadyGenerated(item.minister, item.daysRemaining) ? <p style={{ color: '#22c55e', fontWeight: 'bold' }}>Campaign Generated & Scheduled</p> : <button style={actionButton} disabled={busy} onClick={() => generateBirthdayCampaign(item.minister)}>{busy ? 'Working...' : 'Auto Schedule Campaign'}</button>}
          </div>
        ))}
      </div>
    </div>
  )
}