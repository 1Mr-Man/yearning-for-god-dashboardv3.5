import React, { useEffect, useMemo, useRef, useState } from 'react'
import PublishingWorkspace from './PublishingWorkspace'


// YFG PRODUCTION WORKSPACE — Phase 2C
// Additive: turns a completed research record into an editable production package.
// Source of truth = the research record. Nothing is invented, nothing is published.

const PLATFORMS = ['Facebook', 'Instagram', 'Threads', 'TikTok', 'YouTube']
const DURATIONS = ['30–45 seconds', '45–60 seconds', '60–90 seconds', '90–180 seconds']
const PROD_STATUSES = ['draft', 'needs_review', 'approved', 'queued', 'completed']

const SCORE_KEYS = [
  ['biblical_integrity', 'Biblical Integrity', 0.25],
  ['research_completeness', 'Research Completeness', 0.15],
  ['hook_strength', 'Hook Strength', 0.10],
  ['clarity', 'Clarity', 0.10],
  ['emotional_relevance', 'Emotional Relevance', 0.10],
  ['practical_value', 'Practical Value', 0.10],
  ['shareability', 'Shareability', 0.05],
  ['retention_potential', 'Retention Potential', 0.05],
  ['brand_alignment', 'YFG Brand Alignment', 0.10],
]

const TEXT_COLS = [
  'production_title', 'alternative_title', 'main_topic', 'target_audience', 'viewer_problem',
  'viewer_question', 'main_promise', 'core_biblical_truth', 'primary_scripture', 'supporting_scriptures',
  'yfg_differentiation', 'main_content_angle', 'emotional_journey', 'recommended_format',
  'opening_hook', 'introduction', 'main_teaching_points', 'scripture_integration', 'story_opportunity',
  'practical_application', 'reflection_questions', 'prayer_section', 'conclusion', 'suggested_cta',
  'review_notes', 'needs_verification',
]

const ui = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 4100,
    background: 'rgba(2,6,23,0.86)', backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    overflowY: 'auto', overflowX: 'hidden',
  },
  panel: {
    width: '100%', maxWidth: 900, minHeight: '100%', boxSizing: 'border-box',
    background: '#080b16', borderLeft: '1px solid rgba(51,65,85,0.7)', borderRight: '1px solid rgba(51,65,85,0.7)',
    padding: '18px 14px 190px', color: '#e2e8f0', overflowWrap: 'anywhere',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 2, margin: '-18px -14px 16px', padding: '14px',
    background: 'rgba(8,11,22,0.96)', borderBottom: '1px solid rgba(51,65,85,0.7)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
  },
  kicker: { color: '#D4AF37', fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 },
  title: { margin: '6px 0 8px', fontSize: 20, lineHeight: 1.2, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999,
    background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.85)', color: '#cbd5e1',
    fontSize: 12, fontWeight: 800,
  },
  section: {
    background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.75)', borderRadius: 18,
    padding: 14, marginBottom: 14,
  },
  sub: {
    background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 14,
    padding: 12, marginBottom: 12,
  },
  sectionTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', margin: '0 0 6px' },
  field: { marginBottom: 12 },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '12px', minHeight: 46, borderRadius: 12,
    fontSize: 15, color: '#f8fafc', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(51,65,85,0.9)',
    outline: 'none', fontFamily: 'inherit',
  },
  btn: {
    padding: '13px 16px', minHeight: 48, borderRadius: 14, fontWeight: 850, fontSize: 15, cursor: 'pointer',
    color: '#f8fafc', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.9)',
  },
  primary: { background: 'linear-gradient(135deg,#0B1023,#1d4ed8)', border: '1px solid rgba(212,175,55,0.6)', color: '#fff' },
  gold: { background: 'linear-gradient(135deg,#D4AF37,#b8860b)', border: '1px solid rgba(212,175,55,0.8)', color: '#0B1023' },
  bar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 3, maxHeight: '46vh', overflowY: 'auto',
    display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12, boxSizing: 'border-box',
    background: 'rgba(8,11,22,0.97)', borderTop: '1px solid rgba(51,65,85,0.8)',
  },
  banner: { borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontSize: 14, fontWeight: 700, lineHeight: 1.5 },
}

