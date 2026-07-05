export default function CampaignPlanner({
  campaignPlannerStats,
  campaignForm,
  setCampaignForm,
  saveCampaignPlan,
  applyCampaignTemplate,
  updateCampaignStatus,
  generateCampaignPosts,
  styles,
}) {
  return (
    <div>
      <h2 style={styles.subtitle}>🎯 Campaign Planner v1</h2>

      <div style={styles.missionGrid}>
        <div style={styles.missionCard}><div style={styles.missionIcon}>📚</div><div style={styles.missionLabel}>Total</div><div style={styles.missionValue}>{campaignPlannerStats.total}</div><div style={styles.missionSub}>campaigns</div></div>
        <div style={styles.missionCard}><div style={styles.missionIcon}>🗒️</div><div style={styles.missionLabel}>Planned</div><div style={styles.missionValue}>{campaignPlannerStats.planned}</div><div style={styles.missionSub}>upcoming</div></div>
        <div style={styles.missionCard}><div style={styles.missionIcon}>🚀</div><div style={styles.missionLabel}>Active</div><div style={styles.missionValue}>{campaignPlannerStats.active}</div><div style={styles.missionSub}>running</div></div>
        <div style={styles.missionCard}><div style={styles.missionIcon}>✅</div><div style={styles.missionLabel}>Completed</div><div style={styles.missionValue}>{campaignPlannerStats.completed}</div><div style={styles.missionSub}>finished</div></div>
        <div style={styles.missionCard}><div style={styles.missionIcon}>⏸️</div><div style={styles.missionLabel}>Paused</div><div style={styles.missionValue}>{campaignPlannerStats.paused}</div><div style={styles.missionSub}>on hold</div></div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>✨ Quick Templates</h3>
        <div style={styles.filterBox}>
          <button style={styles.smallButton} onClick={() => applyCampaignTemplate({ campaign_type: 'New Month Campaign', campaign_name: 'New Month of Divine Help', theme: 'Divine Help' })}>New Month</button>
          <button style={styles.smallButton} onClick={() => applyCampaignTemplate({ campaign_type: 'Prayer Week', campaign_name: '7 Days of Prayer and Prophetic Declarations', theme: 'Prophetic Declarations' })}>Prayer Week</button>
          <button style={styles.smallButton} onClick={() => applyCampaignTemplate({ campaign_type: 'Scripture Series', campaign_name: '7 Days in Psalm 42', theme: 'Psalm 42', scripture_reference: 'Psalm 42' })}>Scripture Series</button>
          <button style={styles.smallButton} onClick={() => applyCampaignTemplate({ campaign_type: 'Teaching Series', campaign_name: 'Kingdom Identity in Christ', theme: 'Kingdom Identity' })}>Teaching Series</button>
          <button style={styles.smallButton} onClick={() => applyCampaignTemplate({ campaign_type: 'Revival Week', campaign_name: 'Return to the Secret Place', theme: 'Secret Place' })}>Revival Week</button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>📝 Create Campaign</h3>
        <input type="text" placeholder="Campaign Name" value={campaignForm.campaign_name} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })} style={styles.search} />
        <select value={campaignForm.campaign_type} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_type: e.target.value })} style={styles.search}>
          {['New Month Campaign','Prayer Week','Revival Week','Scripture Series','Teaching Series','Conference Campaign','Fasting and Prayer','Easter Campaign','Christmas Campaign','Custom Campaign'].map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
        <input type="text" placeholder="Theme (e.g. Divine Help)" value={campaignForm.theme} onChange={(e) => setCampaignForm({ ...campaignForm, theme: e.target.value })} style={styles.search} />
        <input type="text" placeholder="Scripture Reference (e.g. Psalm 42)" value={campaignForm.scripture_reference} onChange={(e) => setCampaignForm({ ...campaignForm, scripture_reference: e.target.value })} style={styles.search} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <input type="date" value={campaignForm.start_date} onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })} style={styles.dateInput} />
          <input type="date" value={campaignForm.end_date} onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })} style={styles.dateInput} />
        </div>
        <input type="text" placeholder="Target Platforms (e.g. Instagram, TikTok, YouTube)" value={campaignForm.target_platforms} onChange={(e) => setCampaignForm({ ...campaignForm, target_platforms: e.target.value })} style={styles.search} />
        <input type="text" placeholder="Content Goal (e.g. 25 posts, 7 reels)" value={campaignForm.content_goal} onChange={(e) => setCampaignForm({ ...campaignForm, content_goal: e.target.value })} style={styles.search} />
        <textarea placeholder="Notes, prayer points, sermon angles, hashtags..." value={campaignForm.notes} onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })} style={styles.textarea} />
        <select value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })} style={styles.search}>
          {['planned','active','completed','paused'].map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <button style={styles.actionButton} onClick={saveCampaignPlan}>💾 Save Campaign</button>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>📋 Campaigns</h3>
        {campaignPlannerStats.campaigns.length === 0 && (
          <p style={{ margin: 0, color: '#94a3b8' }}>No campaigns yet. Create one above.</p>
        )}
        {campaignPlannerStats.campaigns.map((c) => {
          const badgeColor = c.status === 'active' ? '#22c55e' : c.status === 'planned' ? '#3b82f6' : c.status === 'paused' ? '#f59e0b' : '#94a3b8'
          return (
            <div key={c.id} style={styles.calendarItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ color: '#f1f5f9', fontSize: 15 }}>{c.campaign_name}</strong>
                <span style={{ background: badgeColor, color: '#0f172a', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>{c.status || 'planned'}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                <span>🏷 {c.campaign_type || '—'}</span>
                {c.theme && <span>🎨 {c.theme}</span>}
                {c.scripture_reference && <span>📖 {c.scripture_reference}</span>}
                <span>📅 {c.start_date || '—'} → {c.end_date || '—'}</span>
                {c.target_platforms && <span>📡 {c.target_platforms}</span>}
                {c.content_goal && <span>🎯 {c.content_goal}</span>}
              </div>
              {c.notes && <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>"{c.notes}"</p>}
              <div style={styles.filterBox}>
                <button style={styles.smallButton} onClick={() => updateCampaignStatus(c.id, 'planned')}>🗒️ Mark Planned</button>
                <button style={styles.smallButton} onClick={() => updateCampaignStatus(c.id, 'active')}>🚀 Mark Active</button>
                <button style={styles.smallButton} onClick={() => updateCampaignStatus(c.id, 'completed')}>✅ Mark Completed</button>
                <button style={styles.smallButton} onClick={() => updateCampaignStatus(c.id, 'paused')}>⏸️ Pause Campaign</button>
                <button style={styles.actionButton} onClick={() => generateCampaignPosts(c)}>🗓 Generate Campaign Posts</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}