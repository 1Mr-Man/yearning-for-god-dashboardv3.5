function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function clean(value) {
  return String(value || '').trim()
}

function hasUsableDate(value) {
  if (isEmpty(value)) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime())
}

function getMinisterNameSafe(minister) {
  return minister?.minister_name || minister?.name || '(no name)'
}

function getBio(minister) {
  return clean(minister.biography || minister.bio || minister.about || minister.description)
}

function getCompleteness(minister) {
  const bio = getBio(minister)
  const birthdayExact = hasUsableDate(minister.birthday) || hasUsableDate(minister.date_of_birth)
  const birthdayText = !birthdayExact && !isEmpty(minister.birthday_text)
  const verification = clean(minister.verification_status).toLowerCase()
  const source = clean(minister.source_note || minister.source_url || minister.website || minister.official_website)
  const image = clean(minister.profile_image_url || minister.image_url || minister.photo_url)
  const social = clean(minister.facebook_url || minister.instagram_url || minister.youtube_url || minister.tiktok_url || minister.social_links)
  const name = clean(minister.minister_name || minister.name)
  const ministry = clean(minister.ministry_name || minister.ministry)

  const checks = [
    { key: 'name', label: 'Name', max: 10, points: name.includes(' ') ? 10 : name.length > 0 ? 6 : 0 },
    { key: 'ministry', label: 'Ministry', max: 10, points: ministry.length >= 10 ? 10 : ministry.length > 0 ? 6 : 0 },
    { key: 'country', label: 'Country', max: 8, points: !isEmpty(minister.country) ? 8 : 0 },
    { key: 'birth', label: 'Birthday / DOB', max: 15, points: birthdayExact ? 15 : birthdayText ? 6 : 0 },
    { key: 'bio', label: 'Biography', max: 20, points: bio.length >= 400 ? 20 : bio.length >= 200 ? 15 : bio.length >= 80 ? 9 : bio.length >= 20 ? 4 : 0 },
    { key: 'status', label: 'Status', max: 5, points: !isEmpty(minister.status) ? 5 : 0 },
    { key: 'source', label: 'Source Note', max: 10, points: source.length >= 30 ? 10 : source.length >= 10 ? 5 : source.length > 0 ? 2 : 0 },
    { key: 'verify', label: 'Verification', max: 10, points: verification === 'verified' ? 10 : verification === 'needs review' ? 4 : 0 },
    { key: 'image', label: 'Profile Image', max: 6, points: image.length > 0 ? 6 : 0 },
    { key: 'social', label: 'Social / Website', max: 6, points: social.length > 0 ? 6 : 0 },
  ]

  const total = checks.reduce((sum, item) => sum + item.max, 0)
  const earned = checks.reduce((sum, item) => sum + item.points, 0)
  const score = Math.round((earned / total) * 100)
  const missing = checks.filter((item) => item.points < item.max).map((item) => item.label)
  return { score, missing, checks, bioLength: bio.length }
}

