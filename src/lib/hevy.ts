import type { Equipment, Exercise, Muscle, Session, SetLog } from '../types'

// Parses the CSV that Hevy's "Export workout data" produces: one row per set,
// workouts identified by (title, start_time).

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.length > 1 || row[0] !== '') rows.push(row)
  return rows
}

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

/** Hevy timestamps look like "13 Jul 2026, 17:03" (local time). */
function parseHevyTime(s: string): Date | null {
  const m = /^(\d{1,2}) (\w{3}) (\d{4}),? (\d{1,2}):(\d{2})/.exec(s.trim())
  if (!m || !(m[2] in MONTHS)) return null
  return new Date(Number(m[3]), MONTHS[m[2]], Number(m[1]), Number(m[4]), Number(m[5]))
}

function guessMuscle(name: string): Muscle {
  const n = name.toLowerCase()
  const has = (...ws: string[]) => ws.some((w) => n.includes(w))
  if (has('row', 'pulldown', 'pull down', 'pull up', 'pull-up', 'chin up', 'chin-up', 'chinup', 'shrug')) return 'Back'
  if (has('curl', 'triceps', 'tricep', 'bicep', 'wrist', 'forearm')) {
    // leg curls are legs, not arms
    if (has('leg curl')) return 'Legs'
    return 'Arms'
  }
  if (has('crunch', ' ab ', 'abs', 'plank', 'leg raise')) return 'Core'
  if (has('leg', 'squat', 'calf', 'hip', 'glute', 'thrust', 'hack', 'deadlift', 'adduction', 'abduction', 'lunge', 'swing')) return 'Legs'
  if (has('shoulder', 'lateral raise', 'delt', 'overhead press', 'face pull', 'upright')) return 'Shoulders'
  if (has('bench', 'chest', 'pec', 'fly', 'press', 'push up', 'pushup', 'dip', 'butterfly')) return 'Chest'
  return 'Chest'
}

function guessEquipment(name: string): Equipment {
  const n = name.toLowerCase()
  if (n.includes('dumbbell')) return 'Dumbbell'
  if (n.includes('kettlebell')) return 'Kettlebell'
  if (n.includes('cable')) return 'Cable'
  if (n.includes('smith') || n.includes('machine') || n.includes('pec deck') || n.includes('plates')) return 'Machine'
  if (n.includes('barbell')) return 'Barbell'
  if (n.includes('push up') || n.includes('pushup') || n.includes('pull up') || n.includes('pull-up') || n.includes('crunch') || n.includes('plank') || n.includes('dip')) return 'Bodyweight'
  return 'Machine'
}

export interface HevyImportResult {
  sessions: Session[]
  newExercises: Exercise[]
  matchedExercises: number
  skippedRows: number
}

export function parseHevyCsv(text: string, existing: Exercise[]): HevyImportResult {
  const rows = parseCsv(text)
  if (!rows.length) throw new Error('Empty file')
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name)
  const iTitle = col('title')
  const iStart = col('start_time')
  const iEnd = col('end_time')
  const iEx = col('exercise_title')
  const iNotes = col('exercise_notes')
  const iKg = col('weight_kg')
  const iReps = col('reps')
  if (iTitle < 0 || iStart < 0 || iEx < 0 || iKg < 0 || iReps < 0) {
    throw new Error('This does not look like a Hevy export (missing expected columns)')
  }

  // Exercise name → id, reusing the library (case-insensitive) first.
  const byName = new Map<string, string>()
  existing.forEach((e) => byName.set(e.name.toLowerCase(), e.id))
  const newExercises: Exercise[] = []
  const matchedIds = new Set<string>()
  const newIds = new Set<string>()
  const exerciseIdFor = (name: string, notes: string): string => {
    const key = name.toLowerCase()
    const hit = byName.get(key)
    if (hit) {
      if (!newIds.has(hit)) matchedIds.add(hit)
      return hit
    }
    const id = 'hx_' + key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    byName.set(key, id)
    newIds.add(id)
    newExercises.push({
      id,
      name,
      muscle: guessMuscle(name),
      equipment: guessEquipment(name),
      notes: notes || '',
      custom: true,
      updatedAt: Date.now(),
    })
    return id
  }

  // Group set rows into workouts by (title, start_time), preserving order.
  interface Group {
    title: string
    start: Date
    end: Date | null
    exercises: Map<string, SetLog[]>
  }
  const groups = new Map<string, Group>()
  let skippedRows = 0
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const start = parseHevyTime(cells[iStart] ?? '')
    const exName = (cells[iEx] ?? '').trim()
    if (!start || !exName) {
      skippedRows++
      continue
    }
    const reps = parseFloat(cells[iReps] ?? '')
    const kg = parseFloat(cells[iKg] ?? '')
    if (!(reps > 0) && !(kg > 0)) {
      skippedRows++ // duration-only rows (e.g. "Warm Up" cardio) or empty sets
      continue
    }
    const gk = `${cells[iTitle]}|${cells[iStart]}`
    let g = groups.get(gk)
    if (!g) {
      g = { title: (cells[iTitle] ?? 'Workout').trim() || 'Workout', start, end: iEnd >= 0 ? parseHevyTime(cells[iEnd] ?? '') : null, exercises: new Map() }
      groups.set(gk, g)
    }
    const exId = exerciseIdFor(exName, (cells[iNotes] ?? '').trim())
    const sets = g.exercises.get(exId) ?? []
    sets.push({ kg: kg > 0 ? kg : 0, reps: reps > 0 ? reps : 0 })
    g.exercises.set(exId, sets)
  }

  // Oldest → newest so PRs can be detected chronologically, like live logging.
  const ordered = [...groups.values()].sort((a, b) => a.start.getTime() - b.start.getTime())
  const bestKg = new Map<string, number>()
  const sessions: Session[] = ordered.map((g) => {
    let volume = 0
    let prCount = 0
    const exercises = [...g.exercises.entries()].map(([exerciseId, sets]) => {
      let topKg = 0
      for (const st of sets) {
        volume += st.kg * st.reps
        if (st.kg > topKg) topKg = st.kg
      }
      const prev = bestKg.get(exerciseId) ?? 0
      if (topKg > prev && topKg > 0) {
        prCount++
        bestKg.set(exerciseId, topKg)
      }
      return { exerciseId, sets }
    })
    const startedAt = g.start.getTime()
    const durationMin = g.end ? Math.max(1, Math.round((g.end.getTime() - startedAt) / 60000)) : 60
    const y = g.start.getFullYear()
    const mo = String(g.start.getMonth() + 1).padStart(2, '0')
    const d = String(g.start.getDate()).padStart(2, '0')
    return {
      id: `h_${startedAt.toString(36)}`, // deterministic → re-importing never duplicates
      name: g.title,
      dateKey: `${y}-${mo}-${d}`,
      startedAt,
      durationMin,
      volumeKg: Math.round(volume),
      prCount,
      exercises,
    }
  })

  return { sessions, newExercises, matchedExercises: matchedIds.size, skippedRows }
}
