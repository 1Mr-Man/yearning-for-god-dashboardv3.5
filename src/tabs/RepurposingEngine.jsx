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

function shortPreview(text, max = 140) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'No preview yet.'
  if (clean.length <= max) return clean
  return `${clean.slice(0, max)}...`
}

function getStatus(item) {
  return safeText(item?.status || item?.publishing_status || '')
}

function getType(item) {
  return item?.content_type || item?.type || 'Content'
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

function isThemeItem(item) {
  const text = `${safeText(item?.content_type)} ${safeText(item?.campaign_stage)} ${safeText(item?.content_text)}`
  return text.includes('weekly theme') || text.includes('theme plan') || text.includes('anchor scripture')
}

function getThemeFromQueue(queue) {
  const themeItem = (queue || []).find(isThemeItem)
  const source = themeItem?.content_text || (queue || []).slice(0, 80).map((item) => `${item.content_type || ''} ${item.content_text || ''}`).join(' ')
  const joined = safeText(source)
  const themes = [
    { key: 'prayer', label: 'Prayer and Intimacy with God', scripture: 'Psalm 42:1' },
    { key: 'worship', label: 'Worship and Surrender', scripture: 'John 4:23' },
    { key: 'fruitfulness', label: 'Kingdom Fruitfulness', scripture: 'John 15:5' },
    { key: 'faith', label: 'Faith and Strength', scripture: 'Isaiah 40:31' },
    { key: 'prophetic', label: 'Prophetic Alignment and Obedience', scripture: 'Ezekiel 37:4' },
    { key: 'kingdom', label: 'Kingdom Life and Discipleship', scripture: 'Matthew 6:33' },
    { key: 'hunger', label: 'Hunger for God and Spiritual Growth', scripture: 'Psalm 42:1' },
  ]
  return themes.find((theme) => joined.includes(theme.key)) || { label: 'Hunger for God and Spiritual Growth', scripture: 'Psalm 42:1' }
}

function selectSourceCandidates(queue) {
  return (queue || [])
    .filter((item) => !isInternalItem(item))
    .filter((item) => {
      const status = getStatus(item)
      return status.includes('ready') || status.includes('draft') || status.includes('scheduled') || status.includes('needs')
    })
    .slice(0, 30)
}

function buildDefaultPack(form) {
  const sourceTitle = form.sourceTitle || 'Weekly source message'
  const minister = form.minister || 'Yearning for God'
  const theme = form.theme || 'Hunger for God and Spiritual Growth'
  const scripture = form.scripture || 'Psalm 42:1'
  const mainMessage = form.mainMessage || 'Call people back to prayer, worship, surrender, and spiritual hunger.'

  return [
    {
      title: 'Facebook Teaching Post',
      platform: 'Facebook',
      content_type: 'Repurposed Teaching Post',
      status: 'draft',
      asset: 'Caption + optional square design',
      direction: `Turn ${sourceTitle} into a short Facebook teaching post. Open with a strong hook, explain one spiritual truth, and end with a gentle question.`,
      promptUse: 'Caption writing',
    },
    {
      title: 'Instagram Declaration Post',
      platform: 'Instagram',
      content_type: "Let's Prophesy",
      status: 'draft',
      asset: 'Carousel or text graphic',
      direction: `Create 5 to 7 short declarations from the message. Keep each line short and mobile-readable.`,
      promptUse: 'Declaration caption',
    },
    {
      title: 'TikTok Short Idea',
      platform: 'TikTok',
      content_type: 'Short Video Idea',
      status: 'Needs Video',
      asset: 'Short clip + captions',
      direction: `Create a 30 to 60 second TikTok concept from the strongest line in the source. Start with a scroll-stopping question.`,
      promptUse: 'Short video idea',
    },
    {
      title: 'YouTube Shorts Script',
      platform: 'YouTube Shorts',
      content_type: 'Shorts Script',
      status: 'Needs Video',
      asset: 'Audio-first short or edited video',
      direction: `Create a 45 to 75 second Shorts script. Use original sermon audio excerpt or voiceover, captions, and one clear spiritual takeaway.`,
      promptUse: 'YouTube Shorts script',
    },
    {
      title: 'Threads Reflection',
      platform: 'Threads',
      content_type: 'Threads Reflection',
      status: 'draft',
      asset: 'Short text post',
      direction: `Write a short Threads post from the theme. Make it reflective, simple, and shareable.`,
      promptUse: 'Threads post',
    },
    {
      title: 'Prayer Post',
      platform: 'Facebook / Threads',
      content_type: "Let's Pray",
      status: 'draft',
      asset: 'Prayer caption',
      direction: `Turn the message into a prayer connected to ${scripture}. Start with Father, and end with Amen.`,
      promptUse: 'Prayer caption',
    },
    {
      title: 'Image Quote',
      platform: 'AI Poster',
      content_type: 'Image Quote',
      status: 'Needs Design',
      asset: 'Quote graphic',
      direction: `Extract one powerful quote from the message and make it suitable for a clean branded graphic.`,
      promptUse: 'Image quote design',
    },
    {
      title: 'Music / Weekly Recap Idea',
      platform: 'Instagram / Facebook / YouTube Shorts',
      content_type: 'Music Recap Idea',
      status: 'draft',
      asset: 'Safe audio + recap visuals',
      direction: `Create a worship atmosphere or recap music idea that summarizes the theme and the main message of the week. Use platform-approved audio only.`,
      promptUse: 'Music recap brief',
    },
  ].map((item) => ({
    ...item,
    minister_name: minister,
    ministry_name: 'Repurposing Engine',
    campaign_stage: 'Repurposed Content Pack',
    sourceTitle,
    theme,
    scripture,
    mainMessage,
  }))
}

export default function RepurposingEngine({ queue = [], performanceStats = [], setActiveTab, refreshAllQueueViews, styles = {} }) {
  const [saving, setSaving] = useState(false)
  const [sourceMode, setSourceMode] = useState('manual')
  const [selectedId, setSelectedId] = useState('')
  const cardStyle = styles.card || cardBase
  const buttonStyle = styles.button || buttonBase
  const primaryButton = styles.primaryButton || { ...buttonBase, background: '#22c55e', color: '#06121f' }

  const realQueue = useMemo(() => (queue || []).filter((item) => !isInternalItem(item)), [queue])
  const themeSuggestion = useMemo(() => getThemeFromQueue(realQueue), [realQueue])
  const sourceCandidates = useMemo(() => selectSourceCandidates(realQueue), [realQueue])
  const selectedSource = useMemo(() => sourceCandidates.find((item) => String(item.id) === String(selectedId)) || null, [sourceCandidates, selectedId])

  const [form, setForm] = useState({
    sourceTitle: '',
    minister: '',
    theme: '',
    scripture: '',
    mainMessage: '',
  })

  const activeForm = useMemo(() => {
    if (sourceMode === 'queue' && selectedSource) {
      return {
        sourceTitle: `${selectedSource.content_type || 'Queue Item'} - ${shortPreview(selectedSource.content_text, 70)}`,
        minister: selectedSource.minister_name || 'Yearning for God',
        theme: themeSuggestion.label,
        scripture: themeSuggestion.scripture,
        mainMessage: shortPreview(selectedSource.content_text, 220),
      }
    }
    return {
      sourceTitle: form.sourceTitle || 'Weekly source message',
      minister: form.minister || 'Yearning for God',
      theme: form.theme || themeSuggestion.label,
      scripture: form.scripture || themeSuggestion.scripture,
      mainMessage: form.mainMessage || 'Call people back to prayer, worship, surrender, and spiritual hunger.',
    }
  }, [sourceMode, selectedSource, form, themeSuggestion])

  const pack = useMemo(() => buildDefaultPack(activeForm), [activeForm])

  const counts = useMemo(() => ({
    sourceCandidates: sourceCandidates.length,
    packItems: pack.length,
    needsVideo: pack.filter((item) => safeText(item.status).includes('video')).length,
    needsDesign: pack.filter((item) => safeText(item.status).includes('design')).length,
    draftCaptions: pack.filter((item) => safeText(item.status).includes('draft')).length,
    trackedPosts: (performanceStats || []).length,
  }), [sourceCandidates, pack, performanceStats])

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied')
    } catch (error) {
      alert('Copy failed. Long press and copy manually.')
    }
  }

  const repurposePrompt = `You are a Christian content repurposing strategist for Yearning for God.\n\nTurn one source message into a full platform content pack.\n\nSource title: ${activeForm.sourceTitle}\nMinister/topic: ${activeForm.minister}\nWeekly theme: ${activeForm.theme}\nAnchor scripture: ${activeForm.scripture}\nMain message: ${activeForm.mainMessage}\n\nCreate these outputs:\n1. Facebook teaching post\n2. Instagram declaration post\n3. TikTok short idea\n4. YouTube Shorts script\n5. Threads reflection\n6. Prayer post\n7. Image quote\n8. Music or weekly recap idea\n\nRules:\n- Keep it Christian, reverent, and spiritually edifying\n- Keep it phone-friendly for manual posting\n- Do not recommend online auto-publishing\n- For music, recommend platform-approved audio, original music, licensed music, or safe background tracks only\n- Make each output standalone\n- Include caption direction and needed asset for each output\n\nReturn the 8 outputs clearly.`

  // NOTE (Phase R2 architecture review): this pack has no research_id,
  // production_id, or any tracked origin — it's a manual brief generator,
  // not output of the Content Research -> Production pipeline. It is
  // deliberately classified as an independent content tool (same category
  // as QuotesPlanner, MusicPlanner, WeeklyCalendar, WeeklyThemePlanner, and
  // most of App.jsx's own posting engines) and intentionally does NOT route
  // through PublishingWorkspace/yfg_publishing_packages. Forcing it through
  // that pipeline would mean inventing a synthetic origin record for content
  // that was never designed to have one. Only ProductionWorkspace's former
  // moveToQueue() (removed in R1) was a genuine bypass, because it skipped a
  // review step its own pipeline was specifically designed to require.
  const savePackToQueue = async () => {
    setSaving(true)
    try {
      const rows = pack.map((item, index) => ({
        minister_name: item.minister_name,
        ministry_name: item.ministry_name,
        content_type: item.content_type,
        platform: item.platform,
        content_text: `${item.title}\n\nSource: ${item.sourceTitle}\nMinister/Topic: ${item.minister_name}\nWeekly Theme: ${item.theme}\nAnchor Scripture: ${item.scripture}\n\nMain Message:\n${item.mainMessage}\n\nOutput Direction:\n${item.direction}\n\nNeeded Asset: ${item.asset}\nPrompt Use: ${item.promptUse}\n\nProduction note: This is a repurposed content brief. Review, write the final caption, produce any needed asset, then mark ready before publishing.`,
        campaign_stage: item.campaign_stage,
        status: item.status,
        scheduled_at: null,
        created_at: new Date(Date.now() + index * 1000).toISOString(),
      }))
      const { error } = await supabase.from('content_queue_main').insert(rows)
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert('Repurposed content pack saved to Queue as 8 items')
    } catch (error) {
      alert(error?.message || 'Could not save repurposed pack')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <div>
      <h1 style={styles.pageTitle || styles.title}>Content Repurposing Engine</h1>
      <p style={styles.subtitle}>Turn one sermon, Bible verse, weekly theme, music idea, or message into a complete multi-platform content pack.</p>

      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>Source content</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <button type="button" style={{ ...buttonStyle, background: sourceMode === 'manual' ? '#38bdf8' : undefined, color: sourceMode === 'manual' ? '#06121f' : undefined }} onClick={() => setSourceMode('manual')}>Manual Source</button>
          <button type="button" style={{ ...buttonStyle, background: sourceMode === 'queue' ? '#38bdf8' : undefined, color: sourceMode === 'queue' ? '#06121f' : undefined }} onClick={() => setSourceMode('queue')}>Use Queue Item</button>
        </div>

        {sourceMode === 'queue' ? (
          <div>
            <label style={{ display: 'block', fontWeight: 900, marginBottom: 8 }}>Choose source from Queue</label>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={{ width: '100%', padding: 12, borderRadius: 14, marginBottom: 12 }}>
              <option value="">Select a source item</option>
              {sourceCandidates.map((item) => (
                <option key={item.id} value={item.id}>{item.id} - {item.minister_name || 'YFG'} - {getType(item)}</option>
              ))}
            </select>
            {selectedSource && (
              <div style={{ padding: 14, borderRadius: 16, background: 'rgba(2, 8, 23, 0.45)', marginBottom: 12 }}>
                <p style={{ color: '#22c55e', fontWeight: 900, marginTop: 0 }}>Selected Source</p>
                <p><strong>{selectedSource.minister_name || 'Yearning for God'}</strong> - {getType(selectedSource)}</p>
                <p style={{ color: '#cbd5e1' }}>{shortPreview(selectedSource.content_text, 240)}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <input value={form.sourceTitle} onChange={(event) => updateField('sourceTitle', event.target.value)} placeholder="Source title, e.g. Apostle Joshua Selman sermon on spiritual hunger" style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.35)' }} />
            <input value={form.minister} onChange={(event) => updateField('minister', event.target.value)} placeholder="Minister or topic" style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.35)' }} />
            <input value={form.theme || themeSuggestion.label} onChange={(event) => updateField('theme', event.target.value)} placeholder="Weekly theme" style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.35)' }} />
            <input value={form.scripture || themeSuggestion.scripture} onChange={(event) => updateField('scripture', event.target.value)} placeholder="Anchor scripture" style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.35)' }} />
            <textarea value={form.mainMessage} onChange={(event) => updateField('mainMessage', event.target.value)} placeholder="Main message or sermon notes" rows={5} style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.35)' }} />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button type="button" style={primaryButton} onClick={() => copyText(repurposePrompt)}>Copy Repurposing Prompt</button>
          <button type="button" style={buttonStyle} onClick={savePackToQueue} disabled={saving}>{saving ? 'Saving...' : 'Save Repurposed Pack to Queue'}</button>
          <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue</button>
          <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('weekly-calendar')}>Open Weekly Calendar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>SOURCE OPTIONS</p><h2>{counts.sourceCandidates}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>PACK ITEMS</p><h2>{counts.packItems}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>DRAFT CAPTIONS</p><h2>{counts.draftCaptions}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>NEEDS DESIGN</p><h2>{counts.needsDesign}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>NEEDS VIDEO</p><h2>{counts.needsVideo}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>TRACKED POSTS</p><h2>{counts.trackedPosts}</h2></div>
      </div>

      <div style={cardStyle}>
        <h2>Repurposed Pack Preview</h2>
        <p style={{ color: '#cbd5e1' }}>One source becomes 8 practical outputs across Facebook, Instagram, TikTok, YouTube Shorts, Threads, prayer, design, and music.</p>
        <div style={{ display: 'grid', gap: 14 }}>
          {pack.map((item) => (
            <div key={`${item.platform}-${item.title}`} style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 16, background: 'rgba(2, 8, 23, 0.45)' }}>
              <p style={{ color: '#38bdf8', fontWeight: 900, marginTop: 0 }}>{item.platform} - {item.content_type}</p>
              <h3 style={{ marginTop: 0 }}>{item.title}</h3>
              <p><strong>Status:</strong> {item.status}</p>
              <p><strong>Needed Asset:</strong> {item.asset}</p>
              <p style={{ color: '#cbd5e1' }}>{item.direction}</p>
              <button type="button" style={buttonStyle} onClick={() => copyText(`${item.title}\nPlatform: ${item.platform}\nType: ${item.content_type}\nStatus: ${item.status}\nSource: ${activeForm.sourceTitle}\nTheme: ${activeForm.theme}\nScripture: ${activeForm.scripture}\nDirection: ${item.direction}\nNeeded Asset: ${item.asset}`)}>Copy Output Brief</button>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Safe Manual Workflow</h2>
        <ol style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
          <li>Choose one source message.</li>
          <li>Copy the repurposing prompt or save the pack to Queue.</li>
          <li>Open each Queue item and complete the final caption, design, or video.</li>
          <li>Mark only finished posts as Ready to Upload.</li>
          <li>Upload manually and paste the live URL immediately.</li>
          <li>Track 24-hour and 7-day stats later.</li>
        </ol>
      </div>
    </div>
  )
}