function getScoreColor(score) {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

function getScoreLabel(score) {
  if (score >= 75) return 'Strong'
  if (score >= 50) return 'Needs Work'
  if (score >= 30) return 'Weak'
  return 'Incomplete'
}

function getBirthdayDisplay(minister) {
  return minister.birthday || minister.date_of_birth || minister.birthday_text || 'Missing'
}

export default function MinisterUpdates({
  ministers = [],
  ministerUpdateStats = {},
  ministerUpdateSearch,
  setMinisterUpdateSearch,
  selectedUpdateMinister,
  ministerUpdateForm,
  setMinisterUpdateForm,
  ministerEventForm,
  setMinisterEventForm,
  selectMinisterForUpdate,
  updateMinisterProfileInfo,
  saveMinisterEvent,
  updateMinisterEventStatus,
  deleteMinisterEvent,
  styles,
}) {
  const card = styles?.card || { background: '#0f172a', border: '1px solid #24324a', borderRadius: 18, padding: 20, marginBottom: 18 }
  const input = styles?.search || { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #334155', marginBottom: 10 }
  const textarea = styles?.textarea || { width: '100%', minHeight: 110, padding: 12, borderRadius: 12, border: '1px solid #334155', marginBottom: 10 }
  const actionButton = styles?.actionButton || { padding: '10px 14px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 800 }
  const smallButton = styles?.smallButton || { padding: '7px 10px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e5e7eb' }
  const deleteButton = styles?.deleteButton || { padding: '7px 10px', borderRadius: 10, border: '1px solid #7f1d1d', background: '#7f1d1d', color: '#fff' }
  const calendarItem = styles?.calendarItem || { padding: 12, border: '1px solid #334155', borderRadius: 12, marginBottom: 10, background: '#0b1220' }

  const enriched = ministers.map((m) => ({ ...m, _quality: getCompleteness(m) }))
  const strongProfiles = enriched.filter((m) => m._quality.score >= 75).length
  const weakProfiles = enriched.filter((m) => m._quality.score < 30).length
  const averageScore = enriched.length ? Math.round(enriched.reduce((sum, m) => sum + m._quality.score, 0) / enriched.length) : 0

  const query = String(ministerUpdateSearch || '').toLowerCase()
  const filtered = enriched
    .filter((m) => {
      if (!query) return true
      return `${m.minister_name || ''} ${m.ministry_name || ''} ${m.country || ''} ${m.biography || ''}`.toLowerCase().includes(query)
    })
    .sort((a, b) => a._quality.score - b._quality.score)

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 8 }}>Minister Data Quality Center</h2>
      <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: 18 }}>
        Complete minister profiles before generating birthday, biography, tribute, and anniversary content.
      </p>

      <div style={{ ...card, borderColor: '#f59e0b', background: 'linear-gradient(135deg, #1e1b4b, #0f172a)' }}>
        <strong style={{ color: '#fef3c7' }}>Safe Research Reminder</strong>
        <p style={{ marginBottom: 0, color: '#cbd5e1', fontSize: 13 }}>
          Only add verified information. Use official websites, ministry publications, and confirmed sources. Do not guess dates.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, margin: '18px 0' }}>
        {[
          { label: 'Total Ministers', value: ministers.length, color: '#94a3b8' },
          { label: 'Strong (75%+)', value: strongProfiles, color: '#22c55e' },
          { label: 'Avg Score', value: `${averageScore}%`, color: averageScore >= 75 ? '#22c55e' : averageScore >= 50 ? '#f59e0b' : '#ef4444' },
          { label: 'Incomplete (<30%)', value: weakProfiles, color: '#ef4444' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: 26, fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Search, Score & Select Minister</h3>
        <input
          type="text"
          placeholder="Search minister, ministry, country, biography..."
          value={ministerUpdateSearch}
          onChange={(e) => setMinisterUpdateSearch(e.target.value)}
          style={input}
        />
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Showing lowest-completion profiles first. Score uses name completeness, bio length, birthday quality, source depth, and verification level.</p>
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {filtered.slice(0, 80).map((m) => {
            const score = m._quality.score
            const color = getScoreColor(score)
            const selected = selectedUpdateMinister && selectedUpdateMinister.id === m.id
            return (
              <div key={m.id} style={{ ...calendarItem, cursor: 'pointer', borderColor: selected ? '#a78bfa' : '#334155' }} onClick={() => selectMinisterForUpdate(m)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <strong style={{ color: '#f1f5f9', fontSize: 15 }}>{getMinisterNameSafe(m)}</strong>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 3 }}>{m.ministry_name || 'No ministry'} · {m.country || 'No country'}</div>
                    <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>Birthday/DOB: {getBirthdayDisplay(m)}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>Bio: {m._quality.bioLength} chars · Verification: {m.verification_status || 'unverified'}</div>
                    {m._quality.missing.length > 0 && (
                      <div style={{ color: '#fca5a5', fontSize: 11, marginTop: 6 }}>Missing: {m._quality.missing.slice(0, 4).join(', ')}{m._quality.missing.length > 4 ? ` (+${m._quality.missing.length - 4} more)` : ''}</div>
                    )}
                  </div>
                  <div style={{ minWidth: 95, textAlign: 'right' }}>
                    <div style={{ color, fontSize: 24, fontWeight: 900 }}>{score}%</div>
                    <div style={{ color, fontSize: 11, fontWeight: 800 }}>{getScoreLabel(score)}</div>
                  </div>
                </div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedUpdateMinister && (
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Update Minister: {selectedUpdateMinister.minister_name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <input type="text" placeholder="Minister Name" value={ministerUpdateForm.minister_name || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, minister_name: e.target.value })} style={input} />
            <input type="text" placeholder="Ministry Name" value={ministerUpdateForm.ministry_name || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, ministry_name: e.target.value })} style={input} />
            <input type="text" placeholder="Country" value={ministerUpdateForm.country || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, country: e.target.value })} style={input} />
            <input type="text" placeholder="Status e.g. active" value={ministerUpdateForm.status || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, status: e.target.value })} style={input} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <label style={{ color: '#cbd5e1', fontSize: 12 }}>Birthday<input type="date" value={ministerUpdateForm.birthday || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, birthday: e.target.value })} style={input} /></label>
            <label style={{ color: '#cbd5e1', fontSize: 12 }}>Date of Birth<input type="date" value={ministerUpdateForm.date_of_birth || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, date_of_birth: e.target.value })} style={input} /></label>
            <label style={{ color: '#cbd5e1', fontSize: 12 }}>Verification<select value={ministerUpdateForm.verification_status || 'unverified'} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, verification_status: e.target.value })} style={input}>
              {['unverified', 'verified', 'needs review'].map((v) => (<option key={v} value={v}>{v}</option>))}
            </select></label>
          </div>
          <input type="text" placeholder="Birthday Text / display note" value={ministerUpdateForm.birthday_text || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, birthday_text: e.target.value })} style={input} />
          <textarea placeholder="Biography (more detail = higher score)" value={ministerUpdateForm.biography || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, biography: e.target.value })} style={textarea} />
          <input type="text" placeholder="Source Note: website, video, post, biography page, etc." value={ministerUpdateForm.source_note || ''} onChange={(e) => setMinisterUpdateForm({ ...ministerUpdateForm, source_note: e.target.value })} style={input} />
          <button style={actionButton} onClick={updateMinisterProfileInfo}>Save Minister Update</button>
        </div>
      )}

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Add Minister Event</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <input type="text" placeholder="Minister Name" value={ministerEventForm.minister_name || ''} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, minister_name: e.target.value })} style={input} />
          <input type="text" placeholder="Event Name" value={ministerEventForm.event_name || ''} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, event_name: e.target.value })} style={input} />
          <select value={ministerEventForm.event_type || 'Birthday'} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, event_type: e.target.value })} style={input}>
            {['Birthday', 'Ministry Anniversary', 'Annual Program', 'Conference', 'Memorial', 'Ordination', 'Special Service', 'Custom Event'].map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <input type="date" value={ministerEventForm.event_date || ''} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, event_date: e.target.value })} style={input} />
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0', fontSize: 14, color: '#cbd5e1' }}>
          <input type="checkbox" checked={!!ministerEventForm.recurring_yearly} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, recurring_yearly: e.target.checked })} /> Recurring Yearly
        </label>
        <input type="text" placeholder="Source Note" value={ministerEventForm.source_note || ''} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, source_note: e.target.value })} style={input} />
        <select value={ministerEventForm.verification_status || 'unverified'} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, verification_status: e.target.value })} style={input}>
          {['unverified', 'verified', 'needs review'].map((v) => (<option key={v} value={v}>{v}</option>))}
        </select>
        <textarea placeholder="Notes" value={ministerEventForm.notes || ''} onChange={(e) => setMinisterEventForm({ ...ministerEventForm, notes: e.target.value })} style={textarea} />
        <button style={actionButton} onClick={saveMinisterEvent}>Save Event</button>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>All Events ({(ministerUpdateStats.events || []).length})</h3>
        {(ministerUpdateStats.events || []).length === 0 && <p style={{ margin: 0, color: '#94a3b8' }}>No events yet.</p>}
        {(ministerUpdateStats.events || []).map((e) => {
          const vColor = e.verification_status === 'verified' ? '#22c55e' : e.verification_status === 'needs review' ? '#f59e0b' : '#94a3b8'
          return (
            <div key={e.id} style={calendarItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ color: '#f1f5f9' }}>{e.event_name}</strong>
                <span style={{ background: vColor, color: '#0f172a', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>{e.verification_status || 'unverified'}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                <span>{e.minister_name || '—'}</span><span>{e.event_type || '—'}</span><span>{e.event_date || '—'}</span>
                {e._days !== null && e._days !== undefined && <span>{e._days} days</span>}
                {e.recurring_yearly && <span>yearly</span>}
              </div>
              {e.notes && <p style={{ margin: '4px 0', fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>{e.notes}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button style={smallButton} onClick={() => updateMinisterEventStatus(e.id, 'verified')}>Verify</button>
                <button style={smallButton} onClick={() => updateMinisterEventStatus(e.id, 'needs review')}>Needs Review</button>
                <button style={smallButton} onClick={() => updateMinisterEventStatus(e.id, 'unverified')}>Unverify</button>
                <button style={deleteButton} onClick={() => deleteMinisterEvent(e.id)}>Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
