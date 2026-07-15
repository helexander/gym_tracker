import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActiveWorkout, AppData, DraftSet, Equipment, Muscle, Routine, Session, SetLog } from './types'
import { loadData, saveData } from './lib/storage'
import { bestKgFor, dateKeyOf, lastSetsFor } from './lib/stats'
import { fullSync } from './lib/sync'
import { SyncScreen } from './ui/SyncScreen'
import { TabBar, type Tab } from './ui/TabBar'
import { HomeScreen } from './ui/HomeScreen'
import { HistoryScreen } from './ui/HistoryScreen'
import { LibraryScreen } from './ui/LibraryScreen'
import { ExerciseDetail } from './ui/ExerciseDetail'
import { NewExercise } from './ui/NewExercise'
import { ActiveWorkoutScreen } from './ui/ActiveWorkoutScreen'

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function mkSets(last: SetLog[] | null): DraftSet[] {
  if (last && last.length) {
    return last.map((ls) => ({ kg: String(ls.kg), reps: String(ls.reps), prev: `${ls.kg} kg × ${ls.reps}`, done: false }))
  }
  return [1, 2, 3].map(() => ({ kg: '', reps: '', prev: '—', done: false }))
}

export default function App() {
  const [data, setData] = useState<AppData>(loadData)
  const [tab, setTab] = useState<Tab>('home')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Muscle | 'All'>('All')
  const [newExOpen, setNewExOpen] = useState<false | 'library' | 'workout'>(false)
  const [syncOpen, setSyncOpen] = useState(false)

  // Persist on every change.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    saveData(data)
  }, [data])

  // Sync: push pending items and pull remote changes. Runs on app start, when
  // connectivity returns, and after anything worth backing up happens.
  // Silently a no-op when sync isn't configured / signed in / offline.
  const dataRef = useRef(data)
  dataRef.current = data
  const syncing = useRef(false)
  const syncNow = async (): Promise<string | null> => {
    if (syncing.current) return null
    syncing.current = true
    try {
      const res = await fullSync(dataRef.current)
      if (res?.changed) setData(res.data)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : String(e)
    } finally {
      syncing.current = false
    }
  }
  useEffect(() => {
    const onOnline = () => void syncNow()
    window.addEventListener('online', onOnline)
    void syncNow()
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exerciseName = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? 'Unknown exercise'

  // ---- workout actions ----

  const startWorkout = (name: string, exerciseIds: string[]) => {
    const workout: ActiveWorkout = {
      name,
      startedAt: Date.now(),
      exercises: exerciseIds.map((id) => ({ exerciseId: id, sets: mkSets(lastSetsFor(data.sessions, id)) })),
      restEndsAt: 0,
      restTotalSec: data.settings.restDurationSec,
    }
    setData((d) => ({ ...d, active: workout }))
  }

  const updWorkout = (mut: (w: ActiveWorkout) => void) => {
    setData((d) => {
      if (!d.active) return d
      const w: ActiveWorkout = {
        ...d.active,
        exercises: d.active.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })),
      }
      mut(w)
      return { ...d, active: w }
    })
  }

  const toggleSet = (ei: number, si: number) => {
    updWorkout((w) => {
      const st = w.exercises[ei].sets[si]
      st.done = !st.done
      if (st.done && data.settings.restAutoStart) {
        w.restEndsAt = Date.now() + data.settings.restDurationSec * 1000
        w.restTotalSec = data.settings.restDurationSec
      }
    })
  }

  const finishWorkout = () => {
    const w = data.active
    if (!w) return
    let volume = 0
    let prCount = 0
    const sessionExercises: Session['exercises'] = []
    for (const we of w.exercises) {
      const done = we.sets.filter((t) => t.done && (parseFloat(t.kg) > 0 || parseFloat(t.reps) > 0))
      const use = done.length ? done : we.sets.filter((t) => parseFloat(t.kg) > 0 || parseFloat(t.reps) > 0)
      if (!use.length) continue
      const sets: SetLog[] = use.map((t) => ({ kg: parseFloat(t.kg) || 0, reps: parseFloat(t.reps) || 0 }))
      let topKg = 0
      for (const st of sets) {
        volume += st.kg * st.reps
        if (st.kg > topKg) topKg = st.kg
      }
      const prevBest = bestKgFor(data.sessions, we.exerciseId)
      if (topKg > prevBest && topKg > 0) prCount++
      sessionExercises.push({ exerciseId: we.exerciseId, sets })
    }
    if (!sessionExercises.length) {
      if (window.confirm('No sets logged. Discard this workout?')) {
        setData((d) => ({ ...d, active: null }))
      }
      return
    }
    const session: Session = {
      id: newId('s'),
      name: w.name,
      dateKey: dateKeyOf(new Date()),
      startedAt: w.startedAt,
      durationMin: Math.max(1, Math.round((Date.now() - w.startedAt) / 60000)),
      volumeKg: Math.round(volume),
      prCount,
      exercises: sessionExercises,
    }
    setData((d) => ({ ...d, sessions: [session, ...d.sessions], active: null }))
    setTab('history')
    setTimeout(() => void syncNow(), 50) // back up the new session right away
  }

  const discardWorkout = () => {
    if (window.confirm('Discard this workout? Logged sets will be lost.')) {
      setData((d) => ({ ...d, active: null }))
    }
  }

  // ---- exercise library actions ----

  const saveNewExercise = (draft: { name: string; equipment: Equipment; muscle: Muscle; notes: string }) => {
    const id = newId('c')
    setData((d) => ({
      ...d,
      exercises: [{ id, custom: true, updatedAt: Date.now(), ...draft }, ...d.exercises],
    }))
    setTimeout(() => void syncNow(), 50)
    if (newExOpen === 'workout' && data.active) {
      updWorkout((w) => {
        w.exercises.push({ exerciseId: id, sets: mkSets(null) })
      })
    } else {
      setTab('exercises')
      setFilter('All')
      setSearch('')
    }
    setNewExOpen(false)
  }

  const detailExercise = useMemo(
    () => (detailId ? data.exercises.find((e) => e.id === detailId) ?? null : null),
    [detailId, data.exercises],
  )

  const changeTab = (t: Tab) => {
    setTab(t)
    setDetailId(null)
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(20px + env(safe-area-inset-top))', paddingBottom: 110 }}>
      {tab === 'home' && (
        <HomeScreen
          sessions={data.sessions}
          routines={data.routines}
          exerciseName={exerciseName}
          onStartEmpty={() => startWorkout('Workout', [])}
          onStartRoutine={(r: Routine) => startWorkout(r.name, r.exerciseIds)}
          onOpenSync={() => setSyncOpen(true)}
        />
      )}
      {tab === 'history' && <HistoryScreen sessions={data.sessions} exerciseName={exerciseName} />}
      {tab === 'exercises' && (
        <LibraryScreen
          exercises={data.exercises}
          search={search}
          filter={filter}
          onSearch={setSearch}
          onFilter={setFilter}
          onOpen={setDetailId}
          onNew={() => setNewExOpen('library')}
        />
      )}

      <TabBar tab={tab} onTab={changeTab} />

      {data.active && (
        <ActiveWorkoutScreen
          workout={data.active}
          exercises={data.exercises}
          onSetField={(ei, si, key, val) => updWorkout((w) => void (w.exercises[ei].sets[si][key] = val))}
          onToggleSet={toggleSet}
          onAddSet={(ei) =>
            updWorkout((w) => {
              const sets = w.exercises[ei].sets
              const lastS = sets[sets.length - 1]
              sets.push({ kg: lastS?.kg ?? '', reps: lastS?.reps ?? '', prev: '—', done: false })
            })
          }
          onRemoveExercise={(ei) => updWorkout((w) => void w.exercises.splice(ei, 1))}
          onAddExercise={(id) =>
            updWorkout((w) => {
              w.exercises.push({ exerciseId: id, sets: mkSets(lastSetsFor(data.sessions, id)) })
            })
          }
          onNewExercise={() => setNewExOpen('workout')}
          onRestAdjust={(delta) =>
            updWorkout((w) => {
              const base = Math.max(Date.now(), w.restEndsAt)
              w.restEndsAt = Math.max(Date.now(), base + delta * 1000)
              const leftSec = Math.ceil((w.restEndsAt - Date.now()) / 1000)
              if (leftSec > w.restTotalSec) w.restTotalSec = leftSec
            })
          }
          onRestSkip={() => updWorkout((w) => void (w.restEndsAt = 0))}
          onFinish={finishWorkout}
          onDiscard={discardWorkout}
        />
      )}

      {detailExercise && (
        <ExerciseDetail exercise={detailExercise} sessions={data.sessions} onClose={() => setDetailId(null)} />
      )}

      {newExOpen && <NewExercise onSave={saveNewExercise} onCancel={() => setNewExOpen(false)} />}

      {syncOpen && <SyncScreen data={data} onClose={() => setSyncOpen(false)} onSyncNow={syncNow} />}
    </div>
  )
}
