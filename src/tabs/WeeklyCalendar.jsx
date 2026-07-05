import React, { useMemo, useState } from 'react'
import { supabase } from '../utils/supabase'

const cardBase = {
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(56, 189, 248, 0.35)',
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
  boxShadow: '0 18px 45px rgba(2, 8, 23, 0.25)',
}

const buttonBase = {
  border: 0,
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 800,
  cursor: 'pointer',
  marginRight: 10,
  marginBottom: 10,
}

function safeText(value) {
  return String(value || '').toLowerCase()
}

function shortPreview(text, max = 120) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'No content preview yet.'
  if (clean.length <= max) return clean
  return `${clean.slice(0, max)}...`
}

function getStatus(item) {
  return safeText(item?.status || item?.publishing_status || '')
}

function getType(item) {
  return item?.content_type || item?.type || 'Content'
}

function getPlatform(item) {
  return item?.platform || item?.channel || 'General'
}

function isInternalItem(item) {
  const text = `${safeText(item?.content_text)} ${safeText(item?.content_type)} ${safeText(item?.minister_name)} ${safeText(item?.platform)} ${safeText(item?.campaign_stage)}`
  return (
    text.includes('dry run') ||
    text.includes('buffer test') ||
    text.includes('manual publishing checklist') ||
    text.includes('poster design prompt') ||
    text.includes('image prompt') ||
    text.includes('production note') ||
    text.includes('asset request') ||
    text.includes('caption file') ||
    text.includes('internal workflow') ||
    text.includes('test post')
  )
}

function isMusicItem(item) {
  const text = `${safeText(item?.content_text)} ${safeText(item?.content_type)} ${safeText(item?.campaign_stage)} ${safeText(item?.ministry_name)}`
  return text.includes('music') || text.includes('song') || text.includes('worship') || text.includes('weekly sound') || text.includes('soundtrack')
}

function isVideoItem(item) {
  const text = `${safeText(item?.content_text)} ${safeText(item?.content_type)} ${safeText(item?.campaign_stage)} ${safeText(item?.platform)}`
  return text.includes('short') || text.includes('video') || text.includes('reel') || text.includes('tiktok') || text.includes('youtube')
}

function isPrayerItem(item) {
  const text = `${safeText(item?.content_text)} ${safeText(item?.content_type)}`
  return text.includes('pray') || text.includes("let's pray") || text.includes('father,') || text.includes('amen')
}

function isDesignItem(item) {
  const text = `${safeText(item?.content_text)} ${safeText(item?.content_type)} ${safeText(item?.campaign_stage)} ${safeText(item?.status)}`
  return text.includes('design') || text.includes('poster') || text.includes('image quote') || text.includes('graphic')
}

function getThemeFromQueue(queue) {
  const joined = (queue || []).slice(0, 160).map((item) => `${item.content_type || ''} ${item.content_text || ''} ${item.campaign_stage || ''}`).join(' ').toLowerCase()
  const themes = [
    {
      key: 'prayer',
      label: 'Prayer and Intimacy with God',
      scripture: 'Psalm 42:1',
      focus: 'Call people back to prayer, worship, surrender, and closeness with God.',
    },
    {
      key: 'worship',
      label: 'Worship and Surrender',
      scripture: 'John 4:23',
      focus: 'Teach true worship and create a worship atmosphere across the week.',
    },
    {
      key: 'fruitfulness',
      label: 'Kingdom Fruitfulness',
      scripture: 'John 15:5',
      focus: 'Show that real fruitfulness comes from abiding in Christ.',
    },
    {
      key: 'faith',
      label: 'Faith and Strength',
      scripture: 'Isaiah 40:31',
      focus: 'Encourage believers to trust God and keep moving with strength.',
    },
    {
      key: 'prophecy',
      label: 'Prophetic Declaration and Alignment',
      scripture: 'Ezekiel 37:4',
      focus: 'Use declarations to stir faith, obedience, hope, and spiritual alignment.',
    },
    {
      key: 'birthday',
      label: 'Honour and Thanksgiving',
      scripture: '1 Thessalonians 5:18',
      focus: 'Honour kingdom servants and thank God for lives of impact.',
    },
    {
      key: 'christian lifestyle',
      label: 'Christian Lifestyle and Discipleship',
      scripture: 'Matthew 5:16',
      focus: 'Help believers live visibly for Christ in daily life.',
    },
  ]
  return themes.find((theme) => joined.includes(theme.key)) || {
    label: 'Hunger for God and Spiritual Growth',
    scripture: 'Psalm 42:1',
    focus: 'Let the whole week point people back to hunger, prayer, worship, surrender, and growth in God.',
  }
}

