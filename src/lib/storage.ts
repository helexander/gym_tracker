import type { AppData, Exercise } from '../types'
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES } from '../data/defaults'
import { CATALOG } from '../data/catalog'

const KEY = 'reps.data.v1'

export function emptyData(): AppData {
  return {
    version: 1,
    exercises: DEFAULT_EXERCISES.slice(),
    routines: DEFAULT_ROUTINES.slice(),
    sessions: [],
    active: null,
    settings: { restAutoStart: true, restDurationSec: 90 },
  }
}

/**
 * Folds the bundled Hevy exercise catalog into the library. Idempotent — runs
 * on every load so app updates can enrich existing saves:
 * - name matches an existing exercise → attach the demo; for imported/built-in
 *   entries also adopt the catalog's muscle + equipment (they're authoritative
 *   for Hevy names). Hand-made customs ('c_…' ids) keep the user's choices.
 * - otherwise → add as a built-in library exercise.
 */
function mergeCatalog(exercises: Exercise[]): Exercise[] {
  const byName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]))
  const catByName = new Map(CATALOG.map((c) => [c.name.toLowerCase(), c]))
  const out = exercises.map((e) => {
    const cat = catByName.get(e.name.toLowerCase())
    if (!cat) return e
    const handMade = e.custom && e.id.startsWith('c_')
    return {
      ...e,
      demoUrl: cat.demoUrl || e.demoUrl,
      muscle: handMade ? e.muscle : cat.muscle,
      equipment: handMade ? e.equipment : cat.equipment,
    }
  })
  for (const c of CATALOG) {
    if (byName.has(c.name.toLowerCase())) continue
    out.push({
      id: 'cat_' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: c.name,
      muscle: c.muscle,
      equipment: c.equipment,
      notes: '',
      custom: false,
      demoUrl: c.demoUrl || undefined,
    })
  }
  return out
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const fresh = emptyData()
      return { ...fresh, exercises: mergeCatalog(fresh.exercises) }
    }
    const parsed = JSON.parse(raw) as AppData
    if (parsed.version !== 1) return emptyData()
    // Merge defaults for forward-compat with older saves.
    const data = { ...emptyData(), ...parsed, settings: { ...emptyData().settings, ...parsed.settings } }
    return { ...data, exercises: mergeCatalog(data.exercises) }
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — data stays in memory for this session.
  }
}
