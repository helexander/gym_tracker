import { useState } from 'react'
import type { Session } from '../types'
import { dateKeyOf, fmtMonthTitle, fmtNum, fmtSessionDate } from '../lib/stats'
import { ACCENT, TEXT_DIM, TEXT_FAINT, card, screenTitle, sectionLabel } from './theme'

interface Props {
  sessions: Session[]
  exerciseName: (id: string) => string
}

function Calendar({ sessions }: { sessions: Session[] }) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const workoutDays = new Set(
    sessions
      .filter((s) => {
        const [y, m] = s.dateKey.split('-').map(Number)
        return y === view.year && m - 1 === view.month
      })
      .map((s) => Number(s.dateKey.split('-')[2])),
  )

  const first = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const leadBlanks = (first.getDay() + 6) % 7 // Monday-start grid
  const todayKey = dateKeyOf(today)

  const cells: { label: string; bg: string; fg: string; fw: number }[] = []
  for (let i = 0; i < leadBlanks; i++) cells.push({ label: '', bg: 'transparent', fg: 'transparent', fw: 400 })
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = key === todayKey
    const hasW = workoutDays.has(d)
    const isFuture = key > todayKey
    cells.push({
      label: String(d),
      bg: isToday ? ACCENT : hasW ? '#DCEBFC' : 'transparent',
      fg: isToday ? '#FFFFFF' : hasW ? ACCENT : isFuture ? '#C2C2C8' : '#1C1C1E',
      fw: isToday || hasW ? 700 : 400,
    })
  }

  const nav = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }
  const navBtn: React.CSSProperties = {
    border: 'none',
    background: 'none',
    color: ACCENT,
    fontSize: 20,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0 8px',
    lineHeight: 1,
  }

  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#000' }}>{fmtMonthTitle(view.year, view.month)}</div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button style={navBtn} onClick={() => nav(-1)} aria-label="Previous month">‹</button>
          <button style={navBtn} onClick={() => nav(1)} aria-label="Next month">›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: TEXT_FAINT }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((c, i) => (
          <div
            key={i}
            style={{
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: c.bg,
              color: c.fg,
              fontSize: 14,
              fontWeight: c.fw,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {c.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11.5, color: 'rgba(60,60,67,0.55)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 4, background: '#DCEBFC' }} />Workout day
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 4, background: ACCENT }} />Today
        </div>
      </div>
    </div>
  )
}

export function HistoryScreen({ sessions, exerciseName }: Props) {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenTitle}>History</div>
      <Calendar sessions={sessions} />

      <div style={{ ...sectionLabel, padding: '0 4px' }}>Past Workouts</div>
      {sessions.length === 0 && (
        <div style={{ ...card, padding: '26px 18px', textAlign: 'center', color: 'rgba(60,60,67,0.55)', fontSize: 14.5, lineHeight: 1.5 }}>
          No workouts yet.<br />Finish your first workout and it will show up here.
        </div>
      )}
      {sessions.map((s) => {
        const bestLine = (se: Session['exercises'][number]) => {
          let bestKg = -1
          let bestReps = 0
          for (const st of se.sets) {
            if (st.kg > bestKg) {
              bestKg = st.kg
              bestReps = st.reps
            }
          }
          return `${bestKg} kg × ${bestReps}`
        }
        return (
          <div key={s.id} style={{ ...card, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>{s.name}</div>
              <div style={{ fontSize: 12.5, color: TEXT_FAINT }}>{fmtSessionDate(s.dateKey)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#3A3A3E', background: '#F1F1F5', borderRadius: 8, padding: '4px 9px' }}>
                {s.durationMin} min
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#3A3A3E', background: '#F1F1F5', borderRadius: 8, padding: '4px 9px' }}>
                {fmtNum(s.volumeKg)} kg
              </div>
              {s.prCount > 0 && (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#B26A00', background: '#FFF3DD', borderRadius: 8, padding: '4px 9px' }}>
                  🏆 {s.prCount} PR
                </div>
              )}
            </div>
            <div style={{ height: 0.5, background: 'rgba(60,60,67,0.12)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.exercises.filter((se) => se.sets.length > 0).map((se, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
                  <div style={{ color: '#1C1C1E' }}>{se.sets.length} × {exerciseName(se.exerciseId)}</div>
                  <div style={{ color: 'rgba(60,60,67,0.55)', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{bestLine(se)}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {sessions.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: TEXT_DIM, padding: '4px 0 8px' }}>
          {sessions.length} workout{sessions.length === 1 ? '' : 's'} — full history, always free
        </div>
      )}
    </div>
  )
}
