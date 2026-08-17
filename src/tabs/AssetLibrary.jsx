import React, { useEffect, useMemo, useState } from 'react'
import {
  ASSET_STATUSES, ASSET_TYPES, ASSET_ROLES, ORIGIN_TYPES, ORIGIN_LABELS,
} from '../lib/yfgAssets'

// YFG ASSET LIBRARY — Phase 2D
// Origin-generic: shows every content asset regardless of where it came from
// (research today; Book Journey, quotes, music later). Read/manage only —
// nothing here publishes or schedules.

const fallback = {
  card: { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.75)', borderRadius: 18, padding: 14, marginBottom: 14 },
  input: { width: '100%', boxSizing: 'border-box', padding: 12, minHeight: 46, borderRadius: 12, fontSize: 15, color: '#f8fafc', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(51,65,85,0.9)', marginBottom: 10, fontFamily: 'inherit' },
  btn: { padding: '11px 14px', minHeight: 44, borderRadius: 12, fontWeight: 800, cursor: 'pointer', color: '#f8fafc', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.9)' },
}

const statusColor = s => ({
  missing: '#ef4444', planned: '#f59e0b', uploaded: '#38bdf8', ready: '#22c55e',
  approved: '#22c55e', attached: '#a78bfa', published: '#0ea5e9', failed: '#ef4444',
}[s] || '#94a3b8')

const emptyForm = {
  content_origin_type: 'research', content_origin_id: '', asset_type: 'image',
  asset_role: 'supporting', asset_name: '', asset_url: '', platform: '', status: 'planned', notes: '',
}

export default function AssetLibrary({ ctx = {} }) {
  const supabase = ctx.supabase
  const styles = ctx.styles || {}
  const card = styles.card || fallback.card
  const input = fallback.input
  const btn = styles.smallButton || fallback.btn

  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [originFilter, setOriginFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true); setErr('')
    try {
      const { data, error } = await supabase.from('yfg_content_assets').select('*').order('created_at', { ascending: false })
      if (error) { setErr('Assets could not be loaded: ' + error.message); setAssets([]); return }
      setAssets(data || [])
    } catch (e) {
      setErr('Assets could not be loaded: ' + (e?.message || String(e)))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function add() {
    setErr(''); setMsg('')
    if (!form.asset_name.trim()) { setErr('Give the asset a name first.'); return }
    const body = { ...form, asset_name: form.asset_name.trim(), content_origin_id: form.content_origin_id.trim() || null }
    const dup = assets.some(a => a.content_origin_type === body.content_origin_type
      && (a.content_origin_id || '') === (body.content_origin_id || '')
      && a.asset_type === body.asset_type
      && a.asset_name.trim().toLowerCase() === body.asset_name.toLowerCase())
    if (dup) { setErr('An identical asset already exists for this content. Duplicate not created.'); return }
    const { data, error } = await supabase.from('yfg_content_assets').insert(body).select().single()
    if (error) {
      setErr(String(error.code) === '23505'
        ? 'An identical asset already exists for this content. Duplicate not created.'
        : 'Asset could not be saved: ' + error.message)
      return
    }
    setAssets(p => [data, ...p]); setForm(emptyForm); setMsg('Asset added.')
  }

  async function setStatus(id, status) {
    const { data, error } = await supabase.from('yfg_content_assets')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) { setErr('Asset could not be updated: ' + error.message); return }
    setAssets(p => p.map(a => (a.id === id ? data : a)))
  }

  async function remove(id) {
    if (!window.confirm('Delete this asset record?')) return
    const { error } = await supabase.from('yfg_content_assets').delete().eq('id', id)
    if (error) { setErr('Asset could not be deleted: ' + error.message); return }
    setAssets(p => p.filter(a => a.id !== id))
  }

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    return assets.filter(a => {
      if (originFilter !== 'all' && a.content_origin_type !== originFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (typeFilter !== 'all' && a.asset_type !== typeFilter) return false
      if (!s) return true
      return `${a.asset_name} ${a.asset_type} ${a.asset_role} ${a.platform} ${a.status} ${a.notes} ${a.content_origin_type}`.toLowerCase().includes(s)
    })
  }, [assets, q, originFilter, statusFilter, typeFilter])

  const counts = useMemo(() => ({
    total: assets.length,
    missing: assets.filter(a => a.status === 'missing' || a.status === 'planned').length,
    ready: assets.filter(a => a.status === 'ready' || a.status === 'approved').length,
    attached: assets.filter(a => a.package_id).length,
  }), [assets])

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 6 }}>🎬 Asset Library</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Every content asset in one place — research content today, Book Journey episodes, quotes and music later.
        Assets are linked by content origin, never hardcoded to one workflow.
      </p>

      {err && <div style={{ ...card, borderColor: '#7f1d1d', color: '#fecaca' }}>{err}</div>}
      {msg && <div style={{ ...card, borderColor: '#14532d', color: '#bbf7d0' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
        {[['Total', counts.total, '#f8fafc'], ['Missing / Planned', counts.missing, '#f59e0b'], ['Ready', counts.ready, '#22c55e'], ['Attached', counts.attached, '#a78bfa']].map(([l, v, c]) => (
          <div key={l} style={{ ...card, textAlign: 'center', marginBottom: 0 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>{l}</div>
            <div style={{ color: c, fontSize: 28, fontWeight: 900 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Add Asset</h3>
        <input style={input} value={form.asset_name} onChange={e => setForm(p => ({ ...p, asset_name: e.target.value }))} placeholder="Asset name" />
        <select style={input} value={form.content_origin_type} onChange={e => setForm(p => ({ ...p, content_origin_type: e.target.value }))}>
          {ORIGIN_TYPES.map(o => <option key={o} value={o}>{ORIGIN_LABELS[o] || o}</option>)}
        </select>
        <input style={input} value={form.content_origin_id} onChange={e => setForm(p => ({ ...p, content_origin_id: e.target.value }))} placeholder="Content origin id (optional)" />
        <select style={input} value={form.asset_type} onChange={e => setForm(p => ({ ...p, asset_type: e.target.value }))}>
          {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={input} value={form.asset_role} onChange={e => setForm(p => ({ ...p, asset_role: e.target.value }))}>
          {ASSET_ROLES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={input} value={form.asset_url} onChange={e => setForm(p => ({ ...p, asset_url: e.target.value }))} placeholder="Asset URL or storage reference" />
        <input style={input} value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} placeholder="Intended platform (optional)" />
        <select style={input} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
          {ASSET_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea style={{ ...input, minHeight: 90 }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" />
        <button style={btn} onClick={add}>Add Asset</button>
      </div>

      <div style={card}>
        <input style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search assets…" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select style={{ ...input, width: 'auto', minWidth: 150, marginBottom: 0 }} value={originFilter} onChange={e => setOriginFilter(e.target.value)}>
            <option value="all">All origins</option>
            {ORIGIN_TYPES.map(o => <option key={o} value={o}>{ORIGIN_LABELS[o] || o}</option>)}
          </select>
          <select style={{ ...input, width: 'auto', minWidth: 150, marginBottom: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            {ASSET_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select style={{ ...input, width: 'auto', minWidth: 150, marginBottom: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {ASSET_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <p style={{ color: '#94a3b8', marginBottom: 0 }}>{loading ? 'Loading…' : `Showing ${visible.length} of ${assets.length} assets.`}</p>
      </div>

      {!loading && visible.length === 0 && (
        <div style={card}><p style={{ color: '#94a3b8', margin: 0 }}>No assets match this view yet.</p></div>
      )}

      {visible.map(a => (
        <div key={a.id} style={{ ...card, borderColor: statusColor(a.status) }}>
          <div style={{ fontWeight: 900, color: '#f8fafc' }}>{a.asset_name}</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            {ORIGIN_LABELS[a.content_origin_type] || a.content_origin_type} · {a.asset_type} · {a.asset_role || 'unassigned'} · {a.platform || 'any platform'}
          </div>
          {a.asset_url && <div style={{ color: '#7dd3fc', fontSize: 12, wordBreak: 'break-all' }}>{a.asset_url}</div>}
          {a.notes && <div style={{ color: '#cbd5e1', fontSize: 13, whiteSpace: 'pre-wrap', marginTop: 6 }}>{a.notes}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
            <span style={{ color: statusColor(a.status), fontWeight: 900, fontSize: 12 }}>{a.status.toUpperCase()}</span>
            <select style={{ ...input, width: 'auto', minHeight: 40, padding: '8px 10px', marginBottom: 0 }} value={a.status} onChange={e => setStatus(a.id, e.target.value)}>
              {ASSET_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button style={btn} onClick={() => remove(a.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
