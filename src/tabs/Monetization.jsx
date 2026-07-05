export default function Monetization({ monetizationChannels, styles }) {
  return (
    <div>
      <h2>💰 Monetization Dashboard</h2>
      <p>Track growth channels and plan next revenue actions.</p>

      <div style={{ ...styles.card, background: '#0f2a1a', border: '1px solid #166534', marginBottom: 20 }}>
        <p style={{ margin: 0, color: '#86efac', fontSize: 14 }}>
          <strong>Phase 1 — Growth Mode.</strong> Focus on building audience reach and engagement across all platforms before activating revenue streams.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {monetizationChannels.map((channel) => (
          <div key={channel.title} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 18, borderTop: `3px solid ${channel.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{channel.icon}</span>
                <h3 style={{ margin: 0, fontSize: 16, color: '#f1f5f9' }}>{channel.title}</h3>
              </div>
              <span style={{ background: '#1e3a5f', color: '#60a5fa', fontSize: 12, fontWeight: 'bold', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {channel.status}
              </span>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Next Action</p>
              <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{channel.nextAction}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, marginTop: 20 }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>📈 Monetization Roadmap</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { phase: 'Phase 1', label: 'Audience Growth', status: '🟡 Active Now', color: '#eab308' },
            { phase: 'Phase 2', label: 'Community Engagement', status: '🔵 Next Up', color: '#3b82f6' },
            { phase: 'Phase 3', label: 'Revenue Activation', status: '⚙ Future', color: '#64748b' },
          ].map((p) => (
            <div key={p.phase} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{p.phase}</p>
              <p style={{ margin: '0 0 6px', fontWeight: 'bold', color: '#f1f5f9', fontSize: 14 }}>{p.label}</p>
              <p style={{ margin: 0, fontSize: 13, color: p.color, fontWeight: 'bold' }}>{p.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}