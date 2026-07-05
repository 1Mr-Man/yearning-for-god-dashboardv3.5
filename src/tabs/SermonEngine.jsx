export default function SermonEngine({
  sermonTitle,
    setSermonTitle,
      sermonMinister,
        setSermonMinister,
          sermonNotes,
            setSermonNotes,
              busy,
                generateSermonDailyPosts,
                  generateSermonIntelligenceV15,
                    styles,
                    }) {
                      return (
                          <div>
                                <h2>📖 Sermon Intelligence Engine</h2>
                                      <p>Generate 25 daily Christian-life posts from one sermon.</p>
                                            <div style={styles.card}>
                                                    <label>Sermon Title</label>
                                                            <input type="text" value={sermonTitle} onChange={(e) => setSermonTitle(e.target.value)} placeholder="Example: The Power of Faith" style={styles.search} />
                                                                    <label>Minister Name</label>
                                                                            <input type="text" value={sermonMinister} onChange={(e) => setSermonMinister(e.target.value)} placeholder="Example: Bishop David Oyedepo" style={styles.search} />
                                                                                    <label>Sermon Notes / Transcript</label>
                                                                                            <textarea value={sermonNotes} onChange={(e) => setSermonNotes(e.target.value)} placeholder="Paste sermon notes, transcript, prayer points, or key message here..." style={styles.textarea} />
                                                                                                    <button style={styles.actionButton} disabled={busy} onClick={generateSermonDailyPosts}>{busy ? 'Working...' : 'Generate 25 Daily Posts'}</button>
                                                                                                            <button style={styles.actionButton} disabled={busy} onClick={generateSermonIntelligenceV15}>{busy ? 'Working...' : 'Generate Sermon Intelligence v1.5'}</button>
                                                                                                                    <button style={styles.actionButton} onClick={() => { setSermonTitle(''); setSermonMinister(''); setSermonNotes('') }}>Clear Sermon Form</button>
                                                                                                                          </div>
                                                                                                                              </div>
                                                                                                                                )
                                                                                                                                }
