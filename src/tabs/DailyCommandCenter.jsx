import React, { useMemo, useState } from 'react'

const CHECKLIST_KEY = 'yfg_daily_operating_guide_v2_checklist'
const MODE_KEY = 'yfg_daily_operating_guide_v2_mode'

function clean(value) {
  return String(value || '').trim()
}

function lower(value) {
  return clean(value).toLowerCase()
}

function safeDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isSameDay(dateA, dateB) {
  if (!dateA || !dateB) return false
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate()
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(date) {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() - day)
  start.setHours(0, 0, 0, 0)
  return start
}

function scheduledDate(item) {
  return safeDate(item?.scheduled_at || item?.schedule_date || item?.publish_at || item?.published_at || item?.created_at)
}

function getLiveUrl(item = {}) {
  const direct = clean(item.external_post_url) || clean(item.live_post_url)
  if (direct) return direct
  const text = clean(item.content_text)
  const match = text.match(/(?:Live URL|Post URL|URL|Live URL Updated):\s*(https?:\/\/\S+)/i)
  if (match?.[1]) return match[1].replace(/[)\].,]+$/, '')
  return ''
}

function isQuoteItem(item) {
  const text = lower(`${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.ministry_name || ''} ${item?.minister_name || ''} ${item?.content_text || ''}`)
  return text.includes('quote') || text.includes('independent daily quote') || text.includes('book quote') || text.includes('quote library') || text.includes('quote publishing tracking v1')
}

function isMusicItem(item) {
  const text = lower(`${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.ministry_name || ''} ${item?.content_text || ''}`)
  return text.includes('music') || text.includes('song') || text.includes('worship atmosphere') || text.includes('safe audio') || text.includes('soundtrack') || text.includes('weekly sound')
}

function isReadyQuotePost(item) {
  const text = lower(`${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.content_text || ''}`)
  return isQuoteItem(item) && (
    text.includes('ready quote post')
    || text.includes('public quote caption:')
    || text.includes('publish-ready quote caption:')
    || text.includes('final quote caption:')
    || text.includes('ready public quote:')
  )
}

function isReadyMusicPost(item) {
  const text = lower(`${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.content_text || ''}`)
  return isMusicItem(item) && (
    text.includes('ready music post')
    || text.includes('public music caption:')
    || text.includes('publish-ready music caption:')
    || text.includes('final music caption:')
  )
}

function isStatsRecorded(item, stage) {
  const text = lower(item?.content_text)
  if (stage === '24h') return text.includes('24h stats recorded: yes') || text.includes('24-hour stats recorded: yes')
  if (stage === '7d') return text.includes('7d stats recorded: yes') || text.includes('7-day stats recorded: yes')
  return text.includes('stats recorded')
}

function isMainDailyContent(item) {
  if (isQuoteItem(item)) return false
  if (isMusicItem(item)) return false
  const type = lower(item?.content_type)
  const stage = lower(item?.campaign_stage)
  const text = lower(item?.content_text)
  if (text.includes('asset request') || text.includes('design prompt') || text.includes('manual publishing checklist')) return false
  return !!(type || stage || text)
}

function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '')
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch (error) {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function copyText(text, done) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => done())
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  done()
}

function Pill({ children, tone = 'blue' }) {
  const tones = {
    blue: { color: '#7dd3fc', bg: 'rgba(56,189,248,.12)', border: 'rgba(56,189,248,.35)' },
    green: { color: '#86efac', bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.35)' },
    yellow: { color: '#fde68a', bg: 'rgba(250,204,21,.12)', border: 'rgba(250,204,21,.35)' },
    red: { color: '#fca5a5', bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.35)' },
    purple: { color: '#d8b4fe', bg: 'rgba(168,85,247,.12)', border: 'rgba(168,85,247,.35)' },
  }
  const t = tones[tone] || tones.blue
  return <span style={{ color: t.color, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 900 }}>{children}</span>
}

