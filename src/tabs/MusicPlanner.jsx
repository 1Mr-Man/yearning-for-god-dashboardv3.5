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

function getPlatform(item) {
  return item?.platform || item?.channel || 'General'
}

function getStatus(item) {
  return safeText(item?.status || item?.publishing_status || '')
}

function getContentType(item) {
  return item?.content_type || item?.type || 'Content'
}

function isInternalItem(item) {
  const text = `${safeText(item?.content_text)} ${safeText(item?.content_type)} ${safeText(item?.minister_name)} ${safeText(item?.platform)}`
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

function isReady(item) {
  const status = getStatus(item)
  return status.includes('ready') || status.includes('scheduled') || status.includes('draft')
}

function shortPreview(text, max = 130) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'No preview available yet.'
  if (clean.length <= max) return clean
  return `${clean.slice(0, max)}...`
}

function getWeekTheme(queue) {
  const real = (queue || []).filter((item) => !isInternalItem(item))
  const joined = real.slice(0, 80).map((item) => `${item.content_type || ''} ${item.content_text || ''}`).join(' ').toLowerCase()

  const themes = [
    { key: 'prayer', label: 'Prayer and intimacy with God', song: 'soft prayer worship' },
    { key: 'worship', label: 'Worship and surrender', song: 'deep worship atmosphere' },
    { key: 'fruitfulness', label: 'Kingdom fruitfulness', song: 'faith declaration worship' },
    { key: 'faith', label: 'Faith and strength', song: 'encouragement worship' },
    { key: 'prophecy', label: 'Prophetic declaration', song: 'declaration and victory sound' },
    { key: 'birthday', label: 'Honour and thanksgiving', song: 'celebration worship' },
    { key: 'christian lifestyle', label: 'Christian lifestyle and discipleship', song: 'reflection worship' },
  ]

  const found = themes.find((theme) => joined.includes(theme.key))
  return found || { label: 'Hunger for God and spiritual growth', song: 'worship, surrender, and reflection' }
}

function buildMusicPlan(queue) {
  const theme = getWeekTheme(queue)
  return [
    {
      day: 'Tuesday',
      time: '7:00 PM',
      title: 'Weekly Worship Atmosphere',
      platform: 'Instagram / Facebook',
      format: 'Music Reflection Post',
      theme: theme.label,
      direction: `Use a ${theme.song} direction that prepares the audience for the week.`,
      caption: 'This week, let every post draw hearts back to God. Pause, worship, and refocus your affection on Him.',
      safeNote: 'Use platform-approved audio or original/licensed music only.',
    },
    {
      day: 'Thursday',
      time: '6:00 PM',
      title: 'Midweek Strength Sound',
      platform: 'TikTok / Instagram Reels',
      format: 'Short Music Video',
      theme: 'Encouragement and spiritual strength',
      direction: 'Create a 15 to 30 second short with scripture text, soft motion, and worship atmosphere.',
      caption: 'In the middle of the week, God is still your strength. Keep your eyes on Him.',
      safeNote: 'Do not upload copyrighted full songs directly. Pick approved in-app audio or safe background music.',
    },
    {
      day: 'Sunday',
      time: '8:00 PM',
      title: 'Weekly Content Summary Music',
      platform: 'Facebook / YouTube Shorts / Instagram',
      format: 'Weekly Recap Music Post',
      theme: 'Summary of the week content',
      direction: 'Combine 3 to 5 best post screenshots or short clips into one recap with worship background.',
      caption: 'This week, we were reminded to pray, worship, and live fully yielded to God. Which post blessed you most?',
      safeNote: 'Use short clips, approved audio, and your own Yearning for God branded recap text.',
    },
  ]
}