function Field({ label, value, onChange, rows, hint }) {
  return (
    <div style={ui.field}>
      <label style={ui.label}>{label}</label>
      {rows ? (
        <textarea style={{ ...ui.input, minHeight: rows * 26, resize: 'vertical' }} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <input style={ui.input} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      )}
      {hint && <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

const s = v => (v == null ? '' : String(v))
const firstAngle = idea => (Array.isArray(idea?.content_angles) && idea.content_angles.length ? idea.content_angles[0] : null)

// Deterministic mapping from the research record. No invented claims.
function draftFromResearch(idea) {
  const a = firstAngle(idea)
  const d = {}
  TEXT_COLS.forEach(k => { d[k] = '' })
  d.main_topic = s(idea.title)
  d.production_title = s(idea.suggested_title || idea.title)
  d.alternative_title = s(idea.title)
  d.target_audience = s(idea.target_audience)
  d.viewer_problem = s(idea.viewer_problem)
  d.viewer_question = s(idea.viewer_question)
  d.main_promise = s(idea.main_promise)
  d.core_biblical_truth = s(idea.key_biblical_truth)
  d.primary_scripture = s(idea.primary_scripture)
  d.supporting_scriptures = s(idea.supporting_scriptures)
  d.yfg_differentiation = s(idea.yfg_differentiation)
  d.main_content_angle = a ? [a.title, a.description, a.why ? `Why it matters: ${a.why}` : ''].filter(Boolean).join('\n') : ''
  d.emotional_journey = s(idea.emotional_journey)
  d.recommended_format = s(idea.video_format)
  d.opening_hook = s(idea.suggested_hook)
  d.introduction = ''
  d.main_teaching_points = s(idea.key_teaching_points)
  d.scripture_integration = [idea.primary_scripture, idea.supporting_scriptures, idea.biblical_context]
    .filter(Boolean).join('\n')
  d.story_opportunity = s(idea.story_opportunity)
  d.practical_application = ''
  d.reflection_questions = s(idea.scripture_questions)
  d.prayer_section = ''
  d.conclusion = s(idea.suggested_ending)
  d.suggested_cta = s(idea.suggested_cta)
  d.review_notes = ''
  d.needs_verification = ''
  return d
}

function shortsFromResearch(idea) {
  const angles = Array.isArray(idea?.content_angles) ? idea.content_angles : []
  const points = s(idea.key_teaching_points).split('\n').map(x => x.trim()).filter(Boolean)
  const seeds = []
  angles.forEach(a => seeds.push({ title: a.title || '', core: a.description || '', format: a.format || '' }))
  points.forEach(p => seeds.push({ title: p.slice(0, 70), core: p, format: '' }))
  return seeds.slice(0, 5).map(seed => ({
    short_title: seed.title,
    hook: '',
    core_message: seed.core,
    key_scripture: s(idea.primary_scripture),
    talking_points: '',
    closing_line: '',
    cta: s(idea.suggested_cta),
    caption: '',
    hashtags: '',
    duration: DURATIONS[1],
    platforms: 'YouTube Shorts, Instagram Reels, TikTok',
  }))
}

function socialFromResearch(idea) {
  const truth = s(idea.key_biblical_truth)
  const scripture = s(idea.primary_scripture)
  const guide = {
    Facebook: { format: 'Reflection post + image', visual: 'Single cinematic image with short scripture overlay' },
    Instagram: { format: 'Carousel or single image', visual: 'Carousel: hook slide, 3 teaching slides, scripture slide, CTA slide' },
    Threads: { format: 'Short text thread', visual: 'Text-only or one quiet image' },
    TikTok: { format: 'Vertical talking-head short', visual: 'Close framing, captions burned in, low-motion background' },
    YouTube: { format: 'Long-form video + community post', visual: 'Thumbnail with face + 3-word title text' },
  }
  return PLATFORMS.map(p => ({
    platform: p,
    hook: '',
    caption: truth ? `${truth}` : '',
    cta: s(idea.suggested_cta),
    hashtags: '',
    format: guide[p].format,
    visual: guide[p].visual,
  }))
}

function visualFromResearch(idea) {
  const brand = 'Elegant Christian Minimalism, cinematic, reverent, uncluttered, deep navy #0B1023 background, gold #D4AF37 accents, white typography, premium Christian editorial appearance'
  const topic = s(idea.suggested_title || idea.title)
  return {
    primary_image: topic ? `Primary concept for "${topic}" — ${brand}.` : '',
    thumbnail: topic ? `Thumbnail for "${topic}" — ${brand}. Minimal text, high contrast, no clutter.` : '',
    carousel: topic ? `6-slide carousel for "${topic}" — ${brand}. Slide 1 hook, slides 2–4 teaching, slide 5 scripture, slide 6 CTA.` : '',
    reel_visual: topic ? `Vertical 9:16 short visual for "${topic}" — ${brand}. Slow camera drift, no busy motion.` : '',
    ai_image_prompt: topic ? `${brand}. Subject: ${topic}. Composition: negative space for white typography, soft directional light, no text rendered in image.` : '',
    video_prompt: topic ? `${brand}. Slow cinematic 9:16 motion background for "${topic}". Subtle light movement, no people speaking, no on-screen text.` : '',
    on_screen_text: '',
    mood: 'Reverent, calm, hopeful, unhurried',
    aspect_ratio: '16:9 long-form · 9:16 shorts · 4:5 feed',
  }
}

function engagementFromResearch(idea) {
  return {
    primary_cta: s(idea.suggested_cta),
    secondary_cta: '',
    reflection_question: s(idea.scripture_questions).split('\n')[0] || '',
    comment_prompt: '',
    share_prompt: '',
    save_prompt: '',
    follow_prompt: '',
  }
}

function researchCompleteness(idea) {
  const keys = ['target_audience', 'viewer_problem', 'viewer_question', 'primary_scripture', 'supporting_scriptures',
    'key_biblical_truth', 'suggested_hook', 'main_promise', 'key_teaching_points', 'emotional_journey',
    'suggested_cta', 'video_format', 'yfg_differentiation', 'research_notes']
  const filled = keys.filter(k => s(idea[k]).trim()).length + ((Array.isArray(idea.content_angles) && idea.content_angles.length) ? 1 : 0)
  return Math.round((filled / (keys.length + 1)) * 100)
}

export function researchIsComplete(idea) {
  return idea?.status !== 'idea' && !!(s(idea?.primary_scripture).trim() || s(idea?.key_biblical_truth).trim() || s(idea?.research_notes).trim())
}

function bandOf(overall, biblical) {
  if (biblical < 70) return { label: 'Needs Biblical Review', color: '#fca5a5', border: '#7f1d1d' }
  if (overall < 80) return { label: 'Needs Improvement', color: '#fcd34d', border: '#78350f' }
  if (overall < 90) return { label: 'Production Ready', color: '#bbf7d0', border: '#14532d' }
  return { label: 'High Priority', color: '#D4AF37', border: '#78350f' }
}

export default function ProductionWorkspace({ idea, production, supabase, onClose, onSaved, onQueued }) {
  const seeded = useMemo(() => {
    const base = draftFromResearch(idea)
    if (production) {
      TEXT_COLS.forEach(k => { base[k] = s(production[k]) })
    }
    return base
  }, [idea, production])

  const [row, setRow] = useState(production || null)
  const [publishing, setPublishing] = useState(null)   // Phase 2D publishing workspace
  const [pkgRow, setPkgRow] = useState(null)

  const [form, setForm] = useState(seeded)
  const [shorts, setShorts] = useState(() => (production && Array.isArray(production.shorts_package) && production.shorts_package.length ? production.shorts_package : shortsFromResearch(idea)))
  const [social, setSocial] = useState(() => (production && Array.isArray(production.social_package) && production.social_package.length ? production.social_package : socialFromResearch(idea)))
  const [visual, setVisual] = useState(() => (production && production.visual_package && Object.keys(production.visual_package).length ? production.visual_package : visualFromResearch(idea)))
  const [engagement, setEngagement] = useState(() => (production && production.engagement_package && Object.keys(production.engagement_package).length ? production.engagement_package : engagementFromResearch(idea)))
  const [scores, setScores] = useState(() => {
    const base = {}
    SCORE_KEYS.forEach(([k]) => { base[k] = 0 })
    base.research_completeness = researchCompleteness(idea)
    if (production && production.quality_score && Object.keys(production.quality_score).length) {
      SCORE_KEYS.forEach(([k]) => { base[k] = Number(production.quality_score[k]) || 0 })
    }
    return base
  })
  const [status, setStatus] = useState(production?.status || 'draft')
  const [sources, setSources] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty

  const touch = () => setDirty(true)
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); touch() }
  const setShort = (i, k, v) => { setShorts(p => p.map((x, j) => (j === i ? { ...x, [k]: v } : x))); touch() }
  const setSoc = (i, k, v) => { setSocial(p => p.map((x, j) => (j === i ? { ...x, [k]: v } : x))); touch() }
  const setVis = (k, v) => { setVisual(p => ({ ...p, [k]: v })); touch() }
  const setEng = (k, v) => { setEngagement(p => ({ ...p, [k]: v })); touch() }
  const setScore = (k, v) => {
    const n = Math.max(0, Math.min(100, Number(String(v).replace(/[^0-9]/g, '')) || 0))
    setScores(p => ({ ...p, [k]: n })); touch()
  }

  const overall = useMemo(
    () => Math.round(SCORE_KEYS.reduce((sum, [k, , w]) => sum + (Number(scores[k]) || 0) * w, 0)),
    [scores],
  )
  const band = bandOf(overall, Number(scores.biblical_integrity) || 0)

  useEffect(() => {
    const onBeforeUnload = e => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data } = await supabase.from('yfg_research_sources').select('*').eq('research_id', idea.id).order('created_at', { ascending: true })
        if (alive) setSources(data || [])
      } catch { /* sources are optional */ }
    })()
    return () => { alive = false }
  }, [idea.id, supabase])

  function payload(nextStatus) {
    const p = { research_id: idea.id, status: nextStatus || status }
    TEXT_COLS.forEach(k => { p[k] = form[k] === '' ? null : form[k] })
    p.shorts_package = shorts
    p.social_package = social
    p.visual_package = visual
    p.engagement_package = engagement
    p.quality_score = scores
    p.overall_score = overall
    p.biblical_integrity_score = Number(scores.biblical_integrity) || 0
    p.research_completeness_score = Number(scores.research_completeness) || 0
    p.brand_alignment_score = Number(scores.brand_alignment) || 0
    p.updated_at = new Date().toISOString()
    if (nextStatus === 'approved') p.approved_at = new Date().toISOString()
    return p
  }

  async function persist(nextStatus, successMsg) {
    if (saving) return null
    // Versioning guard: editing an approved package returns it to Needs Review.
    let target = nextStatus
    if (!nextStatus && row?.status === 'approved' && dirty) {
      if (!window.confirm('Editing this approved production package will return it to Needs Review. Continue?')) return null
      target = 'needs_review'
    }
    setSaving(true); setMsg(''); setErr('')
    try {
      const body = payload(target)
      let data, error
      if (row?.id) {
        ({ data, error } = await supabase.from('yfg_content_production').update(body).eq('id', row.id).select().single())
      } else {
        ({ data, error } = await supabase.from('yfg_content_production').insert(body).select().single())
      }
      if (error) {
        if (String(error.code) === '23505') {
          setErr('Production package already exists. Close and use “Open Production”.')
        } else {
          setErr('Production package could not be saved: ' + error.message)
        }
        return null
      }
      setRow(data); setStatus(data.status); setDirty(false)
      setMsg(successMsg || 'Production package saved successfully.')
      onSaved && onSaved(data)
      return data
    } catch (e) {
      setErr('Production package could not be saved: ' + (e?.message || String(e)))
      return null
    } finally {
      setSaving(false)
    }
  }

  function refreshDraft() {
    if (!window.confirm('Refresh the draft from the research record? Empty production fields will be filled from research; this does not save until you press Save.')) return
    const d = draftFromResearch(idea)
    setForm(p => {
      const next = { ...p }
      TEXT_COLS.forEach(k => { if (!s(next[k]).trim()) next[k] = d[k] })
      return next
    })
    setShorts(p => (p.length ? p : shortsFromResearch(idea)))
    setSocial(p => (p.length ? p : socialFromResearch(idea)))
    setScores(p => ({ ...p, research_completeness: researchCompleteness(idea) }))
    touch()
    setMsg('Draft refreshed from the research record. Empty fields left blank still need completion.')
  }

  async function approve() {
    if ((Number(scores.biblical_integrity) || 0) < 70) {
      setErr('Needs Biblical Review — Biblical Integrity is below 70. Approval is blocked.')
      return
    }
    await persist('approved', 'Production approved.')
  }

  // Phase 2D — open the publishing preparation workspace for this production item.
  async function openPublishing() {
    setErr(''); setMsg('')
    const current = row?.id ? row : await persist(undefined, 'Production package saved.')
    if (!current) return
    if (current.status !== 'approved' && current.status !== 'queued' && current.status !== 'completed') {
      setErr('Approve the production package before preparing the publishing package.')
      return
    }
    try {
      const { data, error } = await supabase.from('yfg_publishing_packages')
        .select('*').eq('production_id', current.id).maybeSingle()
      if (error && error.code !== 'PGRST116') {
        setErr('Publishing package could not be loaded: ' + error.message); return
      }
      setPkgRow(data || null)
      setPublishing(true)
    } catch (e) {
      setErr('Publishing package could not be loaded: ' + (e?.message || String(e)))
    }
  }


  // NOTE (Phase R1): the old moveToQueue() direct-insert path was removed.
  // It bypassed yfg_publishing_packages, the asset readiness engine, the
  // human-review gate, and yfg_package_id duplicate protection. Queueing a
  // produced package now happens only through openPublishing() below, which
  // opens PublishingWorkspace — the mature, canonical path to content_queue_main.

  // ---------- copy outputs ----------
  const srcText = sources.length
    ? sources.map(x => `- ${x.source_name || '(untitled)'} [${x.source_type || 'Other'}]${x.source_url ? ` ${x.source_url}` : ''}${x.notes ? ` — ${x.notes}` : ''}`).join('\n')
    : 'No external source attached.'

  const productionBrief = () => `YFG PRODUCTION BRIEF

Main Topic: ${form.main_topic}
Production Title: ${form.production_title}
Alternative Title: ${form.alternative_title}
Research Status: ${idea.status} | Production Status: ${status}
Content Pillar: ${idea.pillar || ''} | Content Type: ${idea.type || ''}
Priority: ${idea.priority_score || 0}/100

A. PRODUCTION STRATEGY
Primary Audience: ${form.target_audience}
Viewer Problem: ${form.viewer_problem}
Viewer Question: ${form.viewer_question}
Main Promise: ${form.main_promise}
Core Biblical Truth: ${form.core_biblical_truth}
Primary Scripture: ${form.primary_scripture}
Supporting Scriptures: ${form.supporting_scriptures}
YFG Differentiation: ${form.yfg_differentiation}
Main Content Angle: ${form.main_content_angle}
Emotional Journey: ${form.emotional_journey}
Recommended Format: ${form.recommended_format}

QUALITY
${SCORE_KEYS.map(([k, l]) => `${l}: ${scores[k]}/100`).join('\n')}
Overall Production Score: ${overall}/100 — ${band.label}

NEEDS VERIFICATION
${form.needs_verification || '(none flagged)'}

SOURCES
${srcText}
`

  const longformBrief = () => `YFG LONG-FORM PRODUCTION BRIEF (not a generated script)

Title: ${form.production_title}
Alternative Title: ${form.alternative_title}
Format: ${form.recommended_format}

Opening Hook:
${form.opening_hook}

Introduction:
${form.introduction}

Main Teaching Points:
${form.main_teaching_points}

Scripture Integration:
${form.scripture_integration}

Story / Example Opportunity:
${form.story_opportunity}

Practical Application:
${form.practical_application}

Reflection Questions:
${form.reflection_questions}

Prayer / Application Section:
${form.prayer_section}

Conclusion:
${form.conclusion}

Suggested CTA:
${form.suggested_cta}

Sources:
${srcText}
`

  const shortsBrief = () => `YFG SHORT-FORM PACKAGE\n\n${shorts.length ? shorts.map((x, i) => `SHORT ${i + 1}
