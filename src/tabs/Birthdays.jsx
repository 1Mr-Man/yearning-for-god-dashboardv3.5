function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function getRangeLabel(days) {
  if (days === 0) return 'Today'
  if (days <= 7) return 'Next 7 Days'
  if (days <= 14) return 'Next 14 Days'
  return 'Next 30 Days'
}

function getCampaignStage(alreadyDone, daysRemaining) {
  if (alreadyDone) return { label: 'In Queue', color: '#22c55e', bg: '#052e16', border: '#166534' }
  if (daysRemaining <= 3) return { label: 'Urgent: Prepare Now', color: '#ef4444', bg: '#450a0a', border: '#7f1d1d' }
  if (daysRemaining <= 7) return { label: 'Prepare This Week', color: '#f59e0b', bg: '#451a03', border: '#92400e' }
  return { label: 'Not Prepared', color: '#fca5a5', bg: '#1a0a0a', border: '#450a0a' }
}

function getSourceLabel(item) {
  if (item?.birthdayEvent) return 'Birthday Event'
  if (item?.minister?.date_of_birth) return 'Date of Birth'
  if (item?.minister?.birthday) return 'Birthday Field'
  return 'Minister Profile'
}

function groupOpportunities(opportunities) {
  const groups = {
    Today: [],
    'Next 7 Days': [],
    'Next 14 Days': [],
    'Next 30 Days': [],
  }

  safeArray(opportunities)
    .slice()
    .sort((a, b) => Number(a.daysRemaining || 0) - Number(b.daysRemaining || 0))
    .forEach((item) => {
      const days = Number(item.daysRemaining || 0)
      const label = getRangeLabel(days)
      groups[label].push(item)
    })

  return groups
}

function buildResearchPrompt(item, getMinisterName, getMinisterMinistry) {
  const name = getMinisterName(item.minister)
  const ministry = getMinisterMinistry(item.minister)
  const nextBirthday = item.nextBirthday ? new Date(item.nextBirthday).toLocaleDateString() : 'unknown date'

  return `Prepare a verified birthday content pack for ${name} of ${ministry}. Next birthday: ${nextBirthday}. Create: 1 celebration caption, 1 prayer post, 1 quote/legacy post, 1 poster text, 1 image prompt, and 1 short video script. Keep the tone honoring, biblical, and suitable for Yearning for God. Do not invent biographical facts; if a fact is uncertain, mark it as needs verification.`
}

