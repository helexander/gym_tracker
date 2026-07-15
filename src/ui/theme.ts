import type { CSSProperties } from 'react'

export const ACCENT = '#007AFF'
export const ACCENT_SOFT = '#E7F1FF'
export const GRAY = '#8E8E93'
export const TEXT_DIM = 'rgba(60,60,67,0.6)'
export const TEXT_FAINT = 'rgba(60,60,67,0.45)'
export const GREEN = '#34C759'
export const RED = '#FF3B30'
export const BG = '#F2F2F7'

export const card: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 18,
}

export const statCard: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  padding: '12px 14px',
}

export const screenTitle: CSSProperties = {
  fontSize: 34,
  fontWeight: 700,
  color: '#000',
  lineHeight: 1.2,
}

export const sectionLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: TEXT_DIM,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}

export const chip = (active: boolean): CSSProperties => ({
  flex: 'none',
  height: 34,
  padding: '0 14px',
  border: 'none',
  borderRadius: 17,
  background: active ? ACCENT : '#FFFFFF',
  color: active ? '#FFFFFF' : '#3A3A3E',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
})

export const customBadge: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  color: ACCENT,
  background: ACCENT_SOFT,
  borderRadius: 6,
  padding: '2.5px 6px',
  flex: 'none',
}

export const searchInput: CSSProperties = {
  height: 38,
  border: 'none',
  borderRadius: 12,
  background: '#FFFFFF',
  padding: '0 14px',
  fontSize: 15,
  color: '#000',
  boxSizing: 'border-box',
  width: '100%',
}
