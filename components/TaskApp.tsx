'use client'

import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { createClient } from '@/lib/supabase/client'
import QuickAdd from './QuickAdd'
import Tabs from './Tabs'
import TaskList from './TaskList'
import CalendarView from './CalendarView'
import MatrixView from './MatrixView'
import WeeklyDoneChart from './WeeklyDoneChart'

dayjs.extend(isoWeek)

export type Task = {
  id: string
  title: string
  priority: number
  due_date: string // YYYY-MM-DD
  is_done: boolean
  created_at: string
  completed_at: string | null
}

export default function TaskApp({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'today' | 'tomorrow' | 'overdue'>('today')
  const [view, setView] = useState<'list' | 'calendar' | 'matrix' | 'stats'>('list')
  const [loading, setLoading] = useState(true)

  const today = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

  const refresh = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (!error && data) setTasks(data as Task[])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // 認証状態変化にも追従（ログアウト等）
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh())
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const filtered = useMemo(() => {
    const open = tasks.filter(t => !t.is_done)
    if (tab === 'today') return open.filter(t => t.due_date === today)
    if (tab === 'tomorrow') return open.filter(t => t.due_date === tomorrow)
    return open.filter(t => t.due_date < today)
  }, [tasks, tab, today, tomorrow])

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: '0 auto' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Task App</h1>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            ログイン中：{userEmail || '（メール取得中）'}
          </div>
        </div>
        <button
          onClick={logout}
          style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', background: 'white' }}
        >
          ログアウト
        </button>
      </header>

      <section style={{ marginTop: 16 }}>
        <QuickAdd onAdded={refresh} />
      </section>

      <section style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'today', label: '今日' },
            { key: 'tomorrow', label: '明日' },
            { key: 'overdue', label: '期限切れ' },
          ]}
        />

        <Tabs
          value={view}
          onChange={setView}
          items={[
            { key: 'list', label: '一覧' },
            { key: 'calendar', label: 'カレンダー' },
            { key: 'matrix', label: '重要×緊急' },
            { key: 'stats', label: 'グラフ' },
          ]}
        />
      </section>

      <section style={{ marginTop: 16 }}>
        {loading ? (
          <p>Loading…</p>
        ) : view === 'list' ? (
          <TaskList tasks={filtered} onChanged={refresh} highlightOverdue={tab === 'overdue'} />
        ) : view === 'calendar' ? (
          <CalendarView tasks={tasks} />
        ) : view === 'matrix' ? (
          <MatrixView tasks={tasks} />
        ) : (
          <WeeklyDoneChart tasks={tasks} />
        )}
      </section>
    </main>
  )
}
