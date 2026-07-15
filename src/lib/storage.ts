import type { AppData } from '../types'
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES } from '../data/defaults'

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

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (parsed.version !== 1) return emptyData()
    // Merge defaults for forward-compat with older saves.
    return { ...emptyData(), ...parsed, settings: { ...emptyData().settings, ...parsed.settings } }
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
