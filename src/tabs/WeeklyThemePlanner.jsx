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

function shortPreview(text, max = 130) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'No preview available yet.'
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

function getThemeFromQueue(queue) {
  const joined = (queue || []).slice(0, 120).map((item) => `${item.content_type || ''} ${item.content_text || ''} ${item.campaign_stage || ''}`).join(' ').toLowerCase()
  const themes = [
    {
      key: 'prayer',
      label: 'Prayer and Intimacy with God',
      scripture: 'Psalm 42:1',
      direction: 'Call the audience back to hunger, prayer, worship, and closeness with God.',
      music: 'soft worship, prayer atmosphere, surrender sound',
    },
    {
      key: 'worship',
      label: 'Worship and Surrender',
      scripture: 'John 4:23',
      direction: 'Help people return to true worship beyond songs and emotions.',
      music: 'deep worship atmosphere and reflective instrumental',
    },
    {
      key: 'fruitfulness',
      label: 'Kingdom Fruitfulness',
      scripture: 'John 15:5',
      direction: 'Teach that real fruitfulness comes from abiding in Christ.',
      music: 'faith declaration worship and calm victory sound',
    },
    {
      key: 'faith',
      label: 'Faith and Strength',
      scripture: 'Isaiah 40:31',
      direction: 'Encourage believers to trust God and keep moving with strength.',
      music: 'encouragement worship and hopeful cinematic sound',
    },
    {
      key: 'prophecy',
      label: 'Prophetic Declaration and Alignment',
      scripture: 'Ezekiel 37:4',
      direction: 'Use declarations to stir faith, hope, obedience, and spiritual alignment.',
      music: 'declaration sound, light percussion, and victory atmosphere',
    },
    {
      key: 'birthday',
      label: 'Honour and Thanksgiving',
      scripture: '1 Thessalonians 5:18',
      direction: 'Honour kingdom servants and thank God for impact, worship, and legacy.',
      music: 'thanksgiving worship and celebration atmosphere',
    },
    {
      key: 'christian lifestyle',
      label: 'Christian Lifestyle and Discipleship',
      scripture: 'Matthew 5:16',
      direction: 'Help believers live visibly for Christ in daily life.',
      music: 'reflective worship and discipleship background sound',
    },
  ]

  return themes.find((theme) => joined.includes(theme.key)) || {
    label: 'Hunger for God and Spiritual Growth',
    scripture: 'Psalm 42:1',
    direction: 'Let every post point people back to hunger, prayer, worship, surrender, and growth in God.',
    music: 'worship, surrender, prayer atmosphere, and weekly recap sound',
  }
}

function buildWeekPlan(theme) {
  return [
    {
      day: 'Monday',
      time: '7:00 AM',
      title: 'Weekly Anchor Scripture',
      platform: 'Facebook / Instagram / Threads',
      type: 'Scripture Anchor Post',
      direction: `Introduce the week theme with ${theme.scripture} and a simple devotional direction.`,
    },
    {
      day: 'Tuesday',
      time: '7:00 PM',
      title: 'Worship Atmosphere Music Post',
      platform: 'Instagram / Facebook',
      type: 'Music Reflection Post',
      direction: `Use safe audio with ${theme.music}. Connect the music post to the weekly theme.`,
    },
    {
      day: 'Wednesday',
      time: '12:00 PM',
      title: 'Midweek Prayer Post',
      platform: 'Facebook / Threads',
      type: 'Prayer Post',
      direction: 'Lead the audience in a short prayer that aligns with the week theme.',
    },
    {
      day: 'Thursday',
      time: '6:00 PM',
      title: 'Sermon Short / Teaching Clip',
      platform: 'TikTok / YouTube Shorts / Instagram Reels',
      type: 'Short Video',
      direction: 'Use one sermon clip or audio-first short that strengthens the week theme.',
    },
    {
      day: 'Friday',
      time: '7:00 PM',
      title: 'Christian Lifestyle Application',
      platform: 'Facebook / Instagram',
      type: 'Christian Lifestyle Post',
      direction: 'Show how the theme applies to daily obedience, character, devotion, or service.',
    },
    {
      day: 'Saturday',
      time: '6:00 PM',
      title: 'Midweek Strength Music Short',
      platform: 'TikTok / Instagram Reels',
      type: 'Short Music Video',
      direction: 'Create a short worship or encouragement video with safe approved audio.',
    },
    {
      day: 'Sunday',
      time: '8:00 PM',
      title: 'Weekly Recap Music Post',
      platform: 'Facebook / YouTube Shorts / Instagram',
      type: 'Weekly Recap Music Post',
      direction: 'Summarize the strongest posts of the week with worship atmosphere and a simple reflection caption.',
    },
  ]
}