export default function MusicPlanner({ queue = [], performanceStats = [], setActiveTab, refreshAllQueueViews, styles = {} }) {
  const [saving, setSaving] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState('this-week')

  const realQueue = useMemo(() => (queue || []).filter((item) => !isInternalItem(item)), [queue])
  const musicQueue = useMemo(() => realQueue.filter(isMusicItem), [realQueue])
  const readyMusic = useMemo(() => musicQueue.filter(isReady), [musicQueue])
  const theme = useMemo(() => getWeekTheme(realQueue), [realQueue])
  const plan = useMemo(() => buildMusicPlan(realQueue), [realQueue])

  const readyPosts = useMemo(() => realQueue.filter((item) => {
    const status = getStatus(item)
    return status.includes('ready') || status.includes('scheduled')
  }), [realQueue])

  const topReady = readyPosts.slice(0, 5)

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied')
    } catch (error) {
      alert('Copy failed. Long press and copy manually.')
    }
  }

  const musicPrompt = `You are a Christian music content planner for Yearning for God.\n\nCreate 3 music posts for this week.\n\nWeekly theme: ${theme.label}\nMusic direction: ${theme.song}\n\nUse these rules:\n- One person using a phone\n- Post 3 music items per week\n- Do not recommend uploading copyrighted full songs without permission\n- Use platform-approved audio, original music, licensed music, or short worship reflections\n- Make the music connect to the week content\n\nReturn:\n1. Weekly music theme\n2. Music post 1\n3. Music post 2\n4. Music post 3\n5. Caption direction\n6. Safe audio note\n7. What to track after posting`

  const savePlanToQueue = async () => {
    setSaving(true)
    try {
      const now = new Date()
      const rows = plan.map((item, index) => {
        const scheduled = new Date(now)
        scheduled.setDate(now.getDate() + [1, 3, 6][index])
        scheduled.setHours(index === 0 ? 19 : index === 1 ? 18 : 20, 0, 0, 0)
        return {
          minister_name: 'Yearning for God',
          ministry_name: 'Weekly Music Planner',
          content_type: item.format,
          platform: item.platform,
          content_text: `${item.title}\n\nTheme: ${item.theme}\n\nDirection: ${item.direction}\n\nCaption draft:\n${item.caption}\n\nSafe audio note: ${item.safeNote}`,
          campaign_stage: 'Weekly Music Plan',
          status: 'draft',
          scheduled_at: scheduled.toISOString(),
        }
      })

      const { error } = await supabase.from('content_queue_main').insert(rows)
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert('3 music plan items saved to Queue as drafts')
    } catch (error) {
      alert(error?.message || 'Could not save music items')
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = styles.card || cardBase
  const buttonStyle = styles.button || buttonBase
  const primaryButton = styles.primaryButton || { ...buttonBase, background: '#22c55e', color: '#06121f' }
  const dangerText = { color: '#fbbf24', fontWeight: 800 }

  return (
    <div>
      <h1 style={styles.pageTitle || styles.title}>Music Planner</h1>
      <p style={styles.subtitle}>Plan 3 worship/music posts per week and connect them to the whole weekly content direction.</p>

      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>Recommended next move</p>
        <h2 style={{ marginTop: 0 }}>Create this week's 3 music posts.</h2>
        <p style={{ color: '#cbd5e1', fontSize: 16 }}>Current theme: <strong>{theme.label}</strong></p>
        <p style={dangerText}>Use platform-approved audio or original/licensed music. Do not upload copyrighted full songs directly.</p>
        <button type="button" style={primaryButton} onClick={() => copyText(musicPrompt)}>Copy Music Plan Prompt</button>
        <button type="button" style={buttonStyle} onClick={savePlanToQueue} disabled={saving}>{saving ? 'Saving...' : 'Save 3 Music Items to Queue'}</button>
        <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>MUSIC THIS WEEK</p><h2>{musicQueue.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>READY MUSIC</p><h2>{readyMusic.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>READY POSTS</p><h2>{readyPosts.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>WEEKLY TARGET</p><h2>3</h2></div>
      </div>

      <div style={cardStyle}>
        <h2>Weekly Music Schedule</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <button type="button" style={{ ...buttonStyle, background: selectedWeek === 'this-week' ? '#38bdf8' : undefined, color: selectedWeek === 'this-week' ? '#06121f' : undefined }} onClick={() => setSelectedWeek('this-week')}>This Week</button>
          <button type="button" style={{ ...buttonStyle, background: selectedWeek === 'safe-audio' ? '#38bdf8' : undefined, color: selectedWeek === 'safe-audio' ? '#06121f' : undefined }} onClick={() => setSelectedWeek('safe-audio')}>Safe Audio Rules</button>
        </div>

        {selectedWeek === 'safe-audio' ? (
          <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
            <p><strong>Safe audio workflow:</strong></p>
            <p>1. Use TikTok, Instagram, Facebook, or YouTube approved in-app audio where possible.</p>
            <p>2. For your own edited videos, use original music, licensed worship instrumentals, or royalty-safe tracks.</p>
            <p>3. Avoid uploading full copyrighted songs as standalone content without permission.</p>
            <p>4. Keep music as atmosphere for ministry content, not as unauthorized redistribution.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {plan.map((item, index) => (
              <div key={item.title} style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 16, background: 'rgba(2, 8, 23, 0.45)' }}>
                <p style={{ color: '#38bdf8', fontWeight: 900 }}>{item.day} - {item.time}</p>
                <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                <p><strong>Platform:</strong> {item.platform}</p>
                <p><strong>Format:</strong> {item.format}</p>
                <p><strong>Direction:</strong> {item.direction}</p>
                <p style={{ color: '#cbd5e1' }}>{item.caption}</p>
                <p style={dangerText}>{item.safeNote}</p>
                <button type="button" style={buttonStyle} onClick={() => copyText(`${item.title}\n\n${item.day} ${item.time}\nPlatform: ${item.platform}\nFormat: ${item.format}\nTheme: ${item.theme}\nDirection: ${item.direction}\nCaption: ${item.caption}\nSafe note: ${item.safeNote}`)}>Copy This Music Brief</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2>Connect Music to This Week's Content</h2>
        <p style={{ color: '#cbd5e1' }}>Use the music posts to support the ready content below. Do not make music separate from the weekly spiritual direction.</p>
        {topReady.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No ready posts found yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {topReady.map((item) => (
              <div key={item.id || `${item.minister_name}-${item.content_type}`} style={{ padding: 14, borderRadius: 16, background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                <p style={{ color: '#38bdf8', fontWeight: 900 }}>{getPlatform(item)} - {getContentType(item)}</p>
                <h3 style={{ marginTop: 0 }}>{item.minister_name || 'Yearning for God'}</h3>
                <p style={{ color: '#cbd5e1' }}>{shortPreview(item.content_text)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}