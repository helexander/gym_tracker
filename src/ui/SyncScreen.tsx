import { useEffect, useState } from 'react'
import type { AppData } from '../types'
import { envConfig, getClient, getConfig, lastSyncAt, pendingItems, setConfig } from '../lib/sync'
import { ACCENT, BG, GREEN, RED, TEXT_DIM, card, sectionLabel } from './theme'

interface Props {
  data: AppData
  onClose: () => void
  onSyncNow: () => Promise<string | null> // returns error message or null
}

const fieldStyle: React.CSSProperties = {
  height: 44,
  border: 'none',
  borderRadius: 12,
  background: '#FFFFFF',
  padding: '0 14px',
  fontSize: 15,
  color: '#000',
  boxSizing: 'border-box',
  width: '100%',
}

const primaryBtn: React.CSSProperties = {
  height: 44,
  border: 'none',
  borderRadius: 12,
  background: ACCENT,
  color: '#FFFFFF',
  fontSize: 15.5,
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  ...primaryBtn,
  background: '#E7F1FF',
  color: ACCENT,
}

export function SyncScreen({ data, onClose, onSyncNow }: Props) {
  const [configured, setConfigured] = useState(!!getConfig())
  const [email, setEmail] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)

  // setup form
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  // auth form
  const [formEmail, setFormEmail] = useState('')
  const [formPw, setFormPw] = useState('')

  const refreshSession = async () => {
    const c = getClient()
    if (!c) {
      setEmail(null)
      setUid(null)
      return
    }
    const { data: s } = await c.auth.getSession()
    setEmail(s.session?.user.email ?? null)
    setUid(s.session?.user.id ?? null)
  }

  useEffect(() => {
    void refreshSession()
  }, [configured])

  const pending = pendingItems(data, uid)
  const pendingCount = pending.exercises.length + pending.sessions.length
  const last = lastSyncAt()

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : String(e), error: true })
    } finally {
      setBusy(false)
    }
  }

  const saveConfig = () =>
    run(async () => {
      const u = url.trim().replace(/\/$/, '')
      if (!/^https:\/\/.+\.supabase\.co$/.test(u)) throw new Error('URL should look like https://xxxx.supabase.co')
      if (anonKey.trim().length < 20) throw new Error('That does not look like an anon key')
      setConfig({ url: u, anonKey: anonKey.trim() })
      setConfigured(true)
      setMsg({ text: 'Server saved. Now sign in below.', error: false })
    })

  const signIn = (create: boolean) =>
    run(async () => {
      const c = getClient()
      if (!c) throw new Error('Server not configured')
      const creds = { email: formEmail.trim(), password: formPw }
      const { error } = create ? await c.auth.signUp(creds) : await c.auth.signInWithPassword(creds)
      if (error) throw error
      await refreshSession()
      const err = await onSyncNow()
      setMsg(err ? { text: `Signed in, but sync failed: ${err}`, error: true } : { text: 'Signed in and synced.', error: false })
    })

  const signOut = () =>
    run(async () => {
      await getClient()?.auth.signOut()
      await refreshSession()
      setMsg({ text: 'Signed out. Data stays on this device.', error: false })
    })

  const syncNow = () =>
    run(async () => {
      const err = await onSyncNow()
      if (err) throw new Error(err)
      setMsg({ text: 'Sync complete.', error: false })
    })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 16, cursor: 'pointer', padding: 0 }}>
          Done
        </button>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>Backup & Sync</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 14, color: '#1C1C1E', lineHeight: 1.5 }}>
            Your data always lives on this phone and works offline. Sync keeps a copy in your own free Supabase
            database — anything logged offline is pushed automatically when you're back online.
          </div>
          <div style={{ fontSize: 13, color: TEXT_DIM, fontVariantNumeric: 'tabular-nums' }}>
            {pendingCount === 0 ? 'Everything is backed up.' : `${pendingCount} item${pendingCount === 1 ? '' : 's'} waiting to upload.`}
            {last ? ` Last sync ${new Date(last).toLocaleString()}.` : ''}
          </div>
        </div>

        {!configured && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...sectionLabel, paddingLeft: 4 }}>1 · Connect your Supabase project</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Project URL (https://xxxx.supabase.co)" autoCapitalize="none" style={fieldStyle} />
            <input value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="Anon (public) API key" autoCapitalize="none" style={fieldStyle} />
            <button onClick={saveConfig} disabled={busy} style={primaryBtn}>Save Server</button>
            <div style={{ fontSize: 12.5, color: TEXT_DIM, lineHeight: 1.5, padding: '0 2px' }}>
              Create a free project at supabase.com, run the SQL from <b>supabase/schema.sql</b> (in this app's repo) in
              the SQL Editor, then copy the Project URL and anon key from Settings → API.
            </div>
          </div>
        )}

        {configured && !email && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...sectionLabel, paddingLeft: 4 }}>2 · Sign in</div>
            <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" inputMode="email" autoCapitalize="none" style={fieldStyle} />
            <input value={formPw} onChange={(e) => setFormPw(e.target.value)} placeholder="Password" type="password" style={fieldStyle} />
            <button onClick={() => signIn(false)} disabled={busy} style={primaryBtn}>Sign In</button>
            <button onClick={() => signIn(true)} disabled={busy} style={secondaryBtn}>Create Account</button>
            {!envConfig() && (
              <button
                onClick={() => {
                  setConfig(null)
                  setConfigured(false)
                  setMsg(null)
                }}
                style={{ border: 'none', background: 'none', color: TEXT_DIM, fontSize: 13, cursor: 'pointer', padding: '6px 0' }}
              >
                Change server
              </button>
            )}
          </div>
        )}

        {configured && email && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...card, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: TEXT_DIM }}>Signed in as</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: GREEN, flex: 'none' }} />
            </div>
            <button onClick={syncNow} disabled={busy} style={primaryBtn}>{busy ? 'Syncing…' : 'Sync Now'}</button>
            <button onClick={signOut} disabled={busy} style={{ ...secondaryBtn, background: 'none', color: RED }}>Sign Out</button>
          </div>
        )}

        {msg && (
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: msg.error ? RED : GREEN, padding: '0 2px' }}>{msg.text}</div>
        )}
      </div>
    </div>
  )
}