function copyText(text) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export default function Birthdays({
  birthdayOpportunities = [],
  campaignAlreadyGenerated,
  busy,
  generateAllUpcomingCampaigns,
  getBirthdayColor,
  getMinisterName,
  getMinisterMinistry,
  generateBirthdayCampaign,
  styles = {},
}) {
  const opportunities = safeArray(birthdayOpportunities)
  const generated = opportunities.filter((item) => campaignAlreadyGenerated(item.minister, item.daysRemaining)).length
  const pending = opportunities.length - generated
  const urgent = opportunities.filter((item) => Number(item.daysRemaining || 0) <= 7).length
  const grouped = groupOpportunities(opportunities)

  const card = styles.card || { background: '#0f172a', border: '1px solid #24324a', borderRadius: 18, padding: 20, marginBottom: 18 }
  const missionCard = styles.missionCard || card
  const missionIcon = styles.missionIcon || { fontSize: 30 }
  const missionLabel = styles.missionLabel || { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }
  const missionValue = styles.missionValue || { fontSize: 30, fontWeight: 900 }
  const missionSub = styles.missionSub || { color: '#64748b', fontSize: 12 }
  const actionButton = styles.actionButton || { padding: '12px 14px', borderRadius: 12, border: 'none', fontWeight: 800 }
  const smallButton = styles.smallButton || { padding: '8px 10px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e5e7eb' }

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 8 }}>🎂 Birthday Campaign Center</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Detect birthdays, prepare campaigns early, and avoid missing any minister celebration.
      </p>

      <div style={{ ...card, borderColor: '#f59e0b', background: 'linear-gradient(135deg, #1e1b4b, #0f172a)' }}>
        <strong style={{ color: '#fef3c7' }}>Birthday Safety Rule</strong>
        <p style={{ marginBottom: 0, color: '#cbd5e1', fontSize: 13 }}>
          Birthday campaigns should be prepared from verified or needs-review birthday events. Review dates before public posting.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 15 }}>
        {[
          { icon: '🎂', label: 'Opportunities', value: opportunities.length, sub: 'within next 30 days', color: '#f59e0b' },
          { icon: '🔥', label: 'Urgent', value: urgent, sub: 'within next 7 days', color: urgent > 0 ? '#ef4444' : '#22c55e' },
          { icon: '✅', label: 'Generated', value: generated, sub: 'already in queue', color: '#22c55e' },
          { icon: '⏳', label: 'Pending', value: pending, sub: 'needs preparation', color: pending > 0 ? '#ef4444' : '#22c55e' },
        ].map((stat) => (
          <div key={stat.label} style={missionCard}>
            <div style={missionIcon}>{stat.icon}</div>
            <div style={missionLabel}>{stat.label}</div>
            <div style={{ ...missionValue, color: stat.color }}>{stat.value}</div>
            <div style={missionSub}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {opportunities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <button
            style={{ ...actionButton, background: busy ? '#334155' : '#16a34a', color: 'white' }}
            disabled={busy}
            onClick={generateAllUpcomingCampaigns}
          >
            {busy ? '⏳ Working...' : '🗓 Generate All Pending Campaigns'}
          </button>
          <button
            style={{ ...smallButton, background: '#0f172a' }}
            onClick={() => copyText(`Create birthday campaigns for these ministers: ${opportunities.map((item) => getMinisterName(item.minister)).join(', ')}. For each minister create a celebration caption, prayer post, quote/legacy post, poster text, image prompt, hashtags, and short video script. Do not invent unverified facts.`)}
          >
            📋 Copy Batch AI Prompt
          </button>
        </div>
      )}

      {opportunities.length === 0 && (
        <div style={card}>
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
            No upcoming birthdays detected in the next 30 days.<br />
            <span style={{ fontSize: 13, color: '#64748b' }}>Check minister_events_main for Birthday events and yearly date calculation.</span>
          </p>
        </div>
      )}

      {opportunities.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {Object.entries(grouped).map(([groupName, items]) => {
            if (!items.length) return null
            return (
              <div key={groupName} style={{ marginBottom: 24 }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>{groupName} ({items.length})</h3>
                {items.map((item, index) => {
                  const days = Number(item.daysRemaining || 0)
                  const alreadyDone = campaignAlreadyGenerated(item.minister, item.daysRemaining)
                  const stage = getCampaignStage(alreadyDone, days)
                  const birthdayColor = getBirthdayColor ? getBirthdayColor(days) : stage.color
                  const prompt = buildResearchPrompt(item, getMinisterName, getMinisterMinistry)

                  return (
                    <div key={`${groupName}-${index}`} style={{ ...card, borderLeft: `4px solid ${birthdayColor}`, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <h3 style={{ margin: '0 0 6px', color: '#f1f5f9' }}>{getMinisterName(item.minister)}</h3>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 13 }}>{getMinisterMinistry(item.minister)}</p>
                          {item.nextBirthday && (
                            <p style={{ margin: '0 0 4px', color: '#cbd5e1', fontSize: 13 }}>
                              Next birthday: {new Date(item.nextBirthday).toLocaleDateString()}
                            </p>
                          )}
                          <p style={{ margin: '0 0 6px', color: birthdayColor, fontWeight: 900, fontSize: 15 }}>
                            {days === 0 ? '🎉 Birthday Today!' : `⏳ ${days} day${days !== 1 ? 's' : ''} remaining`}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            <span style={{ background: stage.bg, border: `1px solid ${stage.border}`, color: stage.color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>
                              {stage.label}
                            </span>
                            <span style={{ background: '#111827', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                              Source: {getSourceLabel(item)}
                            </span>
                            {item.birthdayEvent?.verification_status && (
                              <span style={{ background: '#451a03', border: '1px solid #92400e', color: '#fbbf24', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                                {item.birthdayEvent.verification_status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                          {!alreadyDone && (
                            <button
                              style={{ ...smallButton, background: busy ? '#334155' : '#1d4ed8', color: busy ? '#64748b' : 'white', whiteSpace: 'nowrap' }}
                              disabled={busy}
                              onClick={() => generateBirthdayCampaign(item.minister)}
                            >
                              {busy ? '⏳ Working...' : '🗓 Generate Campaign'}
                            </button>
                          )}
                          <button style={smallButton} onClick={() => copyText(prompt)}>📋 Copy AI Prompt</button>
                        </div>
                      </div>

                      <div style={{ marginTop: 14, padding: 12, border: '1px solid #1e293b', background: '#020617', borderRadius: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Campaign Pack To Prepare</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, color: '#cbd5e1', fontSize: 12 }}>
                          <span>✅ Celebration Caption</span>
                          <span>✅ Prayer Post</span>
                          <span>✅ Quote/Legacy Post</span>
                          <span>✅ Poster Text</span>
                          <span>✅ Image Prompt</span>
                          <span>✅ Short Video Script</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
