export default function ContentCalendar({
  calendarStats,
  calendarViewMode,
  setCalendarViewMode,
  getContentCalendarStats,
  styles,
}) {
  const nextWeekCounts = calendarStats.nextWeekCounts || [];
  const nextWeekPosts = calendarStats.nextWeekPosts || [];
  const emptyDaysNextWeek = calendarStats.emptyDaysNextWeek || [];
  const heavyDaysNextWeek = calendarStats.heavyDaysNextWeek || [];

  return (
    <div>
      <h2 style={styles.subtitle}>📅 Content Calendar v1</h2>

      <div style={styles.filterBox}>
        <button
          style={
            calendarViewMode === 'today'
              ? styles.activeFilterButton
              : styles.smallButton
          }
          onClick={() => setCalendarViewMode('today')}
        >
          Today
        </button>
        <button
          style={
            calendarViewMode === 'week'
              ? styles.activeFilterButton
              : styles.smallButton
          }
          onClick={() => setCalendarViewMode('week')}
        >
          This Week
        </button>
        <button
          style={
            calendarViewMode === 'nextWeek'
              ? styles.activeFilterButton
              : styles.smallButton
          }
          onClick={() => setCalendarViewMode('nextWeek')}
        >
          Next Week
        </button>
        <button
          style={
            calendarViewMode === 'campaigns'
              ? styles.activeFilterButton
              : styles.smallButton
          }
          onClick={() => setCalendarViewMode('campaigns')}
        >
          Campaigns
        </button>
        <button style={styles.smallButton} onClick={getContentCalendarStats}>
          🔄 Refresh
        </button>
      </div>

      <div style={styles.missionGrid}>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>📆</div>
          <div style={styles.missionLabel}>Today</div>
          <div style={styles.missionValue}>
            {calendarStats.todayPosts.length}
          </div>
          <div style={styles.missionSub}>posts</div>
        </div>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>🗓️</div>
          <div style={styles.missionLabel}>This Week</div>
          <div style={styles.missionValue}>
            {calendarStats.weekPosts.length}
          </div>
          <div style={styles.missionSub}>posts</div>
        </div>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>⏭️</div>
          <div style={styles.missionLabel}>Next Week</div>
          <div style={styles.missionValue}>{nextWeekPosts.length}</div>
          <div style={styles.missionSub}>posts</div>
        </div>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>🎯</div>
          <div style={styles.missionLabel}>Campaigns</div>
          <div style={styles.missionValue}>
            {calendarStats.campaignPosts.length}
          </div>
          <div style={styles.missionSub}>posts</div>
        </div>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>🙏</div>
          <div style={styles.missionLabel}>Prayer</div>
          <div style={styles.missionValue}>
            {calendarStats.prayerPosts.length}
          </div>
          <div style={styles.missionSub}>posts</div>
        </div>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>📖</div>
          <div style={styles.missionLabel}>Sermon</div>
          <div style={styles.missionValue}>
            {calendarStats.sermonPosts.length}
          </div>
          <div style={styles.missionSub}>posts</div>
        </div>
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>🎂</div>
          <div style={styles.missionLabel}>Birthday</div>
          <div style={styles.missionValue}>
            {calendarStats.birthdayPosts.length}
          </div>
          <div style={styles.missionSub}>posts</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>🩺 Calendar Health</h3>
        {calendarStats.emptyDaysThisWeek.length === 0 &&
          calendarStats.heavyDaysThisWeek.length === 0 &&
          emptyDaysNextWeek.length === 0 &&
          heavyDaysNextWeek.length === 0 && (
            <p style={{ color: '#22c55e', margin: 0 }}>
              ✅ Healthy weekly calendar
            </p>
          )}
        {calendarStats.emptyDaysThisWeek.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#fbbf24', margin: '4px 0' }}>
              ⚠️ Empty days (this week):
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1' }}>
              {calendarStats.emptyDaysThisWeek.map((d, i) => (
                <li key={i}>{d.label}</li>
              ))}
            </ul>
          </div>
        )}
        {calendarStats.heavyDaysThisWeek.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#f87171', margin: '4px 0' }}>
              🔥 Heavy days this week (&gt; 25 posts):
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1' }}>
              {calendarStats.heavyDaysThisWeek.map((d, i) => (
                <li key={i}>
                  {d.label} — {d.scheduled + d.published} posts
                </li>
              ))}
            </ul>
          </div>
        )}
        {emptyDaysNextWeek.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#fbbf24', margin: '4px 0' }}>
              ⚠️ Empty days (next week):
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1' }}>
              {emptyDaysNextWeek.map((d, i) => (
                <li key={i}>{d.label}</li>
              ))}
            </ul>
          </div>
        )}
        {heavyDaysNextWeek.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#f87171', margin: '4px 0' }}>
              🔥 Heavy days next week (&gt; 25 posts):
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1' }}>
              {heavyDaysNextWeek.map((d, i) => (
                <li key={i}>
                  {d.label} — {d.scheduled + d.published} posts
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {calendarViewMode === 'today' && (
        <div>
          <div style={styles.statsBar}>
            <div style={styles.statPill}>
              📤 Scheduled: {calendarStats.todayCounts.scheduled}
            </div>
            <div style={styles.statPill}>
              ✅ Published: {calendarStats.todayCounts.published}
            </div>
            <div style={styles.statPill}>
              📝 Draft: {calendarStats.todayCounts.draft}
            </div>
            <div style={styles.statPill}>
              ❌ Failed: {calendarStats.todayCounts.failed}
            </div>
          </div>

          {['scheduled', 'published', 'draft', 'failed'].map((status) => {
            const items = calendarStats.todayPosts.filter(
              (p) => p.status === status
            );
            if (items.length === 0) return null;
            const badgeColor =
              status === 'published'
                ? '#22c55e'
                : status === 'scheduled'
                ? '#3b82f6'
                : status === 'failed'
                ? '#ef4444'
                : '#94a3b8';
            return (
              <div key={status} style={styles.card}>
                <h3 style={{ marginTop: 0, textTransform: 'capitalize' }}>
                  {status} ({items.length})
                </h3>
                {items.map((p) => {
                  const d =
                    p.status === 'published'
                      ? p.published_at || p.updated_at
                      : p.scheduled_at || p.updated_at;
                  const time = d
                    ? new Date(d).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';
                  return (
                    <div key={p.id} style={styles.calendarItem}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              background: badgeColor,
                              color: '#0f172a',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                            }}
                          >
                            {status}
                          </span>
                          <strong>{time}</strong>
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>
                            {p.platform || '—'}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>
                            {p.content_type || '—'}
                          </span>
                        </div>
                        <span style={{ color: '#cbd5e1', fontSize: 13 }}>
                          {p.minister_name || '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {calendarStats.todayPosts.length === 0 && (
            <div style={styles.card}>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                No posts scheduled or published today.
              </p>
            </div>
          )}
        </div>
      )}

      {calendarViewMode === 'week' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {calendarStats.weekCounts.map((d, i) => (
            <div
              key={i}
              style={{
                ...styles.card,
                marginBottom: 0,
                borderColor: d.heavy
                  ? '#7f1d1d'
                  : d.empty
                  ? '#78350f'
                  : '#334155',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>{d.label}</h3>
              <div
                style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}
              >
                {d.total}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 13,
                  color: '#cbd5e1',
                }}
              >
                <div>📤 Scheduled: {d.scheduled}</div>
                <div>✅ Published: {d.published}</div>
                <div>❌ Failed: {d.failed}</div>
                <div>🎯 Campaign/Birthday: {d.campaignOrBirthday}</div>
              </div>
              {d.heavy && (
                <p
                  style={{
                    color: '#f87171',
                    marginTop: 8,
                    marginBottom: 0,
                    fontSize: 12,
                  }}
                >
                  🔥 Heavy day
                </p>
              )}
              {d.empty && (
                <p
                  style={{
                    color: '#fbbf24',
                    marginTop: 8,
                    marginBottom: 0,
                    fontSize: 12,
                  }}
                >
                  ⚠️ Empty day
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {calendarViewMode === 'nextWeek' && (
        <div>
          {nextWeekCounts.length === 0 && (
            <div style={styles.card}>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                No data for next week yet. Run Sunday Workflow to populate.
              </p>
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {nextWeekCounts.map((d, i) => (
              <div
                key={i}
                style={{
                  ...styles.card,
                  marginBottom: 0,
                  borderColor: d.heavy
                    ? '#7f1d1d'
                    : d.empty
                    ? '#78350f'
                    : '#334155',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>{d.label}</h3>
                <div
                  style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}
                >
                  {d.total}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontSize: 13,
                    color: '#cbd5e1',
                  }}
                >
                  <div>📤 Scheduled: {d.scheduled}</div>
                  <div>✅ Published: {d.published}</div>
                  <div>❌ Failed: {d.failed}</div>
                  <div>🎯 Campaign/Birthday: {d.campaignOrBirthday}</div>
                </div>
                {d.heavy && (
                  <p
                    style={{
                      color: '#f87171',
                      marginTop: 8,
                      marginBottom: 0,
                      fontSize: 12,
                    }}
                  >
                    🔥 Heavy day
                  </p>
                )}
                {d.empty && (
                  <p
                    style={{
                      color: '#fbbf24',
                      marginTop: 8,
                      marginBottom: 0,
                      fontSize: 12,
                    }}
                  >
                    ⚠️ Empty day
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {calendarViewMode === 'campaigns' && (
        <div>
          {calendarStats.campaignPosts.length === 0 && (
            <div style={styles.card}>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                No campaign or birthday posts found.
              </p>
            </div>
          )}
          {Object.entries(
            calendarStats.campaignPosts.reduce((acc, p) => {
              const key = p.minister_name || 'Unassigned';
              if (!acc[key]) acc[key] = [];
              acc[key].push(p);
              return acc;
            }, {})
          ).map(([minister, items]) => (
            <div key={minister} style={styles.card}>
              <h3 style={{ marginTop: 0 }}>
                🎯 {minister} ({items.length})
              </h3>
              {items.map((p) => {
                const d = p.scheduled_at || p.published_at || p.updated_at;
                const when = d
                  ? new Date(d).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';
                const badgeColor =
                  p.status === 'published'
                    ? '#22c55e'
                    : p.status === 'scheduled'
                    ? '#3b82f6'
                    : p.status === 'failed'
                    ? '#ef4444'
                    : '#94a3b8';
                return (
                  <div key={p.id} style={styles.calendarItem}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            background: badgeColor,
                            color: '#0f172a',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.status || '—'}
                        </span>
                        <strong>{when}</strong>
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>
                          {p.platform || '—'}
                        </span>
                      </div>
                      {p.campaign_stage && (
                        <span
                          style={{
                            background: '#1e3a5f',
                            color: '#60a5fa',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 'bold',
                          }}
                        >
                          {p.campaign_stage}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      {p.content_type || '—'} · {p.ministry_name || '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
