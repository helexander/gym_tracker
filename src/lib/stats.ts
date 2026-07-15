import type { Session, SetLog } from '../types'

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function dateKeyOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function fmtSessionDate(key: string): string {
  const d = parseKey(key)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
}

export function fmtShortDate(key: string): string {
  const d = parseKey(key)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
}

export function fmtMonthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

export function fmtHeaderDate(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${days[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday of the week containing d, local time. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (out.getDay() + 6) % 7 // Mon=0 … Sun=6
  out.setDate(out.getDate() - dow)
  return out
}

/** Sessions are stored newest-first; all lookups below rely on that. */

/** The most recent logged sets for an exercise (used to prefill a new workout). */
export function lastSetsFor(sessions: Session[], exerciseId: string): SetLog[] | null {
  for (const s of sessions) {
    for (const se of s.exercises) {
      if (se.exerciseId === exerciseId && se.sets.length) return se.sets
    }
  }
  return null
}

/** Heaviest weight ever logged for an exercise. */
export function bestKgFor(sessions: Session[], exerciseId: string): number {
  let best = 0
  for (const s of sessions) {
    for (const se of s.exercises) {
      if (se.exerciseId !== exerciseId) continue
      for (const st of se.sets) if (st.kg > best) best = st.kg
    }
  }
  return best
}

export interface HistPoint {
  dateKey: string
  topKg: number
  topReps: number
  volume: number
}

/** Per-session top set + volume for an exercise, oldest → newest. */
export function historyFor(sessions: Session[], exerciseId: string): HistPoint[] {
  const out: HistPoint[] = []
  for (const s of sessions) {
    for (const se of s.exercises) {
      if (se.exerciseId !== exerciseId || !se.sets.length) continue
      let topKg = 0
      let topReps = 0
      let volume = 0
      for (const st of se.sets) {
        volume += st.kg * st.reps
        if (st.kg > topKg) {
          topKg = st.kg
          topReps = st.reps
        }
      }
      out.push({ dateKey: s.dateKey, topKg, topReps, volume })
    }
  }
  return out.reverse()
}

/** Epley estimated 1RM, rounded to 0.5 kg. */
export function epley1RM(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0
  return Math.round(kg * (1 + reps / 30) * 2) / 2
}
