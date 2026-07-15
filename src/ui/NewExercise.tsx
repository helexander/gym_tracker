import { useState } from 'react'
import type { Equipment, Muscle } from '../types'
import { EQUIPMENT, MUSCLES } from '../types'
import { ACCENT, BG, chip, sectionLabel } from './theme'

interface Props {
  onSave: (draft: { name: string; equipment: Equipment; muscle: Muscle; notes: string }) => void
  onCancel: () => void
}

export function NewExercise({ onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<Equipment>('Barbell')
  const [muscle, setMuscle] = useState<Muscle>('Chest')
  const [notes, setNotes] = useState('')
  const canSave = name.trim().length > 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 16, cursor: 'pointer', padding: 0 }}>
          Cancel
        </button>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>New Exercise</div>
        <button
          onClick={() => canSave && onSave({ name: name.trim(), equipment, muscle, notes: notes.trim() })}
          style={{ border: 'none', background: 'none', color: ACCENT, fontSize: 16, fontWeight: 700, cursor: 'pointer', padding: 0, opacity: canSave ? 1 : 0.35 }}
        >
          Save
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name"
          autoFocus
          style={{ height: 48, border: 'none', borderRadius: 14, background: '#FFFFFF', padding: '0 16px', fontSize: 17, fontWeight: 500, color: '#000', boxSizing: 'border-box', width: '100%' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...sectionLabel, paddingLeft: 4 }}>Equipment</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {EQUIPMENT.map((m) => (
              <button key={m} onClick={() => setEquipment(m)} style={chip(m === equipment)}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...sectionLabel, paddingLeft: 4 }}>Primary Muscle</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {MUSCLES.map((m) => (
              <button key={m} onClick={() => setMuscle(m)} style={chip(m === muscle)}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...sectionLabel, paddingLeft: 4 }}>Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Setup cues, seat height, grip…"
            style={{ minHeight: 90, border: 'none', borderRadius: 14, background: '#FFFFFF', padding: '12px 16px', fontSize: 15, color: '#000', boxSizing: 'border-box', width: '100%', resize: 'none', lineHeight: 1.5 }}
          />
        </div>
      </div>
    </div>
  )
}