function StepCard({ title, time, children, tone = 'blue', actions = [], cardStyle }) {
  return (
    <div style={{ ...cardStyle, borderColor: tone === 'green' ? 'rgba(34,197,94,.35)' : tone === 'yellow' ? 'rgba(250,204,21,.35)' : tone === 'purple' ? 'rgba(168,85,247,.35)' : 'rgba(56,189,248,.35)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ color: '#f8fafc', margin: 0 }}>{title}</h3>
        <Pill tone={tone}>{time}</Pill>
      </div>
      <div style={{ color: '#cbd5e1', lineHeight: 1.7, marginTop: 10 }}>{children}</div>
      {actions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

export default function DailyCommandCenter({ queue = [], performanceStats = {}, setActiveTab, styles = {} }) {
  const [checklist, setChecklist] = useState(() => loadJson(CHECKLIST_KEY, {}))
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'evening')
  const [copied, setCopied] = useState('')

  const today = new Date()
  const tomorrow = addDays(today, 1)
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 7)

  const stats = useMemo(() => {
    const todayItems = queue.filter((item) => isSameDay(scheduledDate(item), today))
    const tomorrowItems = queue.filter((item) => isSameDay(scheduledDate(item), tomorrow))
    const drafts = queue.filter((item) => lower(item.status || 'draft') === 'draft')
    const scheduled = queue.filter((item) => lower(item.status) === 'scheduled')
    const published = queue.filter((item) => lower(item.status) === 'published')
    const todayPublished = todayItems.filter((item) => lower(item.status) === 'published')
    const todayScheduled = todayItems.filter((item) => lower(item.status) === 'scheduled')
    const quoteItems = queue.filter(isQuoteItem)
    const readyQuotes = queue.filter(isReadyQuotePost)
    const publishedQuotes = published.filter(isQuoteItem)
    const quoteNeedsUrl = publishedQuotes.filter((item) => !getLiveUrl(item))
    const quoteNeeds24h = publishedQuotes.filter((item) => getLiveUrl(item) && !isStatsRecorded(item, '24h'))
    const quoteNeeds7d = publishedQuotes.filter((item) => {
      const date = scheduledDate(item)
      if (!date) return false
      const ageDays = Math.floor((Date.now() - date.getTime()) / 86400000)
      return ageDays >= 7 && !isStatsRecorded(item, '7d')
    })
    const musicItems = queue.filter(isMusicItem)
    const readyMusic = queue.filter(isReadyMusicPost)
    const mainToday = todayItems.filter(isMainDailyContent)
    const quoteToday = todayItems.filter(isQuoteItem)
    const tomorrowQuotes = tomorrowItems.filter(isQuoteItem)
    const tomorrowMain = tomorrowItems.filter(isMainDailyContent)
    const musicThisWeek = queue.filter((item) => {
      if (!isMusicItem(item)) return false
      const date = scheduledDate(item)
      return date && date >= weekStart && date < weekEnd
    })

    return {
      total: queue.length,
      drafts: drafts.length,
      scheduled: scheduled.length,
      published: published.length,
      todayItems: todayItems.length,
      tomorrowItems: tomorrowItems.length,
      todayPublished: todayPublished.length,
      todayScheduled: todayScheduled.length,
      mainToday: mainToday.length,
      quoteItems: quoteItems.length,
      readyQuotes: readyQuotes.length,
      quoteToday: quoteToday.length,
      tomorrowQuotes: tomorrowQuotes.length,
      tomorrowMain: tomorrowMain.length,
      publishedQuotes: publishedQuotes.length,
      quoteNeedsUrl: quoteNeedsUrl.length,
      quoteNeeds24h: quoteNeeds24h.length,
      quoteNeeds7d: quoteNeeds7d.length,
      musicItems: musicItems.length,
      readyMusic: readyMusic.length,
      musicThisWeek: musicThisWeek.length,
    }
  }, [queue])

  const perfRecords = Array.isArray(performanceStats?.records) ? performanceStats.records : Array.isArray(performanceStats) ? performanceStats : []
  const totalViews = Number(performanceStats?.totalViews || perfRecords.reduce((sum, item) => sum + Number(item.views || 0), 0))
  const totalShares = Number(performanceStats?.totalShares || perfRecords.reduce((sum, item) => sum + Number(item.shares || 0), 0))
  const totalSaves = Number(performanceStats?.totalSaves || perfRecords.reduce((sum, item) => sum + Number(item.saves || 0), 0))

  const launchStatus = useMemo(() => {
    const issues = []
    if (stats.tomorrowQuotes < 1 && stats.readyQuotes < 1) issues.push('Prepare at least 1 independent quote post for tomorrow.')
    if (stats.tomorrowMain < 3 && stats.scheduled < 5) issues.push('Schedule more main posts for tomorrow or the next 2 days.')
    if (stats.musicThisWeek < 3) issues.push('Keep 3 music posts planned for the week.')
    if (stats.quoteNeedsUrl > 0) issues.push('Paste live URLs for quote posts already marked published.')
    if (stats.quoteNeeds24h > 0) issues.push('Record 24-hour stats for posted quotes.')
    if (stats.drafts > 20) issues.push('Too many drafts. Convert the best ones to scheduled posts.')

    if (!issues.length) return { label: 'Ready for daily operation', tone: 'green', issues }
    if (issues.length <= 2) return { label: 'Almost ready', tone: 'yellow', issues }
    return { label: 'Needs setup before full launch', tone: 'red', issues }
  }, [stats])

  function setGuideMode(nextMode) {
    setMode(nextMode)
    localStorage.setItem(MODE_KEY, nextMode)
  }

  function toggleItem(key) {
    const next = { ...checklist, [key]: !checklist[key] }
    setChecklist(next)
    saveJson(CHECKLIST_KEY, next)
  }

  function resetChecklist() {
    setChecklist({})
    localStorage.removeItem(CHECKLIST_KEY)
  }

  function copyRoutine(type = 'evening') {
    const routines = {
      evening: `YEARNING FOR GOD - EVENING/NIGHT ROUTINE

Goal: prepare tomorrow while you have time.

1. Open Daily Command Center.
2. Open Stats Follow-Up and check anything due today.
3. Open Quotes Planner and prepare 1 independent daily quote.
4. Create quote image asset / Canva design.
5. Save Ready Quote Post to Queue.
6. Open Music Planner and confirm 3 music posts for the week.
7. Open Queue and schedule tomorrow's posts.
8. Confirm each post has platform, caption, asset/design, and time.
9. If you manually posted anything today, paste live URL and mark posted.
10. End by checking Publishing Center.

Daily rule:
Normal content plan + 1 independent quote post.
Quotes are not part of the 25 posts/day target.`,

      morning: `YEARNING FOR GOD - MORNING CHECK ROUTINE

1. Open Daily Command Center.
2. Check what is scheduled for today.
3. Open Publishing Center if automatic publishing is ON.
4. If posting manually, publish only the posts due in the morning.
5. Paste live URL into Queue after posting.
6. Do not spend too much time designing in the morning; design should happen at night.`,

      stats: `YEARNING FOR GOD - STATS FOLLOW-UP ROUTINE

1. Open Stats Follow-Up.
2. Check Quote Stats Due.
3. Check Missing 24h Stats.
4. Check Missing 7-Day Stats.
5. For each live post, record:
   - Reach / Views
   - Likes
   - Comments
   - Shares
   - Saves
   - Followers gained
6. Mark strong quote posts as repeatable.
7. Use Repeat This Format for winners.`
    }

    copyText(routines[type] || routines.evening, () => {
      setCopied(`${type} routine copied.`)
      setTimeout(() => setCopied(''), 2500)
    })
  }

  function copyLaunchWeekGuide() {
    const text = `YEARNING FOR GOD - LAUNCH WEEK GUIDE

Purpose:
Start fully next week with a realistic routine that works even if posting is manual.

Daily minimum:
- 1 independent quote post
- Main planned content according to your posting capacity
- Record URLs after posting
- Record 24h stats the next day

Evening/Night:
1. Prepare tomorrow's quote in Quotes Planner.
2. Create the Canva quote image.
3. Save Ready Quote Post to Queue.
4. Prepare/schedule main content.
5. Confirm Music Planner stays at 3 music posts per week.
6. Review Queue and clean drafts.
7. Check Stats Follow-Up.

Manual posting:
1. Open Queue.
2. Upload the post to the platform.
3. Paste the live URL.
4. Mark as posted/published.
5. Tomorrow, record stats.

Automatic posting:
Use only after testing. Current browser-based automation works only while the app/browser is open.

Growth rule:
Do not only post. Track shares, saves, reach, and followers gained. Repeat the formats that perform well.`
    copyText(text, () => {
      setCopied('Launch week guide copied.')
      setTimeout(() => setCopied(''), 2500)
    })
  }

  const card = styles.card || { background: 'rgba(15,23,42,.92)', border: '1px solid rgba(56,189,248,.35)', borderRadius: 24, padding: 20, marginBottom: 18 }
  const button = styles.button || { border: 0, borderRadius: 14, padding: '12px 16px', fontWeight: 800, cursor: 'pointer', marginRight: 10, marginBottom: 10 }
  const activeButton = styles.activeButton || { ...button, background: '#38bdf8', color: '#020617' }
  const smallButton = { ...button, background: 'rgba(30,41,59,.95)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,.3)' }
  const warningButton = { ...button, background: '#f59e0b', color: '#111827' }

  const checklistItems = [
    { key: 'stats-first', label: 'Check Stats Follow-Up first: any post due for 24h or 7d stats?', tab: 'stats-follow-up' },
    { key: 'quote-tomorrow', label: 'Prepare 1 independent daily quote for tomorrow', tab: 'quotes-planner' },
    { key: 'quote-design', label: 'Create Canva quote image and save quote asset', tab: 'quotes-planner' },
    { key: 'music-week', label: 'Check Music Planner: keep 3 music posts for the week', tab: 'music-planner' },
    { key: 'queue-review', label: 'Open Queue and review ready, draft, scheduled, and published posts', tab: 'queue' },
    { key: 'schedule-main', label: 'Schedule tomorrow main content while you have evening/night time', tab: 'queue' },
    { key: 'live-urls', label: 'Paste live URLs for posts you uploaded manually today', tab: 'queue' },
    { key: 'publisher', label: 'Check Publishing Center only after Queue is clean', tab: 'publishing' },
  ]

  const modeContent = {
    morning: {
      title: 'Morning Quick Check',
      subtitle: 'Use this when you have little time before work. Only confirm today and avoid heavy editing.',
      steps: [
        ['Check Today', '5 minutes', 'Open Queue and confirm today scheduled posts. If manual posting, upload only what is due now.', 'blue', 'queue'],
        ['Publishing Check', '2 minutes', 'If Auto Publishing is ON, confirm the dashboard is open and Publishing is not paused.', 'yellow', 'publishing'],
        ['URL Discipline', 'After posting', 'After every manual upload, paste the live URL in Queue. This is what makes stats tracking possible.', 'green', 'queue'],
      ],
    },
    evening: {
      title: 'Evening/Night Production Routine',
      subtitle: 'This is your main routine. Use it when you have time to prepare tomorrow properly.',
      steps: [
        ['Stats First', '5-10 minutes', 'Open Stats Follow-Up and record anything due. This protects the growth intelligence system.', 'green', 'stats-follow-up'],
        ['Daily Quote', '10-20 minutes', 'Open Quotes Planner, choose/verify one quote, copy Canva prompt, create image, and save ready quote to Queue.', 'purple', 'quotes-planner'],
        ['Main Content', '20-60 minutes', 'Prepare and schedule tomorrow posts. Do not wait until morning to design everything.', 'blue', 'queue'],
        ['Music Check', '5 minutes', 'Confirm the 3-post weekly music target. Music is v1-ready, so maintain it without overworking it.', 'yellow', 'music-planner'],
      ],
    },
    stats: {
      title: 'Stats and Growth Routine',
      subtitle: 'Use this after posts have been live for 24 hours or 7 days.',
      steps: [
        ['Quote Stats Due', 'Start here', 'Open Stats Follow-Up and check Quote Stats Due. Quote wins are measured by reach, shares, saves, and follows.', 'purple', 'stats-follow-up'],
        ['Record in Queue', 'For quotes', 'For quote posts, open Queue and use Save Quote Stats so Stats Follow-Up can read the result.', 'green', 'queue'],
        ['Repeat Winners', 'After stats', 'Use Repeat This Format / Repeat Quote Style for anything with strong saves, shares, or followers gained.', 'yellow', 'stats-follow-up'],
      ],
    },
  }

  const selected = modeContent[mode] || modeContent.evening

  return (
    <div>
      <div style={{ ...card, border: '1px solid rgba(34,197,94,.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#86efac', fontWeight: 900, margin: '0 0 6px' }}>Daily Operating Guide v2</p>
            <h2 style={{ color: '#f8fafc', margin: '0 0 8px' }}>Launch Week Command Center</h2>
            <p style={{ color: '#cbd5e1', margin: 0, maxWidth: 900 }}>
              Use this tab to run the app properly every day. It connects Quotes, Music, Queue, Publishing, and Stats Follow-Up into one realistic phone-friendly workflow.
            </p>
          </div>
          <Pill tone={launchStatus.tone}>{launchStatus.label}</Pill>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          ['morning', 'Morning Check'],
          ['evening', 'Evening/Night Routine'],
          ['stats', 'Stats Routine'],
        ].map(([id, label]) => (
          <button key={id} type="button" style={mode === id ? activeButton : smallButton} onClick={() => setGuideMode(id)}>
            {label}
          </button>
        ))}
        <button type="button" style={warningButton} onClick={copyLaunchWeekGuide}>Copy Launch Week Guide</button>
      </div>

      {copied && <div style={{ ...card, borderColor: 'rgba(250,204,21,.45)', color: '#fde68a', fontWeight: 900 }}>{copied}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          ['Scheduled', stats.scheduled, 'yellow'],
          ['Tomorrow Main', stats.tomorrowMain, 'blue'],
          ['Tomorrow Quotes', stats.tomorrowQuotes, 'purple'],
          ['Ready Quotes', stats.readyQuotes, 'purple'],
          ['Music This Week', stats.musicThisWeek, 'green'],
          ['Quote URLs Needed', stats.quoteNeedsUrl, 'red'],
          ['Quote 24h Stats', stats.quoteNeeds24h, 'yellow'],
          ['Drafts', stats.drafts, 'red'],
        ].map(([label, value, tone]) => (
          <div key={label} style={{ ...card, marginBottom: 0, padding: 14 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 900 }}>{label}</div>
            <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 950 }}>{Number(value).toLocaleString()}</div>
            <Pill tone={tone}>{label}</Pill>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>{selected.title}</h3>
        <p style={{ color: '#cbd5e1', marginTop: -4 }}>{selected.subtitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {selected.steps.map(([title, time, body, tone, tab]) => (
            <StepCard
              key={title}
              title={title}
              time={time}
              tone={tone}
              cardStyle={{ ...card, marginBottom: 0 }}
              actions={[
                <button key="open" type="button" style={smallButton} onClick={() => setActiveTab?.(tab)}>Open</button>,
              ]}
            >
              {body}
            </StepCard>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <button type="button" style={activeButton} onClick={() => copyRoutine(mode)}>Copy This Routine</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('queue')}>Open Queue</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('stats-follow-up')}>Open Stats</button>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Tonight's Operating Checklist</h3>
        <p style={{ color: '#cbd5e1', marginTop: -4 }}>
          This is the exact order to use at night before full launch next week.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {checklistItems.map((item, index) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: 12, borderRadius: 14, background: checklist[item.key] ? 'rgba(34,197,94,.10)' : 'rgba(2,6,23,.45)', border: checklist[item.key] ? '1px solid rgba(34,197,94,.35)' : '1px solid rgba(51,65,85,.65)' }}>
              <label style={{ color: '#e2e8f0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={!!checklist[item.key]} onChange={() => toggleItem(item.key)} />
                <span>{index + 1}. {item.label}</span>
              </label>
              <button type="button" style={smallButton} onClick={() => setActiveTab?.(item.tab)}>Open</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <button type="button" style={activeButton} onClick={() => copyRoutine('evening')}>Copy Evening Routine</button>
          <button type="button" style={smallButton} onClick={resetChecklist}>Reset Checklist</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <div style={card}>
          <h3 style={{ color: '#fde68a', marginTop: 0 }}>Your Launch Week Rule</h3>
          <p style={{ color: '#cbd5e1' }}>Start with consistency before heavy automation.</p>
          <ol style={{ color: '#e2e8f0', lineHeight: 1.75, paddingLeft: 22 }}>
            <li>Post your normal content plan according to your strength.</li>
            <li>Add 1 independent quote post daily.</li>
            <li>Keep music at 3 posts weekly.</li>
            <li>Schedule posts during evening/night.</li>
            <li>Paste live URLs after manual posting.</li>
            <li>Record 24-hour stats the next day.</li>
          </ol>
        </div>

        <div style={card}>
          <h3 style={{ color: '#7dd3fc', marginTop: 0 }}>Manual Posting is Acceptable</h3>
          <p style={{ color: '#cbd5e1' }}>
            For launch week, manual posting is safer. The dashboard should guide the work, keep records, and help you track what grows.
          </p>
          <p style={{ color: '#cbd5e1' }}>
            Automatic Publisher v1 is useful only while the dashboard/browser stays open. True 24/7 automation can come later with server-side cron.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" style={smallButton} onClick={() => setActiveTab?.('queue')}>Open Queue</button>
            <button type="button" style={smallButton} onClick={() => setActiveTab?.('publishing')}>Open Publishing</button>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ color: '#86efac', marginTop: 0 }}>Growth Tracking Reminder</h3>
          <p style={{ color: '#cbd5e1' }}>
            The future Growth Intelligence Engine depends on clean stats. The app must learn from your real winners.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div><div style={{ color: '#94a3b8', fontSize: 12 }}>Views</div><strong style={{ color: '#f8fafc' }}>{totalViews.toLocaleString()}</strong></div>
            <div><div style={{ color: '#94a3b8', fontSize: 12 }}>Shares</div><strong style={{ color: '#f8fafc' }}>{totalShares.toLocaleString()}</strong></div>
            <div><div style={{ color: '#94a3b8', fontSize: 12 }}>Saves</div><strong style={{ color: '#f8fafc' }}>{totalSaves.toLocaleString()}</strong></div>
          </div>
          <button type="button" style={{ ...activeButton, marginTop: 12 }} onClick={() => setActiveTab?.('stats-follow-up')}>Open Stats Follow-Up</button>
        </div>
      </div>

      {launchStatus.issues.length > 0 && (
        <div style={{ ...card, marginTop: 18, border: '1px solid rgba(248,113,113,.35)' }}>
          <h3 style={{ color: '#fca5a5', marginTop: 0 }}>Before Full Launch, Fix These</h3>
          <ul style={{ color: '#e2e8f0', lineHeight: 1.7 }}>
            {launchStatus.issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}