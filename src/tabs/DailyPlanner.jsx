export default function DailyPlanner({
  todayScheduledCount,
    todayPublishedCount,
      todayDraftCount,
        todayPrayerCount,
          todaySermonCount,
            todayBirthdayCount,
              styles,
              }) {
                return (
                    <div>
                          <h2>📅 Daily Content Planner</h2>
                                <p>Today's content readiness and publishing overview.</p>
                                      <div style={styles.card}><h3>Today's Content Summary</h3><p><strong>Scheduled:</strong> {todayScheduledCount}</p><p><strong>Published:</strong> {todayPublishedCount}</p><p><strong>Draft:</strong> {todayDraftCount}</p></div>
                                            <div style={styles.card}><h3>Content Mix Today</h3><p><strong>Prayer Posts:</strong> {todayPrayerCount}</p><p><strong>Sermon Posts:</strong> {todaySermonCount}</p><p><strong>Birthday Posts:</strong> {todayBirthdayCount}</p></div>
                                                  <div style={styles.card}><h3>Readiness Check</h3><p>{todayPrayerCount >= 5 ? '✅ Prayer Pack Ready' : '⚠️ Prayer Pack Missing'}</p><p>{todaySermonCount >= 25 ? '✅ Sermon Pack Ready' : '⚠️ Sermon Pack Missing'}</p><p>{todayScheduledCount >= 25 ? '✅ 25+ Posts Scheduled Today' : `⚠️ Only ${todayScheduledCount} scheduled today`}</p></div>
                                                        <div style={styles.card}><h3>Recommended Action</h3>{todayScheduledCount >= 25 ? (<p>✅ Today's content plan is ready.</p>) : (<p>⚠️ Generate a prayer pack or sermon pack to complete today's content plan.</p>)}</div>
                                                            </div>
                                                              )
                                                              }