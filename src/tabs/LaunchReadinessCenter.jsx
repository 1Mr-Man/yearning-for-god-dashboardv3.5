import React, { useMemo, useState } from 'react'

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

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isBetween(date, start, end) {
  return date && date >= start && date < end
}

function scheduledDate(item) {
  return safeDate(item?.scheduled_at || item?.schedule_date || item?.publish_at || item?.published_at || item?.created_at)
}

function getText(item) {
  return lower(`${item?.id || ''} ${item?.platform || ''} ${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.minister_name || ''} ${item?.ministry_name || ''} ${item?.content_text || ''}`)
}

function isQuoteItem(item) {
  const text = getText(item)
  return text.includes('quote') || text.includes('independent daily quote') || text.includes('book quote') || text.includes('quote library') || text.includes('quote publishing tracking v1')
}

function isMusicItem(item) {
  const text = getText(item)
  return text.includes('music') || text.includes('song') || text.includes('worship atmosphere') || text.includes('safe audio') || text.includes('soundtrack') || text.includes('weekly sound')
}

function isReadyQuotePost(item) {
  const text = getText(item)
  return isQuoteItem(item) && (
    text.includes('ready quote post') ||
    text.includes('public quote caption:') ||
    text.includes('publish-ready quote caption:') ||
    text.includes('final quote caption:') ||
    text.includes('ready public quote:')
  )
}

function isReadyMusicPost(item) {
  const text = getText(item)
  return isMusicItem(item) && (
    text.includes('ready music post') ||
    text.includes('public music caption:') ||
    text.includes('publish-ready music caption:') ||
    text.includes('final music caption:')
  )
}

function isMainPost(item) {
  const text = getText(item)
  if (isQuoteItem(item) || isMusicItem(item)) return false
  if (text.includes('asset request') || text.includes('design prompt') || text.includes('manual publishing checklist')) return false
  return clean(item?.content_text).length > 15 || clean(item?.content_type).length > 0
}

function getLiveUrl(item = {}) {
  const direct = clean(item.external_post_url) || clean(item.live_post_url)
  if (direct) return direct
  const text = clean(item.content_text)
  const match = text.match(/(?:Live URL|Post URL|URL|Live URL Updated):\s*(https?:\/\/\S+)/i)
  if (match?.[1]) return match[1].replace(/[)\].,]+$/, '')
  return ''
}

function hasStats(item, stage) {
  const text = getText(item)
  if (stage === '24h') return text.includes('24h stats recorded: yes') || text.includes('24-hour stats recorded: yes')
  if (stage === '7d') return text.includes('7d stats recorded: yes') || text.includes('7-day stats recorded: yes')
  return text.includes('stats recorded')
}

function scoreItem(pass, weight) {
  return pass ? weight : 0
}

