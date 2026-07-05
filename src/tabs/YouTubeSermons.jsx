import React, { useCallback, useEffect, useMemo, useState } from 'react'

const PLATFORMS = ['TikTok', 'YouTube', 'Instagram', 'Facebook', 'Threads']
const DEFAULT_PLATFORMS = ['TikTok', 'YouTube']

function safeJsonParse(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  return JSON.parse(cleaned)
}

function valueToText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(' ')
  if (typeof value === 'object') {
    if (value.title || value.description) {
      return [value.title, value.description].filter(Boolean).map(valueToText).join('\n\n')
    }
    return Object.values(value).map(valueToText).filter(Boolean).join('\n')
  }
  return String(value)
}

function normalizeCaptionData(raw) {
  const base = raw?.captions && typeof raw.captions === 'object' ? raw.captions : raw
  const normalized = {
    tiktok: valueToText(base?.tiktok || base?.TikTok || base?.tiktokCaption || base?.shortCaption),
    youtube: valueToText(base?.youtube || base?.YouTube || base?.youtubeShorts || base?.youtube_shorts),
    instagram: valueToText(base?.instagram || base?.Instagram || base?.reels),
    facebook: valueToText(base?.facebook || base?.Facebook),
    threads: valueToText(base?.threads || base?.Threads),
    firstComment: valueToText(base?.firstComment || base?.first_comment || base?.comment),
    hashtags: valueToText(base?.hashtags || base?.tags),
    bestTime: valueToText(base?.bestTime || base?.best_time || base?.postTime),
  }
  const fallback = normalized.tiktok || normalized.youtube || normalized.instagram || normalized.facebook || normalized.threads
  if (!fallback) throw new Error('No caption text found. Make sure the JSON contains tiktok or youtube caption fields.')
  if (!normalized.tiktok) normalized.tiktok = fallback
  if (!normalized.youtube) normalized.youtube = fallback
  return normalized
}

function buildClipPrompt(source) {
  const transcript = source?.transcript || source?.notes || ''
  return `You are a Christian short-form content strategist for "Yearning for God" — a Psalm 42-inspired Christian media channel.

We are NOT trying to cut the full talking-head video now.
We are creating AUDIO-FIRST SERMON SHORTS:
- one branded vertical image/poster
- original sermon audio excerpt
- captions/subtitles
- slight motion/zoom later with FFmpeg or CapCut

Analyse this sermon transcript and find the TOP 5 audio-first short moments for TikTok and YouTube Shorts.

Minister: ${source?.minister_name || ''}
Sermon title: ${source?.sermon_title || ''}
YouTube URL: ${source?.youtube_url || ''}

A strong audio-first short moment should have:
- A powerful voice moment that can work even with one image
- A clear start and end time for extracting the minister's original audio
- A short title suitable for poster text
- A strong hook/caption for TikTok and YouTube Shorts
- A 30–90 second duration
- A simple visual direction for one image/poster
- A subtitle style direction for on-screen captions

IMPORTANT FOR AUDIO EXTRACTION:
- Return exact start_time and end_time whenever the transcript has timestamps.
- Use HH:MM:SS format when possible, for example "00:12:30".
- If the transcript only has MM:SS timestamps, convert them to HH:MM:SS, for example "12:30" becomes "00:12:30".
- If exact timing is unclear, give the best approximate start_time and end_time and write "approximate" in timestamp_note.
- Keep every clip between 30 and 90 seconds.

TRANSCRIPT / NOTES:
${transcript.slice(0, 9000)}

Return ONLY valid JSON in this exact format:
{
  "source_video_file_name": "optional local full sermon video/audio file name, e.g. apostle_selman_sermon_001.mp4",
  "clips": [
    {
      "id": 1,
      "start_time": "00:12:30",
      "end_time": "00:13:20",
      "duration_seconds": 50,
      "timestamp_note": "exact or approximate",
      "clip_title": "short title for queue and file name",
      "poster_text": "very short text to appear on the image, maximum 8 words",
      "hook": "opening hook for the caption",
      "quote": "main quotable line or voice moment",
      "context": "brief context of the moment",
      "why_it_works": "why this can work as audio over one image",
      "image_prompt": "prompt for one premium Christian vertical poster image, no minister face required unless user provides an image",
      "subtitle_style": "caption style direction, e.g. bold white text, gold keyword highlights",
      "audio_direction": "how the audio should feel, e.g. prayerful, prophetic, reflective, urgent",
      "caption_direction": "how the final caption should sound"
    }
  ]
}`
}

