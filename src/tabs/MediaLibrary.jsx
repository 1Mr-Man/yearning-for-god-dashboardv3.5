import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'yfg_media_library_assets_v1'

const emptyAsset = {
  title: '',
  asset_type: 'Poster Image',
  related_minister: '',
  related_campaign: '',
  related_queue_id: '',
  file_location: '',
  status: 'Needed',
  platform: '',
  notes: '',
}

function safeText(value) {
  return String(value || '').trim()
}

function makeAssetId() {
  return `asset_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function assetStatusColor(status) {
  if (status === 'Ready') return '#22c55e'
  if (status === 'Used') return '#38bdf8'
  if (status === 'In Progress') return '#f59e0b'
  return '#ef4444'
}

function getQueueTitle(item) {
  const stage = item?.campaign_stage || item?.content_type || 'Queue Item'
  const minister = item?.minister_name || 'General'
  return `${minister} — ${stage}`
}

export default function MediaLibrary({ queue = [], ministers = [], styles = {} }) {
  const card = styles.card || { background: '#0f172a', border: '1px solid #334155', borderRadius: 18, padding: 18, marginBottom: 14 }
  const input = styles.search || { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #334155', marginBottom: 10 }
  const textarea = styles.textarea || { width: '100%', minHeight: 110, padding: 12, borderRadius: 12, border: '1px solid #334155', marginBottom: 10 }
  const button = styles.actionButton || { width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 800 }
  const smallButton = styles.smallButton || { padding: '8px 10px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e5e7eb' }
  const deleteButton = styles.deleteButton || { padding: '8px 10px', borderRadius: 10, border: '1px solid #7f1d1d', background: '#7f1d1d', color: '#fff' }

  const [assets, setAssets] = useState([])
  const [form, setForm] = useState(emptyAsset)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setAssets(Array.isArray(saved) ? saved : [])
    } catch {
      setAssets([])
    }
  }, [])

  function persist(nextAssets) {
    setAssets(nextAssets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAssets))
  }

  function resetForm() {
    setForm(emptyAsset)
    setEditingId(null)
  }

  function saveAsset() {
    if (!safeText(form.title)) {
      alert('Please enter asset title')
      return
    }

    const now = new Date().toISOString()
    if (editingId) {
      const next = assets.map((asset) => asset.id === editingId ? { ...asset, ...form, updated_at: now } : asset)
      persist(next)
      alert('Media asset updated')
      resetForm()
      return
    }

    const newAsset = {
      id: makeAssetId(),
      ...form,
      created_at: now,
      updated_at: now,
    }
    persist([newAsset, ...assets])
    alert('Media asset saved')
    resetForm()
  }

  function editAsset(asset) {
    setEditingId(asset.id)
    setForm({
      title: asset.title || '',
      asset_type: asset.asset_type || 'Poster Image',
      related_minister: asset.related_minister || '',
      related_campaign: asset.related_campaign || '',
      related_queue_id: asset.related_queue_id || '',
      file_location: asset.file_location || '',
      status: asset.status || 'Needed',
      platform: asset.platform || '',
      notes: asset.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteAsset(id) {
    if (!confirm('Delete this media asset record?')) return
    persist(assets.filter((asset) => asset.id !== id))
  }

  function updateAssetStatus(id, status) {
    persist(assets.map((asset) => asset.id === id ? { ...asset, status, updated_at: new Date().toISOString() } : asset))
  }

  async function copyChecklist(asset) {
    const checklist = `MEDIA ASSET CHECKLIST\n\nAsset: ${asset.title}\nType: ${asset.asset_type}\nMinister: ${asset.related_minister || 'Not linked'}\nCampaign: ${asset.related_campaign || 'Not linked'}\nStatus: ${asset.status}\nFile/Link: ${asset.file_location || 'Not added yet'}\nPlatform: ${asset.platform || 'Not selected'}\nNotes: ${asset.notes || 'No notes'}\n\nProduction Steps:\n1. Confirm asset is created/exported.\n2. Confirm correct 9:16 size for Shorts/TikTok if video/image.\n3. Confirm caption and spelling.\n4. Save final file location.\n5. Mark asset Ready.\n6. Use for manual upload.\n7. Mark asset Used after publishing.`
    await navigator.clipboard.writeText(checklist)
    alert('Asset checklist copied')
  }

  const birthdayQueue = queue.filter((item) => {
    const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
    return text.includes('birthday')
  })

  const visibleAssets = useMemo(() => {
    const q = search.toLowerCase()
    return assets.filter((asset) => {
      const matchesSearch = !q || `${asset.title} ${asset.asset_type} ${asset.related_minister} ${asset.related_campaign} ${asset.status} ${asset.notes}`.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [assets, search, typeFilter, statusFilter])

  const stats = {
    total: assets.length,
    needed: assets.filter((a) => a.status === 'Needed').length,
    inProgress: assets.filter((a) => a.status === 'In Progress').length,
    ready: assets.filter((a) => a.status === 'Ready').length,
    used: assets.filter((a) => a.status === 'Used').length,
    linked: assets.filter((a) => a.related_queue_id).length,
  }

  const assetTypes = ['Poster Image', 'Minister Photo', 'Thumbnail', 'Short Video', 'Audio Clip', 'Caption File', 'Background Video', 'Logo', 'Other']
  const statuses = ['Needed', 'In Progress', 'Ready', 'Used']

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 8 }}>🗂️ Media Library</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Track poster images, minister photos, shorts, thumbnails, CapCut exports, and manual upload assets. Queue-created asset requests now appear here automatically.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          ['Total Assets', stats.total, '#f8fafc'],
          ['Needed', stats.needed, '#ef4444'],
          ['In Progress', stats.inProgress, '#f59e0b'],
          ['Ready', stats.ready, '#22c55e'],
          ['Used', stats.used, '#38bdf8'],
          ['Linked Queue', stats.linked, '#a78bfa'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ ...card, textAlign: 'center', marginBottom: 0 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ color, fontSize: 30, fontWeight: 900, marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, borderColor: '#7c3aed' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>{editingId ? 'Edit Media Asset' : 'Add New Media Asset'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Asset title e.g. Apostle Selman birthday poster" style={input} />
          <select value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })} style={input}>
            {assetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={input}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <input list="minister-list" value={form.related_minister} onChange={(e) => setForm({ ...form, related_minister: e.target.value })} placeholder="Related minister" style={input} />
          <datalist id="minister-list">
            {ministers.map((m) => <option key={m.id || m.minister_name} value={m.minister_name || m.name} />)}
          </datalist>
          <input value={form.related_campaign} onChange={(e) => setForm({ ...form, related_campaign: e.target.value })} placeholder="Related campaign e.g. Birthday Campaign" style={input} />
          <select value={form.related_queue_id} onChange={(e) => setForm({ ...form, related_queue_id: e.target.value })} style={input}>
            <option value="">Link queue item (optional)</option>
            {birthdayQueue.slice(0, 80).map((item) => <option key={item.id} value={item.id}>{getQueueTitle(item)}</option>)}
          </select>
        </div>

        <input value={form.file_location} onChange={(e) => setForm({ ...form, file_location: e.target.value })} placeholder="File location or link e.g. Download/yfg_short_001.mp4, Google Drive link, CapCut export name" style={input} />
        <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Platform e.g. TikTok, YouTube Shorts, Instagram, Facebook" style={input} />
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Production notes, design instruction, video export settings, caption status..." style={textarea} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ ...button, width: 'auto', minWidth: 180 }} onClick={saveAsset}>{editingId ? 'Save Changes' : 'Save Asset'}</button>
          {editingId && <button style={smallButton} onClick={resetForm}>Cancel Edit</button>}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Find Assets</h3>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by asset, minister, campaign, status..." style={input} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...input, width: 'auto', minWidth: 160, marginBottom: 0 }}>
            <option value="all">All Types</option>
            {assetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...input, width: 'auto', minWidth: 160, marginBottom: 0 }}>
            <option value="all">All Statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <p style={{ color: '#94a3b8', marginBottom: 0 }}>Showing {visibleAssets.length} of {assets.length} assets.</p>
      </div>

      {visibleAssets.length === 0 && (
        <div style={card}>
          <h3 style={{ color: '#f1f5f9', marginTop: 0 }}>No assets yet</h3>
          <p style={{ color: '#94a3b8', marginBottom: 0 }}>Start by adding the poster, thumbnail, or video file for one birthday campaign.</p>
        </div>
      )}

      {visibleAssets.map((asset) => {
        const color = assetStatusColor(asset.status)
        return (
          <div key={asset.id} style={{ ...card, borderColor: color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 style={{ color: '#f8fafc', margin: '0 0 6px' }}>{asset.title}</h3>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{asset.asset_type} · {asset.related_minister || 'No minister'} · {asset.related_campaign || 'No campaign'}</div>
                {asset.related_queue_id && <p style={{ color: '#7dd3fc', fontSize: 13, margin: '8px 0 0' }}>Linked Queue ID: {asset.related_queue_id}</p>}
                {asset.file_location && <p style={{ color: '#cbd5e1', fontSize: 13, wordBreak: 'break-word' }}>File/Link: {asset.file_location}</p>}
                {asset.notes && <p style={{ color: '#cbd5e1', fontSize: 13, whiteSpace: 'pre-wrap' }}>{asset.notes}</p>}
              </div>
              <div style={{ color, fontWeight: 900, border: `1px solid ${color}`, padding: '7px 10px', borderRadius: 999 }}>{asset.status}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {statuses.map((status) => <button key={status} style={smallButton} onClick={() => updateAssetStatus(asset.id, status)}>{status}</button>)}
              <button style={smallButton} onClick={() => copyChecklist(asset)}>Copy Checklist</button>
              <button style={smallButton} onClick={() => editAsset(asset)}>Edit</button>
              <button style={deleteButton} onClick={() => deleteAsset(asset.id)}>Delete</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}