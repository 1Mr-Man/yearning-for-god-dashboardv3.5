import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase as defaultSupabase } from '../utils/supabase'
import BookImport from './BookImport'

// YFG BOOK JOURNEY — Phase R6 (Book/Chapter foundation) + Phase R7
// (Chapter Analysis & Source-of-Truth Workspace, see ChapterDetail below).
// Reads and writes ONLY the R5 tables (yfg_books, yfg_book_chapters,
// yfg_chapter_sources, yfg_chapter_analysis, yfg_chapter_quotes,
// yfg_chapter_scripture, yfg_chapter_illustrations, yfg_chapter_references,
// yfg_book_chapter_production). Nothing here touches content_queue_main,
// yfg_publishing_packages, yfg_content_assets, or any Content Research table.
// No AI generation. No parsing libraries. No publishing wiring.

const fallback = {
  card: { background: '#0f172a', border: '1px solid #334155', borderRadius: 14, padding: 16, marginBottom: 12 },
  input: { width: '100%', boxSizing: 'border-box', padding: 10, minHeight: 44, borderRadius: 8, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', marginBottom: 8, fontFamily: 'inherit' },
  btn: { padding: '11px 14px', minHeight: 44, borderRadius: 10, fontWeight: 800, cursor: 'pointer', color: '#e5e7eb', background: '#1e293b', border: '1px solid #334155' },
  primary: { background: 'linear-gradient(135deg,#0B1023,#1d4ed8)', border: '1px solid rgba(212,175,55,0.6)', color: '#fff' },
  pill: { display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: 'rgba(148,163,184,0.15)', border: '1px solid #334155', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginRight: 6, marginBottom: 6 },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  section: { borderTop: '1px solid #334155', paddingTop: 12, marginTop: 12 },
}

const CHAPTER_STATUSES = [
  'imported', 'verified', 'structured', 'analyzing', 'analysis_ready',
  'scripture_researched', 'illustrations_researched', 'architecture_ready',
  'drafting', 'accuracy_review', 'theology_review', 'yfg_review', 'approved',
  'production', 'queued', 'published',
]

function Row({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>{children}</div>
}

// ---------- R7 state-machine subset: only these transitions are actionable here ----------
const R7_STATUS_SEQUENCE = [
  'imported', 'verified', 'structured', 'analyzing', 'analysis_ready',
  'scripture_researched', 'illustrations_researched', 'architecture_ready',
]

const ws = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 4300,
    background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    overflowY: 'auto', overflowX: 'hidden',
  },
  panel: {
    width: '100%', maxWidth: 900, minHeight: '100%', boxSizing: 'border-box',
    background: '#080b16', borderLeft: '1px solid rgba(51,65,85,0.7)', borderRight: '1px solid rgba(51,65,85,0.7)',
    padding: '18px 14px 140px', color: '#e2e8f0', overflowWrap: 'anywhere',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 2, margin: '-18px -14px 16px', padding: '14px',
    background: 'rgba(8,11,22,0.96)', borderBottom: '1px solid rgba(51,65,85,0.7)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
  },
  kicker: { color: '#D4AF37', fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 },
  title: { margin: '6px 0 8px', fontSize: 19, lineHeight: 1.25, fontWeight: 900, color: '#fff' },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999,
    background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.85)', color: '#cbd5e1',
    fontSize: 12, fontWeight: 800, marginRight: 6, marginBottom: 6,
  },
  section: { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.75)', borderRadius: 18, padding: 14, marginBottom: 14 },
  sectionTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', margin: '0 0 6px' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: 12, minHeight: 46, borderRadius: 12,
    fontSize: 15, color: '#f8fafc', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(51,65,85,0.9)',
    outline: 'none', fontFamily: 'inherit', marginBottom: 10,
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
  verified: { color: '#22c55e' },
  unverified: { color: '#f59e0b' },
}