function buildCaptionPrompt(source, clip) {
  return `Create captions and production metadata for an AUDIO-FIRST Christian sermon short for "Yearning for God".

This short will use:
- one branded vertical poster/image
- original sermon audio excerpt from the minister
- on-screen subtitles/captions
- slight zoom/motion later

Minister: ${source?.minister_name || ''}
Sermon title: ${source?.sermon_title || ''}
YouTube URL: ${source?.youtube_url || ''}

Clip title: ${clip?.clip_title || ''}
Start time: ${clip?.start_time || clip?.timestamp || ''}
End time: ${clip?.end_time || ''}
Duration seconds: ${clip?.duration_seconds || clip?.duration || ''}
Timestamp note: ${clip?.timestamp_note || ''}
Poster text: ${clip?.poster_text || ''}
Hook: ${clip?.hook || ''}
Main quote/audio moment: ${clip?.quote || ''}
Context: ${clip?.context || ''}
Why it works: ${clip?.why_it_works || ''}
Image prompt: ${clip?.image_prompt || ''}
Subtitle style: ${clip?.subtitle_style || ''}
Audio direction: ${clip?.audio_direction || ''}
Caption direction: ${clip?.caption_direction || ''}

Write captions for TikTok and YouTube Shorts first. Also include optional Instagram, Facebook, and Threads captions.

Rules:
- Spirit-filled, clear, and Kingdom-focused
- Make it clear this is a sermon/audio short, not a fake live video
- Do not say the minister personally endorsed this channel
- Include a call to action
- Include hashtags
- Keep TikTok caption punchy

Return ONLY valid JSON in this format:
{
  "tiktok": "caption for TikTok",
  "youtube": "title + description for YouTube Shorts",
  "instagram": "caption for Instagram Reels",
  "facebook": "caption for Facebook",
  "threads": "caption for Threads",
  "firstComment": "first comment",
  "hashtags": "#YearningForGod #ChristianTikTok #YouTubeShorts #Faith #Prayer #Jesus",
  "bestTime": "7:00 AM / 12:00 PM / 7:00 PM",
  "production_note": "short note for editing: use one poster image, original sermon audio, subtitles, gentle zoom",
  "file_name_suggestion": "YFG_audio_short_001.mp4"
}`
}