function TonePill({ children, tone = 'blue' }) {
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

function copyToClipboard(text, done) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(done)
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

export default function LaunchReadinessCenter({
  queue = [],
  performanceStats = {},
  autoPublishEnabled = false,
  publishingPaused = false,
  setActiveTab,
  styles = {},
}) {
  const [copied, setCopied] = useState('')

  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const next7 = addDays(today, 7)

  const readiness = useMemo(() => {
    const safeQueue = Array.isArray(queue) ? queue : []
    const scheduled = safeQueue.filter((item) => lower(item.status) === 'scheduled')
    const published = safeQueue.filter((item) => lower(item.status) === 'published')
    const drafts = safeQueue.filter((item) => lower(item.status || 'draft') === 'draft')
    const scheduledNext7 = scheduled.filter((item) => isBetween(scheduledDate(item), today, next7))
    const tomorrowPosts = safeQueue.filter((item) => isBetween(scheduledDate(item), tomorrow, addDays(tomorrow, 1)))
    const tomorrowMain = tomorrowPosts.filter(isMainPost)
    const tomorrowQuotes = tomorrowPosts.filter(isQuoteItem)
    const readyQuotes = safeQueue.filter(isReadyQuotePost)
    const readyMusic = safeQueue.filter(isReadyMusicPost)
    const musicNext7 = safeQueue.filter((item) => isMusicItem(item) && isBetween(scheduledDate(item), today, next7))
    const publishedQuotes = published.filter(isQuoteItem)
    const quoteNeedsUrl = publishedQuotes.filter((item) => !getLiveUrl(item))
    const quoteNeeds24h = publishedQuotes.filter((item) => getLiveUrl(item) && !hasStats(item, '24h'))
    const realPublishedWithUrl = published.filter((item) => getLiveUrl(item))
    const perfRecords = Array.isArray(performanceStats?.records) ? performanceStats.records : Array.isArray(performanceStats) ? performanceStats : []
    const statsRecords = perfRecords.length
    const platforms = new Set(scheduledNext7.map((item) => clean(item.platform)).filter(Boolean))
    const quoteLibraryActive = safeQueue.some(isQuoteItem)
    const musicActive = safeQueue.some(isMusicItem)
    const statsActive = statsRecords > 0 || published.some((item) => hasStats(item, '24h') || hasStats(item, '7d'))

    const checks = [
      {
        id: 'queue',
        title: 'Queue has scheduled content',
        pass: scheduledNext7.length >= 7,
        value: `${scheduledNext7.length} scheduled in next 7 days`,
        fix: 'Open Queue and schedule at least 7 posts across the next week.',
        tab: 'queue',
        weight: 15,
      },
      {
        id: 'tomorrow-main',
        title: 'Tomorrow has main content',
        pass: tomorrowMain.length >= 3,
        value: `${tomorrowMain.length} main item(s) for tomorrow`,
        fix: 'Schedule at least 3 main posts for tomorrow before launch week.',
        tab: 'queue',
        weight: 10,
      },
      {
        id: 'quotes',
        title: 'Independent quote system is ready',
        pass: readyQuotes.length >= 1 || tomorrowQuotes.length >= 1,
        value: `${readyQuotes.length} ready quote(s), ${tomorrowQuotes.length} tomorrow quote(s)`,
        fix: 'Open Quotes Planner and prepare one independent quote post.',
        tab: 'quotes-planner',
        weight: 15,
      },
      {
        id: 'music',
        title: 'Music v1 target is covered',
        pass: musicNext7.length >= 3 || readyMusic.length >= 3,
        value: `${musicNext7.length} music item(s) in next 7 days, ${readyMusic.length} ready music`,
        fix: 'Open Music Planner and keep 3 music posts for the week.',
        tab: 'music-planner',
        weight: 10,
      },
      {
        id: 'stats',
        title: 'Stats tracking is active',
        pass: statsActive || realPublishedWithUrl.length > 0,
        value: `${statsRecords} external record(s), ${realPublishedWithUrl.length} published post(s) with URL`,
        fix: 'After posting, paste live URLs and record 24-hour stats.',
        tab: 'stats-follow-up',
        weight: 15,
      },
      {
        id: 'quote-url',
        title: 'Quote live URLs are clean',
        pass: quoteNeedsUrl.length === 0,
        value: `${quoteNeedsUrl.length} quote(s) need live URL`,
        fix: 'Open Queue, paste live URLs, then mark quote posts properly tracked.',
        tab: 'queue',
        weight: 10,
      },
      {
        id: 'quote-stats',
        title: 'Quote stats follow-up is clean',
        pass: quoteNeeds24h.length === 0,
        value: `${quoteNeeds24h.length} quote(s) need 24h stats`,
        fix: 'Open Queue or Stats Follow-Up and save 24-hour quote stats.',
        tab: 'stats-follow-up',
        weight: 10,
      },
      {
        id: 'platforms',
        title: 'Platforms are represented',
        pass: platforms.size >= 3,
        value: `${platforms.size} platform(s) scheduled next 7 days`,
        fix: 'Schedule posts across Facebook, Instagram, TikTok, YouTube, and Threads as available.',
        tab: 'social-accounts',
        weight: 5,
      },
      {
        id: 'drafts',
        title: 'Drafts are under control',
        pass: drafts.length <= 40,
        value: `${drafts.length} draft(s)`,
        fix: 'Convert the best drafts into scheduled posts or remove weak drafts.',
        tab: 'queue',
        weight: 5,
      },
      {
        id: 'daily-guide',
        title: 'Daily operating guide is installed',
        pass: true,
        value: 'Daily Command is available',
        fix: 'Use Daily Command every evening/night.',
        tab: 'daily-command',
        weight: 5,
      },
    ]

    const total = checks.reduce((sum, item) => sum + item.weight, 0)
    const score = checks.reduce((sum, item) => sum + scoreItem(item.pass, item.weight), 0)
    const percent = Math.round((score / total) * 100)
    const failed = checks.filter((item) => !item.pass)

    let level = { label: 'Ready for Launch Week', tone: 'green' }
    if (percent < 60) level = { label: 'Not Ready Yet', tone: 'red' }
    else if (percent < 80) level = { label: 'Almost Ready', tone: 'yellow' }

    return {
      percent,
      level,
      checks,
      failed,
      scheduledNext7,
      tomorrowPosts,
      tomorrowMain,
      tomorrowQuotes,
      readyQuotes,
      readyMusic,
      musicNext7,
      publishedQuotes,
      quoteNeedsUrl,
      quoteNeeds24h,
      statsRecords,
      autoMode: autoPublishEnabled && !publishingPaused,
    }
  }, [queue, performanceStats, autoPublishEnabled, publishingPaused])

  function copyReadinessReport() {
    const failedLines = readiness.failed.map((item) => `- ${item.title}: ${item.value}. Fix: ${item.fix}`).join('\n') || '- No major failed checks.'
    const passedLines = readiness.checks.filter((item) => item.pass).map((item) => `- ${item.title}: ${item.value}`).join('\n')

    const text = `YEARNING FOR GOD - LAUNCH READINESS REPORT

Launch readiness score:
${readiness.percent}/100 - ${readiness.level.label}

Passed checks:
${passedLines}

Fix before launch:
${failedLines}

Recommended next action:
${readiness.failed[0]?.fix || 'Start launch week routine from Daily Command Center.'}

Operating rule:
- Normal content plan + 1 independent quote daily.
- Music remains 3 posts weekly.
- Manual posting is acceptable for launch week.
- Paste live URLs after posting.
- Record 24-hour and 7-day stats.
- Repeat winning quote and content formats.`
    copyToClipboard(text, () => {
      setCopied('Launch readiness report copied.')
      setTimeout(() => setCopied(''), 2500)
    })
  }

  const card = styles.card || { background: 'rgba(15,23,42,.92)', border: '1px solid rgba(56,189,248,.35)', borderRadius: 24, padding: 20, marginBottom: 18 }
  const button = styles.button || { border: 0, borderRadius: 14, padding: '12px 16px', fontWeight: 800, cursor: 'pointer', marginRight: 10, marginBottom: 10 }
  const activeButton = styles.activeButton || { ...button, background: '#38bdf8', color: '#020617' }
  const smallButton = { ...button, background: 'rgba(30,41,59,.95)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,.3)' }
  const dangerButton = { ...button, background: '#ef4444', color: '#fff' }

  const nextFix = readiness.failed[0]

  return (
    <div>
      <div style={{ ...card, border: '1px solid rgba(34,197,94,.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#86efac', fontWeight: 900, margin: '0 0 6px' }}>Launch Readiness Center v1</p>
            <h2 style={{ color: '#f8fafc', margin: '0 0 8px' }}>Is the app ready for next week?</h2>
            <p style={{ color: '#cbd5e1', margin: 0, maxWidth: 900 }}>
              This checks Quotes, Music, Queue, Publishing, Stats, URLs, and daily workflow readiness before full launch.
            </p>
          </div>
          <TonePill tone={readiness.level.tone}>{readiness.level.label}</TonePill>
        </div>
      </div>

      <div style={{ ...card, borderColor: readiness.level.tone === 'green' ? 'rgba(34,197,94,.55)' : readiness.level.tone === 'yellow' ? 'rgba(250,204,21,.55)' : 'rgba(248,113,113,.55)' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontWeight: 900 }}>Readiness score</p>
        <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ color: '#f8fafc', fontSize: 56, margin: '6px 0' }}>{readiness.percent}/100</h1>
          <TonePill tone={readiness.level.tone}>{readiness.level.label}</TonePill>
        </div>
        <div style={{ width: '100%', height: 14, background: 'rgba(51,65,85,.75)', borderRadius: 999, overflow: 'hidden', margin: '8px 0 12px' }}>
          <div style={{ width: `${readiness.percent}%`, height: '100%', background: readiness.level.tone === 'green' ? '#22c55e' : readiness.level.tone === 'yellow' ? '#f59e0b' : '#ef4444' }} />
        </div>
        {nextFix ? (
          <p style={{ color: '#fde68a', fontWeight: 900, margin: '8px 0' }}>Next fix: {nextFix.fix}</p>
        ) : (
          <p style={{ color: '#86efac', fontWeight: 900, margin: '8px 0' }}>You can start launch-week operation and use Daily Command every evening.</p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" style={activeButton} onClick={copyReadinessReport}>Copy Readiness Report</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('daily-command')}>Open Daily Command</button>
          {nextFix && <button type="button" style={dangerButton} onClick={() => setActiveTab?.(nextFix.tab)}>Fix First Issue</button>}
        </div>
        {copied && <p style={{ color: '#fde68a', fontWeight: 900 }}>{copied}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          ['Next 7 Days', readiness.scheduledNext7.length, 'blue'],
          ['Tomorrow Main', readiness.tomorrowMain.length, 'blue'],
          ['Tomorrow Quotes', readiness.tomorrowQuotes.length, 'purple'],
          ['Ready Quotes', readiness.readyQuotes.length, 'purple'],
          ['Music Next 7', readiness.musicNext7.length, 'green'],
          ['Quote URL Fix', readiness.quoteNeedsUrl.length, 'red'],
          ['Quote 24h Fix', readiness.quoteNeeds24h.length, 'yellow'],
          ['Stats Records', readiness.statsRecords, 'green'],
        ].map(([label, value, tone]) => (
          <div key={label} style={{ ...card, marginBottom: 0, padding: 14 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 900 }}>{label}</div>
            <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 950 }}>{Number(value).toLocaleString()}</div>
            <TonePill tone={tone}>{label}</TonePill>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Readiness checks</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {readiness.checks.map((item) => (
            <div key={item.id} style={{ padding: 14, borderRadius: 16, border: item.pass ? '1px solid rgba(34,197,94,.35)' : '1px solid rgba(248,113,113,.35)', background: item.pass ? 'rgba(34,197,94,.08)' : 'rgba(127,29,29,.16)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: '#f8fafc' }}>{item.title}</strong>
                  <p style={{ color: '#cbd5e1', margin: '5px 0 0' }}>{item.value}</p>
                  {!item.pass && <p style={{ color: '#fca5a5', margin: '5px 0 0', fontWeight: 900 }}>Fix: {item.fix}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TonePill tone={item.pass ? 'green' : 'red'}>{item.pass ? 'Ready' : 'Fix'}</TonePill>
                  <button type="button" style={smallButton} onClick={() => setActiveTab?.(item.tab)}>Open</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <div style={card}>
          <h3 style={{ color: '#fde68a', marginTop: 0 }}>Launch Week Minimum</h3>
          <ol style={{ color: '#e2e8f0', lineHeight: 1.8, paddingLeft: 22 }}>
            <li>Use Daily Command every evening/night.</li>
            <li>Prepare one independent quote post daily.</li>
            <li>Keep music at 3 posts weekly.</li>
            <li>Schedule tomorrow main posts before sleeping.</li>
            <li>Paste live URLs after manual posting.</li>
            <li>Record 24-hour stats the next day.</li>
          </ol>
        </div>

        <div style={card}>
          <h3 style={{ color: '#7dd3fc', marginTop: 0 }}>Manual vs Automatic</h3>
          <p style={{ color: '#cbd5e1' }}>
            Current status: {readiness.autoMode ? 'automatic publishing appears active' : 'manual posting / controlled publishing is safer for launch week'}.
          </p>
          <p style={{ color: '#cbd5e1' }}>
            For launch week, the safest target is not full automation first. The target is clean queue, clean URLs, and clean stats.
          </p>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('publishing')}>Open Publishing</button>
        </div>

        <div style={card}>
          <h3 style={{ color: '#86efac', marginTop: 0 }}>After Launch</h3>
          <p style={{ color: '#cbd5e1' }}>
            Once this score stays above 80/100 for a few days, the next big upgrade should be Growth Intelligence: what to post tomorrow based on your own winners.
          </p>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('stats-follow-up')}>Open Stats Follow-Up</button>
        </div>
      </div>
    </div>
  )
}