// ---------- Chapter Detail: R7 Chapter Analysis & Source-of-Truth Workspace ----------
// Sections A-F below. Full-screen overlay, mirrors the existing
// ResearchWorkspace/ProductionWorkspace pattern (same ui shape, same
// dirty-tracking + beforeunload protection). No AI generation. No parsing
// libraries. No writes to content_queue_main, yfg_publishing_packages,
// yfg_content_assets, or any Content Research table. Reads/writes only the
// R5 Book Journey tables.
function ChapterDetail({ chapter, supabase, styles, onBack, onStatusChange }) {
  const [sources, setSources] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [scripture, setScripture] = useState([])
  const [illustrations, setIllustrations] = useState([])
  const [references, setReferences] = useState([])
  const [production, setProduction] = useState(null)
  const [status, setStatus] = useState(chapter.status)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  const touch = () => setDirty(true)

  // A. Chapter Source
  const [sourceForm, setSourceForm] = useState({ excerpt_text: '', location_label: '', location_confidence: 'unavailable' })
  // B. Chapter Understanding (+ F. YFG Exploration lives in the same analysis row, yfg_perspective field)
  const [analysisForm, setAnalysisForm] = useState({ central_idea: '', authors_argument: '', misconceptions_addressed: '', tensions_and_questions: '', yfg_perspective: '' })
  const [quoteForm, setQuoteForm] = useState({ quote_text: '', attribution: '', source_id: '' })
  // C. Scripture Connections
  const [scriptureForm, setScriptureForm] = useState({ scripture_ref: '', connection_note: '' })
  // D. Illustrations
  const [illustrationForm, setIllustrationForm] = useState({ illustration_text: '', illustration_type: 'from_book', attribution: '' })
  // E. Minister/Father/Reference Material
  const [referenceForm, setReferenceForm] = useState({ reference_type: 'minister', name: '', note: '' })

  async function loadAll() {
    setErr('')
    try {
      const [s, a, q, sc, il, rf, pr] = await Promise.all([
        supabase.from('yfg_chapter_sources').select('*').eq('chapter_id', chapter.id).order('created_at', { ascending: false }),
        supabase.from('yfg_chapter_analysis').select('*').eq('chapter_id', chapter.id).maybeSingle(),
        supabase.from('yfg_chapter_quotes').select('*').eq('chapter_id', chapter.id).order('created_at', { ascending: false }),
        supabase.from('yfg_chapter_scripture').select('*').eq('chapter_id', chapter.id).order('created_at', { ascending: false }),
        supabase.from('yfg_chapter_illustrations').select('*').eq('chapter_id', chapter.id).order('created_at', { ascending: false }),
        supabase.from('yfg_chapter_references').select('*').eq('chapter_id', chapter.id).order('created_at', { ascending: false }),
        supabase.from('yfg_book_chapter_production').select('*').eq('chapter_id', chapter.id).maybeSingle(),
      ])
      if (s.error) throw s.error
      if (q.error) throw q.error
      if (sc.error) throw sc.error
      if (il.error) throw il.error
      if (rf.error) throw rf.error
      setSources(s.data || [])
      setAnalysis(a.data || null)
      if (a.data) {
        setAnalysisForm({
          central_idea: a.data.central_idea || '',
          authors_argument: a.data.authors_argument || '',
          misconceptions_addressed: a.data.misconceptions_addressed || '',
          tensions_and_questions: a.data.tensions_and_questions || '',
          yfg_perspective: a.data.yfg_perspective || '',
        })
      }
      setQuotes(q.data || [])
      setScripture(sc.data || [])
      setIllustrations(il.data || [])
      setReferences(rf.data || [])
      setProduction(pr.data || null)
    } catch (e) {
      setErr('Chapter detail could not be loaded: ' + (e?.message || String(e)))
    }
  }
  useEffect(() => { loadAll() /* eslint-disable-next-line */ }, [chapter.id])

  useEffect(() => {
    const onBeforeUnload = e => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  function close() {
    if (dirty && !window.confirm('You have unsaved changes in this chapter. Close anyway?')) return
    onBack && onBack()
  }

  // ---------- resumable status progression (R7 subset only) ----------
  const currentIdx = R7_STATUS_SEQUENCE.indexOf(status)
  const nextStatus = currentIdx >= 0 && currentIdx < R7_STATUS_SEQUENCE.length - 1
    ? R7_STATUS_SEQUENCE[currentIdx + 1]
    : null

  async function advanceStatus() {
    if (!nextStatus) return
    setErr(''); setMsg('')
    const { data, error } = await supabase.from('yfg_book_chapters')
      .update({ status: nextStatus, status_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', chapter.id).select().single()
    if (error) { setErr('Status could not be updated: ' + error.message); return }
    setStatus(data.status)
    setMsg(`Advanced to "${data.status}". This is saved immediately — it does not depend on the other unsaved fields below.`)
    onStatusChange && onStatusChange(data)
  }

  // ---------- A. Chapter Source ----------
  async function addSource() {
    setErr('')
    if (!sourceForm.excerpt_text.trim()) { setErr('Enter the excerpt text first.'); return }
    const { error } = await supabase.from('yfg_chapter_sources').insert({ chapter_id: chapter.id, ...sourceForm })
    if (error) { setErr('Source could not be saved: ' + error.message); return }
    setSourceForm({ excerpt_text: '', location_label: '', location_confidence: 'unavailable' })
    setMsg('Source added.'); loadAll()
  }
  async function removeSource(id) {
    if (!window.confirm('Remove this source? Any quotes linked to it will keep their text but lose the source link.')) return
    const { error } = await supabase.from('yfg_chapter_sources').delete().eq('id', id)
    if (error) { setErr('Source could not be removed: ' + error.message); return }
    loadAll()
  }

  // ---------- B. Chapter Understanding + F. YFG Exploration (same yfg_chapter_analysis row) ----------
  async function saveAnalysis() {
    setErr('')
    const body = { chapter_id: chapter.id, ...analysisForm, updated_at: new Date().toISOString() }
    const { error } = analysis?.id
      ? await supabase.from('yfg_chapter_analysis').update(body).eq('id', analysis.id)
      : await supabase.from('yfg_chapter_analysis').insert(body)
    if (error) { setErr('Analysis could not be saved: ' + error.message); return }
    setDirty(false)
    setMsg('Analysis saved. Applications, prayer, and teaching points are captured later in Chapter Production (a later phase) — this section is the intellectual foundation, not the final script.')
    loadAll()
  }
  async function confirmAnalysis() {
    if (!analysis?.id) { setErr('Save the analysis before confirming it.'); return }
    const { error } = await supabase.from('yfg_chapter_analysis').update({ confirmed_at: new Date().toISOString() }).eq('id', analysis.id)
    if (error) { setErr('Analysis could not be confirmed: ' + error.message); return }
    setMsg('Analysis confirmed.'); loadAll()
  }

  async function addQuote() {
    setErr('')
    if (!quoteForm.quote_text.trim()) { setErr('Enter the quote text first.'); return }
    const body = { chapter_id: chapter.id, quote_text: quoteForm.quote_text, attribution: quoteForm.attribution, source_id: quoteForm.source_id || null }
    const { error } = await supabase.from('yfg_chapter_quotes').insert(body)
    if (error) { setErr('Quote could not be saved: ' + error.message); return }
    setQuoteForm({ quote_text: '', attribution: '', source_id: '' })
    setMsg('Quote added. It is NOT in the Quote Library yet — promote it manually from the Quotes Planner only after verifying it against its source.')
    loadAll()
  }

  // ---------- C. Scripture Connections ----------
  async function addScripture() {
    setErr('')
    if (!scriptureForm.scripture_ref.trim()) { setErr('Enter a scripture reference first.'); return }
    const { error } = await supabase.from('yfg_chapter_scripture').insert({ chapter_id: chapter.id, ...scriptureForm })
    if (error) { setErr('Scripture connection could not be saved: ' + error.message); return }
    setScriptureForm({ scripture_ref: '', connection_note: '' })
    setMsg('Scripture connection added.'); loadAll()
  }

  // ---------- D. Illustrations ----------
  async function addIllustration() {
    setErr('')
    if (!illustrationForm.illustration_text.trim()) { setErr('Enter the illustration text first.'); return }
    const sourceType = illustrationForm.illustration_type === 'from_book' ? 'AUTHOR_SAYS' : 'YFG_EXPLORES'
    const { error } = await supabase.from('yfg_chapter_illustrations').insert({ chapter_id: chapter.id, ...illustrationForm, source_type: sourceType })
    if (error) { setErr('Illustration could not be saved: ' + error.message); return }
    setIllustrationForm({ illustration_text: '', illustration_type: 'from_book', attribution: '' })
    setMsg('Illustration added.'); loadAll()
  }

  // ---------- E. Minister/Father/Reference Material ----------
  async function addReference() {
    setErr('')
    if (!referenceForm.name.trim()) { setErr('Enter a name first.'); return }
    const { error } = await supabase.from('yfg_chapter_references').insert({ chapter_id: chapter.id, ...referenceForm })
    if (error) { setErr('Reference could not be saved: ' + error.message); return }
    setReferenceForm({ reference_type: 'minister', name: '', note: '' })
    setMsg('Reference added.'); loadAll()
  }

  const readyForProduction = status === 'architecture_ready'

  return (
    <div style={ws.overlay} role="dialog" aria-modal="true">
      <div style={ws.panel}>
        <div style={ws.header}>
          <div style={{ minWidth: 0 }}>
            <p style={ws.kicker}>Chapter Analysis &amp; Source-of-Truth Workspace</p>
            <h2 style={ws.title}>{chapter.title || `Chapter ${chapter.chapter_number}`}</h2>
            <div style={ws.metaRow}>
              <span style={ws.pill}>Chapter {chapter.chapter_number}</span>
              <span style={ws.pill}>Status: {status}</span>
              {readyForProduction && <span style={{ ...ws.pill, color: '#22c55e', borderColor: '#14532d' }}>Ready for Production</span>}
            </div>
          </div>
          <button style={{ ...ws.btn, minHeight: 40, padding: '8px 12px' }} onClick={close}>Close</button>
        </div>

        {err && <div style={{ ...ws.banner, color: '#fecaca', border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.18)' }}>{err}</div>}
        {msg && <div style={{ ...ws.banner, color: '#bbf7d0', border: '1px solid #14532d', background: 'rgba(20,83,45,0.18)' }}>{msg}</div>}
        <div style={{ ...ws.banner, color: '#cbd5e1', border: '1px solid rgba(51,65,85,0.9)', background: 'rgba(15,23,42,0.7)' }}>
          This workspace is resumable — every section saves independently, so you can leave and come back to any stage without losing progress. Nothing here touches the publishing queue.
        </div>

        {/* A. Chapter Source */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>A. Chapter Source</h3>
          {sources.map(s => (
            <div key={s.id} style={{ ...ws.pill, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <span style={s.location_confidence === 'exact' ? ws.verified : ws.unverified}>
                [{s.location_confidence}]{s.location_label ? ` ${s.location_label}` : ''} — {s.excerpt_text.slice(0, 140)}
              </span>
              <button style={{ ...ws.btn, minHeight: 32, padding: '4px 10px', fontSize: 12 }} onClick={() => removeSource(s.id)}>Remove</button>
            </div>
          ))}
          <label style={ws.label}>Verbatim excerpt (source/reference)</label>
          <textarea style={{ ...ws.input, minHeight: 80 }} placeholder="Exact text from the book — never paraphrased here" value={sourceForm.excerpt_text} onChange={e => { setSourceForm(p => ({ ...p, excerpt_text: e.target.value })); touch() }} />
          <label style={ws.label}>Page / location / reference</label>
          <input style={ws.input} placeholder="e.g. p. 42, Section 3, 12:30" value={sourceForm.location_label} onChange={e => { setSourceForm(p => ({ ...p, location_label: e.target.value })); touch() }} />
          <label style={ws.label}>Source verification state</label>
          <select style={ws.input} value={sourceForm.location_confidence} onChange={e => { setSourceForm(p => ({ ...p, location_confidence: e.target.value })); touch() }}>
            <option value="exact">exact</option>
            <option value="approximate">approximate</option>
            <option value="unavailable">unavailable</option>
          </select>
          <button style={ws.btn} onClick={addSource}>Add Source</button>
        </section>

        {/* B. Chapter Understanding */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>B. Chapter Understanding {analysis?.confirmed_at ? <span style={ws.verified}>(confirmed)</span> : <span style={ws.unverified}>(unconfirmed)</span>}</h3>
          <label style={ws.label}>Central Idea</label>
          <textarea style={{ ...ws.input, minHeight: 60 }} value={analysisForm.central_idea} onChange={e => { setAnalysisForm(p => ({ ...p, central_idea: e.target.value })); touch() }} />
          <label style={ws.label}>Author's Argument (supporting concepts / key quotations belong here narratively; use the Quotes field below for exact wording)</label>
          <textarea style={{ ...ws.input, minHeight: 60 }} value={analysisForm.authors_argument} onChange={e => { setAnalysisForm(p => ({ ...p, authors_argument: e.target.value })); touch() }} />
          <label style={ws.label}>Misconceptions Addressed</label>
          <textarea style={{ ...ws.input, minHeight: 50 }} value={analysisForm.misconceptions_addressed} onChange={e => { setAnalysisForm(p => ({ ...p, misconceptions_addressed: e.target.value })); touch() }} />
          <label style={ws.label}>Tensions &amp; Questions</label>
          <textarea style={{ ...ws.input, minHeight: 50 }} value={analysisForm.tensions_and_questions} onChange={e => { setAnalysisForm(p => ({ ...p, tensions_and_questions: e.target.value })); touch() }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={ws.btn} onClick={saveAnalysis}>Save Analysis</button>
            <button style={{ ...ws.btn, ...ws.gold }} disabled={!analysis?.id} onClick={confirmAnalysis}>Confirm Analysis</button>
          </div>

          <div style={{ marginTop: 14, borderTop: '1px solid rgba(51,65,85,0.6)', paddingTop: 12 }}>
            <strong style={{ color: '#D4AF37', fontSize: 13 }}>Key Quotations ({quotes.length})</strong>
            {quotes.map(q => (
              <div key={q.id} style={{ ...ws.pill, display: 'block', width: '100%' }}>
                <span style={q.source_id ? ws.verified : ws.unverified}>{q.source_id ? '✓ linked to source' : '✗ no source link'}</span> — "{q.quote_text.slice(0, 100)}" — {q.attribution || 'unattributed'}
              </div>
            ))}
            <textarea style={{ ...ws.input, minHeight: 50 }} placeholder="Quote text" value={quoteForm.quote_text} onChange={e => setQuoteForm(p => ({ ...p, quote_text: e.target.value }))} />
            <input style={ws.input} placeholder="Attribution" value={quoteForm.attribution} onChange={e => setQuoteForm(p => ({ ...p, attribution: e.target.value }))} />
            <label style={ws.label}>Link to source (required for traceability)</label>
            <select style={ws.input} value={quoteForm.source_id} onChange={e => setQuoteForm(p => ({ ...p, source_id: e.target.value }))}>
              <option value="">(no linked source — not recommended)</option>
              {sources.map(s => <option key={s.id} value={s.id}>{s.excerpt_text.slice(0, 50)}...</option>)}
            </select>
            <button style={ws.btn} onClick={addQuote}>Add Quote</button>
          </div>
        </section>

        {/* C. Scripture Connections */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>C. Scripture Connections ({scripture.length})</h3>
          {scripture.map(s => <div key={s.id} style={{ ...ws.pill, display: 'block', width: '100%' }}>{s.scripture_ref} — {s.connection_note?.slice(0, 100)}</div>)}
          <label style={ws.label}>Scripture reference</label>
          <input style={ws.input} placeholder="e.g. Psalm 42:1" value={scriptureForm.scripture_ref} onChange={e => setScriptureForm(p => ({ ...p, scripture_ref: e.target.value }))} />
          <label style={ws.label}>Connection to the author's idea</label>
          <textarea style={{ ...ws.input, minHeight: 60 }} value={scriptureForm.connection_note} onChange={e => setScriptureForm(p => ({ ...p, connection_note: e.target.value }))} />
          <button style={ws.btn} onClick={addScripture}>Add Scripture Connection</button>
        </section>

        {/* D. Illustrations */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>D. Illustrations ({illustrations.length})</h3>
          {illustrations.map(i => <div key={i.id} style={{ ...ws.pill, display: 'block', width: '100%' }}>[{i.illustration_type}] {i.illustration_text.slice(0, 100)} {i.attribution ? `— ${i.attribution}` : ''}</div>)}
          <label style={ws.label}>Illustration / story</label>
          <textarea style={{ ...ws.input, minHeight: 60 }} value={illustrationForm.illustration_text} onChange={e => setIllustrationForm(p => ({ ...p, illustration_text: e.target.value }))} />
          <label style={ws.label}>Type</label>
          <select style={ws.input} value={illustrationForm.illustration_type} onChange={e => setIllustrationForm(p => ({ ...p, illustration_type: e.target.value }))}>
            <option value="from_book">from_book</option>
            <option value="real_testimony">real_testimony</option>
            <option value="hypothetical">hypothetical</option>
            <option value="historical">historical</option>
          </select>
          <label style={ws.label}>Attribution / source</label>
          <input style={ws.input} value={illustrationForm.attribution} onChange={e => setIllustrationForm(p => ({ ...p, attribution: e.target.value }))} />
          <button style={ws.btn} onClick={addIllustration}>Add Illustration</button>
        </section>

        {/* E. Minister/Father/Reference Material */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>E. Minister / Father / Reference Material ({references.length})</h3>
          {references.map(r => <div key={r.id} style={{ ...ws.pill, display: 'block', width: '100%' }}>[{r.reference_type}] {r.name}{r.note ? ` — ${r.note}` : ''}</div>)}
          <label style={ws.label}>Person</label>
          <select style={ws.input} value={referenceForm.reference_type} onChange={e => setReferenceForm(p => ({ ...p, reference_type: e.target.value }))}>
            <option value="minister">minister</option>
            <option value="church_father">church_father</option>
            <option value="patriarch">patriarch</option>
            <option value="other">other</option>
          </select>
          <input style={ws.input} placeholder="Name" value={referenceForm.name} onChange={e => setReferenceForm(p => ({ ...p, name: e.target.value }))} />
          <label style={ws.label}>Relationship to the chapter / notes</label>
          <textarea style={{ ...ws.input, minHeight: 50 }} value={referenceForm.note} onChange={e => setReferenceForm(p => ({ ...p, note: e.target.value }))} />
          <button style={ws.btn} onClick={addReference}>Add Reference</button>
        </section>

        {/* F. YFG Exploration */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>F. YFG Exploration</h3>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
            Explicitly separated from the author's own words (Section B) — this is YFG's own commentary, questions, and spiritual implications. Applications, prayer, and teaching-point structuring happen later in Chapter Production, not here.
          </div>
          <label style={ws.label}>What this means for YFG / deeper spiritual implications / questions / teaching opportunities</label>
          <textarea style={{ ...ws.input, minHeight: 90 }} value={analysisForm.yfg_perspective} onChange={e => { setAnalysisForm(p => ({ ...p, yfg_perspective: e.target.value })); touch() }} />
          <button style={ws.btn} onClick={saveAnalysis}>Save Analysis (includes this section)</button>
        </section>

        {/* Status progression */}
        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>Chapter Journey Progress</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {R7_STATUS_SEQUENCE.map((s, i) => (
              <span key={s} style={{ ...ws.pill, ...(i <= currentIdx ? { color: '#22c55e', borderColor: '#14532d' } : {}) }}>{i <= currentIdx ? '✓ ' : ''}{s}</span>
            ))}
          </div>
          {nextStatus
            ? <button style={{ ...ws.btn, ...ws.gold }} onClick={advanceStatus}>Advance to "{nextStatus}"</button>
            : <div style={{ color: '#22c55e', fontSize: 13 }}>This chapter has reached the end of the R7 workflow (architecture_ready). Production is a later phase.</div>}
        </section>

        <section style={ws.section}>
          <h3 style={ws.sectionTitle}>Chapter Production</h3>
          {production
            ? <div style={{ ...ws.pill, display: 'block' }}>Production record exists — status: {production.status}</div>
            : <div style={{ color: '#94a3b8', fontSize: 13 }}>No production record yet. Creating one is a later phase (R8) — this workspace only builds the source-grounded foundation it will draw from.</div>}
        </section>

        <div style={ws.bar}>
          <button style={{ ...ws.btn, ...ws.primary, flex: '1 1 100%' }} onClick={close}>Back to Chapter List</button>
        </div>
      </div>
    </div>
  )
}


// ---------- Chapter List for a Book ----------
function ChapterList({ book, supabase, styles, onOpenChapter, onBack }) {
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ chapter_number: '', title: '', theme: '' })

  async function load() {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('yfg_book_chapters').select('*').eq('book_id', book.id).order('chapter_number', { ascending: true })
    if (error) { setErr('Chapters could not be loaded: ' + error.message); setLoading(false); return }
    setChapters(data || []); setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [book.id])

  async function addChapter() {
    setErr(''); setMsg('')
    const num = Number(form.chapter_number)
    if (!num || num < 1) { setErr('Enter a valid chapter number.'); return }
    const { error } = await supabase.from('yfg_book_chapters').insert({
      book_id: book.id, chapter_number: num, title: form.title || null, theme: form.theme || null,
    })
    if (error) {
      setErr(String(error.code) === '23505'
        ? `Chapter ${num} already exists for this book. Duplicate not created.`
        : 'Chapter could not be saved: ' + error.message)
      return
    }
    setForm({ chapter_number: '', title: '', theme: '' })
    setMsg('Chapter added.'); load()
  }

  const st = styles.card || fallback.card
  const input = fallback.input
  const btn = fallback.btn

  return (
    <div style={st}>
      <button style={btn} onClick={onBack}>&larr; Back to books</button>
      <h3 style={{ margin: '10px 0 4px', color: '#fff' }}>{book.title}</h3>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{book.author || 'Unknown author'} · {chapters.length} chapter(s)</div>

      {err && <div style={{ color: '#fecaca', marginBottom: 8 }}>{err}</div>}
      {msg && <div style={{ color: '#bbf7d0', marginBottom: 8 }}>{msg}</div>}

      {loading ? <div style={{ color: '#94a3b8' }}>Loading…</div> : chapters.map(c => (
        <div key={c.id} style={{ ...fallback.pill, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', cursor: 'pointer' }} onClick={() => onOpenChapter(c)}>
          <span>Ch. {c.chapter_number}: {c.title || '(untitled)'}</span>
          <span style={{ fontSize: 11, opacity: 0.8 }}>{c.status}</span>
        </div>
      ))}

      <div style={fallback.section}>
        <strong style={{ color: '#D4AF37' }}>Add Chapter</strong>
        <Row>
          <input style={{ ...input, flex: '0 1 120px' }} type="number" placeholder="Chapter #" value={form.chapter_number} onChange={e => setForm(p => ({ ...p, chapter_number: e.target.value }))} />
          <input style={{ ...input, flex: '1 1 200px' }} placeholder="Chapter title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </Row>
        <input style={input} placeholder="Theme (optional)" value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))} />
        <button style={{ ...btn, ...fallback.primary }} onClick={addChapter}>Add Chapter</button>
      </div>
    </div>
  )
}

// ---------- Book Library (top level) ----------
export default function BookLibrary({ ctx = {} }) {
  const supabase = ctx.supabase || defaultSupabase
  const styles = ctx.styles || {}

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', author: '', source_format: 'manual_notes' })
  const [openBook, setOpenBook] = useState(null)
  const [openChapter, setOpenChapter] = useState(null)
  const [openImport, setOpenImport] = useState(false)

  async function load() {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('yfg_books').select('*').order('created_at', { ascending: false })
    if (error) { setErr('Books could not be loaded: ' + error.message); setLoading(false); return }
    setBooks(data || []); setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  async function addBook() {
    setErr(''); setMsg('')
    if (!form.title.trim()) { setErr('Give the book a title first.'); return }
    const { error } = await supabase.from('yfg_books').insert({ title: form.title.trim(), author: form.author || null, source_format: form.source_format })
    if (error) { setErr('Book could not be saved: ' + error.message); return }
    setForm({ title: '', author: '', source_format: 'manual_notes' })
    setMsg('Book added.'); load()
  }

  const st = styles.card || fallback.card
  const input = fallback.input
  const btn = fallback.btn

  if (openImport) {
    return <BookImport
      supabase={supabase}
      onClose={() => setOpenImport(false)}
      onImported={book => { setOpenImport(false); load(); setOpenBook(book) }}
    />
  }

  if (openChapter) {
    return <ChapterDetail
      chapter={openChapter}
      supabase={supabase}
      styles={styles}
      onBack={() => setOpenChapter(null)}
      onStatusChange={updated => setOpenChapter(updated)}
    />
  }

  if (openBook) {
    return <ChapterList
      book={openBook}
      supabase={supabase}
      styles={styles}
      onOpenChapter={setOpenChapter}
      onBack={() => setOpenBook(null)}
    />
  }

  return (
    <div>
      <div style={{ ...st, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 6px', color: '#fff' }}>Book Journey — Book Library</h2>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          Foundation layer (Phase R6). Manual entry only — automated PDF/DOCX/EPUB import is not yet
          available and requires a new dependency to be approved separately. This never writes to the
          existing production queue or publishing system.
        </div>
      </div>

      {err && <div style={{ ...st, color: '#fecaca' }}>{err}</div>}
      {msg && <div style={{ ...st, color: '#bbf7d0' }}>{msg}</div>}

      <div style={st}>
        <strong style={{ color: '#D4AF37' }}>Import Book (R9.1 — .txt only)</strong>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 10px' }}>
          Upload a plain-text book. Chapter structure is detected and shown for your review before anything is saved —
          the original text is preserved as-is. PDF, EPUB, and DOCX are not supported yet.
        </p>
        <button style={{ ...btn, ...fallback.primary }} onClick={() => setOpenImport(true)}>Import .txt Book</button>
      </div>

      <div style={st}>
        <strong style={{ color: '#D4AF37' }}>Add Book</strong>
        <Row>
          <input style={{ ...input, flex: '1 1 200px' }} placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <input style={{ ...input, flex: '1 1 160px' }} placeholder="Author" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} />
        </Row>
        <select style={input} value={form.source_format} onChange={e => setForm(p => ({ ...p, source_format: e.target.value }))}>
          <option value="manual_notes">manual_notes</option>
          <option value="text">text</option>
          <option value="pdf">pdf (source only — no automated parsing yet)</option>
          <option value="epub">epub (source only — no automated parsing yet)</option>
          <option value="audio_transcript">audio_transcript</option>
        </select>
        <button style={{ ...btn, ...fallback.primary }} onClick={addBook}>Add Book</button>
      </div>

      <div style={st}>
        <strong style={{ color: '#D4AF37' }}>Books ({books.length})</strong>
        {loading ? <div style={{ color: '#94a3b8', marginTop: 8 }}>Loading…</div> : books.map(b => (
          <div key={b.id} style={{ ...fallback.pill, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginTop: 8, cursor: 'pointer' }} onClick={() => setOpenBook(b)}>
            <span>{b.title} {b.author ? `— ${b.author}` : ''}</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{b.status}</span>
          </div>
        ))}
        {!loading && books.length === 0 && <div style={{ color: '#94a3b8', marginTop: 8 }}>No books yet.</div>}
      </div>
    </div>
  )
}
