import React, { useEffect, useMemo, useRef, useState } from 'react'

// YFG Research Workspace — mobile-first dark drawer for a single research idea.
// Reuses the existing supabase client + styles passed in as props.

const SOURCE_TYPES = ['Bible', 'YouTube', 'Google/Search', 'Christian Article', 'Book', 'Sermon', 'Academic/Theological', 'Other']

const TEXT_FIELDS = [
  'viewer_problem', 'viewer_question', 'target_audience', 'suggested_title',
  'research_intent', 'main_search_query', 'related_search_queries', 'faqs',
  'audience_pain_points', 'misconceptions', 'content_gaps',
  'primary_scripture', 'supporting_scriptures', 'biblical_theme', 'key_biblical_truth',
  'biblical_context', 'scripture_questions', 'doctrinal_notes',
  'video_format', 'suggested_hook', 'main_promise', 'story_opportunity',
  'key_teaching_points', 'emotional_journey', 'open_loops', 'suggested_cta', 'suggested_ending',
  'existing_content', 'common_approaches', 'creator_gaps', 'yfg_differentiation', 'opportunities_deeper', 'avoid_notes',
  'research_notes',
]
const NUM_FIELDS = ['evergreen_potential', 'trend_potential']

const ui = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 4000,
    background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    overflowY: 'auto', padding: '0',
  },
  panel: {
    width: '100%', maxWidth: 900, minHeight: '100%', boxSizing: 'border-box',
    background: '#080b16', borderLeft: '1px solid rgba(51,65,85,0.7)', borderRight: '1px solid rgba(51,65,85,0.7)',
    padding: '18px 14px 120px', color: '#e2e8f0',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 2, margin: '-18px -14px 16px', padding: '14px',
    background: 'rgba(8,11,22,0.96)', borderBottom: '1px solid rgba(51,65,85,0.7)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
  },
  kicker: { color: '#a78bfa', fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 },
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
  sectionTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', margin: '0 0 6px' },
  field: { marginBottom: 12 },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '12px 12px', minHeight: 46, borderRadius: 12,
    fontSize: 15, color: '#f8fafc', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(51,65,85,0.9)',
    outline: 'none', fontFamily: 'inherit',
  },
  btn: {
    padding: '13px 16px', minHeight: 48, borderRadius: 14, fontWeight: 850, fontSize: 15, cursor: 'pointer',
    color: '#f8fafc', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.9)',
  },
  primary: {
    background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: '1px solid rgba(167,139,250,0.6)', color: '#fff',
  },
  bar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 3,
    display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12,
    background: 'rgba(8,11,22,0.97)', borderTop: '1px solid rgba(51,65,85,0.8)',
  },
  banner: { borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontSize: 14, fontWeight: 700 },
}

