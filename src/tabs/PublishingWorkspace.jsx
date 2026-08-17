import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ASSET_STATUSES, ASSET_TYPES, ASSET_ROLES, PLATFORMS, ORIGIN_LABELS,
  computeReadiness, packageFromProduction, assetSatisfies,
} from '../lib/yfgAssets'

// YFG PUBLISHING WORKSPACE — Phase 2D
// Bridges an APPROVED production package to the EXISTING content_queue_main.
// It never publishes and never schedules. It only prepares.

const ui = {
  overlay: { position: 'fixed', inset: 0, zIndex: 4200, background: 'rgba(2,6,23,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', overflowX: 'hidden' },
  panel: { width: '100%', maxWidth: 900, minHeight: '100%', boxSizing: 'border-box', background: '#080b16', padding: '18px 14px 200px', color: '#e2e8f0', overflowWrap: 'anywhere' },
  header: { position: 'sticky', top: 0, zIndex: 2, margin: '-18px -14px 16px', padding: 14, background: 'rgba(8,11,22,0.96)', borderBottom: '1px solid rgba(51,65,85,0.7)', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  kicker: { color: '#D4AF37', fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 },
  title: { margin: '6px 0 8px', fontSize: 19, lineHeight: 1.25, fontWeight: 900, color: '#fff' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.85)', color: '#cbd5e1', fontSize: 12, fontWeight: 800, marginRight: 6, marginBottom: 6 },
  section: { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.75)', borderRadius: 18, padding: 14, marginBottom: 14 },
  sub: { background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 14, padding: 12, marginBottom: 12 },
  sectionTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', margin: '0 0 6px' },
  field: { marginBottom: 12 },
  input: { width: '100%', boxSizing: 'border-box', padding: 12, minHeight: 46, borderRadius: 12, fontSize: 15, color: '#f8fafc', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(51,65,85,0.9)', outline: 'none', fontFamily: 'inherit' },
  btn: { padding: '13px 16px', minHeight: 48, borderRadius: 14, fontWeight: 850, fontSize: 15, cursor: 'pointer', color: '#f8fafc', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.9)' },
  primary: { background: 'linear-gradient(135deg,#0B1023,#1d4ed8)', border: '1px solid rgba(212,175,55,0.6)', color: '#fff' },
  gold: { background: 'linear-gradient(135deg,#D4AF37,#b8860b)', border: '1px solid rgba(212,175,55,0.8)', color: '#0B1023' },
  bar: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 3, maxHeight: '46vh', overflowY: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12, boxSizing: 'border-box', background: 'rgba(8,11,22,0.97)', borderTop: '1px solid rgba(51,65,85,0.8)' },
  banner: { borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontSize: 14, fontWeight: 700, lineHeight: 1.5 },
}

function Field({ label, value, onChange, rows }) {
  return (
    <div style={ui.field}>
      <label style={ui.label}>{label}</label>
      {rows
        ? <textarea style={{ ...ui.input, minHeight: rows * 26, resize: 'vertical' }} value={value ?? ''} onChange={e => onChange(e.target.value)} />
        : <input style={ui.input} value={value ?? ''} onChange={e => onChange(e.target.value)} />}
    </div>
  )
}

const META_COLS = [
  'main_title', 'alternative_titles', 'description', 'script', 'caption',
  'hashtags', 'captions_subtitles', 'chapters', 'keywords', 'review_notes',
]

const emptyAsset = { asset_type: 'video', asset_role: 'long_form', asset_name: '', asset_url: '', platform: '', status: 'planned', notes: '' }

export default function PublishingWorkspace({
  idea, production, pkg: initialPkg, supabase,
  originType = 'research', originId,
  onClose, onSaved, onQueued,
}) {
  const contentOriginType = originType
  const contentOriginId = originId || idea?.id || null

  const [row, setRow] = useState(initialPkg || null)
  const [form, setForm] = useState(() => {
    const base = {}
    META_COLS.forEach(k => { base[k] = '' })
    if (initialPkg) { META_COLS.forEach(k => { base[k] = initialPkg[k] || '' }); return base }
    const mapped = packageFromProduction(production, idea)
    META_COLS.forEach(k => { if (mapped[k] != null) base[k] = mapped[k] })
    return base
  })
  const [targets, setTargets] = useState(() =>
    Array.isArray(initialPkg?.platform_targets) && initialPkg.platform_targets.length
      ? initialPkg.platform_targets : ['youtube', 'facebook', 'instagram'])
  const [platformMeta, setPlatformMeta] = useState(() =>
    (initialPkg?.platform_metadata && typeof initialPkg.platform_metadata === 'object')
      ? initialPkg.platform_metadata
      : packageFromProduction(production, idea).platform_metadata)
  const [humanReviewed, setHumanReviewed] = useState(!!initialPkg?.human_reviewed)
  const [status, setStatus] = useState(initialPkg?.status || 'draft')
  const [assets, setAssets] = useState([])
  const [assetForm, setAssetForm] = useState(emptyAsset)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [dirty, setDirty] = useState(false)
  const mounted = useRef(false)

  const touch = () => setDirty(true)
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); touch() }

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  useEffect(() => {
    const h = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  async function loadAssets() {
    try {
      const { data, error } = await supabase.from('yfg_content_assets').select('*')
        .eq('content_origin_type', contentOriginType).eq('content_origin_id', contentOriginId)
        .order('created_at', { ascending: false })
      if (error) { setErr('Assets could not be loaded: ' + error.message); return }
      setAssets(data || [])
    } catch (e) { setErr('Assets could not be loaded: ' + (e?.message || String(e))) }
  }
  useEffect(() => { loadAssets() }, [contentOriginId])

  const pkgForCheck = useMemo(() => ({ ...form, platform_targets: targets }), [form, targets])
  const readiness = useMemo(() => computeReadiness(pkgForCheck, assets), [pkgForCheck, assets])

  const checklist = useMemo(() => ([
    { label: 'Production approved', ok: production?.status === 'approved' || production?.status === 'queued' || production?.status === 'completed' },
    { label: 'Content origin exists', ok: !!contentOriginId },
    { label: 'Required assets present', ok: readiness.ready },
    { label: 'Required metadata present', ok: !!(form.main_title || '').trim() && !!(form.description || '').trim() },
    { label: 'Human reviewed', ok: humanReviewed },
    { label: 'No duplicate package', ok: true },
    { label: 'No duplicate queue item', ok: !row?.queued_at },
  ]), [production, contentOriginId, readiness.ready, form, humanReviewed, row])

  function payload(nextStatus) {
    const now = new Date().toISOString()
    const body = {
      content_origin_type: contentOriginType,
      content_origin_id: contentOriginId,
      production_id: production?.id || null,
      platform_targets: targets,
      platform_metadata: platformMeta,
      required_assets: readiness.rows.map(r => ({
        platform: r.platform.key,
        missing: r.missing.map(m => m.label),
      })),
      readiness_score: readiness.score,
      human_reviewed: humanReviewed,
      reviewed_at: humanReviewed ? (row?.reviewed_at || now) : null,
      ai_generated: false,
      status: nextStatus || (readiness.ready ? (status === 'queued' ? 'queued' : 'ready') : 'needs_assets'),
      updated_at: now,
    }
    META_COLS.forEach(k => { body[k] = form[k] || null })
    return body
  }

  async function persist(nextStatus, okMsg) {
    setSaving(true); setMsg(''); setErr('')
    try {
      const body = payload(nextStatus)
      let res
      if (row?.id) res = await supabase.from('yfg_publishing_packages').update(body).eq('id', row.id).select().single()
      else res = await supabase.from('yfg_publishing_packages').insert(body).select().single()
      if (res.error) {
        if (String(res.error.code) === '23505') {
          const { data } = await supabase.from('yfg_publishing_packages').select('*').eq('production_id', production?.id).maybeSingle()
          if (data) { setRow(data); setStatus(data.status); setErr('A publishing package already exists for this production item — the existing package was loaded.'); return data }
        }
        setErr('Publishing package could not be saved: ' + res.error.message)
        return null
      }
      setRow(res.data); setStatus(res.data.status); setDirty(false)
      setMsg(okMsg || 'Publishing package saved.')
      onSaved && onSaved(res.data)
      return res.data
    } catch (e) {
      setErr('Publishing package could not be saved: ' + (e?.message || String(e)))
      return null
    } finally { if (mounted.current) setSaving(false) }
  }

  // ---------- assets ----------
  async function addAsset() {
    setMsg(''); setErr('')
    if (!assetForm.asset_name.trim()) { setErr('Give the asset a name first.'); return }
    const dup = assets.some(a => a.asset_type === assetForm.asset_type
      && a.asset_name.trim().toLowerCase() === assetForm.asset_name.trim().toLowerCase())
    if (dup) { setErr('An asset with this name and type already exists for this content. Duplicate not created.'); return }
    try {
      const { data, error } = await supabase.from('yfg_content_assets').insert({
        ...assetForm,
        asset_name: assetForm.asset_name.trim(),
        content_origin_type: contentOriginType,
        content_origin_id: contentOriginId,
        production_id: production?.id || null,
        package_id: row?.id || null,
      }).select().single()
      if (error) {
        setErr(String(error.code) === '23505'
          ? 'An asset with this name and type already exists for this content. Duplicate not created.'
          : 'Asset could not be saved: ' + error.message)
        return
      }
      setAssets(p => [data, ...p]); setAssetForm(emptyAsset); setMsg('Asset added.')
    } catch (e) { setErr('Asset could not be saved: ' + (e?.message || String(e))) }
  }

  async function updateAsset(id, patch) {
    setMsg(''); setErr('')
    try {
      const { data, error } = await supabase.from('yfg_content_assets')
        .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single()
      if (error) { setErr('Asset could not be updated: ' + error.message); return }
      setAssets(p => p.map(a => (a.id === id ? data : a)))
    } catch (e) { setErr('Asset could not be updated: ' + (e?.message || String(e))) }
  }

  async function attachAsset(a) {
    const current = row?.id ? row : await persist(undefined, 'Publishing package saved.')
    if (!current) return
    await updateAsset(a.id, { package_id: current.id, production_id: production?.id || null, status: 'attached' })
    setMsg('Asset attached to this publishing package.')
  }

  async function removeAsset(id) {
    if (!window.confirm('Delete this asset record?')) return
    const { error } = await supabase.from('yfg_content_assets').delete().eq('id', id)
    if (error) { setErr('Asset could not be deleted: ' + error.message); return }
    setAssets(p => p.filter(a => a.id !== id))
  }

  // ---------- queue (existing content_queue_main only) ----------
  async function sendToQueue() {
    setMsg(''); setErr('')
    if (production?.status !== 'approved' && production?.status !== 'queued' && production?.status !== 'completed') {
      setErr('The production package must be approved before a publishing package can be queued.'); return
    }
    if (!readiness.ready) { setErr(`Cannot queue yet — ${readiness.missingCount} required item(s) still missing.`); return }
    if (!humanReviewed) { setErr('Mark the package as human reviewed before queueing.'); return }
    const current = await persist('ready', 'Publishing package saved.')
    if (!current) return
    setSaving(true)
    try {
      const rows = readiness.rows.filter(r => r.ready).map(r => ({
        minister_name: 'Yearning for God',
        ministry_name: 'YFG Publishing Package',
        content_type: r.platform.contentType,
        platform: r.platform.queuePlatform,
        title: form.main_title,
        content_text: platformText(r.platform.key),
        campaign_stage: 'YFG Publishing Package',
        status: 'draft',
        scheduled_at: null,
        yfg_package_id: current.id,
      }))
      if (!rows.length) { setErr('No platform is ready to queue yet.'); return }
      const { data, error } = await supabase.from('content_queue_main').insert(rows).select()
      if (error) {
        setErr(String(error.code) === '23505'
          ? 'This publishing package is already in the queue. Duplicate queue items were prevented.'
          : 'Queue item could not be created: ' + error.message)
        return
      }
      const { data: up } = await supabase.from('yfg_publishing_packages')
        .update({ status: 'queued', queued_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', current.id).select().single()
      if (up) { setRow(up); setStatus(up.status); onSaved && onSaved(up) }
      setMsg(`${data.length} queue item(s) created as unscheduled drafts. Nothing was published or scheduled.`)
      onQueued && onQueued()
    } catch (e) {
      setErr('Queue item could not be created: ' + (e?.message || String(e)))
    } finally { if (mounted.current) setSaving(false) }
  }

  function platformText(key) {
    const pm = platformMeta?.[key] || {}
    if (key === 'youtube') return [form.main_title, form.description, form.keywords && `Tags: ${form.keywords}`, form.script && `\nSCRIPT\n${form.script}`].filter(Boolean).join('\n\n')
    return [pm.caption || form.caption, pm.hashtags || form.hashtags].filter(Boolean).join('\n\n')
  }

  const packageText = () => `YFG PUBLISHING PACKAGE

Origin: ${ORIGIN_LABELS[contentOriginType] || contentOriginType} (${contentOriginId || 'n/a'})
Production: ${production?.id || 'n/a'} (${production?.status || 'n/a'})
Package status: ${status} | Readiness: ${readiness.score}%

Main title: ${form.main_title || ''}
Alternative titles: ${form.alternative_titles || ''}

Description:
${form.description || ''}

Script:
${form.script || ''}

Caption:
${form.caption || ''}

Hashtags:
${form.hashtags || ''}

Captions / subtitles: ${form.captions_subtitles || ''}
Chapters: ${form.chapters || ''}
Keywords: ${form.keywords || ''}

ASSETS
${assets.length ? assets.map(a => `- [${a.status}] ${a.asset_type}: ${a.asset_name}${a.asset_url ? ` — ${a.asset_url}` : ''}`).join('\n') : '(no assets yet)'}

PLATFORM READINESS
${readiness.rows.map(r => `${r.platform.label}: ${r.ready ? 'Ready' : `Missing ${r.missing.map(m => m.label).join(', ')}`}`).join('\n')}
`

  async function copy(text) {
    setMsg(''); setErr('')
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); setMsg('Copied to clipboard.'); return }
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'
      document.body.appendChild(ta); ta.select()
      const ok = document.execCommand('copy'); document.body.removeChild(ta)
      ok ? setMsg('Copied to clipboard.') : setErr('Copy failed — select and copy manually.')
    } catch { setErr('Copy failed — select and copy manually.') }
  }

  function close() {
    if (dirty && !window.confirm('You have unsaved publishing changes. Close anyway?')) return
    onClose && onClose()
  }

  function toggleTarget(k) {
    setTargets(p => (p.includes(k) ? p.filter(x => x !== k) : [...p, k])); touch()
  }

  return (
    <div style={ui.overlay} role="dialog" aria-modal="true">
      <div style={ui.panel}>
        <div style={ui.header}>
          <div style={{ minWidth: 0 }}>
            <p style={ui.kicker}>YFG Publishing Preparation</p>
            <h2 style={ui.title}>{form.main_title || idea?.title || 'Publishing Package'}</h2>
            <div>
              <span style={ui.pill}>Package: {status}</span>
              <span style={ui.pill}>Readiness: {readiness.score}%</span>
              <span style={ui.pill}>{readiness.ready ? 'READY TO PUBLISH' : `MISSING ${readiness.missingCount} ASSET(S)`}</span>
            </div>
          </div>
          <button style={{ ...ui.btn, minHeight: 40, padding: '8px 12px' }} onClick={close}>Close</button>
        </div>

        {err && <div style={{ ...ui.banner, background: 'rgba(127,29,29,0.35)', border: '1px solid #7f1d1d', color: '#fecaca' }}>{err}</div>}
        {msg && <div style={{ ...ui.banner, background: 'rgba(20,83,45,0.35)', border: '1px solid #14532d', color: '#bbf7d0' }}>{msg}</div>}

        {/* A */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>A. Content Overview</h3>
          <div style={ui.sub}>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
              <div><strong>Origin type:</strong> {ORIGIN_LABELS[contentOriginType] || contentOriginType}</div>
              <div><strong>Origin id:</strong> {contentOriginId || '—'}</div>
              <div><strong>Research:</strong> {idea?.title || '—'}</div>
              <div><strong>Production status:</strong> {production?.status || '—'}</div>
              <div><strong>Traceability:</strong> Publishing Package → Production → {ORIGIN_LABELS[contentOriginType] || contentOriginType}</div>
            </div>
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            Draft generation unavailable — no AI integration is connected. All fields are mapped from the approved production package or entered by you.
          </div>
        </section>

        {/* B */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>B. Required Assets</h3>
          <div style={{ marginBottom: 10 }}>
            {PLATFORMS.map(p => (
              <button key={p.key} onClick={() => toggleTarget(p.key)}
                style={{ ...ui.pill, cursor: 'pointer', border: targets.includes(p.key) ? '1px solid rgba(212,175,55,0.8)' : '1px solid rgba(51,65,85,0.85)', color: targets.includes(p.key) ? '#D4AF37' : '#cbd5e1' }}>
                {targets.includes(p.key) ? '✓ ' : ''}{p.label}
              </button>
            ))}
          </div>
          {readiness.rows.map(r => (
            <div key={r.platform.key} style={ui.sub}>
              <strong style={{ color: '#f8fafc' }}>{r.platform.label}</strong>
              <div style={{ marginTop: 6 }}>
                {r.items.map(i => (
                  <div key={i.key} style={{ fontSize: 13, color: i.ok ? '#86efac' : '#fca5a5' }}>{i.ok ? '✓' : '✗'} {i.label}</div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* C */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>C. Uploaded / Attached Assets</h3>
          <div style={ui.sub}>
            <Field label="Asset name" value={assetForm.asset_name} onChange={v => setAssetForm(p => ({ ...p, asset_name: v }))} />
            <div style={ui.field}>
              <label style={ui.label}>Asset type</label>
              <select style={ui.input} value={assetForm.asset_type} onChange={e => setAssetForm(p => ({ ...p, asset_type: e.target.value }))}>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={ui.field}>
              <label style={ui.label}>Asset role</label>
              <select style={ui.input} value={assetForm.asset_role} onChange={e => setAssetForm(p => ({ ...p, asset_role: e.target.value }))}>
                {ASSET_ROLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Asset URL / storage reference" value={assetForm.asset_url} onChange={v => setAssetForm(p => ({ ...p, asset_url: v }))} />
            <div style={ui.field}>
              <label style={ui.label}>Asset status</label>
              <select style={ui.input} value={assetForm.status} onChange={e => setAssetForm(p => ({ ...p, status: e.target.value }))}>
                {ASSET_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button style={{ ...ui.btn, ...ui.primary }} onClick={addAsset}>Add Asset</button>
          </div>

          {assets.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No assets recorded for this content yet.</div>}
          {assets.map(a => (
            <div key={a.id} style={ui.sub}>
              <div style={{ fontWeight: 800, color: '#f8fafc' }}>{a.asset_name}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{a.asset_type} · {a.asset_role || 'unassigned'} · {a.status}{a.package_id ? ' · attached' : ''}</div>
              {a.asset_url && <div style={{ color: '#7dd3fc', fontSize: 12 }}>{a.asset_url}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <select style={{ ...ui.input, width: 'auto', minHeight: 40, padding: '8px 10px' }} value={a.status} onChange={e => updateAsset(a.id, { status: e.target.value })}>
                  {ASSET_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button style={{ ...ui.btn, minHeight: 40, padding: '8px 12px' }} onClick={() => attachAsset(a)}>Attach</button>
                <button style={{ ...ui.btn, minHeight: 40, padding: '8px 12px' }} onClick={() => removeAsset(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </section>

        {/* D */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>D. Platform Readiness</h3>
          {readiness.rows.map(r => (
            <div key={r.platform.key} style={{ ...ui.sub, borderColor: r.ready ? 'rgba(34,197,94,0.5)' : 'rgba(245,158,11,0.5)' }}>
              <strong style={{ color: '#f8fafc' }}>{r.platform.label}</strong>{' '}
              <span style={{ color: r.ready ? '#86efac' : '#fcd34d', fontWeight: 800 }}>
                {r.ready ? '🟢 Ready' : `🟡 Missing ${r.missing.map(m => m.label).join(', ')}`}
              </span>
            </div>
          ))}
        </section>

        {/* E */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>E. Publishing Metadata</h3>
          <Field label="Main title" value={form.main_title} onChange={v => set('main_title', v)} />
          <Field label="Alternative titles" value={form.alternative_titles} onChange={v => set('alternative_titles', v)} rows={2} />
          <Field label="Description" value={form.description} onChange={v => set('description', v)} rows={5} />
          <Field label="Script" value={form.script} onChange={v => set('script', v)} rows={6} />
          <Field label="Caption" value={form.caption} onChange={v => set('caption', v)} rows={3} />
          <Field label="Hashtags" value={form.hashtags} onChange={v => set('hashtags', v)} rows={2} />
          <Field label="Captions / subtitles reference" value={form.captions_subtitles} onChange={v => set('captions_subtitles', v)} rows={2} />
          <Field label="Chapters" value={form.chapters} onChange={v => set('chapters', v)} rows={3} />
          <Field label="Tags / keywords" value={form.keywords} onChange={v => set('keywords', v)} rows={2} />
          {targets.map(k => (
            <div key={k} style={ui.sub}>
              <strong style={{ color: '#f8fafc' }}>{(PLATFORMS.find(p => p.key === k) || {}).label || k} copy</strong>
              <Field label="Caption" value={platformMeta?.[k]?.caption || ''} rows={3}
                onChange={v => { setPlatformMeta(p => ({ ...p, [k]: { ...(p?.[k] || {}), caption: v } })); touch() }} />
            </div>
          ))}
        </section>

        {/* F */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>F. Quality / Approval Status</h3>
          <div style={{ fontSize: 13, lineHeight: 1.9 }}>
            {checklist.map(c => (
              <div key={c.label} style={{ color: c.ok ? '#86efac' : '#fca5a5' }}>{c.ok ? '✓' : '✗'} {c.label}</div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: '#cbd5e1' }}>
            AI-generated: No · Human reviewed: {humanReviewed ? 'Yes' : 'No'} · Approved (production): {production?.status === 'approved' || production?.status === 'queued' ? 'Yes' : 'No'} · Ready: {readiness.ready ? 'Yes' : 'No'} · Queued: {row?.queued_at ? 'Yes' : 'No'} · Scheduled: No · Published: No
          </div>
          <button style={{ ...ui.btn, marginTop: 12 }} onClick={() => { setHumanReviewed(v => !v); touch() }}>
            {humanReviewed ? 'Unmark Human Reviewed' : 'Mark Human Reviewed'}
          </button>
        </section>

        {/* G */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>G. Publishing Package</h3>
          <pre style={{ ...ui.sub, whiteSpace: 'pre-wrap', fontSize: 12, color: '#cbd5e1', margin: 0 }}>{packageText()}</pre>
        </section>

        {/* H */}
        <section style={ui.section}>
          <h3 style={ui.sectionTitle}>H. Queue Preparation</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
            Ready platforms are inserted into the existing posting queue as <strong>draft</strong> and <strong>unscheduled</strong>.
            Nothing is published automatically. You schedule it yourself in the Posting Queue.
          </p>
          <Field label="Review notes" value={form.review_notes} onChange={v => set('review_notes', v)} rows={3} />
        </section>

        <div style={ui.bar}>
          <button style={{ ...ui.btn, ...ui.primary }} disabled={saving} onClick={() => persist(undefined, 'Publishing package saved.')}>{saving ? 'Saving…' : 'Save Package'}</button>
          <button style={ui.btn} onClick={() => copy(packageText())}>Copy Publishing Package</button>
          <button style={{ ...ui.btn, ...ui.gold }} disabled={saving} onClick={sendToQueue}>Send to Posting Queue (draft)</button>
          <button style={ui.btn} onClick={close}>Close Workspace</button>
        </div>
      </div>
    </div>
  )
}

export { assetSatisfies }