export default function YouTubeSermons({ supabase, weeklySermons, setWeeklySermons, setActiveTab, refreshAllQueueViews, styles }) {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeSource, setActiveSource] = useState(null)
  const [clipJsonInput, setClipJsonInput] = useState('')
  const [clipMoments, setClipMoments] = useState([])
  const [clipError, setClipError] = useState('')
  const [expandedClip, setExpandedClip] = useState(null)
  const [captionInputs, setCaptionInputs] = useState({})
  const [clipCaptions, setClipCaptions] = useState({})
  const [approvedClips, setApprovedClips] = useState({})
  const [clipPlatforms, setClipPlatforms] = useState({})
  const [savedClips, setSavedClips] = useState({})
  const [savingClip, setSavingClip] = useState({})
  const [form, setForm] = useState({
    minister_name: '',
    sermon_title: '',
    youtube_url: '',
    transcript: '',
    notes: '',
    use_for_weekly_plan: false,
    status: 'new',
  })

  const ui = useMemo(() => ({
    card: styles?.card || {
      background: '#0f172a',
      border: '1px solid #253656',
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      color: '#e5e7eb',
    },
    input: styles?.input || {
      width: '100%',
      padding: 12,
      borderRadius: 12,
      border: '1px solid #334155',
      background: '#020617',
      color: '#f8fafc',
      boxSizing: 'border-box',
    },
    button: styles?.button || {
      padding: '10px 14px',
      borderRadius: 12,
      border: 'none',
      background: '#7c3aed',
      color: 'white',
      fontWeight: 800,
      cursor: 'pointer',
    },
    muted: { color: '#94a3b8', fontSize: 13, lineHeight: 1.6 },
    label: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, marginBottom: 5 },
  }), [styles])

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4500)
  }

  const loadSources = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('youtube_sermon_sources')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) flash('Error loading sermon sources: ' + error.message)
    else setSources(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadSources() }, [loadSources])

  const copyToClipboard = async (text, success = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text)
      flash(success)
    } catch {
      flash('Copy failed. Long-press and copy manually.')
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.minister_name.trim() || !form.sermon_title.trim()) {
      flash('Minister name and sermon title are required.')
      return
    }
    setSaving(true)
    const payload = {
      minister_name: form.minister_name.trim(),
      sermon_title: form.sermon_title.trim(),
      youtube_url: form.youtube_url || null,
      transcript: form.transcript || null,
      notes: form.notes || null,
      use_for_weekly_plan: !!form.use_for_weekly_plan,
      status: form.status || 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('youtube_sermon_sources').insert([payload])
    setSaving(false)
    if (error) { flash('Save error: ' + error.message); return }
    setForm({ minister_name: '', sermon_title: '', youtube_url: '', transcript: '', notes: '', use_for_weekly_plan: false, status: 'new' })
    flash('Sermon source added.')
    await loadSources()
  }

  const toggleUseForPlan = async (row) => {
    const next = !row.use_for_weekly_plan
    const { error } = await supabase
      .from('youtube_sermon_sources')
      .update({ use_for_weekly_plan: next, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) { flash('Update error: ' + error.message); return }
    setSources((prev) => prev.map((s) => s.id === row.id ? { ...s, use_for_weekly_plan: next } : s))
  }

  const deleteSource = async (row) => {
    if (!window.confirm(`Delete "${row.sermon_title}"?`)) return
    const { error } = await supabase.from('youtube_sermon_sources').delete().eq('id', row.id)
    if (error) { flash('Delete error: ' + error.message); return }
    setSources((prev) => prev.filter((s) => s.id !== row.id))
    if (activeSource?.id === row.id) {
      setActiveSource(null)
      setClipMoments([])
      setClipCaptions({})
      setCaptionInputs({})
      setClipJsonInput('')
    }
    flash('Deleted.')
  }

  const loadIntoWeeklyPlanner = () => {
    const selected = sources.filter((s) => s.use_for_weekly_plan).slice(0, 7)
    if (selected.length === 0) { flash('Select at least one sermon for weekly plan.'); return }
    const mapped = selected.map((s) => ({
      title: s.sermon_title,
      minister: s.minister_name,
      notes: s.transcript || s.notes || s.youtube_url || '',
    }))
    setWeeklySermons([
      ...mapped,
      ...Array.from({ length: Math.max(0, 7 - mapped.length) }, () => ({ title: '', minister: '', notes: '' })),
    ])
    flash(`Loaded ${mapped.length} sermon(s) into Weekly Planner.`)
  }

  const startManualClipFinder = (source) => {
    const transcript = source.transcript || source.notes || ''
    if (!transcript.trim()) {
      flash('Paste transcript or detailed notes before creating clip prompts.')
      return
    }
    setActiveSource(source)
    setClipMoments([])
    setClipCaptions({})
    setCaptionInputs({})
    setApprovedClips({})
    setSavedClips({})
    setClipPlatforms({})
    setClipJsonInput('')
    setClipError('')
    copyToClipboard(buildClipPrompt(source), 'Clip Finder prompt copied. Paste it into Claude/ChatGPT.')
  }

  const parseClipJson = () => {
    try {
      const data = safeJsonParse(clipJsonInput)
      const clips = (data.clips || []).map((clip, idx) => ({
        id: String(clip.id || idx + 1),
        video_file_name: clip.video_file_name || clip.source_video_file_name || data.source_video_file_name || data.video_file_name || '',
        poster_text: clip.poster_text || clip.image_text || '',
        image_prompt: clip.image_prompt || '',
        subtitle_style: clip.subtitle_style || '',
        audio_direction: clip.audio_direction || '',
        start_time: clip.start_time || clip.start || clip.timestamp || '',
        end_time: clip.end_time || clip.end || '',
        duration_seconds: clip.duration_seconds || clip.durationSeconds || '',
        timestamp_note: clip.timestamp_note || clip.timestampNote || '',
        timestamp: clip.timestamp || clip.start_time || clip.start || '',
        duration: clip.duration || clip.estimated_duration || (clip.duration_seconds ? `${clip.duration_seconds}s` : ''),
        clip_title: clip.clip_title || clip.title || `Clip ${idx + 1}`,
        hook: clip.hook || '',
        quote: clip.quote || '',
        context: clip.context || '',
        why_it_works: clip.why_it_works || clip.reason || '',
        caption_direction: clip.caption_direction || clip.captionDirection || '',
      }))
      if (clips.length === 0) throw new Error('No clips found in JSON.')
      const approved = {}
      const platforms = {}
      clips.forEach((c) => { approved[c.id] = true; platforms[c.id] = [...DEFAULT_PLATFORMS] })
      setClipMoments(clips)
      setApprovedClips(approved)
      setClipPlatforms(platforms)
      setClipError('')
      flash(`${clips.length} clip moment(s) parsed successfully.`)
    } catch (error) {
      setClipError('JSON parse error: ' + error.message)
    }
  }

  const parseCaptionJson = (clip) => {
    try {
      const data = normalizeCaptionData(safeJsonParse(captionInputs[clip.id] || ''))
      setClipCaptions((prev) => ({ ...prev, [clip.id]: data }))
      setExpandedClip(clip.id)
      flash('Caption JSON parsed successfully.')
    } catch (error) {
      flash('Caption JSON error: ' + error.message)
    }
  }

  const togglePlatform = (clipId, platform) => {
    setClipPlatforms((prev) => {
      const current = prev[clipId] || []
      return {
        ...prev,
        [clipId]: current.includes(platform)
          ? current.filter((p) => p !== platform)
          : [...current, platform],
      }
    })
  }

  const saveClipToQueue = async (clip, captionsOverride = null) => {
    const captions = captionsOverride ? normalizeCaptionData(captionsOverride) : clipCaptions[clip.id]
    const platforms = clipPlatforms[clip.id] || DEFAULT_PLATFORMS
    if (!captions) { flash('Paste/parse caption JSON before saving to Queue.'); return }
    if (!platforms.length) { flash('Choose at least one platform.'); return }

    setSavingClip((prev) => ({ ...prev, [clip.id]: true }))
    let failed = false

    for (const platform of platforms) {
      const key = platform.toLowerCase()
      const platformCaption = captions[key] || captions.tiktok || captions.youtube || captions.facebook || ''
      const contentText = `${platformCaption}\n\n${captions.hashtags || ''}\n\nFIRST COMMENT:\n${captions.firstComment || ''}\n\nCLIP DETAILS:\nTitle: ${clip.clip_title || ''}\nVideo File: ${clip.video_file_name || 'Add local video file later'}\nStart Time: ${clip.start_time || clip.timestamp || ''}\nEnd Time: ${clip.end_time || ''}\nDuration Seconds: ${clip.duration_seconds || clip.duration || ''}\nTimestamp Note: ${clip.timestamp_note || ''}\nHook: ${clip.hook || ''}\nQuote: ${clip.quote || ''}\nCaption Direction: ${clip.caption_direction || ''}\nBest Time: ${captions.bestTime || ''}\nVideo status: Ready for FFmpeg/Claude Code cutting after matching this draft with the full sermon video file.`

      const row = {
        minister_name: activeSource?.minister_name || 'Yearning for God',
        ministry_name: 'YouTube Sermon Clip Finder',
        content_type: `${platform} Audio-First Sermon Short`,
        platform,
        content_text: contentText,
        status: 'draft',
        scheduled_at: null,
        campaign_stage: 'Audio-First Short Draft',
      }

      const { error } = await supabase.from('content_queue_main').insert([row])
      if (error) {
        failed = true
        flash(`Queue save error (${platform}): ${error.message}`)
        break
      }
    }

    if (!failed) {
      setSavedClips((prev) => ({ ...prev, [clip.id]: true }))
      flash(`Saved clip to Queue as draft for ${platforms.join(', ')}. Stay on this page, then open Posting Queue manually to view it.`)
      if (typeof refreshAllQueueViews === 'function') {
        await refreshAllQueueViews()
      }
    }
    setSavingClip((prev) => ({ ...prev, [clip.id]: false }))
  }

  const selectedCount = sources.filter((s) => s.use_for_weekly_plan).length

  return (
    <div style={styles?.container || { padding: 16 }}>
      <h2 style={styles?.heading || { marginBottom: 8 }}>YouTube Sermons + Audio-First Shorts Factory</h2>
      <p style={ui.muted}>Low-cost workflow: save sermons, copy AI prompts, paste AI JSON results, and save approved audio-first TikTok/YouTube short drafts to your Queue. After saving, this tab stays open to prevent blank-screen redirect issues. This prepares one-image + original-sermon-audio shorts for the future FFmpeg/Claude Code maker.</p>

      {message && <div style={{ ...ui.card, borderColor: '#22c55e', background: '#052e1a' }}>{message}</div>}

      <form onSubmit={handleAdd} style={ui.card}>
        <h3 style={{ marginTop: 0 }}>Add Sermon Source</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <input style={ui.input} placeholder="Minister name" value={form.minister_name} onChange={(e) => setForm({ ...form, minister_name: e.target.value })} />
          <input style={ui.input} placeholder="Sermon title" value={form.sermon_title} onChange={(e) => setForm({ ...form, sermon_title: e.target.value })} />
          <input style={ui.input} placeholder="YouTube URL" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
          <textarea style={ui.input} rows={6} placeholder="Paste sermon transcript here" value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} />
          <textarea style={ui.input} rows={3} placeholder="Notes, theme, or summary" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1' }}>
            <input type="checkbox" checked={form.use_for_weekly_plan} onChange={(e) => setForm({ ...form, use_for_weekly_plan: e.target.checked })} />
            Use for weekly plan
          </label>
          <button style={ui.button} disabled={saving}>{saving ? 'Saving...' : 'Add Sermon Source'}</button>
        </div>
      </form>

      <div style={{ ...ui.card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={ui.button} onClick={loadIntoWeeklyPlanner}>Load Selected to Weekly Planner ({selectedCount}/7)</button>
        <button style={{ ...ui.button, background: '#334155' }} onClick={() => setActiveTab?.('sunday-workflow')}>Open Sunday Workflow</button>
      </div>

      <h3>Saved Sermon Sources</h3>
      {loading ? <div style={ui.card}>Loading sermon sources...</div> : sources.length === 0 ? <div style={ui.card}>No sermon sources yet.</div> : sources.map((source) => (
        <div key={source.id} style={ui.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: '0 0 5px' }}>{source.sermon_title}</h3>
              <p style={{ ...ui.muted, margin: 0 }}>{source.minister_name}</p>
              {source.youtube_url && <a href={source.youtube_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13 }}>Open YouTube link</a>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={ui.button} onClick={() => startManualClipFinder(source)}>Copy Clip Finder Prompt</button>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#cbd5e1' }}>
                <input type="checkbox" checked={!!source.use_for_weekly_plan} onChange={() => toggleUseForPlan(source)} /> Weekly plan
              </label>
              <button style={{ ...ui.button, background: '#991b1b' }} onClick={() => deleteSource(source)}>Delete</button>
            </div>
          </div>

          {activeSource?.id === source.id && (
            <div style={{ marginTop: 16, borderTop: '1px solid #334155', paddingTop: 16 }}>
              <h3>Paste AI Clip JSON Result</h3>
              <textarea style={ui.input} rows={8} placeholder="Paste the JSON result from Claude/ChatGPT here" value={clipJsonInput} onChange={(e) => setClipJsonInput(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button style={ui.button} onClick={parseClipJson}>Parse Clip Moments</button>
                <button style={{ ...ui.button, background: '#334155' }} onClick={() => copyToClipboard(buildClipPrompt(source), 'Clip Finder prompt copied again.')}>Copy Prompt Again</button>
              </div>
              {clipError && <p style={{ color: '#f87171' }}>{clipError}</p>}

              {clipMoments.map((clip, index) => {
                const approved = approvedClips[clip.id] !== false
                const captions = clipCaptions[clip.id]
                const platforms = clipPlatforms[clip.id] || DEFAULT_PLATFORMS
                return (
                  <div key={clip.id} style={{ ...ui.card, borderColor: approved ? '#22c55e' : '#475569', marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <h3 style={{ margin: 0 }}>Clip {index + 1}: {clip.clip_title}</h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={approved} onChange={() => setApprovedClips((prev) => ({ ...prev, [clip.id]: !approved }))} /> Approve
                      </label>
                    </div>
                    <p style={ui.muted}><strong>Start:</strong> {clip.start_time || clip.timestamp || 'Not stated'} | <strong>End:</strong> {clip.end_time || 'Not stated'} | <strong>Duration:</strong> {clip.duration_seconds ? `${clip.duration_seconds}s` : (clip.duration || 'Not stated')}</p>
                    <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: 14, padding: 12, marginBottom: 10 }}>
                      <strong>Hook:</strong> {clip.hook}<br /><br />
                      <strong>Quote:</strong> {clip.quote}<br /><br />
                      <strong>Context:</strong> {clip.context}<br /><br />
                      <strong>Why it works:</strong> {clip.why_it_works}<br /><br />
                      <strong>Poster text:</strong> {clip.poster_text || 'Not stated'}<br />
                      <strong>Image prompt:</strong> {clip.image_prompt || 'Not stated'}<br />
                      <strong>Subtitle style:</strong> {clip.subtitle_style || 'Not stated'}<br />
                      <strong>Audio direction:</strong> {clip.audio_direction || 'Not stated'}<br />
                      <strong>Caption direction:</strong> {clip.caption_direction || 'Not stated'}
                    </div>

                    {approved && (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <div style={ui.label}>Platforms</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {PLATFORMS.map((platform) => (
                              <button key={platform} onClick={() => togglePlatform(clip.id, platform)} style={{ ...ui.button, background: platforms.includes(platform) ? '#2563eb' : '#334155', padding: '7px 10px' }}>{platform}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                          <button style={ui.button} onClick={() => copyToClipboard(buildCaptionPrompt(source, clip), 'Caption prompt copied. Paste it into Claude/ChatGPT.')}>Copy Caption Prompt</button>
                          {captions && <button style={{ ...ui.button, background: '#334155' }} onClick={() => setExpandedClip(expandedClip === clip.id ? null : clip.id)}>{expandedClip === clip.id ? 'Hide Captions' : 'View Captions'}</button>}
                          {captions && <button style={{ ...ui.button, background: savedClips[clip.id] ? '#15803d' : '#d97706' }} disabled={savingClip[clip.id] || savedClips[clip.id]} onClick={() => saveClipToQueue(clip)}>{savingClip[clip.id] ? 'Saving...' : savedClips[clip.id] ? 'Saved' : 'Save to Queue Drafts'}</button>}
                        </div>
                        <textarea style={ui.input} rows={7} placeholder="Paste caption JSON from Claude/ChatGPT here" value={captionInputs[clip.id] || ''} onChange={(e) => setCaptionInputs((prev) => ({ ...prev, [clip.id]: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                          <button style={{ ...ui.button, background: '#0f766e' }} onClick={() => parseCaptionJson(clip)}>Parse Caption JSON</button>
                          <button
                            style={{ ...ui.button, background: savedClips[clip.id] ? '#15803d' : '#d97706' }}
                            disabled={savingClip[clip.id] || savedClips[clip.id]}
                            onClick={async () => {
                              let currentCaptions = clipCaptions[clip.id]
                              if (!currentCaptions) {
                                try {
                                  currentCaptions = normalizeCaptionData(safeJsonParse(captionInputs[clip.id] || ''))
                                  setClipCaptions((prev) => ({ ...prev, [clip.id]: currentCaptions }))
                                  setExpandedClip(clip.id)
                                } catch (error) {
                                  flash('Caption JSON error: ' + error.message)
                                  return
                                }
                              }
                              await saveClipToQueue(clip, currentCaptions)
                            }}
                          >
                            {savingClip[clip.id] ? 'Saving...' : savedClips[clip.id] ? 'Saved to Queue' : 'Save to Queue Drafts'}
                          </button>
                          {!clipCaptions[clip.id] && <span style={{ color: '#94a3b8', fontSize: 12 }}>Paste caption JSON, then click Save.</span>}
                        </div>

                        {captions && expandedClip === clip.id && (
                          <div style={{ marginTop: 14 }}>
                            {platforms.map((platform) => {
                              const key = platform.toLowerCase()
                              const caption = captions[key] || captions.tiktok || captions.youtube || ''
                              return (
                                <div key={platform} style={{ background: '#020617', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                    <strong>{platform}</strong>
                                    <button style={{ ...ui.button, padding: '5px 9px', background: '#475569' }} onClick={() => copyToClipboard(`${caption}\n\n${captions.hashtags || ''}`, `${platform} caption copied.`)}>Copy</button>
                                  </div>
                                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{caption}</p>
                                </div>
                              )
                            })}
                            {captions.firstComment && <p style={ui.muted}><strong>First Comment:</strong> {captions.firstComment}</p>}
                            {captions.hashtags && <p style={{ color: '#60a5fa', lineHeight: 1.6 }}>{captions.hashtags}</p>}
                            {captions.bestTime && <p style={ui.muted}><strong>Best Time:</strong> {captions.bestTime}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}