export default function WeeklyThemePlanner({ queue = [], performanceStats = [], setActiveTab, refreshAllQueueViews, styles = {} }) {
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('plan')

  const realQueue = useMemo(() => (queue || []).filter((item) => !isInternalItem(item)), [queue])
  const theme = useMemo(() => getThemeFromQueue(realQueue), [realQueue])
  const weekPlan = useMemo(() => buildWeekPlan(theme), [theme])

  const readyItems = useMemo(() => realQueue.filter((item) => {
    const status = getStatus(item)
    return status.includes('ready') || status.includes('scheduled')
  }), [realQueue])

  const musicItems = useMemo(() => realQueue.filter(isMusicItem), [realQueue])
  const prayerItems = useMemo(() => realQueue.filter((item) => safeText(getType(item)).includes('pray') || safeText(item?.content_text).includes('father')), [realQueue])
  const sermonItems = useMemo(() => realQueue.filter((item) => safeText(getType(item)).includes('short') || safeText(item?.content_text).includes('sermon:')), [realQueue])
  const birthdayItems = useMemo(() => realQueue.filter((item) => safeText(item?.campaign_stage).includes('birthday') || safeText(item?.content_text).includes('birthday')), [realQueue])

  const topReady = readyItems.slice(0, 6)

  const cardStyle = styles.card || cardBase
  const buttonStyle = styles.button || buttonBase
  const primaryButton = styles.primaryButton || { ...buttonBase, background: '#22c55e', color: '#06121f' }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied')
    } catch (error) {
      alert('Copy failed. Long press and copy manually.')
    }
  }

  const prompt = `You are a Christian weekly content strategist for Yearning for God.\n\nCreate a one-week content theme plan.\n\nWeekly theme: ${theme.label}\nAnchor scripture: ${theme.scripture}\nContent direction: ${theme.direction}\nMusic direction: ${theme.music}\n\nCurrent workload:\nReady to upload: ${readyItems.length}\nMusic items: ${musicItems.length}\nPrayer items: ${prayerItems.length}\nSermon/video items: ${sermonItems.length}\nBirthday/campaign items: ${birthdayItems.length}\n\nRules:\n- One person using a phone\n- Manual posting only\n- Include 3 music posts per week\n- Use platform-approved audio or licensed/original music only\n- Keep the weekly theme spiritually focused and practical\n\nReturn:\n1. Weekly theme\n2. Anchor scripture\n3. Daily content plan\n4. Music direction\n5. 4 upload priorities\n6. 2 design priorities\n7. 2 video priorities\n8. What to track next week`

  const saveThemePlanToQueue = async () => {
    setSaving(true)
    try {
      const now = new Date()
      const rows = weekPlan.map((item, index) => {
        const scheduled = new Date(now)
        scheduled.setDate(now.getDate() + index)
        const hour = item.time.includes('7:00 AM') ? 7 : item.time.includes('12:00 PM') ? 12 : item.time.includes('8:00 PM') ? 20 : item.time.includes('6:00 PM') ? 18 : 19
        scheduled.setHours(hour, 0, 0, 0)
        return {
          minister_name: 'Yearning for God',
          ministry_name: 'Weekly Theme Planner',
          content_type: item.type,
          platform: item.platform,
          content_text: `${item.title}\n\nWeekly Theme: ${theme.label}\nAnchor Scripture: ${theme.scripture}\n\nDirection: ${item.direction}\n\nProduction note: Turn this weekly theme brief into a public caption, design, or video before publishing.`,
          campaign_stage: 'Weekly Theme Plan',
          status: 'draft',
          scheduled_at: scheduled.toISOString(),
        }
      })
      const { error } = await supabase.from('content_queue_main').insert(rows)
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert('Weekly theme plan saved to Queue as 7 draft items')
    } catch (error) {
      alert(error?.message || 'Could not save weekly theme plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle || styles.title}>Weekly Theme Planner</h1>
      <p style={styles.subtitle}>Connect prayer posts, sermon shorts, music posts, lifestyle posts, and weekly recap under one spiritual direction.</p>

      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>This week's spiritual direction</p>
        <h2 style={{ marginTop: 0 }}>{theme.label}</h2>
        <p style={{ color: '#cbd5e1' }}><strong>Anchor Scripture:</strong> {theme.scripture}</p>
        <p style={{ color: '#cbd5e1' }}><strong>Content Direction:</strong> {theme.direction}</p>
        <p style={{ color: '#fbbf24', fontWeight: 800 }}><strong>Music Direction:</strong> {theme.music}</p>
        <button type="button" style={primaryButton} onClick={() => copyText(prompt)}>Copy Weekly Theme Prompt</button>
        <button type="button" style={buttonStyle} onClick={saveThemePlanToQueue} disabled={saving}>{saving ? 'Saving...' : 'Save Weekly Theme Plan to Queue'}</button>
        <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('music-planner')}>Open Music Planner</button>
        <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>READY POSTS</p><h2>{readyItems.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>MUSIC</p><h2>{musicItems.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>PRAYER</p><h2>{prayerItems.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>SERMON/VIDEO</p><h2>{sermonItems.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>BIRTHDAY</p><h2>{birthdayItems.length}</h2></div>
      </div>

      <div style={cardStyle}>
        <h2>Weekly Content Flow</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <button type="button" style={{ ...buttonStyle, background: view === 'plan' ? '#38bdf8' : undefined, color: view === 'plan' ? '#06121f' : undefined }} onClick={() => setView('plan')}>Plan</button>
          <button type="button" style={{ ...buttonStyle, background: view === 'ready' ? '#38bdf8' : undefined, color: view === 'ready' ? '#06121f' : undefined }} onClick={() => setView('ready')}>Ready Items</button>
          <button type="button" style={{ ...buttonStyle, background: view === 'rules' ? '#38bdf8' : undefined, color: view === 'rules' ? '#06121f' : undefined }} onClick={() => setView('rules')}>Rules</button>
        </div>

        {view === 'plan' && (
          <div style={{ display: 'grid', gap: 14 }}>
            {weekPlan.map((item) => (
              <div key={item.title} style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 16, background: 'rgba(2, 8, 23, 0.45)' }}>
                <p style={{ color: '#38bdf8', fontWeight: 900 }}>{item.day} - {item.time}</p>
                <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Platform:</strong> {item.platform}</p>
                <p style={{ color: '#cbd5e1' }}>{item.direction}</p>
                <button type="button" style={buttonStyle} onClick={() => copyText(`${item.day} ${item.time}\n${item.title}\nType: ${item.type}\nPlatform: ${item.platform}\nTheme: ${theme.label}\nScripture: ${theme.scripture}\nDirection: ${item.direction}`)}>Copy This Day Brief</button>
              </div>
            ))}
          </div>
        )}

        {view === 'ready' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {topReady.length === 0 ? <p style={{ color: '#94a3b8' }}>No ready posts found yet.</p> : topReady.map((item) => (
              <div key={item.id || `${item.minister_name}-${item.content_type}`} style={{ padding: 14, borderRadius: 16, background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                <p style={{ color: '#38bdf8', fontWeight: 900 }}>{getPlatform(item)} - {getType(item)}</p>
                <h3 style={{ marginTop: 0 }}>{item.minister_name || 'Yearning for God'}</h3>
                <p style={{ color: '#cbd5e1' }}>{shortPreview(item.content_text)}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'rules' && (
          <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
            <p><strong>Weekly operating rule:</strong> one theme, many formats.</p>
            <p>1. Keep prayer, sermon shorts, lifestyle posts, and music connected to one message.</p>
            <p>2. Use 3 music posts per week: worship atmosphere, midweek strength, and weekly recap.</p>
            <p>3. Use platform-approved audio, original music, licensed music, or safe background tracks only.</p>
            <p>4. Do not turn theme briefs into published posts until the public caption/design/video is ready.</p>
            <p>5. Track which theme produced the strongest engagement at the end of the week.</p>
          </div>
        )}
      </div>
    </div>
  )
}