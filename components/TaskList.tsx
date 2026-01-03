'use client'

import { useMemo } from 'react'
import dayjs from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import type { Task } from './TaskApp'

export default function TaskList({
  tasks,
  onChanged,
  highlightOverdue,
}: {
  tasks: Task[]
  onChanged: () => void
  highlightOverdue?: boolean
}) {
  const supabase = useMemo(() => createClient(), [])
  const today = dayjs().format('YYYY-MM-DD')

  const toggleDone = async (task: Task) => {
    const next = !task.is_done
    await supabase.from('tasks').update({
      is_done: next,
      completed_at: next ? new Date().toISOString() : null,
    }).eq('id', task.id)
    onChanged()
  }

  const prLabel = (p: number) => (p === 3 ? '高' : p === 2 ? '中' : '低')

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}>
      {tasks.length === 0 ? (
        <p style={{ opacity: 0.7, margin: 0 }}>タスクなし</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {tasks.map(t => {
            const overdue = t.due_date < today
            return (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid #eee',
                  background: highlightOverdue && overdue ? '#fff3f3' : 'white',
                }}
              >
                <input type="checkbox" checked={t.is_done} onChange={() => toggleDone(t)} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{t.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    期限: {t.due_date} / 重要度: {prLabel(t.priority)}
                  </div>
                </div>

                {overdue && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#b00020' }}>
                    期限切れ
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
