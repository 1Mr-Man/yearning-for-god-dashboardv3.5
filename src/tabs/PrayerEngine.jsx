export default function PrayerEngine({
  todayPrayerPackExists,
  prayerTheme,
  setPrayerTheme,
  selectedTone,
  setSelectedTone,
  ministerTones,
  busy,
  generatePrayerPost,
  generateAndSchedulePrayerPack,
  generatedPrayer,
  copyText,
  savePrayerToQueue,
  styles,
}) {
  return (
    <div>
      <h2>🙏 Prayer Engine</h2>
      <p>Generate daily "Let's Pray, Let's Prophesy" content.</p>
      {todayPrayerPackExists ? (<p style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Today's Prayer Pack Already Scheduled</p>) : (<p style={{ color: '#eab308', fontWeight: 'bold' }}>⚠️ Today's Prayer Pack Not Yet Scheduled</p>)}
      <div style={styles.card}>
        <label>Prayer Theme</label>
        <input type="text" value={prayerTheme} onChange={(e) => setPrayerTheme(e.target.value)} style={styles.search} />
        <label>Ministerial Tone</label>
        <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)} style={styles.dateInput}>
          {ministerTones.length > 0 ? ministerTones.map((tone) => (<option key={tone.id} value={tone.minister_name}>{tone.minister_name}</option>)) : (<><option value="Prophetic">Prophetic</option><option value="Faith">Faith</option><option value="Revival">Revival</option><option value="Apostolic">Apostolic</option><option value="Worship">Worship</option><option value="Teaching">Teaching</option></>)}
        </select>
        <button style={styles.actionButton} disabled={busy} onClick={generatePrayerPost}>{busy ? 'Working...' : "Generate Today's Prayer Post"}</button>
        <button style={styles.actionButton} disabled={busy} onClick={generateAndSchedulePrayerPack}>{busy ? 'Working...' : "Generate & Schedule Today's Prayer Pack"}</button>
      </div>
      {generatedPrayer && (
        <div>
          {[
            { title: "🙏 Let's Pray", text: generatedPrayer.prayerText, platform: 'Facebook', type: 'Prayer Post' },
            { title: "🔥 Let's Prophesy", text: generatedPrayer.prophecyText, platform: 'Facebook', type: 'Prophetic Declaration' },
            { title: '📝 Caption', text: generatedPrayer.caption, platform: 'Instagram', type: 'Prayer Caption' },
            { title: '🎨 Image Prompt', text: generatedPrayer.imagePrompt, platform: 'AI Poster', type: 'Prayer Image Prompt' },
            { title: '🎤 Voice-over Script', text: generatedPrayer.voiceoverScript, platform: 'Video', type: 'Prayer Voice-over Script' },
          ].map((item) => (
            <div key={item.type} style={styles.generatedBox}>
              <h3>{item.title}</h3>
              <textarea value={item.text} readOnly style={styles.textarea} />
              <button style={styles.copyButton} onClick={() => copyText(item.text)}>Copy</button>
              <button style={styles.copyButton} disabled={busy} onClick={() => savePrayerToQueue(item.platform, item.type, item.text)}>Save to Queue</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}