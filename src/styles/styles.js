// Mature dark studio UI skin for Yearning for God.
// Drop-in replacement for: src/styles/styles.js
// Keeps the same style keys your existing tabs already use.

const styles = {
  app: {
    minHeight: '100vh',
    padding: '22px 18px 42px',
    background:
      'radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 32%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.10), transparent 30%), #060813',
    color: '#f8fafc',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: 1180,
    margin: '0 auto',
  },

  title: {
    fontSize: 'clamp(34px, 8vw, 58px)',
    lineHeight: 1.02,
    margin: '18px 0 12px',
    fontWeight: 900,
    letterSpacing: '-0.055em',
    color: '#ffffff',
    textShadow: '0 18px 50px rgba(0,0,0,0.45)',
  },

  subtitle: {
    fontSize: 'clamp(20px, 5vw, 34px)',
    lineHeight: 1.15,
    margin: '0 0 26px',
    fontWeight: 850,
    letterSpacing: '-0.035em',
    color: '#f1f5f9',
    maxWidth: 760,
  },

  // Navigation shell used by the mature Navigation component.
  navShell: {
    background: 'rgba(9, 12, 25, 0.86)',
    border: '1px solid rgba(51,65,85,0.78)',
    boxShadow: '0 24px 70px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
    borderRadius: 26,
    padding: '22px 18px',
    marginBottom: 26,
    backdropFilter: 'blur(14px)',
  },

  studioBadgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 22,
  },

  studioBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  studioIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(37,99,235,0.9))',
    boxShadow: '0 18px 45px rgba(79,70,229,0.32)',
    fontSize: 22,
  },

  studioName: {
    margin: 0,
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: '-0.03em',
    color: '#ffffff',
  },

  studioSub: {
    margin: '3px 0 0',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
  },

  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 13px',
    borderRadius: 999,
    background: 'rgba(16,185,129,0.10)',
    border: '1px solid rgba(16,185,129,0.25)',
    color: '#34d399',
    fontSize: 13,
    fontWeight: 850,
    whiteSpace: 'nowrap',
  },

  navSection: {
    marginTop: 20,
  },

  navSectionTitle: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    margin: '0 0 12px 8px',
  },

  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 12,
  },

  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    width: '100%',
    minHeight: 58,
    padding: '15px 16px',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 850,
    letterSpacing: '-0.02em',
    color: '#e2e8f0',
    background: 'rgba(15,23,42,0.72)',
    border: '1px solid rgba(51,65,85,0.82)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035), 0 10px 24px rgba(0,0,0,0.16)',
    cursor: 'pointer',
    transition: 'transform 140ms ease, border-color 140ms ease, background 140ms ease',
    textAlign: 'left',
  },

  activeNavButton: {
    color: '#ffffff',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5 55%, #2563eb)',
    border: '1px solid rgba(167,139,250,0.7)',
    boxShadow: '0 18px 45px rgba(79,70,229,0.36), inset 0 1px 0 rgba(255,255,255,0.15)',
  },

  navIcon: {
    fontSize: 21,
    width: 26,
    display: 'inline-flex',
    justifyContent: 'center',
  },

  // Backward-compatible key. Some older tabs still use styles.nav/styles.button.
  nav: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 25,
  },

  button: {
    padding: '12px 18px',
    borderRadius: 14,
    fontWeight: 850,
    fontSize: 15,
    color: '#f8fafc',
    background: 'rgba(15,23,42,0.78)',
    border: '1px solid rgba(51,65,85,0.85)',
    boxShadow: '0 10px 22px rgba(0,0,0,0.18)',
    cursor: 'pointer',
  },

  card: {
    background: 'rgba(15,23,42,0.82)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 22,
    padding: 20,
    marginBottom: 15,
    boxShadow: '0 18px 50px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.035)',
  },

  search: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    borderRadius: 14,
    fontSize: 16,
    color: '#f8fafc',
    background: 'rgba(2,6,23,0.82)',
    border: '1px solid rgba(51,65,85,0.9)',
    outline: 'none',
  },

  listItem: {
    background: 'rgba(15,23,42,0.76)',
    border: '1px solid rgba(51,65,85,0.78)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
  },

  backButton: {
    marginBottom: 20,
    padding: '11px 16px',
    borderRadius: 14,
    fontWeight: 850,
    color: '#f8fafc',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(51,65,85,0.8)',
  },

  profileCard: {
    background: 'rgba(15,23,42,0.82)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 22,
    padding: 22,
    boxShadow: '0 18px 50px rgba(0,0,0,0.24)',
  },

  profileSection: {
    background: 'rgba(2,6,23,0.58)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 16,
    padding: 16,
    marginTop: 15,
  },

  actionButton: {
    width: '100%',
    padding: 13,
    marginTop: 15,
    borderRadius: 14,
    fontWeight: 850,
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    border: '1px solid rgba(167,139,250,0.55)',
  },

  generatedBox: {
    background: 'rgba(15,23,42,0.82)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  textarea: {
    width: '100%',
    minHeight: 150,
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
    color: '#f8fafc',
    background: 'rgba(2,6,23,0.82)',
    border: '1px solid rgba(51,65,85,0.9)',
    outline: 'none',
  },

  copyButton: {
    width: '100%',
    padding: 12,
    marginTop: 10,
    borderRadius: 14,
    fontWeight: 850,
    color: '#fff',
    background: 'rgba(37,99,235,0.86)',
    border: '1px solid rgba(96,165,250,0.45)',
  },

  smallButton: {
    padding: '9px 12px',
    marginRight: 6,
    marginTop: 10,
    borderRadius: 12,
    fontWeight: 850,
    color: '#f8fafc',
    background: 'rgba(15,23,42,0.82)',
    border: '1px solid rgba(51,65,85,0.82)',
  },

  deleteButton: {
    padding: '9px 12px',
    marginRight: 6,
    marginTop: 10,
    borderRadius: 12,
    fontWeight: 850,
    background: '#dc2626',
    color: 'white',
    border: '1px solid rgba(252,165,165,0.45)',
  },

  dateInput: {
    width: '100%',
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 14,
    fontSize: 15,
    color: '#f8fafc',
    background: 'rgba(2,6,23,0.82)',
    border: '1px solid rgba(51,65,85,0.9)',
  },

  filterBox: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },

  activeFilterButton: {
    padding: '9px 12px',
    marginRight: 6,
    marginTop: 10,
    borderRadius: 12,
    fontWeight: 850,
    background: '#22c55e',
    color: '#052e16',
    border: '2px solid #bbf7d0',
  },

  calendarItem: {
    background: 'rgba(2,6,23,0.58)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
  },

  missionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 15,
  },

  missionCard: {
    background: 'rgba(15,23,42,0.78)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 18,
    padding: 16,
    textAlign: 'center',
    boxShadow: '0 14px 34px rgba(0,0,0,0.18)',
  },

  missionIcon: { fontSize: 28, marginBottom: 6 },
  missionLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 850 },
  missionValue: { fontSize: 24, fontWeight: 900, marginBottom: 4, color: '#fff' },
  missionSub: { color: '#64748b', fontSize: 12, marginTop: 2 },

  statsBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
    background: 'rgba(15,23,42,0.78)',
    border: '1px solid rgba(51,65,85,0.82)',
    borderRadius: 18,
    padding: '12px 16px',
  },

  statPill: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(2,6,23,0.58)',
    border: '1px solid rgba(51,65,85,0.6)',
    borderRadius: 999,
    padding: '7px 14px',
    fontSize: 14,
    color: '#dbeafe',
    fontWeight: 750,
  },
}

export default styles