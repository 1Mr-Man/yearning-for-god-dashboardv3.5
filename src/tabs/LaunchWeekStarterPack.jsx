import React, { useMemo, useState } from 'react'
import { supabase } from '../utils/supabase'

const PLAN_KEY = 'yfg_launch_week_content_starter_pack_v1'
const THEME_KEY = 'yfg_launch_week_theme_v1'

function clean(value) {
  return String(value || '').trim()
}

function lower(value) {
  return clean(value).toLowerCase()
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function dateInputValue(date) {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isoAt(dateString, hour = 19, minute = 0) {
  const [year, month, day] = String(dateString).split('-').map(Number)
  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  return date.toISOString()
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

function makeId(prefix = 'launch') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function defaultTheme() {
  return {
    weeklyTheme: 'Seeking God with a Hungry Heart',
    scripture: 'Psalm 42:1',
    voice: 'warm, biblical, simple, Spirit-led',
    platforms: 'Facebook, Instagram, TikTok, YouTube Shorts, Threads',
    mainPostTarget: '3 to 5 main posts daily at launch',
    quoteRule: '1 independent quote post daily',
    musicRule: '3 music posts weekly',
  }
}

function buildPlan(theme, startDate) {
  const baseDate = new Date(`${startDate}T00:00:00`)
  const mainIdeas = [
    {
      title: 'When your soul is thirsty for God',
      type: 'Christian Motivation',
      hook: 'There is a hunger only God can satisfy.',
      caption: 'There are seasons when success, noise, and activity cannot satisfy the soul. The heart was created to long for God. Return to Him today. #YearningForGod #Psalm42',
      scripture: theme.scripture || 'Psalm 42:1',
      time: [7, 0],
    },
    {
      title: 'Do not lose your secret place',
      type: 'Prayer Post',
      hook: 'The secret place is where weak men receive strength.',
      caption: 'Before you face the day, return to the place of prayer. Strength is not only found in strategy; strength is found in God. #Prayer #ChristianLiving',
      scripture: 'Matthew 6:6',
      time: [12, 0],
    },
    {
      title: 'God is still working in hidden seasons',
      type: 'Christian Encouragement',
      hook: 'Hidden does not mean forgotten.',
      caption: 'Sometimes God grows you away from public applause. Do not despise hidden seasons. Roots grow before fruits appear. #Faith #Encouragement',
      scripture: 'Isaiah 40:31',
      time: [19, 0],
    },
    {
      title: 'Grace for consistency',
      type: 'Kingdom Teaching',
      hook: 'Spiritual growth is built daily, not occasionally.',
      caption: 'One prayer today. One scripture today. One act of obedience today. God can build a deep life through daily surrender. #Discipleship #WalkWithGod',
      scripture: 'Luke 9:23',
      time: [7, 30],
    },
    {
      title: 'When prayer feels dry',
      type: 'Prayer Post',
      hook: 'Keep praying even when your emotions are quiet.',
      caption: 'Prayer is not powerful because you feel something every time. Prayer is powerful because God hears. Stay in the place of communion. #PrayerLife #Faith',
      scripture: '1 Thessalonians 5:17',
      time: [20, 0],
    },
    {
      title: 'The Word will steady your heart',
      type: 'Scripture Reflection',
      hook: 'A noisy world needs a Word-governed heart.',
      caption: 'Let the Word of God become louder than fear, pressure, and confusion. A heart anchored in Scripture cannot be easily moved. #BibleVerse #ChristianContent',
      scripture: 'Psalm 119:105',
      time: [13, 0],
    },
    {
      title: 'God sees your obedience',
      type: 'Christian Motivation',
      hook: 'Heaven does not ignore hidden obedience.',
      caption: 'The seed you sow in obedience may look small today, but God is not unrighteous to forget your labour of love. Keep serving. #Obedience #Kingdom',
      scripture: 'Hebrews 6:10',
      time: [18, 30],
    },
  ]

  const quoteIdeas = [
    ['Faith is not proved by noise, but by obedience to the Word of God.', 'Quote Library / verify source before exact attribution', 'Faith'],
    ['A prayerless life slowly becomes a self-dependent life.', 'Yearning for God reflection / verify if attributing to a minister', 'Prayer'],
    ['The secret place is not a religious duty; it is the believer鈥檚 place of renewal.', 'Yearning for God reflection / verify source if from a book', 'Prayer'],
    ['God does not only want your gift; He wants your heart.', 'Quote Library / verify source before exact attribution', 'Consecration'],
    ['Spiritual hunger is preserved by daily fellowship with God.', 'Yearning for God reflection / verify source if needed', 'Hunger for God'],
    ['A man who walks with God will not be stranded by the noise of men.', 'Quote Library / verify source before exact attribution', 'Walk with God'],
    ['The Word of God is not just information; it is life to the believer.', 'Yearning for God reflection / verify if attributing', 'Scripture'],
  ]

  const musicSlots = [
    { day: 0, title: 'Monday worship atmosphere', focus: 'Hunger for God', time: [21, 0] },
    { day: 2, title: 'Midweek worship reflection', focus: 'Strength in God', time: [21, 0] },
    { day: 5, title: 'Weekend thanksgiving sound', focus: 'Gratitude and surrender', time: [20, 30] },
  ]

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(baseDate, index)
    const dateKey = dateInputValue(date)
    const main = mainIdeas[index % mainIdeas.length]
    const quote = quoteIdeas[index % quoteIdeas.length]
    const music = musicSlots.find((slot) => slot.day === index)

    return {
      id: `day-${index + 1}`,
      dayNumber: index + 1,
      date: dateKey,
      theme: theme.weeklyTheme,
      main: {
        id: makeId('main'),
        selected: true,
        title: main.title,
        content_type: main.type,
        hook: main.hook,
        caption: main.caption,
        scripture: main.scripture,
        scheduled_at: isoAt(dateKey, main.time[0], main.time[1]),
        platform: 'Facebook',
      },
      quote: {
        id: makeId('quote'),
        selected: true,
        quote: quote[0],
        source: quote[1],
        category: quote[2],
        author: 'Christian Quote Library',
        scheduled_at: isoAt(dateKey, 9, 0),
        platform: 'Facebook',
      },
      music: music ? {
        id: makeId('music'),
        selected: true,
        title: music.title,
        focus: music.focus,
        scheduled_at: isoAt(dateKey, music.time[0], music.time[1]),
        platform: 'Facebook',
      } : null,
    }
  })

  return {
    created_at: new Date().toISOString(),
    startDate,
    theme,
    days,
  }
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

function makeMainPostText(day, theme) {
  return `LAUNCH WEEK MAIN POST

Theme: ${theme.weeklyTheme}
Scripture: ${day.main.scripture}
Hook: ${day.main.hook}

Caption:
${day.main.caption}

Production note:
This is part of Launch Week Content Starter Pack v1.
Review caption, platform, design/asset, and schedule before publishing.`
}

function makeQuotePostText(day, theme) {
  return `READY QUOTE POST - INDEPENDENT DAILY QUOTE

Quote:
"${day.quote.quote}"

Author / Source:
${day.quote.author}
${day.quote.source}

Category:
${day.quote.category}

Caption:
"${day.quote.quote}"

Let this stir your hunger for God today.

Source status:
Needs verification if attributed to a specific minister, book, father, or patriarch.

Design direction:
Create a clean quote image with strong readable text, warm Christian atmosphere, simple background, and Yearning for God branding.

Tracking note:
Quotes are independent from the normal daily content target.`
}

function makeMusicPostText(day, theme) {
  return `READY MUSIC POST - WEEKLY MUSIC SLOT

Music idea:
${day.music.title}

Focus:
${day.music.focus}

Caption:
A simple worship atmosphere for the week. Let your heart return to God again.

Safe audio reminder:
Use only platform-safe audio, original audio, licensed audio, or approved public-domain/royalty-free music.

Production note:
Music remains 3 posts weekly for v1.`
}

export default function LaunchWeekStarterPack({
  queue = [],
  refreshAllQueueViews,
  setActiveTab,
  styles = {},
}) {
  const savedTheme = loadJson(THEME_KEY, defaultTheme())
  const [theme, setTheme] = useState(savedTheme)
  const [startDate, setStartDate] = useState(dateInputValue(addDays(new Date(), 1)))
  const [plan, setPlan] = useState(() => loadJson(PLAN_KEY, null))
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')

  const card = styles.card || { background: 'rgba(15,23,42,.92)', border: '1px solid rgba(56,189,248,.35)', borderRadius: 24, padding: 20, marginBottom: 18 }
  const button = styles.button || { border: 0, borderRadius: 14, padding: '12px 16px', fontWeight: 800, cursor: 'pointer', marginRight: 10, marginBottom: 10 }
  const activeButton = styles.activeButton || { ...button, background: '#38bdf8', color: '#020617' }
  const smallButton = { ...button, background: 'rgba(30,41,59,.95)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,.3)' }
  const successButton = { ...button, background: '#22c55e', color: '#052e16' }
  const input = styles.input || { width: '100%', padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,.35)', background: '#020617', color: '#f8fafc', marginBottom: 10 }
  const textarea = styles.textarea || { width: '100%', minHeight: 90, padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,.35)', background: '#020617', color: '#f8fafc', marginBottom: 10 }

  const summary = useMemo(() => {
    if (!plan?.days) return { main: 0, quotes: 0, music: 0, total: 0 }
    const main = plan.days.filter((day) => day.main?.selected).length
    const quotes = plan.days.filter((day) => day.quote?.selected).length
    const music = plan.days.filter((day) => day.music?.selected).length
    return { main, quotes, music, total: main + quotes + music }
  }, [plan])

  function updateTheme(field, value) {
    const next = { ...theme, [field]: value }
    setTheme(next)
    saveJson(THEME_KEY, next)
  }

  function generatePlan() {
    const next = buildPlan(theme, startDate)
    setPlan(next)
    saveJson(PLAN_KEY, next)
  }

  function updateDay(dayId, section, field, value) {
    const next = {
      ...plan,
      days: plan.days.map((day) => {
        if (day.id !== dayId) return day
        return {
          ...day,
          [section]: {
            ...day[section],
            [field]: value,
          },
        }
      }),
    }
    setPlan(next)
    saveJson(PLAN_KEY, next)
  }

  function toggleDayItem(dayId, section) {
    const next = {
      ...plan,
      days: plan.days.map((day) => {
        if (day.id !== dayId || !day[section]) return day
        return {
          ...day,
          [section]: {
            ...day[section],
            selected: !day[section].selected,
          },
        }
      }),
    }
    setPlan(next)
    saveJson(PLAN_KEY, next)
  }

  function copyPlanPrompt() {
    const text = `You are a Christian social media content strategist for Yearning for God.

Create a stronger 7-day launch week content plan.

Weekly theme:
${theme.weeklyTheme}

Scripture:
${theme.scripture}

Voice:
${theme.voice}

Platforms:
${theme.platforms}

Rules:
1. Quotes are independent from the normal daily post target.
2. Add 1 quote post daily from Christian books, ministers, fathers, or patriarchs.
3. Keep music to 3 posts weekly.
4. Main content should be practical, biblical, emotional, and easy to post manually.
5. Return each day with: main post idea, quote idea, caption direction, Canva design direction, and schedule suggestion.`
    copyText(text, () => {
      setCopied('AI plan prompt copied.')
      setTimeout(() => setCopied(''), 2500)
    })
  }

  function copyPrintablePlan() {
    if (!plan?.days) return
    const lines = plan.days.map((day) => {
      return `DAY ${day.dayNumber} - ${day.date}
Main: ${day.main.title} (${day.main.content_type})
Quote: "${day.quote.quote}" - ${day.quote.author}
Music: ${day.music ? day.music.title : 'No music slot'}`
    }).join('\n\n')

    const text = `YEARNING FOR GOD - 7 DAY LAUNCH WEEK STARTER PLAN

Theme: ${theme.weeklyTheme}
Scripture: ${theme.scripture}

${lines}

Daily rule:
Normal content plan + 1 independent quote post.
Music rule:
3 music posts weekly.
Tracking rule:
Paste live URL after manual posting and record 24-hour stats the next day.`
    copyText(text, () => {
      setCopied('Printable launch plan copied.')
      setTimeout(() => setCopied(''), 2500)
    })
  }

  async function insertQueueItem(row) {
    const { error } = await supabase.from('content_queue_main').insert([row])
    if (error) throw error
  }

  async function savePlanToQueue() {
    if (!plan?.days?.length) return alert('Generate the 7-day plan first.')
    setBusy(true)
    try {
      const rows = []
      plan.days.forEach((day) => {
        if (day.main?.selected) {
          rows.push({
            platform: day.main.platform || 'Facebook',
            content_type: day.main.content_type || 'Christian Motivation',
            campaign_stage: 'Launch Week Starter Pack - Main Post',
            ministry_name: 'Yearning for God',
            minister_name: 'Yearning for God',
            content_text: makeMainPostText(day, theme),
            status: 'scheduled',
            scheduled_at: day.main.scheduled_at,
            created_at: new Date().toISOString(),
          })
        }

        if (day.quote?.selected) {
          rows.push({
            platform: day.quote.platform || 'Facebook',
            content_type: 'Independent Daily Quote',
            campaign_stage: 'Ready Quote Post - Launch Week',
            ministry_name: 'Yearning for God',
            minister_name: day.quote.author || 'Christian Quote Library',
            content_text: makeQuotePostText(day, theme),
            status: 'scheduled',
            scheduled_at: day.quote.scheduled_at,
            created_at: new Date().toISOString(),
          })
        }

        if (day.music?.selected) {
          rows.push({
            platform: day.music.platform || 'Facebook',
            content_type: 'Music Reflection Post',
            campaign_stage: 'Ready Music Post - Launch Week',
            ministry_name: 'Yearning for God',
            minister_name: 'Yearning for God',
            content_text: makeMusicPostText(day, theme),
            status: 'scheduled',
            scheduled_at: day.music.scheduled_at,
            created_at: new Date().toISOString(),
          })
        }
      })

      for (const row of rows) {
        await insertQueueItem(row)
      }

      if (refreshAllQueueViews) await refreshAllQueueViews()
      alert(`${rows.length} launch week item(s) saved to Queue.`)
      setActiveTab?.('queue')
    } catch (error) {
      console.error(error)
      alert(`Could not save launch plan to Queue: ${error.message || error}`)
    } finally {
      setBusy(false)
    }
  }

  const existingLaunchItems = queue.filter((item) => lower(`${item.content_text || ''} ${item.campaign_stage || ''}`).includes('launch week')).length

  return (
    <div>
      <div style={{ ...card, border: '1px solid rgba(34,197,94,.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#86efac', fontWeight: 900, margin: '0 0 6px' }}>Launch Week Content Starter Pack v1</p>
            <h2 style={{ color: '#f8fafc', margin: '0 0 8px' }}>Prepare your first 7 days quickly</h2>
            <p style={{ color: '#cbd5e1', margin: 0, maxWidth: 900 }}>
              Build a simple launch-week plan: main posts, one independent quote daily, and three music posts for the week.
            </p>
          </div>
          <Pill tone="green">Manual or scheduled launch</Pill>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          ['Main Posts', summary.main, 'blue'],
          ['Daily Quotes', summary.quotes, 'purple'],
          ['Music Slots', summary.music, 'green'],
          ['Total Items', summary.total, 'yellow'],
          ['Already in Queue', existingLaunchItems, 'blue'],
        ].map(([label, value, tone]) => (
          <div key={label} style={{ ...card, marginBottom: 0, padding: 14 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 900 }}>{label}</div>
            <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 950 }}>{Number(value).toLocaleString()}</div>
            <Pill tone={tone}>{label}</Pill>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Launch theme setup</h3>
        <label style={{ color: '#cbd5e1', fontWeight: 800 }}>Start date</label>
        <input style={input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label style={{ color: '#cbd5e1', fontWeight: 800 }}>Weekly theme</label>
        <input style={input} value={theme.weeklyTheme} onChange={(e) => updateTheme('weeklyTheme', e.target.value)} />

        <label style={{ color: '#cbd5e1', fontWeight: 800 }}>Main scripture</label>
        <input style={input} value={theme.scripture} onChange={(e) => updateTheme('scripture', e.target.value)} />

        <label style={{ color: '#cbd5e1', fontWeight: 800 }}>Voice / tone</label>
        <textarea style={textarea} value={theme.voice} onChange={(e) => updateTheme('voice', e.target.value)} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" style={activeButton} onClick={generatePlan}>Generate 7-Day Starter Plan</button>
          <button type="button" style={smallButton} onClick={copyPlanPrompt}>Copy AI Plan Prompt</button>
          {plan?.days && <button type="button" style={smallButton} onClick={copyPrintablePlan}>Copy Printable Plan</button>}
          {plan?.days && <button type="button" style={successButton} disabled={busy} onClick={savePlanToQueue}>{busy ? 'Saving...' : 'Save Selected Items to Queue'}</button>}
        </div>
        {copied && <p style={{ color: '#fde68a', fontWeight: 900 }}>{copied}</p>}
      </div>

      {!plan?.days ? (
        <div style={card}>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>No starter plan yet</h3>
          <p style={{ color: '#cbd5e1' }}>
            Set your launch theme and tap Generate 7-Day Starter Plan. You can edit each day before saving to Queue.
          </p>
        </div>
      ) : (
        <div style={card}>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>7-Day Launch Plan</h3>
          <p style={{ color: '#cbd5e1' }}>
            Select or edit each item. Save only what you want to Queue.
          </p>

          {plan.days.map((day) => (
            <div key={day.id} style={{ padding: 16, borderRadius: 18, border: '1px solid rgba(56,189,248,.25)', background: 'rgba(2,6,23,.38)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ color: '#f8fafc', margin: 0 }}>Day {day.dayNumber} - {day.date}</h3>
                <Pill tone="blue">Launch Week</Pill>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 12 }}>
                <div style={{ padding: 12, borderRadius: 16, background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.25)' }}>
                  <label style={{ color: '#e2e8f0', fontWeight: 900 }}>
                    <input type="checkbox" checked={!!day.main.selected} onChange={() => toggleDayItem(day.id, 'main')} /> Main Post
                  </label>
                  <input style={input} value={day.main.title} onChange={(e) => updateDay(day.id, 'main', 'title', e.target.value)} />
                  <textarea style={textarea} value={day.main.caption} onChange={(e) => updateDay(day.id, 'main', 'caption', e.target.value)} />
                  <input style={input} value={day.main.platform} onChange={(e) => updateDay(day.id, 'main', 'platform', e.target.value)} />
                  <input style={input} type="datetime-local" value={day.main.scheduled_at ? new Date(day.main.scheduled_at).toISOString().slice(0,16) : ''} onChange={(e) => updateDay(day.id, 'main', 'scheduled_at', new Date(e.target.value).toISOString())} />
                </div>

                <div style={{ padding: 12, borderRadius: 16, background: 'rgba(168,85,247,.08)', border: '1px solid rgba(168,85,247,.25)' }}>
                  <label style={{ color: '#e2e8f0', fontWeight: 900 }}>
                    <input type="checkbox" checked={!!day.quote.selected} onChange={() => toggleDayItem(day.id, 'quote')} /> Independent Quote
                  </label>
                  <textarea style={textarea} value={day.quote.quote} onChange={(e) => updateDay(day.id, 'quote', 'quote', e.target.value)} />
                  <input style={input} value={day.quote.author} onChange={(e) => updateDay(day.id, 'quote', 'author', e.target.value)} />
                  <input style={input} value={day.quote.source} onChange={(e) => updateDay(day.id, 'quote', 'source', e.target.value)} />
                  <input style={input} value={day.quote.platform} onChange={(e) => updateDay(day.id, 'quote', 'platform', e.target.value)} />
                  <input style={input} type="datetime-local" value={day.quote.scheduled_at ? new Date(day.quote.scheduled_at).toISOString().slice(0,16) : ''} onChange={(e) => updateDay(day.id, 'quote', 'scheduled_at', new Date(e.target.value).toISOString())} />
                </div>

                {day.music ? (
                  <div style={{ padding: 12, borderRadius: 16, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)' }}>
                    <label style={{ color: '#e2e8f0', fontWeight: 900 }}>
                      <input type="checkbox" checked={!!day.music.selected} onChange={() => toggleDayItem(day.id, 'music')} /> Music Slot
                    </label>
                    <input style={input} value={day.music.title} onChange={(e) => updateDay(day.id, 'music', 'title', e.target.value)} />
                    <input style={input} value={day.music.focus} onChange={(e) => updateDay(day.id, 'music', 'focus', e.target.value)} />
                    <input style={input} value={day.music.platform} onChange={(e) => updateDay(day.id, 'music', 'platform', e.target.value)} />
                    <input style={input} type="datetime-local" value={day.music.scheduled_at ? new Date(day.music.scheduled_at).toISOString().slice(0,16) : ''} onChange={(e) => updateDay(day.id, 'music', 'scheduled_at', new Date(e.target.value).toISOString())} />
                  </div>
                ) : (
                  <div style={{ padding: 12, borderRadius: 16, background: 'rgba(30,41,59,.55)', border: '1px solid rgba(148,163,184,.18)' }}>
                    <Pill tone="yellow">No music slot today</Pill>
                    <p style={{ color: '#cbd5e1' }}>Music is planned 3 times per week for v1.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <h3 style={{ color: '#fde68a', marginTop: 0 }}>How to use this next week</h3>
        <ol style={{ color: '#e2e8f0', lineHeight: 1.8, paddingLeft: 22 }}>
          <li>Generate the 7-day plan.</li>
          <li>Edit the quotes if you have verified book/minister sources.</li>
          <li>Save selected items to Queue.</li>
          <li>Open Queue and adjust schedule/platforms.</li>
          <li>Create quote images in Canva using Quotes Planner workflow.</li>
          <li>Post manually if needed, paste live URL, and track stats tomorrow.</li>
        </ol>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('daily-command')}>Open Daily Command</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('launch-readiness')}>Open Launch Readiness</button>
          <button type="button" style={smallButton} onClick={() => setActiveTab?.('queue')}>Open Queue</button>
        </div>
      </div>
    </div>
  )
}