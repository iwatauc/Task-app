'use client'

import dayjs from 'dayjs'
import type { Task } from './TaskApp'

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const now = dayjs()
  const start = now.startOf('month').startOf('week')
  const end = now.endOf('month').endOf('week')

  const days: dayjs.Dayjs[] = []
  let d = start
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    days.push(d)
    d = d.add(1, 'day')
  }

  const map = new Map<string, Task[]>()
  tasks.filter(t => !t.is_done).forEach(t => {
    const arr = map.get(t.due_date) ?? []
    arr.push(t)
    map.set(t.due_date, arr)
  })

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}>
      <h2 style={{ marginTop: 0 }}>{now.format('YYYY年MM月')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {['日','月','火','水','木','金','土'].map(w => (
          <div key={w} style={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>{w}</div>
        ))}
        {days.map(day => {
          const key = day.format('YYYY-MM-DD')
          const list = map.get(key) ?? []
          const inMonth = day.month() === now.month()
          const high = list.filter(t => t.priority === 3).length

          return (
            <div
              key={key}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                padding: 10,
                minHeight: 84,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 900 }}>{day.date()}</div>
                {list.length > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {high > 0 ? `●${list.length}（高${high}）` : `●${list.length}`}
                  </div>
                )}
              </div>

              {list.slice(0, 2).map(t => (
                <div key={t.id} style={{ marginTop: 6, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.priority === 3 ? '⚠️ ' : ''}{t.title}
                </div>
              ))}
              {list.length > 2 && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>…他{list.length - 2}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
