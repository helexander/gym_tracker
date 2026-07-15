import type { Exercise, Session } from '../types'
import { bestKgFor, epley1RM, fmtNum, fmtShortDate, historyFor, lastSetsFor } from '../lib/stats'
import { ACCENT, ACCENT_SOFT, BG, TEXT_FAINT, card, customBadge } from './theme'

interface Props {
  exercise: Exercise
  sessions: Session[]
  onClose: () => void
}

export function ExerciseDetail({ exercise, sessions, onClose }: Props) {
  const hist = historyFor(sessions, exercise.id)
  const last = lastSetsFor(sessions, exercise.id)
  const bestKg = bestKgFor(sessions, exercise.id)
  const bestSet = last?.reduce((a, t) => (t.kg > (a ? a.kg : -1) ? t : a), null as null | { kg: number; reps: number })
  const e1rm = bestSet ? epley1RM(bestSet.kg, bestSet.reps) : 0
  const bestVol = hist.reduce((a, h) => Math.max(a, h.volume), 0)

  const chartHist = hist.slice(-8)
  let line = ''
  let area = ''
  let dots: { x: number; y: number }[] = []
  if (chartHist.length >= 2) {
    const kgs = chartHist.map((h) => h.topKg)
    const kmin = Math.min(...kgs)
    const pad = Math.max(...kgs) - kmin || 1
    dots = chartHist.map((h, i) => ({
      x: Math.round((12 + (i * 296) / (chartHist.length - 1)) * 10) / 10,
      y: Math.round((122 - ((h.topKg - kmin) / pad) * 100) * 10) / 10,
    }))
    line = dots.map((p) => `${p.x},${p.y}`).join(' ')
    area = `M${dots[0].x},126 ${dots.map((p) => `L${p.x},${p.y}`).join(' ')} L${dots[dots.length - 1].x},126 Z`
  }

  const statBox = (val: string, label: string) => (
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '12px 13px' }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: '#000', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      <div style={{ fontSize: 11, color: 'rgba(60,60,67,0.55)', marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 35, background: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(16px + env(safe-area-inset-top)) 16px 8px' }}>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 15.5, fontWeight: 500, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          ‹ Exercises
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ fontSize: 27, fontWeight: 700, color: '#000', lineHeight: 1.2 }}>{exercise.name}</div>
          {exercise.custom && <div style={{ ...customBadge, padding: '3px 7px' }}>CUSTOM</div>}
        </div>
        <div style={{ fontSize: 13.5, color: 'rgba(60,60,67,0.55)', marginTop: 2 }}>
          {exercise.muscle} · {exercise.equipment}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {statBox(bestKg > 0 ? String(bestKg) : '—', 'best weight (kg)')}
          {statBox(e1rm > 0 ? String(e1rm) : '—', 'est. 1RM (kg)')}
          {statBox(bestVol > 0 ? fmtNum(Math.round(bestVol)) : '—', 'session volume (kg)')}
        </div>

        {chartHist.length >= 2 ? (
          <>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#000' }}>Heaviest weight</div>
                <div style={{ fontSize: 12, color: TEXT_FAINT }}>last {chartHist.length} sessions</div>
              </div>
              <svg viewBox="0 0 320 140" style={{ width: '100%', height: 'auto', marginTop: 8, display: 'block' }}>
                <path d={area} fill={ACCENT_SOFT} />
                <polyline points={line} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {dots.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={ACCENT} stroke="#FFFFFF" strokeWidth="1.5" />
                ))}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11.5, color: TEXT_FAINT }}>
                <div>{fmtShortDate(chartHist[0].dateKey)}</div>
                <div>{fmtShortDate(chartHist[chartHist.length - 1].dateKey)}</div>
              </div>
            </div>

            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px 9px', fontSize: 15, fontWeight: 600, color: '#000' }}>Session history</div>
              {hist.slice().reverse().map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '0.5px solid rgba(60,60,67,0.1)', fontSize: 14 }}>
                  <div style={{ color: '#1C1C1E' }}>{fmtShortDate(h.dateKey)}</div>
                  <div style={{ color: 'rgba(60,60,67,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                    Top set · {h.topKg} kg × {h.topReps}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ ...card, padding: '26px 18px', textAlign: 'center', color: 'rgba(60,60,67,0.5)', fontSize: 14, lineHeight: 1.5 }}>
            {hist.length === 1
              ? 'One session logged. Charts appear from your second session.'
              : <>No sessions logged yet.<br />Charts appear after your first workout with this exercise.</>}
          </div>
        )}

        {exercise.notes && (
          <div style={{ ...card, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: TEXT_FAINT }}>NOTES</div>
            <div style={{ fontSize: 14, color: '#1C1C1E', lineHeight: 1.5, marginTop: 5 }}>{exercise.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}
