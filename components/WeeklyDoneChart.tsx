'use client'

import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Task } from './TaskApp'

dayjs.extend(isoWeek)

export default function WeeklyDoneChart({ tasks }: { tasks: Task[] }) {
  const start = dayjs().startOf('isoWeek') // 月曜始まり
  const days = Array.from({ length: 7 }).map((_, i) => start.add(i, 'day'))

  const done = tasks.filter(t => t.is_done && t.completed_at)

  const data = days.map(d => {
    const key = d.format('YYYY-MM-DD')
    const count = done.filter(t => dayjs(t.completed_at!).format('YYYY-MM-DD') === key).length
    return { day: d.format('MM/DD'), count }
  })

  const total = data.reduce((s, x) => s + x.count, 0)

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}>
      <h2 style={{ marginTop: 0 }}>今週の完了数：{total}</h2>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
