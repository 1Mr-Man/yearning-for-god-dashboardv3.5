import { useMemo, useState } from 'react'

function clean(value) {
  return String(value || '').trim()
}

function lc(value) {
  return clean(value).toLowerCase()
}

function toNum(value) {
  const n = Number(String(value || 0).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function getCombinedText(item = {}) {
  return `${item.id || ''} ${item.platform || ''} ${item.content_type || ''} ${item.campaign_stage || ''} ${item.minister_name || ''} ${item.ministry_name || ''} ${item.content_text || ''} ${item.published_by || ''}`.toLowerCase()
}

function isQuoteItem(item = {}) {
  const text = getCombinedText(item)
  return (
    text.includes('quote') ||
    text.includes('independent daily quote') ||
    text.includes('book excerpt') ||
    text.includes('book quote') ||
    text.includes('once said') ||
    text.includes('quote library') ||
    text.includes('patriarch') ||
    text.includes('patriark') ||
    text.includes('quote publishing tracking v1') ||
    text.includes('quote performance tracking v1')
  )
}

function isTestPost(item = {}) {
  const text = getCombinedText(item)
  return [
    'dry run',
    'test post',
    'real facebook test',
    'facebook real test',
    'controlled publishing test',
    'should not go live',
    'dummy post',
    'sample post',
    'buffer test',
    'buffer-test',
    'tiktok buffer test',
    'publishing test',
    'integration test',
  ].some((term) => text.includes(term))
}

function isInternalWorkflowPost(item = {}) {
  const text = getCombinedText(item)
  const stage = lc(item.campaign_stage)

  if (isQuoteItem(item)) return false
  if (stage.includes('needs design') || stage.includes('needs video')) return false

  return [
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
  ].some((term) => text.includes(term))
}

function getLiveUrl(item = {}) {
  const direct = clean(item.external_post_url) || clean(item.live_post_url)
  if (direct) return direct

  const text = clean(item.content_text)
  const patterns = [
    /Live URL:\s*(https?:\/\/\S+)/i,
    /Live URL Updated:\s*(https?:\/\/\S+)/i,
    /Post URL:\s*(https?:\/\/\S+)/i,
    /URL:\s*(https?:\/\/\S+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].replace(/[)\].,]+$/, '')
  }

  const anyUrl = text.match(/https?:\/\/\S+/i)
  return anyUrl ? anyUrl[0].replace(/[)\].,]+$/, '') : ''
}

function hasLiveUrl(item = {}) {
  return getLiveUrl(item).length > 6
}

function extractDateFromText(text = '', pattern) {
  const match = clean(text).match(pattern)
  return match?.[1] ? clean(match[1]) : ''
}