function weekdayName(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long' })
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function nextSevenDays() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function buildDefaultSlots(theme) {
  return [
    {
      dayLabel: 'Monday',
      time: '7:00 AM',
      title: 'Anchor Scripture + Weekly Direction',
      platform: 'Facebook / Instagram / Threads',
      type: 'Scripture Anchor Post',
      asset: 'Caption + simple scripture design',
      direction: `Introduce ${theme.label} with ${theme.scripture}.`,
    },
    {
      dayLabel: 'Tuesday',
      time: '7:00 PM',
      title: 'Music Post 1 - Worship Atmosphere',
      platform: 'Instagram / Facebook',
      type: 'Music Reflection Post',
      asset: 'Safe audio + worship caption',
      direction: 'Use platform-approved audio and connect it to the weekly theme.',
    },
    {
      dayLabel: 'Wednesday',
      time: '12:00 PM',
      title: 'Midweek Prayer Post',
      platform: 'Facebook / Threads',
      type: 'Prayer Post',
      asset: 'Prayer caption',
      direction: 'Lead a short prayer aligned with the weekly theme.',
    },
    {
      dayLabel: 'Thursday',
      time: '6:00 PM',
      title: 'Sermon Short / Teaching Clip',
      platform: 'TikTok / YouTube Shorts / Instagram Reels',
      type: 'Short Video',
      asset: 'Video clip + captions',
      direction: 'Use one sermon short or audio-first clip that strengthens the theme.',
    },
    {
      dayLabel: 'Friday',
      time: '7:00 PM',
      title: 'Christian Lifestyle Application',
      platform: 'Facebook / Instagram',
      type: 'Christian Lifestyle Post',
      asset: 'Caption + optional design',
      direction: 'Show how the weekly theme applies to daily obedience and devotion.',
    },
    {
      dayLabel: 'Saturday',
      time: '6:00 PM',
      title: 'Music Post 2 - Midweek Strength',
      platform: 'TikTok / Instagram Reels',
      type: 'Short Music Video',
      asset: 'Short video + safe audio',
      direction: 'Create a short encouragement music video using safe audio.',
    },
    {
      dayLabel: 'Sunday',
      time: '8:00 PM',
      title: 'Music Post 3 - Weekly Recap',
      platform: 'Facebook / YouTube Shorts / Instagram',
      type: 'Weekly Recap Music Post',
      asset: '3 to 5 screenshots or clips + safe worship background',
      direction: 'Summarize the best content of the week with a reflective caption.',
    },
  ]
}

function pickCandidateForSlot(slot, candidates, usedIds) {
  const title = safeText(slot.title)
  let preferred = []

  if (title.includes('music')) preferred = candidates.filter(isMusicItem)
  else if (title.includes('sermon') || title.includes('clip')) preferred = candidates.filter(isVideoItem)
  else if (title.includes('prayer')) preferred = candidates.filter(isPrayerItem)
  else if (title.includes('lifestyle')) preferred = candidates.filter((item) => safeText(getType(item)).includes('lifestyle'))
  else preferred = candidates

  const item = preferred.find((entry) => !usedIds.has(entry.id)) || candidates.find((entry) => !usedIds.has(entry.id))
  if (item?.id) usedIds.add(item.id)
  return item || null
}

export default function WeeklyCalendar({ queue = [], performanceStats = [], setActiveTab, refreshAllQueueViews, styles = {} }) {
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('calendar')

  const cardStyle = styles.card || cardBase
  const buttonStyle = styles.button || buttonBase
  const primaryButton = styles.primaryButton || { ...buttonBase, background: '#22c55e', color: '#06121f' }

  const realQueue = useMemo(() => (queue || []).filter((item) => !isInternalItem(item)), [queue])
  const theme = useMemo(() => getThemeFromQueue(realQueue), [realQueue])
  const days = useMemo(() => nextSevenDays(), [])
  const defaultSlots = useMemo(() => buildDefaultSlots(theme), [theme])

  const readyItems = useMemo(() => realQueue.filter((item) => {
    const status = getStatus(item)
    return status.includes('ready') || status.includes('scheduled') || status.includes('draft')
  }), [realQueue])

  const needsVideo = useMemo(() => realQueue.filter((item) => {
    const text = `${safeText(item?.status)} ${safeText(item?.content_type)} ${safeText(item?.campaign_stage)}`
    return text.includes('needs video') || (isVideoItem(item) && getStatus(item).includes('draft'))
  }), [realQueue])

  const needsDesign = useMemo(() => realQueue.filter((item) => {
    const text = `${safeText(item?.status)} ${safeText(item?.content_type)} ${safeText(item?.campaign_stage)}`
    return text.includes('needs design') || isDesignItem(item)
  }), [realQueue])

  const musicItems = useMemo(() => realQueue.filter(isMusicItem), [realQueue])
  const usedIds = useMemo(() => new Set(), [readyItems])

  const calendarRows = useMemo(() => defaultSlots.map((slot, index) => {
    const date = days[index] || new Date()
    const candidate = pickCandidateForSlot(slot, readyItems, usedIds)
    const status = candidate ? (candidate.status || 'draft') : 'planned'
    return {
      ...slot,
      date,
      day: weekdayName(date),
      shortDate: formatShortDate(date),
      candidate,
      status,
    }
  }), [defaultSlots, days, readyItems, usedIds])

  const uploadReadyCount = calendarRows.filter((row) => row.candidate && !safeText(row.status).includes('draft')).length
  const plannedCount = calendarRows.filter((row) => !row.candidate).length

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied')
    } catch (error) {
      alert('Copy failed. Long press and copy manually.')
    }
  }

  const weeklyPrompt = `You are a Christian weekly content calendar manager for Yearning for God.\n\nCreate a phone-friendly 7-day manual posting calendar.\n\nWeekly theme: ${theme.label}\nAnchor scripture: ${theme.scripture}\nTheme focus: ${theme.focus}\n\nCurrent counts:\nReady/draft/scheduled items: ${readyItems.length}\nMusic items: ${musicItems.length}\nNeeds video: ${needsVideo.length}\nNeeds design: ${needsDesign.length}\nPublished records with URL: ${(performanceStats || []).length}\n\nSuggested weekly calendar:\n${calendarRows.map((row) => `${row.day} ${row.time} - ${row.platform} - ${row.type} - ${row.title}`).join('\n')}\n\nRules:\n- One person using a phone\n- Manual posting only\n- 3 music posts per week\n- Use platform-approved audio, original music, or licensed music only\n- Paste live URLs immediately after posting\n- Track 24-hour stats the next day\n\nReturn:\n1. Priority order\n2. Weekly calendar\n3. Daily upload target\n4. Design tasks\n5. Video tasks\n6. Music tasks\n7. What to track after posting`

  const saveCalendarToQueue = async () => {
    setSaving(true)
    try {
      const rows = calendarRows.map((row) => {
        const scheduled = new Date(row.date)
        const hour = row.time.includes('7:00 AM') ? 7 : row.time.includes('12:00 PM') ? 12 : row.time.includes('8:00 PM') ? 20 : row.time.includes('6:00 PM') ? 18 : 19
        scheduled.setHours(hour, 0, 0, 0)
        return {
          minister_name: row.candidate?.minister_name || 'Yearning for God',
          ministry_name: 'Weekly Content Calendar',
          content_type: row.type,
          platform: row.platform,
          content_text: `${row.title}\n\nWeekly Theme: ${theme.label}\nAnchor Scripture: ${theme.scripture}\n\nDay: ${row.day}\nTime: ${row.time}\nPlatform: ${row.platform}\nNeeded Asset: ${row.asset}\n\nDirection: ${row.direction}\n\nQueue match: ${row.candidate ? `${row.candidate.minister_name || 'Unknown'} - ${getType(row.candidate)}` : 'No matched ready item yet'}\n\nProduction note: Turn this calendar brief into a finished public caption, design, or video before publishing.`,
          campaign_stage: 'Weekly Content Calendar',
          status: 'draft',
          scheduled_at: scheduled.toISOString(),
        }
      })
      const { error } = await supabase.from('content_queue_main').insert(rows)
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert('Weekly calendar saved to Queue as 7 draft items')
    } catch (error) {
      alert(error?.message || 'Could not save weekly calendar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle || styles.title}>Weekly Content Calendar</h1>
      <p style={styles.subtitle}>Arrange the weekly theme, music posts, sermon shorts, prayer posts, and upload tasks into a simple 7-day manual calendar.</p>

      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>This week's calendar direction</p>
        <h2 style={{ marginTop: 0 }}>{theme.label}</h2>
        <p style={{ color: '#cbd5e1' }}><strong>Anchor Scripture:</strong> {theme.scripture}</p>
        <p style={{ color: '#cbd5e1' }}><strong>Focus:</strong> {theme.focus}</p>
        <button type="button" style={primaryButton} onClick={() => copyText(weeklyPrompt)}>Copy Weekly Calendar Prompt</button>
        <button type="button" style={buttonStyle} onClick={saveCalendarToQueue} disabled={saving}>{saving ? 'Saving...' : 'Save Calendar to Queue'}</button>
        <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('weekly-theme')}>Open Weekly Theme</button>
        <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('production-sprint')}>Open Production Sprint</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>CALENDAR DAYS</p><h2>{calendarRows.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>READY MATCHES</p><h2>{uploadReadyCount}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>PLANNED ONLY</p><h2>{plannedCount}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>MUSIC ITEMS</p><h2>{musicItems.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>NEEDS DESIGN</p><h2>{needsDesign.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>NEEDS VIDEO</p><h2>{needsVideo.length}</h2></div>
      </div>

      <div style={cardStyle}>
        <h2>Calendar View</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <button type="button" style={{ ...buttonStyle, background: view === 'calendar' ? '#38bdf8' : undefined, color: view === 'calendar' ? '#06121f' : undefined }} onClick={() => setView('calendar')}>7-Day Calendar</button>
          <button type="button" style={{ ...buttonStyle, background: view === 'tasks' ? '#38bdf8' : undefined, color: view === 'tasks' ? '#06121f' : undefined }} onClick={() => setView('tasks')}>Production Tasks</button>
          <button type="button" style={{ ...buttonStyle, background: view === 'rules' ? '#38bdf8' : undefined, color: view === 'rules' ? '#06121f' : undefined }} onClick={() => setView('rules')}>Posting Rules</button>
        </div>

        {view === 'calendar' && (
          <div style={{ display: 'grid', gap: 14 }}>
            {calendarRows.map((row) => (
              <div key={`${row.day}-${row.title}`} style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 16, background: 'rgba(2, 8, 23, 0.45)' }}>
                <p style={{ color: '#38bdf8', fontWeight: 900 }}>{row.day} - {row.shortDate} - {row.time}</p>
                <h3 style={{ marginTop: 0 }}>{row.title}</h3>
                <p><strong>Platform:</strong> {row.platform}</p>
                <p><strong>Type:</strong> {row.type}</p>
                <p><strong>Needed Asset:</strong> {row.asset}</p>
                <p><strong>Status:</strong> {row.status}</p>
                {row.candidate ? (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: 'rgba(15, 23, 42, 0.7)' }}>
                    <p style={{ color: '#22c55e', fontWeight: 900, marginTop: 0 }}>Matched Queue Item</p>
                    <p><strong>{row.candidate.minister_name || 'Yearning for God'}</strong> - {getType(row.candidate)}</p>
                    <p style={{ color: '#cbd5e1' }}>{shortPreview(row.candidate.content_text)}</p>
                  </div>
                ) : (
                  <p style={{ color: '#fbbf24' }}>No ready item matched yet. Create this from Weekly Theme, Music Planner, or Queue.</p>
                )}
                <button type="button" style={buttonStyle} onClick={() => copyText(`${row.day} ${row.time}\n${row.title}\nPlatform: ${row.platform}\nType: ${row.type}\nNeeded Asset: ${row.asset}\nWeekly Theme: ${theme.label}\nScripture: ${theme.scripture}\nDirection: ${row.direction}`)}>Copy Day Brief</button>
              </div>
            ))}
          </div>
        )}

        {view === 'tasks' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(2, 8, 23, 0.45)' }}>
              <h3>Upload Tasks</h3>
              <p style={{ color: '#cbd5e1' }}>Post 4 ready items per day. Paste live URLs immediately after each upload.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(2, 8, 23, 0.45)' }}>
              <h3>Design Tasks</h3>
              <p style={{ color: '#cbd5e1' }}>Create 2 designs today. Start with scripture anchor, music cover, or image quote designs.</p>
              {needsDesign.slice(0, 3).map((item) => <p key={item.id || item.content_text} style={{ color: '#93c5fd' }}>{item.minister_name || 'Yearning for God'} - {getType(item)}</p>)}
            </div>
            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(2, 8, 23, 0.45)' }}>
              <h3>Video Tasks</h3>
              <p style={{ color: '#cbd5e1' }}>Create 2 videos today. Prioritize sermon shorts and weekly music recap videos.</p>
              {needsVideo.slice(0, 3).map((item) => <p key={item.id || item.content_text} style={{ color: '#93c5fd' }}>{item.minister_name || 'Yearning for God'} - {getType(item)}</p>)}
            </div>
          </div>
        )}

        {view === 'rules' && (
          <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
            <p><strong>Weekly rule:</strong> one theme, seven days, three music posts.</p>
            <p>1. Monday sets the spiritual direction.</p>
            <p>2. Tuesday, Saturday, and Sunday carry the music layer.</p>
            <p>3. Thursday should carry the strongest video/sermon moment.</p>
            <p>4. Use only platform-approved audio, original music, licensed music, or safe background tracks.</p>
            <p>5. Manual posting only. Paste live URLs immediately.</p>
            <p>6. Track 24-hour stats the next day and 7-day stats the following week.</p>
          </div>
        )}
      </div>
    </div>
  )
}