Title: ${x.short_title || ''}
Hook: ${x.hook || ''}
Core Message: ${x.core_message || ''}
Key Scripture: ${x.key_scripture || ''}
Talking Points: ${x.talking_points || ''}
Closing Line: ${x.closing_line || ''}
CTA: ${x.cta || ''}
Caption: ${x.caption || ''}
Hashtags: ${x.hashtags || ''}
Duration: ${x.duration || ''}
Platforms: ${x.platforms || ''}`).join('\n\n') : '(no short-form concepts yet)'}\n`

  const socialBrief = () => `YFG SOCIAL PACKAGE\n\n${social.map(p => `${p.platform.toUpperCase()}
Format: ${p.format || ''}
Hook: ${p.hook || ''}
Caption: ${p.caption || ''}
CTA: ${p.cta || ''}
Hashtags: ${p.hashtags || ''}
Visual: ${p.visual || ''}`).join('\n\n')}\n`

  const visualBrief = () => `YFG VISUAL PROMPTS
Primary Image Concept: ${visual.primary_image || ''}
Thumbnail Concept: ${visual.thumbnail || ''}
Carousel Concept: ${visual.carousel || ''}
Reel/Short Visual Concept: ${visual.reel_visual || ''}
AI Image Prompt: ${visual.ai_image_prompt || ''}
Video Prompt: ${visual.video_prompt || ''}
On-screen Text: ${visual.on_screen_text || ''}
Visual Mood: ${visual.mood || ''}
Aspect Ratio: ${visual.aspect_ratio || ''}
`

  const engagementBrief = () => `YFG ENGAGEMENT
Primary CTA: ${engagement.primary_cta || ''}
Secondary CTA: ${engagement.secondary_cta || ''}
Reflection Question: ${engagement.reflection_question || ''}
Comment Prompt: ${engagement.comment_prompt || ''}
Share Prompt: ${engagement.share_prompt || ''}
Save Prompt: ${engagement.save_prompt || ''}
Follow/Subscribe Prompt: ${engagement.follow_prompt || ''}
`

  const completePackage = () => [productionBrief(), longformBrief(), shortsBrief(), socialBrief(), visualBrief(), engagementBrief()].join('\n\n==============================\n\n')

  async function copy(text) {
    setMsg(''); setErr('')
    try {
      // Try the modern Clipboard API first, fall back to execCommand for stricter contexts
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setMsg('Copied to clipboard.')
        return
      }
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) setMsg('Copied to clipboard.')
      else setErr('Copy failed — select and copy manually.')
    } catch {
      setErr('Copy failed — select and copy manually.')
    }
  }

  function close() {
    if (dirty && !window.confirm('You have unsaved production changes. Close anyway?')) return
    onClose && onClose()
  }

  return (
    <div style={ui.overlay} role="dialog" aria-modal="true">
      <div style={ui.panel}>
        <div style={ui.header}>
          <div style={{ minWidth: 0 }}>
            <p style={ui.kicker}>YFG Production Workspace</p>
            <h2 style={ui.title}>{idea.title}</h2>
            <div style={ui.metaRow}>
              <span style={ui.pill}>Priority {idea.priority_score || 0}/100</span>
              <span style={ui.pill}>Research: {idea.status}</span>
              <span style={ui.pill}>Production: {status}</span>
              {idea.pillar && <span style={ui.pill}>{idea.pillar}</span>}
              {idea.type && <span style={ui.pill}>{idea.type}</span>}
            </div>
          </div>
          <button style={{ ...ui.btn, minHeight: 40, padding: '8px 12px' }} onClick={close}>Close</button>
        </div>

        {err && <div style={{ ...ui.banner, color: '#fecaca', border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.18)' }}>{err}</div>}
        {msg && <div style={{ ...ui.banner, color: '#bbf7d0', border: '1px solid #14532d', background: 'rgba(20,83,45,0.18)' }}>{msg}</div>}
        <div style={{ ...ui.banner, color: '#cbd5e1', border: '1px solid rgba(51,65,85,0.9)', background: 'rgba(15,23,42,0.7)' }}>
          Draft generation unavailable — enter manually or connect an AI provider. Fields below are mapped directly from the research record; empty fields need completion. Nothing here is published.
        </div>

        {/* A */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>A. Production Strategy</h3>
          <Field label="Main Topic" value={form.main_topic} onChange={v => set('main_topic', v)} />
          <Field label="Production Title" value={form.production_title} onChange={v => set('production_title', v)} />
          <Field label="Alternative Title" value={form.alternative_title} onChange={v => set('alternative_title', v)} />
          <Field label="Primary Audience" value={form.target_audience} onChange={v => set('target_audience', v)} rows={2} />
          <Field label="Viewer Problem" value={form.viewer_problem} onChange={v => set('viewer_problem', v)} rows={2} />
          <Field label="Viewer Question" value={form.viewer_question} onChange={v => set('viewer_question', v)} rows={2} />
          <Field label="Main Promise" value={form.main_promise} onChange={v => set('main_promise', v)} rows={2} />
          <Field label="Core Biblical Truth" value={form.core_biblical_truth} onChange={v => set('core_biblical_truth', v)} rows={3} />
          <Field label="Primary Scripture" value={form.primary_scripture} onChange={v => set('primary_scripture', v)} rows={2} hint="Verify every reference before production." />
          <Field label="Supporting Scriptures" value={form.supporting_scriptures} onChange={v => set('supporting_scriptures', v)} rows={3} />
          <Field label="YFG Differentiation" value={form.yfg_differentiation} onChange={v => set('yfg_differentiation', v)} rows={3} />
          <Field label="Main Content Angle" value={form.main_content_angle} onChange={v => set('main_content_angle', v)} rows={4} />
          <Field label="Emotional Journey" value={form.emotional_journey} onChange={v => set('emotional_journey', v)} rows={3} />
          <Field label="Recommended Format" value={form.recommended_format} onChange={v => set('recommended_format', v)} />
        </section>

        {/* B */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>B. Long-form Content — Production Brief</h3>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>This is a production brief, not a generated script. No sermon text is auto-written.</div>
          <Field label="Long-form Title" value={form.production_title} onChange={v => set('production_title', v)} />
          <Field label="Alternative Title" value={form.alternative_title} onChange={v => set('alternative_title', v)} />
          <Field label="Opening Hook" value={form.opening_hook} onChange={v => set('opening_hook', v)} rows={3} />
          <Field label="Introduction" value={form.introduction} onChange={v => set('introduction', v)} rows={4} />
          <Field label="Main Teaching Points" value={form.main_teaching_points} onChange={v => set('main_teaching_points', v)} rows={6} />
          <Field label="Scripture Integration" value={form.scripture_integration} onChange={v => set('scripture_integration', v)} rows={4} />
          <Field label="Story / Example Opportunity" value={form.story_opportunity} onChange={v => set('story_opportunity', v)} rows={3} />
          <Field label="Practical Application" value={form.practical_application} onChange={v => set('practical_application', v)} rows={4} />
          <Field label="Reflection Questions" value={form.reflection_questions} onChange={v => set('reflection_questions', v)} rows={3} />
          <Field label="Prayer / Application Section" value={form.prayer_section} onChange={v => set('prayer_section', v)} rows={3} />
          <Field label="Conclusion" value={form.conclusion} onChange={v => set('conclusion', v)} rows={3} />
          <Field label="Suggested CTA" value={form.suggested_cta} onChange={v => set('suggested_cta', v)} rows={2} />
        </section>

        {/* C */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>C. Short-form Content (up to 5)</h3>
          {shorts.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>No short-form concepts derived yet — add content angles or teaching points in the Research Workspace, then Refresh Draft.</div>}
          {shorts.map((x, i) => (
            <div key={i} style={ui.sub}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <strong style={{ color: '#D4AF37' }}>Short {i + 1}</strong>
                <button style={{ ...ui.btn, minHeight: 34, padding: '6px 10px', fontSize: 13 }} onClick={() => { setShorts(p => p.filter((_, j) => j !== i)); touch() }}>Remove</button>
              </div>
              <Field label="Short Title" value={x.short_title} onChange={v => setShort(i, 'short_title', v)} />
              <Field label="Hook" value={x.hook} onChange={v => setShort(i, 'hook', v)} rows={2} />
              <Field label="Core Message" value={x.core_message} onChange={v => setShort(i, 'core_message', v)} rows={3} />
              <Field label="Key Scripture" value={x.key_scripture} onChange={v => setShort(i, 'key_scripture', v)} />
              <Field label="Talking Points" value={x.talking_points} onChange={v => setShort(i, 'talking_points', v)} rows={3} />
              <Field label="Closing Line" value={x.closing_line} onChange={v => setShort(i, 'closing_line', v)} rows={2} />
              <Field label="CTA" value={x.cta} onChange={v => setShort(i, 'cta', v)} rows={2} />
              <Field label="Caption" value={x.caption} onChange={v => setShort(i, 'caption', v)} rows={3} />
              <Field label="Hashtags" value={x.hashtags} onChange={v => setShort(i, 'hashtags', v)} rows={2} />
              <div style={ui.field}>
                <label style={ui.label}>Estimated Duration</label>
                <select style={ui.input} value={x.duration || ''} onChange={e => setShort(i, 'duration', e.target.value)}>
                  <option value="">—</option>
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Field label="Platform Suitability" value={x.platforms} onChange={v => setShort(i, 'platforms', v)} />
            </div>
          ))}
          {shorts.length < 5 && (
            <button style={ui.btn} onClick={() => { setShorts(p => [...p, { short_title: '', hook: '', core_message: '', key_scripture: '', talking_points: '', closing_line: '', cta: '', caption: '', hashtags: '', duration: '', platforms: '' }]); touch() }}>+ Add short-form concept</button>
          )}
        </section>

        {/* D */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>D. Social Content</h3>
          {social.map((p, i) => (
            <div key={p.platform || i} style={ui.sub}>
              <strong style={{ color: '#D4AF37', display: 'block', marginBottom: 8 }}>{p.platform}</strong>
              <Field label="Content Format" value={p.format} onChange={v => setSoc(i, 'format', v)} />
              <Field label="Hook" value={p.hook} onChange={v => setSoc(i, 'hook', v)} rows={2} />
              <Field label="Caption" value={p.caption} onChange={v => setSoc(i, 'caption', v)} rows={4} />
              <Field label="CTA" value={p.cta} onChange={v => setSoc(i, 'cta', v)} rows={2} />
              <Field label="Hashtags" value={p.hashtags} onChange={v => setSoc(i, 'hashtags', v)} rows={2} />
              <Field label="Visual Suggestion" value={p.visual} onChange={v => setSoc(i, 'visual', v)} rows={2} />
            </div>
          ))}
        </section>

        {/* E */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>E. Visual Content</h3>
          <Field label="Primary Image Concept" value={visual.primary_image} onChange={v => setVis('primary_image', v)} rows={3} />
          <Field label="Thumbnail Concept" value={visual.thumbnail} onChange={v => setVis('thumbnail', v)} rows={3} />
          <Field label="Carousel Concept" value={visual.carousel} onChange={v => setVis('carousel', v)} rows={3} />
          <Field label="Reel / Short Visual Concept" value={visual.reel_visual} onChange={v => setVis('reel_visual', v)} rows={3} />
          <Field label="AI Image Prompt" value={visual.ai_image_prompt} onChange={v => setVis('ai_image_prompt', v)} rows={4} />
          <Field label="Video Prompt" value={visual.video_prompt} onChange={v => setVis('video_prompt', v)} rows={4} />
          <Field label="On-screen Text" value={visual.on_screen_text} onChange={v => setVis('on_screen_text', v)} rows={2} />
          <Field label="Suggested Visual Mood" value={visual.mood} onChange={v => setVis('mood', v)} />
          <Field label="Suggested Aspect Ratio" value={visual.aspect_ratio} onChange={v => setVis('aspect_ratio', v)} />
        </section>

        {/* F */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>F. Engagement</h3>
          <Field label="Primary CTA" value={engagement.primary_cta} onChange={v => setEng('primary_cta', v)} rows={2} />
          <Field label="Secondary CTA" value={engagement.secondary_cta} onChange={v => setEng('secondary_cta', v)} rows={2} />
          <Field label="Reflection Question" value={engagement.reflection_question} onChange={v => setEng('reflection_question', v)} rows={2} />
          <Field label="Comment Prompt" value={engagement.comment_prompt} onChange={v => setEng('comment_prompt', v)} rows={2} hint="Invite honest reflection. No engagement bait." />
          <Field label="Share Prompt" value={engagement.share_prompt} onChange={v => setEng('share_prompt', v)} rows={2} />
          <Field label="Save Prompt" value={engagement.save_prompt} onChange={v => setEng('save_prompt', v)} rows={2} />
          <Field label="Follow / Subscribe Prompt" value={engagement.follow_prompt} onChange={v => setEng('follow_prompt', v)} rows={2} />
        </section>

        {/* G */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>G. Quality Control</h3>
          {SCORE_KEYS.map(([k, label, w]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <label style={{ ...ui.label, margin: 0, flex: '1 1 150px' }}>{label} <span style={{ color: '#64748b' }}>({Math.round(w * 100)}%)</span></label>
              <input style={{ ...ui.input, width: 90, flex: '0 0 90px' }} inputMode="numeric" value={scores[k]} onChange={e => setScore(k, e.target.value)} />
            </div>
          ))}
          <div style={{ ...ui.banner, marginTop: 8, color: band.color, border: `1px solid ${band.border}`, background: 'rgba(2,6,23,0.6)' }}>
            Overall Production Score: {overall}/100 — {band.label}
            {(Number(scores.biblical_integrity) || 0) < 70 && <div style={{ marginTop: 6, fontWeight: 700 }}>Approval is blocked until Biblical Integrity reaches 70.</div>}
          </div>
          <Field label="Review Notes" value={form.review_notes} onChange={v => set('review_notes', v)} rows={3} />
          <Field label="Needs Verification" value={form.needs_verification} onChange={v => set('needs_verification', v)} rows={3} hint="List every scripture, quote, statistic or claim that still needs checking." />
          <div style={ui.sub}>
            <strong style={{ color: '#94a3b8', fontSize: 12, letterSpacing: '0.1em' }}>RESEARCH SOURCES</strong>
            <div style={{ marginTop: 8, color: '#cbd5e1', fontSize: 13, whiteSpace: 'pre-wrap' }}>{srcText}</div>
          </div>
        </section>

        {/* H */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>H. Production Actions</h3>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            “Prepare Publishing Package” opens the Phase 2D asset &amp; publishing workspace for this approved item.
            From there, readiness checks, human review, and duplicate protection all run before anything reaches the
            content queue — this is now the only path into the queue from a production package. It never publishes.
          </div>
        </section>

        <div style={ui.bar}>
          <button style={{ ...ui.btn, ...ui.primary, flex: '1 1 100%' }} disabled={saving} onClick={() => persist(undefined)}>{saving ? 'Working…' : 'Save Production Package'}</button>
          <button style={{ ...ui.btn, ...ui.gold, flex: '1 1 100%' }} disabled={saving} onClick={openPublishing}>Prepare Publishing Package</button>

          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={refreshDraft}>Refresh Draft</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} disabled={saving} onClick={() => persist('needs_review', 'Marked as needs review.')}>Mark Needs Review</button>
          <button style={{ ...ui.btn, ...ui.gold, flex: '1 1 46%' }} disabled={saving} onClick={approve}>Approve Production</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={() => copy(productionBrief())}>Copy Production Brief</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={() => copy(longformBrief())}>Copy Long-form Brief</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={() => copy(shortsBrief())}>Copy Shorts Package</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={() => copy(socialBrief())}>Copy Social Package</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={() => copy(visualBrief())}>Copy Visual Prompts</button>
          <button style={{ ...ui.btn, flex: '1 1 46%' }} onClick={() => copy(completePackage())}>Copy Complete Package</button>
          <button style={{ ...ui.btn, flex: '1 1 100%' }} onClick={close}>Close</button>
        </div>

        {publishing && (
          <PublishingWorkspace
            idea={idea}
            production={row}
            pkg={pkgRow}
            supabase={supabase}
            originType="research"
            originId={idea?.id}
            onSaved={p => setPkgRow(p)}
            onQueued={() => onQueued && onQueued()}
            onClose={() => setPublishing(false)}
          />
        )}

      </div>
    </div>
  )
}
