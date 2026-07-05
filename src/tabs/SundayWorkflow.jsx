export default function SundayWorkflow({
  coverageRefreshing,
  readinessScore,
  nextWeekCoverage,
  missingCoverageDays,
  nextWeekDayCounts,
  coverageLastUpdated,
  weeklyOverload,
  loadBalancing,
  remainingDaysGenerating,
  sundayWorkflowSummary,
  weeklySermonsFilled,
  busy,
  setActiveTab,
  calculateNextWeekCoverage,
  getReadinessColor,
  getReadinessLabel,
  getNextWeekDates,
  checkWeeklyOverload,
  balanceWeeklyLoad,
  generateSundayWorkflowPlan,
  generateRemainingDaysOnly,
  styles,
}) {
  return (
    <div>
      <h2>🕊 Sunday One-Click Workflow</h2>
      <p>Paste up to 7 sermons, generate 175 posts smart-distributed across every day, and let the Auto Publisher handle the week.</p>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>🎯 Next Week Readiness Score</h3>
          <button style={{ ...styles.smallButton, background: '#1e3a5f', color: '#60a5fa' }} onClick={calculateNextWeekCoverage}>
            {coverageRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 14, background: '#0f172a', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${readinessScore}%`, background: getReadinessColor(readinessScore), borderRadius: 8, transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: 22, color: getReadinessColor(readinessScore), minWidth: 60, textAlign: 'right' }}>{readinessScore}%</span>
        </div>
        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 'bold', color: getReadinessColor(readinessScore) }}>{getReadinessLabel(readinessScore)}</p>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Based on {nextWeekCoverage} of 7 days covered with scheduled or published posts next week.</p>
      </div>

      <div style={styles.card}>
        <h3>Weekly Readiness</h3>
        <p><strong>Sermons Filled:</strong> {weeklySermonsFilled} / 7</p>
        <p><strong>Expected Posts:</strong> 175 (25 per day × 7 days)</p>
        <p><strong>Distribution:</strong> Smart Distributed — all sermons appear across the week.</p>
        <p style={{ marginTop: 10, fontSize: 13, color: '#94a3b8' }}>Even with 1 sermon, all 7 days are covered. More sermons = more content variety each day.</p>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>📅 Next Week Coverage</h3>
          <button style={{ ...styles.smallButton, background: '#1e3a5f', color: '#60a5fa' }} onClick={calculateNextWeekCoverage}>
            {coverageRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p><strong>Covered Days:</strong> {nextWeekCoverage} / 7</p>
        {missingCoverageDays.length > 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 6px' }}>Missing days:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {missingCoverageDays.map((day) => (
                <span key={day} style={{ background: '#450a0a', color: '#fca5a5', padding: '3px 10px', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }}>{day}</span>
              ))}
            </div>
          </div>
        )}
        {missingCoverageDays.length === 0 && nextWeekCoverage > 0 && <p style={{ fontSize: 13, color: '#22c55e', marginTop: 6 }}>✅ All days accounted for.</p>}
      </div>

      <div style={styles.card}>
        <h3 style={{ marginBottom: 14 }}>🗓 Next Week Calendar Preview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          {getNextWeekDates().map(({ name, dateLabel, dayIndex }) => {
            const count = nextWeekDayCounts[dayIndex] || 0
            const hasPosts = count > 0
            const isMissing = missingCoverageDays.includes(name)
            return (
              <div key={name} style={{ background: hasPosts ? '#0f2a1a' : '#1a0a0a', border: `1px solid ${hasPosts ? '#166534' : '#450a0a'}`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{dateLabel}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: hasPosts ? '#86efac' : '#fca5a5', marginBottom: 6 }}>{name}</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: hasPosts ? '#22c55e' : '#ef4444' }}>{count}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{hasPosts ? 'posts' : 'empty'}</div>
                {isMissing && <div style={{ fontSize: 10, color: '#f97316', marginTop: 4, fontWeight: 'bold' }}>NEEDS FILL</div>}
              </div>
            )
          })}
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>Shows scheduled + published posts per day for next Monday-Sunday.</p>
        {coverageLastUpdated && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Last refreshed: {coverageLastUpdated.toLocaleTimeString()}</p>}
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>⚖️ Weekly Load Balancer v1</h3>
        </div>
        {weeklyOverload.length === 0 ? (
          <p style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ No overloaded days. Weekly Sermon Planner load is healthy.</p>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: '#fca5a5', marginBottom: 10 }}>⚠️ {weeklyOverload.length} day(s) exceed the 25-post limit for Weekly Sermon Planner:</p>
            {weeklyOverload.map((day) => (
              <div key={day.dayIndex} style={{ background: '#1a0a0a', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{day.dayName}</span>
                <span style={{ color: '#fca5a5', fontSize: 14 }}>{day.count} posts — <strong style={{ color: '#ef4444' }}>{day.excess} excess</strong></span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button style={{ ...styles.smallButton, background: busy || loadBalancing ? '#334155' : '#1e3a5f', color: busy || loadBalancing ? '#64748b' : '#60a5fa' }} disabled={busy || loadBalancing} onClick={checkWeeklyOverload}>🔄 Refresh Load Check</button>
          <button style={{ ...styles.smallButton, background: busy || loadBalancing || weeklyOverload.length === 0 ? '#334155' : '#7c2d12', color: busy || loadBalancing || weeklyOverload.length === 0 ? '#64748b' : '#fdba74', opacity: weeklyOverload.length === 0 ? 0.5 : 1 }} disabled={busy || loadBalancing || weeklyOverload.length === 0} onClick={balanceWeeklyLoad}>{loadBalancing ? '⟳ Balancing...' : '⚖️ Balance Weekly Load'}</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>Only Weekly Sermon Planner excess posts are moved to draft. Birthday campaigns and special posts are protected.</p>
      </div>

      <div style={styles.card}>
        <h3>🚀 Sunday Workflow Command</h3>
        <ol style={{ paddingLeft: 20, fontSize: 14, color: '#e2e8f0' }}>
          <li>Paste up to 7 sermons in the Weekly Planner.</li>
          <li>Click <strong>Generate Full Weekly Plan</strong>.</li>
          <li>System generates 175 posts smart-distributed across <strong>next Monday-Sunday</strong> — all sermons appear every day.</li>
          <li>Publishing Center Auto Publisher handles posting during the week.</li>
        </ol>
        <div style={{ marginTop: 15, padding: 12, background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8 }}>
          <p style={{ color: '#60a5fa', fontWeight: 'bold', margin: '0 0 5px' }}>🛡 Active Protection</p>
          <p style={{ color: '#cbd5e1', fontSize: 13, margin: 0 }}>Hard Daily Capacity Guard active: max 25 Weekly Sermon Planner posts per day.</p>
        </div>
        <button style={{ ...styles.actionButton, background: busy ? '#334155' : undefined }} disabled={busy} onClick={generateSundayWorkflowPlan}>
          {busy ? 'Working...' : '🚀 Generate Full Weekly Plan'}
        </button>
        <p style={{ marginTop: 10, fontSize: 13, color: '#eab308' }}>
          Smart Distributed: all sermons appear across the week. Posts start <strong>next Monday at 6am</strong> — safe to run any day including Sunday.
        </p>
      </div>

      <div style={styles.card}>
        <h3>🩹 Generate Remaining Days Only</h3>
        <p style={{ fontSize: 14, color: '#cbd5e1' }}>Fill only the missing coverage days for next week. Generates 25 posts per missing day with all sermons distributed, starting each day at 6:00 AM with 25-minute intervals.</p>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Days already covered are skipped automatically via a live Supabase check before generation.</p>
        {missingCoverageDays.length === 0 ? (
          <p style={{ color: '#22c55e', fontWeight: 'bold', marginTop: 12 }}>✅ All 7 days are already covered. Nothing to fill.</p>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#e2e8f0', marginTop: 12, marginBottom: 8 }}>{missingCoverageDays.length} day(s) still need content:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {missingCoverageDays.map((day) => (
                <span key={day} style={{ background: '#450a0a', color: '#fca5a5', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }}>{day}</span>
              ))}
            </div>
            <button style={{ ...styles.actionButton, background: busy || remainingDaysGenerating ? '#334155' : '#1d4ed8', color: 'white' }} disabled={busy || remainingDaysGenerating || missingCoverageDays.length === 0} onClick={generateRemainingDaysOnly}>
              {remainingDaysGenerating ? '⟳ Generating...' : `🩹 Fill ${missingCoverageDays.length} Missing Day(s) — ${missingCoverageDays.length * 25} Posts`}
            </button>
          </>
        )}
      </div>

      {sundayWorkflowSummary && (
        <div style={styles.card}>
          <h3>✅ Last Sunday Workflow Summary</h3>
          <p><strong>Sermons Used:</strong> {sundayWorkflowSummary.sermonsCount}</p>
          <p><strong>Posts Inserted:</strong> {sundayWorkflowSummary.totalPosts}</p>
          <p><strong>Days Skipped:</strong> {sundayWorkflowSummary.skippedDays}</p>
          <p><strong>Partial Days Filled:</strong> {sundayWorkflowSummary.partialDays}</p>
          <p><strong>Week Window:</strong> {sundayWorkflowSummary.from} → {sundayWorkflowSummary.to}</p>
          <p style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>Use the Publishing Center to monitor how these posts are going out in real time.</p>
        </div>
      )}

      <div style={styles.card}>
        <h3>Quick Links</h3>
        <button style={styles.smallButton} onClick={() => setActiveTab('weekly')}>Open Weekly Planner</button>
        <button style={styles.smallButton} onClick={() => setActiveTab('publishing')}>Open Publishing Center</button>
      </div>
    </div>
  )
}
