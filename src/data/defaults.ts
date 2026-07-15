import type { Exercise, Routine } from '../types'

// Built-in library. History starts empty — real data comes from your workouts.
export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'bench', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell', custom: false, notes: '' },
  { id: 'squat', name: 'Squat', muscle: 'Legs', equipment: 'Barbell', custom: false, notes: '' },
  { id: 'dead', name: 'Deadlift', muscle: 'Back', equipment: 'Barbell', custom: false, notes: '' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell', custom: false, notes: '' },
  { id: 'latpull', name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable', custom: false, notes: '' },
  { id: 'row', name: 'Seated Row', muscle: 'Back', equipment: 'Machine', custom: false, notes: '' },
  { id: 'incline', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', custom: false, notes: '' },
  { id: 'curl', name: 'Dumbbell Curl', muscle: 'Arms', equipment: 'Dumbbell', custom: false, notes: '' },
  { id: 'pushdown', name: 'Triceps Pushdown', muscle: 'Arms', equipment: 'Cable', custom: false, notes: '' },
  { id: 'legpress', name: 'Leg Press', muscle: 'Legs', equipment: 'Machine', custom: false, notes: '' },
  { id: 'rdl', name: 'Romanian Deadlift', muscle: 'Legs', equipment: 'Barbell', custom: false, notes: '' },
  { id: 'calf', name: 'Standing Calf Raise', muscle: 'Legs', equipment: 'Machine', custom: false, notes: '' },
  { id: 'lateral', name: 'Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbell', custom: false, notes: '' },
  { id: 'pullup', name: 'Pull Up', muscle: 'Back', equipment: 'Bodyweight', custom: false, notes: '' },
  { id: 'legraise', name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight', custom: false, notes: '' },
]

export const DEFAULT_ROUTINES: Routine[] = [
  { id: 'push', name: 'Push Day', exerciseIds: ['bench', 'ohp', 'incline', 'pushdown'] },
  { id: 'pull', name: 'Pull Day', exerciseIds: ['dead', 'latpull', 'row', 'curl'] },
  { id: 'legs', name: 'Leg Day', exerciseIds: ['squat', 'rdl', 'legpress', 'calf'] },
]
