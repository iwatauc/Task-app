'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { createClient } from '@/lib/supabase/client'

export default function QuickAdd({ onAdded }: { onAdded: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [due, setDue] = useState<'today' | 'tomorrow'>('today')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    const title = text.trim()
    if (!title) return
    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      window.location.href = '/login'
      return
    }

    const due_date =
      due === 'today' ? dayjs().format('YYYY-MM-DD') : dayjs().add(1, 'day').format('YYYY-MM-DD')

    await supabase.from('tasks').insert({
      title,
      due_date,
      priority,
      created_by: user.id,
    })

    setText('')
    setSaving(false)
    onAdded()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={due} onChange={e => setDue(e.target.value as any)} style={{ padding: 10, borderRadius: 10 }}>
          <option value="today">今日</option>
          <option value="tomorrow">明日</option>
        </select>

        <select
          value={priority}
          onChange={e => setPriority(Number(e.target.value) as any)}
          style={{ padding: 10, borderRadius: 10 }}
        >
          <option value={3}>高</option>
          <option value={2}>中</option>
          <option value={1}>低</option>
        </select>

        <div style={{ flex: 1, minWidth: 240 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="入力してEnter（例：『資料送る』）"
            style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd' }}
          />
        </div>

        <button
          onClick={add}
          disabled={saving}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #ddd',
            background: saving ? '#f3f3f3' : 'white',
            fontWeight: 800,
          }}
        >
          {saving ? '追加中…' : '追加'}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        “スマホで1秒”に寄せるため、まずは最短入力を最優先にしています（音声入力は次で追加できます）。
      </div>
    </div>
  )
}