function getPublishedDate(item = {}) {
  const raw =
    item.published_at ||
    item.last_auto_published_at ||
    extractDateFromText(item.content_text, /Posted at:\s*(.+)/i) ||
    extractDateFromText(item.content_text, /URL saved at:\s*(.+)/i) ||
    item.updated_at ||
    item.scheduled_at ||
    item.created_at
  const d = raw ? new Date(raw) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysSince(date) {
  if (!date) return 9999
  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

function hoursSince(date) {
  if (!date) return 9999
  return Math.floor((Date.now() - date.getTime()) / 3600000)
}

function dateLabel(date) {
  if (!date) return 'Unknown date'
  return date.toLocaleString()
}

function shortText(item = {}, limit = 160) {
  const text = clean(item.content_text).replace(/\s+/g, ' ')
  if (!text) return 'No preview text available.'
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function recordPostId(record = {}) {
  return String(record.content_queue_id || record.queue_id || record.post_id || '')
}

function recordDate(record = {}) {
  const raw = record.created_at || record.recorded_at || record.updated_at || record.published_at
  const d = raw ? new Date(raw) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

function recordStage(record = {}) {
  const text = `${record.stage || ''} ${record.stats_stage || ''} ${record.note || ''} ${record.performance_note || ''}`.toLowerCase()
  if (text.includes('7d') || text.includes('7-day') || text.includes('7 day')) return '7d'
  if (text.includes('24h') || text.includes('24-hour') || text.includes('24 hour')) return '24h'
  return 'any'
}

function recordTotalSignal(record = {}) {
  return toNum(record.views) + toNum(record.likes) + toNum(record.comments) + toNum(record.shares) + toNum(record.saves) + toNum(record.followers_gained)
}

function scoreRecord(record = {}) {
  const views = toNum(record.views)
  const engagement = toNum(record.likes) + toNum(record.comments) + toNum(record.shares) + toNum(record.saves)
  const followers = toNum(record.followers_gained)
  let score = 0

  if (views >= 10000) score += 40
  else if (views >= 3000) score += 30
  else if (views >= 1000) score += 22
  else if (views >= 300) score += 14
  else if (views > 0) score += 8

  if (engagement >= 500) score += 35
  else if (engagement >= 100) score += 25
  else if (engagement >= 30) score += 16
  else if (engagement > 0) score += 8

  if (followers >= 20) score += 25
  else if (followers >= 5) score += 15
  else if (followers > 0) score += 8

  if (toNum(record.shares) >= 10 || toNum(record.saves) >= 10) score += 15

  return Math.min(score, 100)
}

function isCleanPerformanceRecord(record = {}, queue = []) {
  if (!record) return false
  const text = `${record.id || ''} ${record.platform || ''} ${record.content_type || ''} ${record.minister_name || ''} ${record.content_text || ''} ${record.note || ''} ${record.performance_note || ''}`.toLowerCase()
  if ([
    'dry run',
    'test post',
    'real facebook test',
    'facebook real test',
    'buffer test',
    'tiktok buffer test',
    'integration test',
    'dummy post',
    'sample post',
  ].some((term) => text.includes(term))) return false

  const linkedId = recordPostId(record)
  if (linkedId && Array.isArray(queue)) {
    const linked = queue.find((item) => String(item.id) === String(linkedId))
    if (linked && (isTestPost(linked) || isInternalWorkflowPost(linked))) return false
  }

  return true
}

function isRealPublishedPost(item = {}) {
  if (!item || lc(item.status) !== 'published') return false
  if (isTestPost(item)) return false
  if (isInternalWorkflowPost(item)) return false
  if (!hasLiveUrl(item)) return false
  return clean(item.content_text).length >= 15
}

function extractMetricFromBlock(block = '', labelRegex) {
  const match = block.match(labelRegex)
  return match?.[1] ? toNum(match[1]) : 0
}

function deriveQuoteRecordsFromQueue(queue = []) {
  const records = []

  queue.forEach((item) => {
    if (!isQuoteItem(item)) return
    const text = clean(item.content_text)
    if (!text.toLowerCase().includes('quote performance tracking v1')) return

    const blocks = text.split(/---\s*/g).filter((block) => block.toLowerCase().includes('quote performance tracking v1'))

    blocks.forEach((block, index) => {
      const stageMatch = block.match(/Stats stage:\s*([^\n]+)/i)
      const dateMatch = block.match(/Stats recorded at:\s*([^\n]+)/i)
      const stage = clean(stageMatch?.[1]) || 'any'
      const recordedAt = clean(dateMatch?.[1]) || item.updated_at || new Date().toISOString()

      records.push({
        id: `quote-inline-${item.id}-${index}`,
        content_queue_id: item.id,
        queue_id: item.id,
        platform: item.platform || 'Platform',
        content_type: item.content_type || 'Independent Daily Quote',
        minister_name: item.minister_name || item.ministry_name || 'Yearning for God',
        views: extractMetricFromBlock(block, /Reach\s*\/\s*Views:\s*([0-9,.]+)/i),
        likes: extractMetricFromBlock(block, /Likes:\s*([0-9,.]+)/i),
        comments: extractMetricFromBlock(block, /Comments:\s*([0-9,.]+)/i),
        shares: extractMetricFromBlock(block, /Shares:\s*([0-9,.]+)/i),
        saves: extractMetricFromBlock(block, /Saves:\s*([0-9,.]+)/i),
        followers_gained: extractMetricFromBlock(block, /Follows gained:\s*([0-9,.]+)/i),
        stage,
        stats_stage: stage,
        recorded_at: recordedAt,
        created_at: recordedAt,
        note: `Quote stats saved inside Queue (${stage})`,
        _source: 'quote-inline',
      })
    })
  })

  return records
}

function hasStageRecord(recordMap, itemId, stage) {
  const records = recordMap.get(String(itemId)) || []
  if (records.length === 0) return false
  if (stage === 'any') return true
  return records.some((record) => {
    const s = recordStage(record)
    return s === stage || s === 'any'
  })
}

function has24hStats(item, recordMap) {
  const text = lc(item.content_text)
  return text.includes('24h stats recorded: yes') || hasStageRecord(recordMap, item.id, '24h')
}

function has7dStats(item, recordMap) {
  const text = lc(item.content_text)
  return text.includes('7d stats recorded: yes') || hasStageRecord(recordMap, item.id, '7d')
}

function isQuoteWinnerItem(item = {}) {
  const text = lc(item.content_text)
  return isQuoteItem(item) && (
    text.includes('repeat candidate: yes') ||
    text.includes('quote winner: yes') ||
    text.includes('repeat this quote style')
  )
}

function formatPostLine(item = {}) {
  return `#${item.id} - ${item.platform || 'Platform'} - ${item.minister_name || item.ministry_name || 'Yearning for God'} - ${item.content_type || 'Post'} - ${dateLabel(getPublishedDate(item))}`
}

function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  return Promise.resolve()
}

export default function StatsFollowUp({
  queue = [],
  performanceStats = {},
  setActiveTab,
  styles = {},
}) {
  const [filter, setFilter] = useState('due-today')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState('')

  const safeQueue = Array.isArray(queue) ? queue : []
  const card = styles.card || { background: '#0f172a', border: '1px solid #334155', borderRadius: 18, padding: 18, marginBottom: 16 }
  const smallButton = styles.smallButton || { padding: '9px 12px', borderRadius: 12, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', fontWeight: 800, cursor: 'pointer' }
  const activeButton = styles.activeFilterButton || { padding: '9px 12px', borderRadius: 12, border: '1px solid #22c55e', background: '#22c55e', color: '#052e16', fontWeight: 900, cursor: 'pointer' }
  const actionButton = styles.actionButton || { padding: '10px 14px', borderRadius: 12, border: '1px solid #22c55e', background: '#16a34a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
  const searchStyle = styles.search || { width: '100%', padding: 14, borderRadius: 14, border: '1px solid #334155', background: '#020617', color: '#f8fafc' }
  const calendarItem = styles.calendarItem || { padding: 12, border: '1px solid #334155', borderRadius: 12, marginBottom: 10, background: '#0b1220' }

  const rawExternalRecords = useMemo(() => {
    if (Array.isArray(performanceStats)) return performanceStats
    if (Array.isArray(performanceStats.records)) return performanceStats.records
    return []
  }, [performanceStats])

  const quoteInlineRecords = useMemo(() => deriveQuoteRecordsFromQueue(safeQueue), [safeQueue])

  const allRawRecords = useMemo(() => {
    return [...rawExternalRecords, ...quoteInlineRecords]
  }, [rawExternalRecords, quoteInlineRecords])

  const records = useMemo(() => allRawRecords.filter((record) => isCleanPerformanceRecord(record, safeQueue)), [allRawRecords, safeQueue])
  const hiddenUncleanRecords = Math.max(0, allRawRecords.length - records.length)

  const recordMap = useMemo(() => {
    const map = new Map()
    records.forEach((record) => {
      const key = recordPostId(record)
      if (!key) return
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(record)
    })
    return map
  }, [records])

  const realPublished = useMemo(() => {
    return safeQueue
      .filter(isRealPublishedPost)
      .map((item) => ({
        ...item,
        _isQuote: isQuoteItem(item),
        _isQuoteWinner: isQuoteWinnerItem(item),
        _publishedDate: getPublishedDate(item),
        _ageDays: daysSince(getPublishedDate(item)),
        _ageHours: hoursSince(getPublishedDate(item)),
      }))
      .sort((a, b) => (b._publishedDate?.getTime() || 0) - (a._publishedDate?.getTime() || 0))
  }, [safeQueue])

  const todayStart = startOfToday()
  const postsPublishedToday = realPublished.filter((item) => item._publishedDate && item._publishedDate >= todayStart)
  const checkTomorrow = postsPublishedToday

  const quotePublished = realPublished.filter((item) => item._isQuote)
  const quoteUrlsNeeded = safeQueue.filter((item) => lc(item.status) === 'published' && isQuoteItem(item) && !hasLiveUrl(item))
  const quoteWinners = realPublished.filter((item) => item._isQuoteWinner)

  const missing24HourStats = realPublished.filter((item) => item._ageHours >= 24 && !has24hStats(item, recordMap))
  const missing7DayStats = realPublished.filter((item) => item._ageDays >= 7 && !has7dStats(item, recordMap))
  const missingAnyStats = realPublished.filter((item) => !has24hStats(item, recordMap) && !has7dStats(item, recordMap))
  const dueToday = realPublished.filter((item) => {
    if (item._ageHours >= 24 && item._ageDays < 7 && !has24hStats(item, recordMap)) return true
    if (item._ageDays >= 7 && !has7dStats(item, recordMap)) return true
    return false
  })
  const quoteDueStats = dueToday.filter((item) => item._isQuote)

  const scoredRecords = useMemo(() => {
    return records
      .filter((record) => recordTotalSignal(record) > 0)
      .map((record) => {
        const linked = safeQueue.find((item) => String(item.id) === recordPostId(record))
        return { ...record, _score: scoreRecord(record), _date: recordDate(record), _linkedPost: linked }
      })
      .sort((a, b) => b._score - a._score)
  }, [records, safeQueue])

  const bestRecent = scoredRecords.filter((r) => {
    const d = r._date
    if (!d) return false
    return Date.now() - d.getTime() <= 14 * 86400000
  }).slice(0, 6)

  const weakRecent = scoredRecords
    .filter((r) => {
      const d = r._date
      if (!d) return false
      return Date.now() - d.getTime() <= 14 * 86400000 && r._score > 0 && r._score < 25
    })
    .slice(0, 6)

  const recommendation = (() => {
    if (quoteUrlsNeeded.length > 0) return `Paste live URLs for ${quoteUrlsNeeded.length} posted quote(s) first.`
    if (quoteDueStats.length > 0) return `Check ${quoteDueStats.length} quote post(s) due for stats today.`
    if (dueToday.length > 0) return `Check ${dueToday.length} post(s) due for stats today.`
    if (postsPublishedToday.length > 0) return `You posted ${postsPublishedToday.length} item(s) today. They should be checked tomorrow.`
    if (missing7DayStats.length > 0) return `Clean ${missing7DayStats.length} old post(s) missing 7-day stats.`
    if (bestRecent.length > 0) return 'Review your best recent post and repeat the winning format.'
    return 'No urgent stats follow-up. Prepare one daily quote and one strong main post.'
  })()

  const filteredPosts = useMemo(() => {
    let list = []
    if (filter === 'today') list = postsPublishedToday
    else if (filter === 'tomorrow') list = checkTomorrow
    else if (filter === 'due-today') list = dueToday
    else if (filter === 'missing-24') list = missing24HourStats
    else if (filter === 'missing-7') list = missing7DayStats
    else if (filter === 'missing-any') list = missingAnyStats
    else if (filter === 'quote-due') list = quoteDueStats
    else if (filter === 'quote-url') list = quoteUrlsNeeded
    else if (filter === 'quote-winners') list = quoteWinners
    else if (filter === 'quotes') list = quotePublished
    else list = realPublished

    const q = lc(search)
    if (!q) return list
    return list.filter((item) => getCombinedText(item).includes(q))
  }, [
    filter,
    postsPublishedToday,
    checkTomorrow,
    dueToday,
    missing24HourStats,
    missing7DayStats,
    missingAnyStats,
    quoteDueStats,
    quoteUrlsNeeded,
    quoteWinners,
    quotePublished,
    realPublished,
    search,
  ])

  function statusLineForItem(item) {
    if (quoteUrlsNeeded.some((post) => String(post.id) === String(item.id))) return 'Needs live URL'
    if (item._ageDays >= 7 && !has7dStats(item, recordMap)) return 'Needs 7-day stats'
    if (item._ageHours >= 24 && !has24hStats(item, recordMap)) return 'Needs 24-hour stats'
    if (has7dStats(item, recordMap)) return '7-day stats recorded'
    if (has24hStats(item, recordMap)) return '24-hour stats recorded'
    return 'Check later'
  }

  function copyStatsPrompt() {
    const dueLines = dueToday.slice(0, 15).map(formatPostLine).join('\n') || 'No stats due today.'
    const quoteLines = quoteDueStats.slice(0, 15).map(formatPostLine).join('\n') || 'No quote stats due today.'
    const bestLines = bestRecent.slice(0, 5).map((record) => `#${record.content_queue_id || 'N/A'} - ${record.platform || 'Platform'} - ${record.content_type || 'Post'} - views ${toNum(record.views)} - likes ${toNum(record.likes)} - comments ${toNum(record.comments)} - shares ${toNum(record.shares)} - saves ${toNum(record.saves)} - score ${record._score}`).join('\n') || 'No strong recent record yet.'

    const text = `You are helping manage the Yearning for God Christian media dashboard.

Create a practical stats follow-up plan for today.

Current recommendation:
${recommendation}

Counts:
Posts published today: ${postsPublishedToday.length}
Posts to check tomorrow: ${checkTomorrow.length}
Due for stats today: ${dueToday.length}
Quote posts due for stats today: ${quoteDueStats.length}
Quote posts needing live URL: ${quoteUrlsNeeded.length}
Missing 24-hour stats: ${missing24HourStats.length}
Missing 7-day stats: ${missing7DayStats.length}
Total real published posts with URLs: ${realPublished.length}
Inline quote stats detected from Queue: ${quoteInlineRecords.length}

Posts due today:
${dueLines}

Quote posts due today:
${quoteLines}

Best recent records:
${bestLines}

Return:
1. What to check first today
2. What numbers to record
3. Which quote posts should be repeated
4. Which weak posts need review
5. A simple phone-friendly tracking routine.

Rules:
- Keep it realistic for one person using a phone.
- Quotes are independent from the normal 25 posts/day.
- Focus on reach/views, shares, saves, and followers gained.
- Do not recommend online auto-publishing unless I specifically ask.`
    copyToClipboard(text)
    setCopied('Stats follow-up prompt copied.')
    setTimeout(() => setCopied(''), 2500)
  }

  function copyPostChecklist(item) {
    const needs = statusLineForItem(item)
    const text = `Stats follow-up for Yearning for God post

Post: ${formatPostLine(item)}
Live URL: ${getLiveUrl(item) || 'Paste live URL here'}
Status: ${needs}
Type: ${item._isQuote ? 'Independent Daily Quote' : 'Main content'}

Record these numbers:
- Reach / Views:
- Likes:
- Comments:
- Shares:
- Saves:
- Followers gained:
- Notes: What spiritual response did people give?

After recording:
1. If this is a quote post, open Queue and use Save Quote Stats.
2. If this is a normal post, open Growth Tracker and save the stats.
3. If shares/saves are strong, mark the format as repeatable.`
    copyToClipboard(text)
    setCopied(`Checklist copied for #${item.id}.`)
    setTimeout(() => setCopied(''), 2500)
  }

  function copyRepeatPrompt(record) {
    const linked = record._linkedPost || {}
    const text = `You are helping Yearning for God repeat a winning content format.

Winning record:
#${record.content_queue_id || 'N/A'} - ${record.platform || 'Platform'} - ${record.content_type || linked.content_type || 'Post'}
Minister/Source: ${record.minister_name || linked.minister_name || linked.ministry_name || 'Yearning for God'}
Views/Reach: ${toNum(record.views)}
Likes: ${toNum(record.likes)}
Comments: ${toNum(record.comments)}
Shares: ${toNum(record.shares)}
Saves: ${toNum(record.saves)}
Followers gained: ${toNum(record.followers_gained)}
Score: ${record._score}

Original post preview:
${shortText(linked, 600)}

Create 5 new content ideas that repeat the FORMAT and spiritual direction, not the exact wording. If it is a quote post, suggest new quotes/themes, caption angles, and Canva design directions.`
    copyToClipboard(text)
    setCopied('Repeat format prompt copied.')
    setTimeout(() => setCopied(''), 2500)
  }

  function copyWeakReviewPrompt(record) {
    const linked = record._linkedPost || {}
    const text = `You are helping Yearning for God review a weak content record.

Weak record:
#${record.content_queue_id || 'N/A'} - ${record.platform || 'Platform'} - ${record.content_type || linked.content_type || 'Post'}
Views/Reach: ${toNum(record.views)}
Likes: ${toNum(record.likes)}
Comments: ${toNum(record.comments)}
Shares: ${toNum(record.shares)}
Saves: ${toNum(record.saves)}
Score: ${record._score}

Original post preview:
${shortText(linked, 600)}

Give a short review:
1. Likely reason it was weak
2. Caption fix
3. Design/hook improvement
4. Whether to repeat, rewrite, or retire this style.`
    copyToClipboard(text)
    setCopied('Weak post review prompt copied.')
    setTimeout(() => setCopied(''), 2500)
  }

  const statCards = [
    { label: 'Published Today', value: postsPublishedToday.length, hint: 'Check tomorrow' },
    { label: 'Due Today', value: dueToday.length, hint: '24h or 7d stats' },
    { label: 'Quote Stats Due', value: quoteDueStats.length, hint: 'Independent quote posts' },
    { label: 'Quote URLs Needed', value: quoteUrlsNeeded.length, hint: 'Paste live URLs' },
    { label: 'Quote Winners', value: quoteWinners.length, hint: 'Repeat style' },
    { label: 'Inline Quote Stats', value: quoteInlineRecords.length, hint: 'Read from Queue' },
    { label: 'Missing 24h Stats', value: missing24HourStats.length, hint: 'Needs tracking' },
    { label: 'Missing 7-Day Stats', value: missing7DayStats.length, hint: 'Old follow-up' },
  ]

  const filters = [
    { id: 'due-today', label: 'Due Today' },
    { id: 'quote-due', label: 'Quote Stats Due' },
    { id: 'quote-url', label: 'Quote URLs Needed' },
    { id: 'quote-winners', label: 'Quote Winners' },
    { id: 'quotes', label: 'All Published Quotes' },
    { id: 'today', label: 'Published Today' },
    { id: 'tomorrow', label: 'Check Tomorrow' },
    { id: 'missing-24', label: 'Missing 24h' },
    { id: 'missing-7', label: 'Missing 7-Day' },
    { id: 'missing-any', label: 'No Stats Yet' },
    { id: 'all', label: 'All Real Published' },
  ]

  return (
    <div>
      <div style={card}>
        <p style={{ margin: 0, color: '#94a3b8', fontWeight: 800 }}>Daily follow-up board</p>
        <h2 style={{ margin: '6px 0 8px', color: '#f8fafc' }}>Stats Follow-Up Center</h2>
        <p style={{ margin: 0, color: '#cbd5e1' }}>
          This version reads normal published posts and quote posts. It also detects quote live URLs and quote performance blocks saved inside Queue.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 16 }}>
        {statCards.map((item) => (
          <div key={item.label} style={card}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontWeight: 800 }}>{item.label}</p>
            <h2 style={{ margin: '8px 0', color: '#f8fafc' }}>{item.value.toLocaleString()}</h2>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: 13 }}>{item.hint}</p>
          </div>
        ))}
      </div>

      <div style={{ ...card, borderColor: dueToday.length > 0 || quoteUrlsNeeded.length > 0 ? '#f59e0b' : '#22c55e' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontWeight: 800 }}>Recommended next move</p>
        <h3 style={{ margin: '8px 0', color: '#f8fafc' }}>{recommendation}</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" style={actionButton} onClick={copyStatsPrompt}>Copy Stats Follow-Up Prompt</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab && setActiveTab('growth-tracker')}>Open Growth Tracker</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab && setActiveTab('quotes-planner')}>Open Quotes Planner</button>
        </div>
        {copied && <p style={{ margin: '10px 0 0', color: '#fde68a', fontWeight: 900 }}>{copied}</p>}
        {hiddenUncleanRecords > 0 && <p style={{ margin: '10px 0 0', color: '#fde68a', fontWeight: 900 }}>{hiddenUncleanRecords} test/internal stat record(s) are hidden.</p>}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Follow-up filters</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {filters.map((item) => (
            <button key={item.id} type="button" style={filter === item.id ? activeButton : smallButton} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by minister, platform, quote, content type..."
          style={searchStyle}
        />
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Posts to follow up</h3>
        {filteredPosts.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No posts in this filter right now.</p>
        ) : (
          filteredPosts.slice(0, 40).map((item) => {
            const postRecords = recordMap.get(String(item.id)) || []
            const status = statusLineForItem(item)
            return (
              <div key={item.id} style={calendarItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: 0, color: '#f8fafc', fontWeight: 900 }}>
                      #{item.id} - {item.platform || 'Platform'} - {item.content_type || 'Post'}
                    </p>
                    <p style={{ margin: '4px 0', color: '#cbd5e1' }}>
                      {item.minister_name || item.ministry_name || 'Yearning for God'} {item._isQuote ? '- Quote Post' : ''}
                    </p>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
                      Published: {dateLabel(item._publishedDate)} | Age: {item._ageHours}h | {status}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: postRecords.length ? '#22c55e' : '#f59e0b', fontWeight: 900 }}>
                      {postRecords.length ? `${postRecords.length} stats record(s)` : 'No stats yet'}
                    </p>
                    {getLiveUrl(item) && <a href={getLiveUrl(item)} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', fontWeight: 800 }}>Open live post</a>}
                  </div>
                </div>
                <p style={{ color: '#cbd5e1' }}>{shortText(item)}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={smallButton} onClick={() => copyPostChecklist(item)}>Copy Tracking Checklist</button>
                  {item._isQuote ? (
                    <button type="button" style={smallButton} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue to Save Quote Stats</button>
                  ) : (
                    <button type="button" style={smallButton} onClick={() => setActiveTab && setActiveTab('growth-tracker')}>Record Stats</button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Best recent posts</h3>
          {bestRecent.length === 0 ? <p style={{ color: '#94a3b8' }}>No strong recent stats yet.</p> : bestRecent.map((record) => (
            <div key={record.id || `${record.content_queue_id}-${record.created_at}`} style={calendarItem}>
              <p style={{ margin: 0, color: '#f8fafc', fontWeight: 900 }}>#{record.content_queue_id || 'N/A'} - {record.platform || 'Platform'}</p>
              <p style={{ margin: '4px 0', color: '#cbd5e1' }}>{record.minister_name || record._linkedPost?.minister_name || record._linkedPost?.ministry_name || 'Yearning for God'}</p>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Views {toNum(record.views).toLocaleString()} | Shares {toNum(record.shares).toLocaleString()} | Saves {toNum(record.saves).toLocaleString()} | Score {record._score}
              </p>
              {record._source === 'quote-inline' && <p style={{ margin: '6px 0 0', color: '#fde68a', fontWeight: 800 }}>Quote stats read from Queue</p>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <button type="button" style={smallButton} onClick={() => copyRepeatPrompt(record)}>Repeat This Format</button>
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Weak posts to review</h3>
          {weakRecent.length === 0 ? <p style={{ color: '#94a3b8' }}>No weak recent posts flagged yet.</p> : weakRecent.map((record) => (
            <div key={record.id || `${record.content_queue_id}-${record.created_at}`} style={calendarItem}>
              <p style={{ margin: 0, color: '#f8fafc', fontWeight: 900 }}>#{record.content_queue_id || 'N/A'} - {record.platform || 'Platform'}</p>
              <p style={{ margin: '4px 0', color: '#cbd5e1' }}>{record.minister_name || record._linkedPost?.minister_name || record._linkedPost?.ministry_name || 'Yearning for God'}</p>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Views {toNum(record.views).toLocaleString()} | Shares {toNum(record.shares).toLocaleString()} | Saves {toNum(record.saves).toLocaleString()} | Score {record._score}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <button type="button" style={smallButton} onClick={() => copyWeakReviewPrompt(record)}>Review Weak Post</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}