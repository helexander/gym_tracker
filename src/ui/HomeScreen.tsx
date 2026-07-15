import type { Routine, Session } from '../types'
import { dateKeyOf, fmtHeaderDate, fmtNum, fmtSessionDate, parseKey, startOfWeek } from '../lib/stats'
import { ACCENT, ACCENT_SOFT, TEXT_DIM, TEXT_FAINT, sectionLabel, statCard } from './theme'

interface Props {
  sessions: Session[]
  routines: Routine[]
  exerciseName: (id: string) => string
  onStartEmpty: () => void
  onStartRoutine: (r: Routine) => void
  onOpenSync: () => void
}

function lastDoneLabel(sessions: Session[], routineName: string): string {
  const s = sessions.find((x) => x.name === routineName)
  if (!s) return 'never done'
  const today = dateKeyOf(new Date())
  if (s.dateKey === today) return 'today'
  const days = Math.round((parseKey(today).getTime() - parseKey(s.dateKey).getTime()) / 86400000)
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  return fmtSessionDate(s.dateKey)
}

export function HomeScreen({ sessions, routines, exerciseName, onStartEmpty, onStartRoutine, onOpenSync }: Props) {
  const now = new Date()
  const weekStartKey = dateKeyOf(startOfWeek(now))
  const wk = sessions.filter((s) => s.dateKey >= weekStartKey)
  const wkVol = wk.reduce((a, s) => a + s.volumeKg, 0)
  const wkSets = wk.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0), 0)

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {fmtHeaderDate(now)}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 0.2, color: '#000', lineHeight: 1.2 }}>Workout</div>
        </div>
        <button
          onClick={onOpenSync}
          aria-label="Backup & sync"
          style={{ border: 'none', background: '#FFFFFF', width: 38, height: 38, borderRadius: 19, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginBottom: 4 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M7 18 a4.5 4.5 0 0 1 -0.5 -8.97 A6 6 0 0 1 18.2 10.6 A4 4 0 0 1 17.5 18 Z"
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={statCard}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#000', fontVariantNumeric: 'tabular-nums' }}>{wk.length}</div>
          <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 2 }}>workouts this week</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#000', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(wkVol)}</div>
          <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 2 }}>kg volume</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#000', fontVariantNumeric: 'tabular-nums' }}>{wkSets}</div>
          <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 2 }}>sets logged</div>
        </div>
      </div>

      <button
        onClick={onStartEmpty}
        style={{
          height: 50,
          border: 'none',
          borderRadius: 14,
          background: ACCENT,
          color: '#FFFFFF',
          fontSize: 17,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Start Empty Workout
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...sectionLabel, padding: '4px 4px 0' }}>My Routines</div>
        {routines.map((r) => (
          <div key={r.id} style={{ background: '#FFFFFF', borderRadius: 18, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: TEXT_FAINT }}>{lastDoneLabel(sessions, r.name)}</div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.45, color: TEXT_DIM }}>
              {r.exerciseIds.map(exerciseName).join(', ')}
            </div>
            <button
              onClick={() => onStartRoutine(r)}
              style={{
                height: 38,
                border: 'none',
                borderRadius: 11,
                background: ACCENT_SOFT,
                color: ACCENT,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              Start Routine
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
