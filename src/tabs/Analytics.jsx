export default function Analytics({ analyticsStats, styles }) {
  return (
    <div>
      <h2>📊 Analytics Dashboard v1</h2>
      <p style={{ color: '#94a3b8', marginBottom: 20 }}>Read-only insights from your content queue. Updated automatically with each refresh.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Published Today', value: analyticsStats.publishedToday, color: '#22c55e', icon: '✅' },
          { label: 'Published This Week', value: analyticsStats.publishedThisWeek, color: '#3b82f6', icon: '📅' },
          { label: 'Scheduled This Week', value: analyticsStats.scheduledThisWeek, color: '#eab308', icon: '⏰' },
          { label: 'Failed Posts', value: analyticsStats.failedPosts, color: '#ef4444', icon: '⚠️' },
        ].map((card) => (
          <div key={card.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 18, borderLeft: `4px solid ${card.color}` }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{card.icon} {card.label}</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 'bold', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, borderLeft: `4px solid ${analyticsStats.failedPosts === 0 ? '#22c55e' : '#eab308'}` }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Publishing Health</h3>
        {analyticsStats.failedPosts === 0 ? (
          <p style={{ margin: 0, fontSize: 18, color: '#22c55e', fontWeight: 'bold' }}>✅ Healthy — No failed posts detected.</p>
        ) : (
          <p style={{ margin: 0, fontSize: 18, color: '#eab308', fontWeight: 'bold' }}>⚠️ Needs attention — {analyticsStats.failedPosts} failed post(s) need review.</p>
        )}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Total Scheduled: <strong style={{ color: '#f1f5f9' }}>{analyticsStats.totalScheduled}</strong></span>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Total Published: <strong style={{ color: '#f1f5f9' }}>{analyticsStats.totalPublished}</strong></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginTop: 14 }}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>📡 Platform Distribution</h3>
          {Object.keys(analyticsStats.platformCounts).length === 0 ? (
            <p style={{ color: '#64748b', margin: 0 }}>No data yet.</p>
          ) : (
            Object.entries(analyticsStats.platformCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => {
                const max = Math.max(...Object.values(analyticsStats.platformCounts))
                const pct = max > 0 ? (count / max) * 100 : 0
                return (
                  <div key={platform} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#cbd5e1', fontSize: 13 }}>{platform}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 13 }}>{count}</span>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })
          )}
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>📝 Content Type Distribution</h3>
          {Object.keys(analyticsStats.contentTypeCounts).length === 0 ? (
            <p style={{ color: '#64748b', margin: 0 }}>No data yet.</p>
          ) : (
            Object.entries(analyticsStats.contentTypeCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([ctype, count]) => {
                const max = Math.max(...Object.values(analyticsStats.contentTypeCounts))
                const pct = max > 0 ? (count / max) * 100 : 0
                return (
                  <div key={ctype} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#cbd5e1', fontSize: 13 }}>{ctype}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 13 }}>{count}</span>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#a855f7', borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>🎯 Content Category Mix</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {Object.entries(analyticsStats.categoryCounts).map(([category, count]) => {
            const total = Object.values(analyticsStats.categoryCounts).reduce((s, n) => s + n, 0)
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const colors = { 'Prayer Posts': '#22c55e', 'Sermon Posts': '#3b82f6', 'Birthday Posts': '#eab308', 'Other Posts': '#64748b' }
            return (
              <div key={category} style={{ background: '#0f172a', border: `1px solid ${colors[category]}33`, borderRadius: 10, padding: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{category}</p>
                <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 'bold', color: colors[category] }}>{count}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{pct}% of total</p>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>📈 7-Day Publishing Summary</h3>
        {(() => {
          const max = Math.max(...analyticsStats.sevenDayPublishingData.map((d) => d.count), 1)
          return (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 160, paddingTop: 10 }}>
              {analyticsStats.sevenDayPublishingData.map((d, idx) => {
                const height = (d.count / max) * 130
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 'bold', marginBottom: 4 }}>{d.count}</span>
                    <div style={{ width: '100%', maxWidth: 40, background: '#3b82f6', height: `${Math.max(height, 4)}px`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{d.shortLabel}</span>
                  </div>
                )
              })}
            </div>
          )
        })()}
        <p style={{ marginTop: 12, marginBottom: 0, color: '#64748b', fontSize: 12 }}>
          Total published in last 7 days: <strong style={{ color: '#f1f5f9' }}>{analyticsStats.sevenDayPublishingData.reduce((s, d) => s + d.count, 0)}</strong>
        </p>
      </div>

      <div style={{ ...styles.card, marginTop: 14, borderLeft: '4px solid #a855f7' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>💡 Growth Insight</h3>
        {(() => {
          const insights = []
          if (analyticsStats.publishedToday >= 25) insights.push({ text: 'Strong publishing activity today.', color: '#22c55e', icon: '🚀' })
          if (analyticsStats.publishedToday < 10) insights.push({ text: 'Publishing activity is low today.', color: '#eab308', icon: '📉' })
          if (analyticsStats.failedPosts > 0) insights.push({ text: 'Review failed posts in Publishing Center.', color: '#ef4444', icon: '⚠️' })
          const cats = analyticsStats.categoryCounts
          const topCategory = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]
          if (topCategory && topCategory[1] > 0) {
            if (topCategory[0] === 'Sermon Posts') insights.push({ text: 'Sermon content is leading your content engine.', color: '#3b82f6', icon: '📖' })
            if (topCategory[0] === 'Prayer Posts') insights.push({ text: 'Prayer content is leading your engagement rhythm.', color: '#22c55e', icon: '🙏' })
          }
          if (insights.length === 0) insights.push({ text: 'Content is balanced. Keep publishing consistently.', color: '#94a3b8', icon: '✨' })
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ background: '#0f172a', border: `1px solid ${ins.color}33`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{ins.icon}</span>
                  <span style={{ color: ins.color, fontSize: 14, fontWeight: 'bold' }}>{ins.text}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}