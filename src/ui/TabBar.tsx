import { ACCENT, GRAY } from './theme'

export type Tab = 'home' | 'history' | 'exercises'

export function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const fg = (t: Tab) => (tab === t ? ACCENT : GRAY)
  const btn: React.CSSProperties = {
    flex: 1,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '2px 0',
  }
  const label: React.CSSProperties = { fontSize: 10.5, fontWeight: 600 }
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        display: 'flex',
        padding: '10px 8px calc(10px + env(safe-area-inset-bottom))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(249,249,251,0.85)',
        borderTop: '0.5px solid rgba(60,60,67,0.16)',
      }}
    >
      <button style={btn} onClick={() => onTab('home')}>
        <svg width="26" height="26" viewBox="0 0 24 24">
          <path
            d="M4 10.5 L12 4 L20 10.5 V19 A1.5 1.5 0 0 1 18.5 20.5 H5.5 A1.5 1.5 0 0 1 4 19 Z"
            fill="none"
            stroke={fg('home')}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ ...label, color: fg('home') }}>Home</span>
      </button>
      <button style={btn} onClick={() => onTab('history')}>
        <svg width="26" height="26" viewBox="0 0 24 24">
          <rect x="4" y="5.5" width="16" height="14.5" rx="3" fill="none" stroke={fg('history')} strokeWidth="2" />
          <line x1="8" y1="3.5" x2="8" y2="7.5" stroke={fg('history')} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="3.5" x2="16" y2="7.5" stroke={fg('history')} strokeWidth="2" strokeLinecap="round" />
          <line x1="4.5" y1="10.5" x2="19.5" y2="10.5" stroke={fg('history')} strokeWidth="1.6" />
        </svg>
        <span style={{ ...label, color: fg('history') }}>History</span>
      </button>
      <button style={btn} onClick={() => onTab('exercises')}>
        <svg width="26" height="26" viewBox="0 0 24 24">
          <rect x="1.5" y="9" width="3.5" height="6" rx="1.2" fill={fg('exercises')} />
          <rect x="19" y="9" width="3.5" height="6" rx="1.2" fill={fg('exercises')} />
          <rect x="6" y="6.5" width="3.5" height="11" rx="1.2" fill={fg('exercises')} />
          <rect x="14.5" y="6.5" width="3.5" height="11" rx="1.2" fill={fg('exercises')} />
          <rect x="9.5" y="11" width="5" height="2" fill={fg('exercises')} />
        </svg>
        <span style={{ ...label, color: fg('exercises') }}>Exercises</span>
      </button>
    </div>
  )
}
