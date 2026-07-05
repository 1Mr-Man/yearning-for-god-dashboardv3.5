export default function WeeklyPlanner({
  weeklySermons,
  weeklySermonsFilled,
  weeklyPostCount,
  weeklyCoverageDays,
  updateWeeklySermon,
  getWeeklyPreview,
  generateSundayWorkflowPlan,
  busy,
  styles,
}) {
  return (
    <div>
      <h2>📆 Weekly Sermon Planner v2</h2>
      <p>Plan 7 sermons for the week and generate up to 175 scheduled posts.</p>
      {weeklySermons.map((sermon, index) => (
        <div key={index} style={styles.card}>
          <h3>Sermon {index + 1}</h3>
          <label>Sermon Title</label>
          <input type="text" value={sermon.title} onChange={(e) => updateWeeklySermon(index, 'title', e.target.value)} placeholder="Example: The Power of Faith" style={styles.search} />
          <label>Minister Name</label>
          <input type="text" value={sermon.minister} onChange={(e) => updateWeeklySermon(index, 'minister', e.target.value)} placeholder="Example: Apostle Joshua Selman" style={styles.search} />
          <label>Sermon Notes / Transcript</label>
          <textarea value={sermon.notes} onChange={(e) => updateWeeklySermon(index, 'notes', e.target.value)} placeholder="Paste sermon notes, transcript, quotes, prayer points, or key message here..." style={styles.textarea} />
        </div>
      ))}
      <div style={styles.card}><h3>Weekly Capacity</h3><p><strong>Sermons:</strong> {weeklySermonsFilled}</p><p><strong>Posts:</strong> {weeklyPostCount}</p><p><strong>Estimated Coverage:</strong> {weeklyCoverageDays} day(s)</p></div>
      <div style={styles.card}><h3>Weekly Schedule Preview</h3>{getWeeklyPreview().map((item) => (<p key={item.day}><strong>{item.day}:</strong> {item.posts} posts</p>))}</div>
      <button style={styles.actionButton} disabled={busy} onClick={generateSundayWorkflowPlan}>
        {busy ? 'Working...' : '🚀 Generate Smart Weekly Plan'}
      </button>
    </div>
  )
}
