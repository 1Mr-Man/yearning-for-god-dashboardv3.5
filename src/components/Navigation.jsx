// ASCII-safe grouped navigation for Yearning for God.
// Drop-in replacement for: src/components/Navigation.jsx
// Uses plain text icons to reduce phone/WPS emoji corruption.

import React from 'react'
import fallbackStyles from '../styles/styles'

export default function Navigation({ activeTab, setActiveTab, styles = fallbackStyles }) {
  const groups = [
    {
      title: 'Core',
      tabs: [
        { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
        { id: 'daily-command', label: 'Daily Command', icon: 'DC' },
        { id: 'launch-readiness', label: 'Launch Readiness', icon: 'LR' },
        { id: 'launch-week-starter', label: 'Launch Week Starter', icon: 'LW' },
        { id: 'queue', label: 'Posting Queue', icon: 'QU' },
        { id: 'publishing', label: 'Publishing Engine', icon: 'PB' },
        { id: 'platform-readiness', label: 'Platform Readiness', icon: 'PL' },
        { id: 'posting-plan', label: 'Posting Plan', icon: 'PP' },
        { id: 'music-planner', label: 'Music Planner', icon: 'MU' },
        { id: 'quotes-planner', label: 'Quotes Planner', icon: 'QT' },
        { id: 'weekly-theme', label: 'Weekly Theme', icon: 'WT' },
        { id: 'weekly-calendar', label: 'Weekly Calendar', icon: 'WC' },
        { id: 'repurposing-engine', label: 'Repurposing Engine', icon: 'RE' },
        { id: 'production-sprint', label: 'Production Sprint', icon: 'PS' },
        { id: 'stats-follow-up', label: 'Stats Follow-Up', icon: 'SF' },
        { id: 'content-calendar', label: 'Content Calendar', icon: 'CA' },
      ],
    },
    {
      title: 'Planning',
      tabs: [
        { id: 'sunday-workflow', label: 'Sunday Workflow', icon: 'SU' },
        { id: 'weekly', label: 'Weekly Planner', icon: 'WK' },
        { id: 'planner', label: 'Daily Planner', icon: 'DA' },
        { id: 'youtube-sermons', label: 'YouTube Sermons', icon: 'YT' },
        { id: 'campaign-planner', label: 'Campaign Planner', icon: 'CP' },
      ],
    },
    {
      title: 'Engines',
      tabs: [
        { id: 'prayer', label: 'Prayer Engine', icon: 'PR' },
        { id: 'sermon', label: 'Sermon Engine', icon: 'SE' },
        { id: 'birthdays', label: 'Birthday Campaigns', icon: 'BD' },
      ],
    },
    {
      title: 'Management',
      tabs: [
        { id: 'ministers', label: 'Ministers Catalog', icon: 'MN' },
        { id: 'minister-updates', label: 'Minister Updates', icon: 'UP' },
        { id: 'social-accounts', label: 'Social Accounts', icon: 'AC' },
        { id: 'media-library', label: 'Media Library', icon: 'ML' },
      ],
    },
    {
      title: 'Growth',
      tabs: [
        { id: 'analytics', label: 'Analytics', icon: 'AN' },
        { id: 'growth-tracker', label: 'Growth Tracker', icon: 'GT' },
        { id: 'monetization', label: 'Monetization', icon: 'MO' },
      ],
    },
  ]

  const baseButton = styles.navButton || styles.button
  const activeButton = styles.activeNavButton || {}

  return (
    <div style={styles.navShell || styles.nav}>
      <div style={styles.studioBadgeRow}>
        <div style={styles.studioBrand}>
          <div style={styles.studioIcon}>YFG</div>
          <div>
            <p style={styles.studioName}>Yearning for God Studio</p>
            <p style={styles.studioSub}>Christian Media Growth Dashboard</p>
          </div>
        </div>
        <div style={styles.statusPill}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: '#10b981', display: 'inline-block' }} />
          Database Connected
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.title} style={styles.navSection}>
          <p style={styles.navSectionTitle}>{group.title}</p>
          <div style={styles.navGrid}>
            {group.tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{ ...baseButton, ...(isActive ? activeButton : {}) }}
                >
                  <span style={styles.navIcon}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}