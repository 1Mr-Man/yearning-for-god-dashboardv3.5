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

function getBio(minister) {
  return clean(minister.biography || minister.bio || minister.about || minister.description)
}

function getQuality(minister) {
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
    // Name — tiered: full name with space scores higher than single word
    { label: 'Name', max: 10, points: name.includes(' ') ? 10 : name.length > 0 ? 6 : 0 },
    // Ministry — tiered: longer ministry name scores higher
    { label: 'Ministry', max: 10, points: ministry.length >= 10 ? 10 : ministry.length > 0 ? 6 : 0 },
    // Country
    { label: 'Country', max: 8, points: !isEmpty(minister.country) ? 8 : 0 },
    // Birthday — exact date is best, text note is partial
    { label: 'Birthday / DOB', max: 15, points: birthdayExact ? 15 : birthdayText ? 6 : 0 },
    // Biography — 4 tiers based on length
    { label: 'Biography', max: 20, points: bio.length >= 400 ? 20 : bio.length >= 200 ? 15 : bio.length >= 80 ? 9 : bio.length >= 20 ? 4 : 0 },
    // Status
    { label: 'Status', max: 5, points: !isEmpty(minister.status) ? 5 : 0 },
    // Source — tiered by detail level
    { label: 'Source Note', max: 10, points: source.length >= 30 ? 10 : source.length >= 10 ? 5 : source.length > 0 ? 2 : 0 },
    // Verification — verified vs needs review vs unverified
    { label: 'Verification', max: 10, points: verification === 'verified' ? 10 : verification === 'needs review' ? 4 : 0 },
    // Profile image
    { label: 'Profile Image', max: 6, points: image.length > 0 ? 6 : 0 },
    // Social / website
    { label: 'Social / Website', max: 6, points: social.length > 0 ? 6 : 0 },
  ]

  const total = checks.reduce((sum, item) => sum + item.max, 0)
  const earned = checks.reduce((sum, item) => sum + item.points, 0)
  const score = Math.round((earned / total) * 100)
  const missing = checks.filter((item) => item.points < item.max).map((item) => item.label)

  return { score, earned, total, missing, checks, bioLength: bio.length }
}

function scoreColor(score) {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

function scoreLabel(score) {
  if (score >= 75) return 'Strong'
  if (score >= 50) return 'Needs Work'
  if (score >= 30) return 'Weak'
  return 'Incomplete'
}

export default function Ministers({
  ministers = [],
  search,
  setSearch,
  filteredMinisters = [],
  openMinisterProfile,
  getMinisterName,
  getMinisterMinistry,
  styles,
}) {
  const input = styles?.search || { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #334155', marginBottom: 10 }
  const listItem = styles?.listItem || { padding: 14, borderRadius: 14, border: '1px solid #334155', marginBottom: 10, background: '#0f172a' }

  const enrichedAll = ministers.map((m) => ({ ...m, _quality: getQuality(m) }))
  const strong = enrichedAll.filter((m) => m._quality.score >= 75).length
  const needsWork = enrichedAll.filter((m) => m._quality.score >= 50 && m._quality.score < 75).length
  const weak = enrichedAll.filter((m) => m._quality.score >= 30 && m._quality.score < 50).length
  const incomplete = enrichedAll.filter((m) => m._quality.score < 30).length

  const visible = filteredMinisters
    .map((m) => ({ ...m, _quality: getQuality(m) }))
    .sort((a, b) => a._quality.score - b._quality.score || clean(a.minister_name || a.name).localeCompare(clean(b.minister_name || b.name)))

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 8 }}>Ministers Catalog</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Ministers Loaded: {ministers.length} · Strong: {strong} · Needs Work: {needsWork} · Weak: {weak} · Incomplete: {incomplete}
      </p>
      <input
        type="text"
        placeholder="Search ministers, ministries, countries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={input}
      />
      <p style={{ color: '#94a3b8', fontSize: 13 }}>Showing: {visible.length} · Lowest scores appear first</p>

      {visible.slice(0, 100).map((minister) => {
        const quality = minister._quality
        const score = quality.score
        const color = scoreColor(score)
        const missingPreview = quality.missing.slice(0, 4).join(', ')
        return (
          <div key={minister.id || getMinisterName(minister)} style={{ ...listItem, cursor: 'pointer' }} onClick={() => openMinisterProfile(minister)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#f8fafc', fontSize: 16 }}>{getMinisterName(minister)}</strong>
                <p style={{ color: '#94a3b8', margin: '6px 0 4px' }}>{getMinisterMinistry(minister)}</p>
                <small style={{ color: '#64748b' }}>{minister.country || 'Country missing'} · {minister.verification_status || 'unverified'} · Bio: {quality.bioLength} chars</small>
                {missingPreview && (
                  <div style={{ color: '#fca5a5', fontSize: 11, marginTop: 6 }}>
                    Improve: {missingPreview}{quality.missing.length > 4 ? ` (+${quality.missing.length - 4} more)` : ''}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', minWidth: 84 }}>
                <div style={{ color, fontWeight: 900, fontSize: 22 }}>{score}%</div>
                <small style={{ color, fontWeight: 800 }}>{scoreLabel(score)}</small>
              </div>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
