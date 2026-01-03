'use client'

import dayjs from 'dayjs'
import type { Task } from './TaskApp'

export default function MatrixView({ tasks }: { tasks: Task[] }) {
  const today = dayjs().format('YYYY-MM-DD')
  const open = tasks.filter(t => !t.is_done)

  const isUrgent = (t: Task) => t.due_date <= today
  const isImportant = (t: Task) => t.priority === 3

  const q1 = open.filter(t => isImportant(t) && isUrgent(t))     // 重要×緊急
  const q2 = open.filter(t => isImportant(t) && !isUrgent(t))    // 重要×非緊急
  const q3 = open.filter(t => !isImportant(t) && isUrgent(t))    // 非重要×緊急
  const q4 = open.filter(t => !isImportant(t) && !isUrgent(t))   // 非重要×非緊急

  const Box = ({ title, list }: { title: string; list: Task[] }) => (
    <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 12 }}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
        {list.length === 0 ? <div style={{ opacity: 0.6, fontSize: 12 }}>なし</div> : null}
        {list.slice(0, 8).map(t => (
          <div key={t.id} style={{ fontSize: 12 }}>
            {t.priority === 3 ? '⚠️ ' : ''}{t.title}（{t.due_date}）
          </div>
        ))}
        {list.length > 8 ? <div style={{ fontSize: 12, opacity: 0.7 }}>…他{list.length - 8}</div> : null}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
      <Box title="🔴 重要 × 緊急（今やる）" list={q1} />
      <Box title="🟡 重要 × 非緊急（育てる）" list={q2} />
      <Box title="⚪ 非重要 × 緊急（短く片付ける）" list={q3} />
      <Box title="⚫ 非重要 × 非緊急（やらない候補）" list={q4} />
    </div>
  )
}
