export default function Profile({
  selectedMinister,
  setActiveTab,
  getMinisterName,
  getMinisterMinistry,
  getBirthday,
  busy,
  generateBirthdayPost,
  generateBirthdayCampaign,
  styles,
}) {
  return (
    <div>
      <button style={styles.backButton} onClick={() => setActiveTab('ministers')}>← Back to Ministers</button>
      <div style={styles.profileCard}>
        <h2>{getMinisterName(selectedMinister)}</h2>
        <h3>{getMinisterMinistry(selectedMinister)}</h3>
        <div style={styles.profileSection}>
          <p><strong>Country:</strong> {selectedMinister.country || 'Not added'}</p>
          <p><strong>Birthday:</strong> {getBirthday(selectedMinister)}</p>
          <p><strong>Status:</strong> {selectedMinister.status || 'Active / Not specified'}</p>
        </div>
        <div style={styles.profileSection}><h3>📝 Biography</h3><p>{selectedMinister.biography || selectedMinister.bio || 'Biography not added yet.'}</p></div>
        <button style={styles.actionButton} disabled={busy} onClick={() => generateBirthdayPost(selectedMinister)}>Generate Birthday Post</button>
        <button style={styles.actionButton} disabled={busy} onClick={() => generateBirthdayCampaign(selectedMinister)}>Generate 5-Step Birthday Campaign</button>
      </div>
    </div>
  )
}