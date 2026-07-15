import type { Exercise, Muscle } from '../types'
import { MUSCLES } from '../types'
import { ACCENT, ACCENT_SOFT, card, chip, customBadge, screenTitle, searchInput } from './theme'

interface Props {
  exercises: Exercise[]
  search: string
  filter: Muscle | 'All'
  onSearch: (q: string) => void
  onFilter: (m: Muscle | 'All') => void
  onOpen: (id: string) => void
  onNew: () => void
}

export function ExerciseRow({
  ex,
  right,
  onClick,
}: {
  ex: Exercise
  right: React.ReactNode
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '0.5px solid rgba(60,60,67,0.1)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#000' }}>{ex.name}</div>
          {ex.custom && <div style={customBadge}>CUSTOM</div>}
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(60,60,67,0.55)', marginTop: 2 }}>
          {ex.muscle} · {ex.equipment}
        </div>
      </div>
      {right}
    </div>
  )
}

export function LibraryScreen({ exercises, search, filter, onSearch, onFilter, onOpen, onNew }: Props) {
  const q = search.toLowerCase()
  const filtered = exercises.filter(
    (e) => (filter === 'All' || e.muscle === filter) && (!q || e.name.toLowerCase().includes(q)),
  )

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={screenTitle}>Exercises</div>
        <button
          onClick={onNew}
          style={{
            height: 36,
            padding: '0 14px',
            border: 'none',
            borderRadius: 18,
            background: ACCENT_SOFT,
            color: ACCENT,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New
        </button>
      </div>
      <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search exercises" style={searchInput} />
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
        {(['All', ...MUSCLES] as const).map((m) => (
          <button key={m} onClick={() => onFilter(m)} style={{ ...chip(m === filter), height: 32, borderRadius: 16, fontSize: 13.5, padding: '0 13px' }}>
            {m}
          </button>
        ))}
      </div>
      <div style={{ ...card, overflow: 'hidden' }}>
        {filtered.map((ex) => (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            onClick={() => onOpen(ex.id)}
            right={<div style={{ color: 'rgba(60,60,67,0.3)', fontSize: 19, flex: 'none' }}>›</div>}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '22px 16px', textAlign: 'center', color: 'rgba(60,60,67,0.5)', fontSize: 14 }}>
            No exercises match.
          </div>
        )}
      </div>
    </div>
  )
}
