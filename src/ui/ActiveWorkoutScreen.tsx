import { useEffect, useState } from 'react'
import type { ActiveWorkout, Exercise } from '../types'
import { fmtClock } from '../lib/stats'
import { ACCENT, ACCENT_SOFT, BG, GRAY, GREEN, RED, card, searchInput } from './theme'
import { ExerciseRow } from './LibraryScreen'

interface Props {
  workout: ActiveWorkout
  exercises: Exercise[]
  onSetField: (ei: number, si: number, key: 'kg' | 'reps', val: string) => void
  onToggleSet: (ei: number, si: number) => void
  onAddSet: (ei: number) => void
  onRemoveExercise: (ei: number) => void
  onAddExercise: (id: string) => void
  onNewExercise: () => void
  onRestAdjust: (deltaSec: number) => void
  onRestSkip: () => void
  onFinish: () => void
  onDiscard: () => void
}

function RestBar({ workout, now, onRestAdjust, onRestSkip }: Pick<Props, 'workout' | 'onRestAdjust' | 'onRestSkip'> & { now: number }) {
  const left = Math.max(0, Math.ceil((workout.restEndsAt - now) / 1000))
  if (left <= 0) return null
  const pct = Math.round((left / Math.max(1, workout.restTotalSec)) * 100)
  const smallBtn = (label: string, onClick: () => void, primary = false): React.ReactElement => (
    <button
      onClick={onClick}
      style={{
        height: 34,
        padding: '0 11px',
        border: 'none',
        borderRadius: 10,
        background: primary ? ACCENT : '#FFFFFF',
        color: primary ? '#FFFFFF' : ACCENT,
        fontSize: 13.5,
        fontWeight: 700,
        cursor: 'pointer',
        flex: 'none',
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{ margin: '4px 16px 8px', background: ACCENT_SOFT, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: '#5A8FD0' }}>REST</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: ACCENT, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{fmtClock(left)}</div>
        <div style={{ height: 3.5, background: '#CBE0FA', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 2 }} />
        </div>
      </div>
      {smallBtn('−15', () => onRestAdjust(-15))}
      {smallBtn('+15', () => onRestAdjust(15))}
      {smallBtn('Skip', onRestSkip, true)}
    </div>
  )
}

function PickerSheet({
  exercises,
  onPick,
  onNewExercise,
  onClose,
}: {
  exercises: Exercise[]
  onPick: (id: string) => void
  onNewExercise: () => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = exercises.filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 45 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '72%', background: BG, borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#000' }}>Add Exercise</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={onNewExercise}
              style={{ border: 'none', background: ACCENT_SOFT, color: ACCENT, height: 30, padding: '0 12px', borderRadius: 15, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
            >
              + New
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#E4E4EA', color: '#5A5A60', width: 30, height: 30, borderRadius: 15, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
        <div style={{ padding: '0 16px 10px' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" style={searchInput} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 30px' }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            {filtered.map((ex) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                onClick={() => onPick(ex.id)}
                right={<div style={{ color: ACCENT, fontSize: 22, fontWeight: 600, flex: 'none' }}>+</div>}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ActiveWorkoutScreen(props: Props) {
  const { workout, exercises, onSetField, onToggleSet, onAddSet, onRemoveExercise, onAddExercise, onFinish, onDiscard } = props
  const [now, setNow] = useState(Date.now())
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const elapsed = Math.max(0, Math.floor((now - workout.startedAt) / 1000))
  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? '?'
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '34px 1fr 62px 62px 40px', gap: 8, alignItems: 'center' }
  const colHead: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'rgba(60,60,67,0.45)' }
  const numInput = (done: boolean): React.CSSProperties => ({
    width: '100%',
    boxSizing: 'border-box',
    border: 'none',
    background: done ? '#D3EEDD' : '#EFEFF4',
    borderRadius: 8,
    height: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
    fontVariantNumeric: 'tabular-nums',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, background: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#000', lineHeight: 1.2 }}>{workout.name}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtClock(elapsed)}</div>
        </div>
        <button
          onClick={onFinish}
          style={{ height: 38, padding: '0 18px', border: 'none', borderRadius: 19, background: GREEN, color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Finish
        </button>
      </div>

      <RestBar workout={workout} now={now} onRestAdjust={props.onRestAdjust} onRestSkip={props.onRestSkip} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {workout.exercises.length === 0 && (
          <div style={{ ...card, padding: '26px 18px', textAlign: 'center', color: 'rgba(60,60,67,0.55)', fontSize: 14.5, lineHeight: 1.5 }}>
            No exercises yet.<br />Add your first one below.
          </div>
        )}

        {workout.exercises.map((we, ei) => (
          <div key={ei} style={{ ...card, padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16.5, fontWeight: 600, color: ACCENT }}>{nameOf(we.exerciseId)}</div>
              <button
                onClick={() => onRemoveExercise(ei)}
                aria-label="Remove exercise"
                style={{ border: 'none', background: 'none', color: 'rgba(60,60,67,0.35)', fontSize: 16, cursor: 'pointer', padding: '2px 4px' }}
              >
                ✕
              </button>
            </div>
            <div style={{ ...grid, padding: '0 4px' }}>
              <div style={{ ...colHead, textAlign: 'center' }}>SET</div>
              <div style={colHead}>PREVIOUS</div>
              <div style={{ ...colHead, textAlign: 'center' }}>KG</div>
              <div style={{ ...colHead, textAlign: 'center' }}>REPS</div>
              <div style={{ ...colHead, textAlign: 'center' }}>✓</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {we.sets.map((st, si) => (
                <div key={si} style={{ ...grid, padding: '3px 4px', borderRadius: 10, background: st.done ? '#E4F6EA' : 'transparent' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(60,60,67,0.55)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{si + 1}</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(60,60,67,0.4)', fontVariantNumeric: 'tabular-nums' }}>{st.prev}</div>
                  <input value={st.kg} onChange={(e) => onSetField(ei, si, 'kg', e.target.value)} inputMode="decimal" style={numInput(st.done)} />
                  <input value={st.reps} onChange={(e) => onSetField(ei, si, 'reps', e.target.value)} inputMode="numeric" style={numInput(st.done)} />
                  <button
                    onClick={() => onToggleSet(ei, si)}
                    style={{
                      width: 32,
                      height: 32,
                      margin: '0 auto',
                      border: 'none',
                      borderRadius: 9,
                      background: st.done ? GREEN : '#E4E4EA',
                      color: st.done ? '#FFFFFF' : GRAY,
                      fontSize: 16,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => onAddSet(ei)}
              style={{ height: 34, border: 'none', borderRadius: 10, background: '#F1F1F5', color: ACCENT, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Set
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowPicker(true)}
          style={{ height: 44, border: 'none', borderRadius: 13, background: ACCENT_SOFT, color: ACCENT, fontSize: 15.5, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Exercise
        </button>
        <button
          onClick={onDiscard}
          style={{ height: 40, border: 'none', borderRadius: 13, background: 'none', color: RED, fontSize: 14.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Discard Workout
        </button>
      </div>

      {showPicker && (
        <PickerSheet
          exercises={exercises}
          onPick={(id) => {
            onAddExercise(id)
            setShowPicker(false)
          }}
          onNewExercise={() => {
            setShowPicker(false)
            props.onNewExercise()
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