function Field({ label, value, onChange, rows }) {
  return (
    <div style={ui.field}>
      <label style={ui.label}>{label}</label>
      {rows ? (
        <textarea style={{ ...ui.input, minHeight: rows * 26, resize: 'vertical' }} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <input style={ui.input} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  )
}

export default function ResearchWorkspace({ idea, supabase, onClose, onSaved }) {
  const initial = useMemo(() => {
    const d = {}
    TEXT_FIELDS.forEach(k => { d[k] = idea?.[k] ?? '' })
    NUM_FIELDS.forEach(k => { d[k] = idea?.[k] ?? 0 })
    d.suggested_title = idea?.suggested_title ?? ''
    return d
  }, [idea])

  const [form, setForm] = useState(initial)
  const [angles, setAngles] = useState(() => Array.isArray(idea?.content_angles) ? idea.content_angles : [])
  const [sources, setSources] = useState([])
  const [newSource, setNewSource] = useState({ source_name: '', source_url: '', source_type: 'Bible', notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setDirty(true) }

  useEffect(() => {
    const onBeforeUnload = e => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data, error } = await supabase.from('yfg_research_sources').select('*').eq('research_id', idea.id).order('created_at', { ascending: true })
        if (!alive) return
        if (!error) setSources(data || [])
      } catch { /* sources table optional */ }
    })()
    return () => { alive = false }
  }, [idea.id, supabase])

  function payload() {
    const p = {}
    TEXT_FIELDS.forEach(k => { p[k] = form[k] === '' ? null : form[k] })
    NUM_FIELDS.forEach(k => { p[k] = Number(form[k]) || 0 })
    p.content_angles = angles
    p.updated_at = new Date().toISOString()
    return p
  }

  async function save(extra) {
    if (saving) return null
    setSaving(true); setMsg(''); setErr('')
    try {
      const { data, error } = await supabase
        .from('yfg_content_research')
        .update({ ...payload(), ...(extra || {}) })
        .eq('id', idea.id)
        .select()
        .single()
      if (error) { setErr('Unable to save research. Please try again. (' + error.message + ')'); setSaving(false); return null }
      setDirty(false)
      setMsg('Research saved successfully.')
      onSaved?.(data)
      setSaving(false)
      return data
    } catch (e) {
      setErr('Unable to save research. Please try again. (' + (e?.message || String(e)) + ')')
      setSaving(false)
      return null
    }
  }

  async function complete() {
    const data = await save({ status: 'researched' })
    if (data) { setMsg('Research saved and marked complete.'); setTimeout(() => onClose?.(), 400) }
  }

  async function addSource() {
    if (!newSource.source_name.trim() && !newSource.source_url.trim()) { setErr('Add a source name or URL first.'); return }
    setErr(''); setMsg('')
    try {
      const { data, error } = await supabase.from('yfg_research_sources')
        .insert({ ...newSource, research_id: idea.id }).select().single()
      if (error) { setErr('Unable to save source. Please try again. (' + error.message + ')'); return }
      setSources(p => [...p, data])
      setNewSource({ source_name: '', source_url: '', source_type: 'Bible', notes: '' })
      setMsg('Source added.')
    } catch (e) { setErr('Unable to save source. (' + (e?.message || String(e)) + ')') }
  }

  async function removeSource(id) {
    try {
      const { error } = await supabase.from('yfg_research_sources').delete().eq('id', id)
      if (error) { setErr('Unable to delete source.'); return }
      setSources(p => p.filter(s => s.id !== id))
    } catch { setErr('Unable to delete source.') }
  }

  function close() {
    if (dirty && !window.confirm('You have unsaved research changes. Leave without saving?')) return
    onClose?.()
  }

  const setAngle = (i, k, v) => { setAngles(p => p.map((a, j) => j === i ? { ...a, [k]: v } : a)); setDirty(true) }

  return (
    <div style={ui.overlay} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div style={ui.panel}>
        <div style={ui.header}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={ui.kicker}>YFG Research Workspace</p>
            <h2 style={ui.title}>{idea.title}</h2>
            <div style={ui.metaRow}>
              <span style={ui.pill}>Priority: {idea.priority_score || 0}/100</span>
              <span style={ui.pill}>Pillar: {idea.pillar || '—'}</span>
              <span style={ui.pill}>Status: {idea.status}</span>
            </div>
          </div>
          <button style={{ ...ui.btn, minHeight: 40, padding: '8px 12px', flexShrink: 0 }} onClick={close}>Close</button>
        </div>

        {err && <div style={{ ...ui.banner, color: '#fecaca', background: 'rgba(127,29,29,0.28)', border: '1px solid #7f1d1d' }}>{err}</div>}
        {msg && <div style={{ ...ui.banner, color: '#bbf7d0', background: 'rgba(20,83,45,0.28)', border: '1px solid #14532d' }}>{msg}</div>}

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>A · Core Content Opportunity</h3>
          <div style={ui.field}><label style={ui.label}>Main Topic</label><div style={{ ...ui.input, minHeight: 0, padding: 12, color: '#cbd5e1' }}>{idea.title}</div></div>
          <Field label="Viewer Problem" rows={3} value={form.viewer_problem} onChange={v => set('viewer_problem', v)} />
          <Field label="Viewer Question" rows={2} value={form.viewer_question} onChange={v => set('viewer_question', v)} />
          <Field label="Target Audience" rows={2} value={form.target_audience} onChange={v => set('target_audience', v)} />
          <div style={ui.field}><label style={ui.label}>Content Pillar</label><div style={{ ...ui.input, minHeight: 0, color: '#cbd5e1' }}>{idea.pillar || '—'}</div></div>
          <div style={ui.field}><label style={ui.label}>Content Type</label><div style={{ ...ui.input, minHeight: 0, color: '#cbd5e1' }}>{idea.type || '—'}</div></div>
          <div style={ui.field}><label style={ui.label}>Priority Score</label><div style={{ ...ui.input, minHeight: 0, color: '#cbd5e1' }}>{idea.priority_score || 0}/100</div></div>
          <Field label="Suggested Title" rows={2} value={form.suggested_title} onChange={v => set('suggested_title', v)} />
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>B · Search & Discovery</h3>
          <Field label="Search Intent" rows={2} value={form.research_intent} onChange={v => set('research_intent', v)} />
          <Field label="Main Search Query" value={form.main_search_query} onChange={v => set('main_search_query', v)} />
          <Field label="Related Search Queries (one per line)" rows={4} value={form.related_search_queries} onChange={v => set('related_search_queries', v)} />
          <Field label="Frequently Asked Questions (one per line)" rows={4} value={form.faqs} onChange={v => set('faqs', v)} />
          <Field label="Audience Pain Points" rows={3} value={form.audience_pain_points} onChange={v => set('audience_pain_points', v)} />
          <Field label="Audience Misconceptions" rows={3} value={form.misconceptions} onChange={v => set('misconceptions', v)} />
          <Field label="Content Gaps" rows={3} value={form.content_gaps} onChange={v => set('content_gaps', v)} />
          <div style={ui.field}>
            <label style={ui.label}>Evergreen Potential (0–100)</label>
            <input type="number" min="0" max="100" style={ui.input} value={form.evergreen_potential} onChange={e => set('evergreen_potential', e.target.value)} />
          </div>
          <div style={ui.field}>
            <label style={ui.label}>Trend Potential (0–100)</label>
            <input type="number" min="0" max="100" style={ui.input} value={form.trend_potential} onChange={e => set('trend_potential', e.target.value)} />
          </div>
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>C · Biblical Foundation</h3>
          <p style={{ color: '#64748b', fontSize: 12, margin: '-6px 0 12px' }}>Ground every angle in Scripture, not generic motivation.</p>
          <Field label="Primary Scripture" value={form.primary_scripture} onChange={v => set('primary_scripture', v)} />
          <Field label="Supporting Scriptures (one per line)" rows={4} value={form.supporting_scriptures} onChange={v => set('supporting_scriptures', v)} />
          <Field label="Biblical Theme" rows={2} value={form.biblical_theme} onChange={v => set('biblical_theme', v)} />
          <Field label="Key Biblical Truth" rows={3} value={form.key_biblical_truth} onChange={v => set('key_biblical_truth', v)} />
          <Field label="Biblical Context" rows={4} value={form.biblical_context} onChange={v => set('biblical_context', v)} />
          <Field label="Questions Scripture Answers" rows={3} value={form.scripture_questions} onChange={v => set('scripture_questions', v)} />
          <Field label="Doctrinal / Theological Notes" rows={4} value={form.doctrinal_notes} onChange={v => set('doctrinal_notes', v)} />
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>D · Content Angles</h3>
          {angles.length === 0 && <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>No angles yet.</p>}
          {angles.map((a, i) => (
            <div key={i} style={{ background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(51,65,85,0.7)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
              <Field label={`Angle ${i + 1} Title`} rows={2} value={a.title} onChange={v => setAngle(i, 'title', v)} />
              <Field label="Description" rows={3} value={a.description} onChange={v => setAngle(i, 'description', v)} />
              <Field label="Why It Matters" rows={2} value={a.why} onChange={v => setAngle(i, 'why', v)} />
              <Field label="Retention Potential" value={a.retention} onChange={v => setAngle(i, 'retention', v)} />
              <Field label="Shareability" value={a.shareability} onChange={v => setAngle(i, 'shareability', v)} />
              <Field label="Recommended Format" value={a.format} onChange={v => setAngle(i, 'format', v)} />
              <button style={ui.btn} onClick={() => { setAngles(p => p.filter((_, j) => j !== i)); setDirty(true) }}>Remove Angle</button>
            </div>
          ))}
          <button style={{ ...ui.btn, ...ui.primary }} onClick={() => { setAngles(p => [...p, { title: '', description: '', why: '', retention: '', shareability: '', format: '' }]); setDirty(true) }}>+ Add Angle</button>
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>E · Video Direction</h3>
          <Field label="Recommended Video Format" value={form.video_format} onChange={v => set('video_format', v)} />
          <Field label="Suggested Hook" rows={3} value={form.suggested_hook} onChange={v => set('suggested_hook', v)} />
          <Field label="Main Promise" rows={2} value={form.main_promise} onChange={v => set('main_promise', v)} />
          <Field label="Story Opportunity" rows={3} value={form.story_opportunity} onChange={v => set('story_opportunity', v)} />
          <Field label="Key Teaching Points (one per line)" rows={5} value={form.key_teaching_points} onChange={v => set('key_teaching_points', v)} />
          <Field label="Emotional Journey" rows={3} value={form.emotional_journey} onChange={v => set('emotional_journey', v)} />
          <Field label="Open Loops" rows={3} value={form.open_loops} onChange={v => set('open_loops', v)} />
          <Field label="Suggested CTA" rows={2} value={form.suggested_cta} onChange={v => set('suggested_cta', v)} />
          <Field label="Suggested Ending" rows={3} value={form.suggested_ending} onChange={v => set('suggested_ending', v)} />
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>F · Competitor / Existing Content</h3>
          <Field label="Existing Content Observed" rows={4} value={form.existing_content} onChange={v => set('existing_content', v)} />
          <Field label="Common Approaches" rows={3} value={form.common_approaches} onChange={v => set('common_approaches', v)} />
          <Field label="What Other Creators Are Missing" rows={3} value={form.creator_gaps} onChange={v => set('creator_gaps', v)} />
          <Field label="YFG Differentiation" rows={3} value={form.yfg_differentiation} onChange={v => set('yfg_differentiation', v)} />
          <Field label="Opportunities to Go Deeper" rows={3} value={form.opportunities_deeper} onChange={v => set('opportunities_deeper', v)} />
          <Field label="Things YFG Should Avoid" rows={3} value={form.avoid_notes} onChange={v => set('avoid_notes', v)} />
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>G · Sources</h3>
          {sources.length === 0 && <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>No sources saved yet.</p>}
          {sources.map(s => (
            <div key={s.id} style={{ background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(51,65,85,0.7)', borderRadius: 14, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: '#f1f5f9', wordBreak: 'break-word' }}>{s.source_name || s.source_url}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{s.source_type} · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</div>
              {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', fontSize: 13, wordBreak: 'break-all' }}>{s.source_url}</a>}
              {s.notes && <p style={{ color: '#cbd5e1', fontSize: 14, marginTop: 6 }}>{s.notes}</p>}
              <button style={{ ...ui.btn, marginTop: 8 }} onClick={() => removeSource(s.id)}>Remove</button>
            </div>
          ))}
          <div style={{ background: 'rgba(2,6,23,0.4)', border: '1px dashed rgba(51,65,85,0.9)', borderRadius: 14, padding: 12 }}>
            <Field label="Source Name" value={newSource.source_name} onChange={v => setNewSource(p => ({ ...p, source_name: v }))} />
            <Field label="Source URL" value={newSource.source_url} onChange={v => setNewSource(p => ({ ...p, source_url: v }))} />
            <div style={ui.field}>
              <label style={ui.label}>Source Type</label>
              <select style={ui.input} value={newSource.source_type} onChange={e => setNewSource(p => ({ ...p, source_type: e.target.value }))}>
                {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Notes" rows={3} value={newSource.notes} onChange={v => setNewSource(p => ({ ...p, notes: v }))} />
            <button style={{ ...ui.btn, ...ui.primary }} onClick={addSource}>+ Add Source</button>
          </div>
        </div>

        <div style={ui.section}>
          <h3 style={ui.sectionTitle}>H · Research Notes</h3>
          <Field label="Long-form research notes" rows={12} value={form.research_notes} onChange={v => set('research_notes', v)} />
        </div>

        <div style={ui.bar}>
          <button style={{ ...ui.btn, ...ui.primary, flex: 1, minWidth: 150 }} disabled={saving} onClick={() => save()}>{saving ? 'Saving...' : 'Save Research'}</button>
          <button style={{ ...ui.btn, flex: 1, minWidth: 150 }} disabled={saving} onClick={complete}>Mark Research Complete</button>
        </div>
      </div>
    </div>
  )
}
