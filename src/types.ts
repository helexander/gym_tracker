export const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell'] as const
export const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const

export type Equipment = (typeof EQUIPMENT)[number]
export type Muscle = (typeof MUSCLES)[number]

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  equipment: Equipment
  notes: string
  custom: boolean
}

/** A single logged set inside a finished session. */
export interface SetLog {
  kg: number
  reps: number
}

export interface SessionExercise {
  exerciseId: string
  sets: SetLog[]
}

/** A finished workout stored in history. */
export interface Session {
  id: string
  name: string
  /** Local date key YYYY-MM-DD of the day the workout was finished. */
  dateKey: string
  /** Epoch ms when the workout started. */
  startedAt: number
  durationMin: number
  volumeKg: number
  prCount: number
  exercises: SessionExercise[]
}

export interface Routine {
  id: string
  name: string
  exerciseIds: string[]
}

/** An in-progress set: text fields so partial input like "72.5" works. */
export interface DraftSet {
  kg: string
  reps: string
  prev: string
  done: boolean
}

export interface DraftExercise {
  exerciseId: string
  sets: DraftSet[]
}

/** In-progress workout — persisted so it survives the app being killed. */
export interface ActiveWorkout {
  name: string
  startedAt: number
  exercises: DraftExercise[]
  /** Epoch ms when the current rest period ends; 0 = no rest running. */
  restEndsAt: number
  restTotalSec: number
}

export interface Settings {
  restAutoStart: boolean
  restDurationSec: number
}

export interface AppData {
  version: 1
  exercises: Exercise[]
  routines: Routine[]
  sessions: Session[]
  active: ActiveWorkout | null
  settings: Settings
}
