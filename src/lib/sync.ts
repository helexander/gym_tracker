import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppData, Exercise, Session } from '../types'

// ---------------------------------------------------------------------------
// Server config. Build-time env vars win; otherwise the user pastes their
// Supabase URL + anon key once in the Sync screen and we keep them locally.
// The anon key is a publishable key — data is protected by RLS, not the key.
// ---------------------------------------------------------------------------

export interface SyncConfig {
  url: string
  anonKey: string
}

const CONFIG_KEY = 'reps.sync.config.v1'
const LAST_SYNC_KEY = 'reps.sync.last.v1'

export function envConfig(): SyncConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && anonKey ? { url, anonKey } : null
}

export function getConfig(): SyncConfig | null {
  const env = envConfig()
  if (env) return env
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw) as SyncConfig
    return cfg.url && cfg.anonKey ? cfg : null
  } catch {
    return null
  }
}

export function setConfig(cfg: SyncConfig | null): void {
  if (cfg) localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
  else localStorage.removeItem(CONFIG_KEY)
  client = null
  clientConfigKey = ''
}

let client: SupabaseClient | null = null
let clientConfigKey = ''

export function getClient(): SupabaseClient | null {
  const cfg = getConfig()
  if (!cfg) return null
  const key = cfg.url + '|' + cfg.anonKey
  if (!client || clientConfigKey !== key) {
    client = createClient(cfg.url, cfg.anonKey)
    clientConfigKey = key
  }
  return client
}

// ---------------------------------------------------------------------------
// Pending tracking (outbox). An item is pending until a push for it succeeds.
// Tracked per signed-in user so switching accounts re-pushes everything.
// ---------------------------------------------------------------------------

function pushedKey(uid: string): string {
  return `reps.sync.pushed.v1.${uid}`
}

function loadPushed(uid: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(pushedKey(uid)) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function savePushed(uid: string, ids: Set<string>): void {
  try {
    localStorage.setItem(pushedKey(uid), JSON.stringify([...ids]))
  } catch {
    // best effort — worst case we re-push (upserts are idempotent)
  }
}

/** Items that would be pushed on the next sync: custom exercises + sessions. */
export function pendingItems(data: AppData, uid: string | null): { exercises: Exercise[]; sessions: Session[] } {
  const pushed = uid ? loadPushed(uid) : new Set<string>()
  return {
    exercises: data.exercises.filter((e) => e.custom && !pushed.has(`e:${e.id}`)),
    sessions: data.sessions.filter((s) => !pushed.has(`s:${s.id}`)),
  }
}

export function lastSyncAt(): number | null {
  const v = localStorage.getItem(LAST_SYNC_KEY)
  return v ? Number(v) : null
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

interface ExerciseRow {
  user_id: string
  id: string
  name: string
  muscle: string
  equipment: string
  notes: string
  custom: boolean
  updated_at: number
}

interface SessionRow {
  user_id: string
  id: string
  name: string
  date_key: string
  started_at: number
  duration_min: number
  volume_kg: number
  pr_count: number
  exercises: Session['exercises']
}

function toExerciseRow(e: Exercise, uid: string): ExerciseRow {
  return {
    user_id: uid,
    id: e.id,
    name: e.name,
    muscle: e.muscle,
    equipment: e.equipment,
    notes: e.notes,
    custom: e.custom,
    updated_at: e.updatedAt ?? 0,
  }
}

function fromExerciseRow(r: ExerciseRow): Exercise {
  return {
    id: r.id,
    name: r.name,
    muscle: r.muscle as Exercise['muscle'],
    equipment: r.equipment as Exercise['equipment'],
    notes: r.notes,
    custom: r.custom,
    updatedAt: r.updated_at,
  }
}

function toSessionRow(s: Session, uid: string): SessionRow {
  return {
    user_id: uid,
    id: s.id,
    name: s.name,
    date_key: s.dateKey,
    started_at: s.startedAt,
    duration_min: s.durationMin,
    volume_kg: s.volumeKg,
    pr_count: s.prCount,
    exercises: s.exercises,
  }
}

function fromSessionRow(r: SessionRow): Session {
  return {
    id: r.id,
    name: r.name,
    dateKey: r.date_key,
    startedAt: r.started_at,
    durationMin: r.duration_min,
    volumeKg: Number(r.volume_kg),
    prCount: r.pr_count,
    exercises: r.exercises,
  }
}

// ---------------------------------------------------------------------------
// Sync: pull remote → merge into local → push pending. Local data is the
// working copy; the server is backup + cross-device store. Upserts are
// idempotent, so a crash mid-sync just means some items push again next time.
// ---------------------------------------------------------------------------

export interface SyncResult {
  data: AppData
  changed: boolean
  pushed: number
  pulled: number
}

function mergeRemote(data: AppData, remoteEx: Exercise[], remoteSes: Session[]): { data: AppData; changed: boolean } {
  let changed = false
  let exercises = data.exercises
  for (const re of remoteEx) {
    const local = exercises.find((e) => e.id === re.id)
    if (!local) {
      exercises = [re, ...exercises]
      changed = true
    } else if ((re.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      exercises = exercises.map((e) => (e.id === re.id ? re : e))
      changed = true
    }
  }
  let sessions = data.sessions
  for (const rs of remoteSes) {
    if (!sessions.some((s) => s.id === rs.id)) {
      sessions = [...sessions, rs]
      changed = true
    }
  }
  if (changed) {
    sessions = sessions.slice().sort((a, b) => (b.dateKey === a.dateKey ? b.startedAt - a.startedAt : b.dateKey < a.dateKey ? -1 : 1))
  }
  return { data: changed ? { ...data, exercises, sessions } : data, changed }
}

export async function fullSync(data: AppData): Promise<SyncResult | null> {
  const c = getClient()
  if (!c || (typeof navigator !== 'undefined' && !navigator.onLine)) return null
  const { data: auth } = await c.auth.getSession()
  const uid = auth.session?.user.id
  if (!uid) return null

  // Pull
  const [exRes, sesRes] = await Promise.all([
    c.from('exercises').select('*'),
    c.from('sessions').select('*'),
  ])
  if (exRes.error) throw exRes.error
  if (sesRes.error) throw sesRes.error
  const remoteEx = (exRes.data as ExerciseRow[]).map(fromExerciseRow)
  const remoteSes = (sesRes.data as SessionRow[]).map(fromSessionRow)
  const merged = mergeRemote(data, remoteEx, remoteSes)

  // Anything already on the server never needs a first push.
  const pushed = loadPushed(uid)
  remoteEx.forEach((e) => pushed.add(`e:${e.id}`))
  remoteSes.forEach((s) => pushed.add(`s:${s.id}`))

  // Push pending
  const pendEx = merged.data.exercises.filter((e) => e.custom && !pushed.has(`e:${e.id}`))
  const pendSes = merged.data.sessions.filter((s) => !pushed.has(`s:${s.id}`))
  if (pendEx.length) {
    const { error } = await c.from('exercises').upsert(pendEx.map((e) => toExerciseRow(e, uid)), { onConflict: 'user_id,id' })
    if (error) throw error
    pendEx.forEach((e) => pushed.add(`e:${e.id}`))
  }
  if (pendSes.length) {
    const { error } = await c.from('sessions').upsert(pendSes.map((s) => toSessionRow(s, uid)), { onConflict: 'user_id,id' })
    if (error) throw error
    pendSes.forEach((s) => pushed.add(`s:${s.id}`))
  }

  savePushed(uid, pushed)
  localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
  return { ...merged, pushed: pendEx.length + pendSes.length, pulled: remoteEx.length + remoteSes.length }
}
