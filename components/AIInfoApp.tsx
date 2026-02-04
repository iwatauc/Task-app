'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'

export type AiService = {
  id: string
  name: string
  capabilitySummary: string
  costYen: number
  sourceUrl: string
  latestUpdateSummary: string
  latestUpdatedAt: string
  confirmed: boolean
}

type NotificationPlan = {
  id: string
  tool: 'LINE' | 'Slack' | 'メール' | 'X'
  scheduledAt: string
  message: string
}

const initialServices: AiService[] = [
  {
    id: 'svc-1',
    name: 'VisionCraft AI',
    capabilitySummary: '画像生成とスタイル変換を高速化し、商用利用向けのライセンス設定が追加。',
    costYen: 3500,
    sourceUrl: 'https://example.com/visioncraft-ai',
    latestUpdateSummary: '高解像度の生成モデルが追加され、1枚あたりの生成速度が20%改善。',
    latestUpdatedAt: '2024-06-20T10:00',
    confirmed: false,
  },
  {
    id: 'svc-2',
    name: 'SummarizePro',
    capabilitySummary: '長文の要約精度が向上し、PDFの一括処理が可能になった。',
    costYen: 1800,
    sourceUrl: 'https://example.com/summarizepro',
    latestUpdateSummary: '医療・法務向けテンプレートが追加され、要約のフォーマットを自動選択。',
    latestUpdatedAt: '2024-07-02T14:30',
    confirmed: true,
  },
  {
    id: 'svc-3',
    name: 'CodePilot Studio',
    capabilitySummary: 'IDE内でのコード補完とレビュー支援が統合された。',
    costYen: 5200,
    sourceUrl: 'https://example.com/codepilot-studio',
    latestUpdateSummary: 'セキュリティレビューの自動指摘と、CI連携が追加。',
    latestUpdatedAt: '2024-07-10T09:15',
    confirmed: false,
  },
]

const defaultNotificationMessage = '最新のAIサービス更新情報をまとめました。'

export default function AIInfoApp({ userEmail }: { userEmail: string }) {
  const [services, setServices] = useState<AiService[]>(initialServices)
  const [searchText, setSearchText] = useState('')
  const [newService, setNewService] = useState({
    name: '',
    capabilitySummary: '',
    costYen: '',
    sourceUrl: '',
    latestUpdateSummary: '',
    latestUpdatedAt: '',
  })
  const [notificationTool, setNotificationTool] = useState<NotificationPlan['tool']>('Slack')
  const [notificationTime, setNotificationTime] = useState('')
  const [notificationMessage, setNotificationMessage] = useState(defaultNotificationMessage)
  const [notificationPlans, setNotificationPlans] = useState<NotificationPlan[]>([])
  const [shareMessage, setShareMessage] = useState('')

  const latestService = useMemo(() => {
    return [...services].sort((a, b) => (a.latestUpdatedAt < b.latestUpdatedAt ? 1 : -1))[0]
  }, [services])

  const filteredServices = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return services
    return services.filter(service => {
      return (
        service.name.toLowerCase().includes(query) ||
        service.capabilitySummary.toLowerCase().includes(query) ||
        service.latestUpdateSummary.toLowerCase().includes(query) ||
        service.sourceUrl.toLowerCase().includes(query)
      )
    })
  }, [searchText, services])

  const toggleConfirmed = (id: string) => {
    setServices(prev =>
      prev.map(service => (service.id === id ? { ...service, confirmed: !service.confirmed } : service))
    )
  }

  const addService = () => {
    if (!newService.name || !newService.capabilitySummary || !newService.sourceUrl || !newService.latestUpdatedAt) return
    const costValue = Number(newService.costYen || 0)
    const next: AiService = {
      id: `svc-${Date.now()}`,
      name: newService.name,
      capabilitySummary: newService.capabilitySummary,
      costYen: Number.isFinite(costValue) ? costValue : 0,
      sourceUrl: newService.sourceUrl,
      latestUpdateSummary: newService.latestUpdateSummary || '更新内容の要約を入力してください。',
      latestUpdatedAt: newService.latestUpdatedAt,
      confirmed: false,
    }
    setServices(prev => [next, ...prev])
    setNewService({
      name: '',
      capabilitySummary: '',
      costYen: '',
      sourceUrl: '',
      latestUpdateSummary: '',
      latestUpdatedAt: '',
    })
  }

  const scheduleNotification = () => {
    if (!notificationTime) return
    const nextPlan: NotificationPlan = {
      id: `notify-${Date.now()}`,
      tool: notificationTool,
      scheduledAt: notificationTime,
      message: notificationMessage || defaultNotificationMessage,
    }
    setNotificationPlans(prev => [nextPlan, ...prev])
    setNotificationTime('')
  }

  const handleShare = async (service: AiService) => {
    const message = `${service.name}\n${service.capabilitySummary}\n費用: ¥${service.costYen.toLocaleString()}\n更新: ${service.latestUpdateSummary}\n${service.sourceUrl}`
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message)
      setShareMessage(`${service.name} の情報をクリップボードにコピーしました。`)
    } else {
      setShareMessage('クリップボードが利用できないため、共有メッセージを表示します。')
      alert(message)
    }
    window.setTimeout(() => setShareMessage(''), 3000)
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>AI情報ダッシュボード</h1>
          <p style={{ marginTop: 6, color: '#5f6368' }}>AIサービスの最新情報を収集・要約し、通知まで管理します。</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>ログイン中</div>
          <div style={{ fontWeight: 600 }}>{userEmail || 'ゲスト'} </div>
        </div>
      </header>

      <section style={{ display: 'grid', gap: 12, padding: 16, borderRadius: 16, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            placeholder="AIサービスを検索（名前・要約・URL）"
            style={{ flex: 1, minWidth: 240, padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
          <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f3f4f6', color: '#374151' }}>
            データ件数: {filteredServices.length}
          </div>
        </div>
        {latestService && (
          <div style={{ background: '#eef2ff', padding: 12, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>最新アップデート</div>
            <div>{latestService.name} - {latestService.latestUpdateSummary}</div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>
              更新日時: {dayjs(latestService.latestUpdatedAt).format('YYYY/MM/DD HH:mm')}
            </div>
          </div>
        )}
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>AIサービス情報データベース</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 12 }}>確認済み</th>
                <th style={{ textAlign: 'left', padding: 12 }}>サービス</th>
                <th style={{ textAlign: 'left', padding: 12 }}>できること</th>
                <th style={{ textAlign: 'left', padding: 12 }}>コスト（円）</th>
                <th style={{ textAlign: 'left', padding: 12 }}>最新更新</th>
                <th style={{ textAlign: 'left', padding: 12 }}>根拠URL</th>
                <th style={{ textAlign: 'left', padding: 12 }}>共有</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => (
                <tr key={service.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12 }}>
                    <input
                      type="checkbox"
                      checked={service.confirmed}
                      onChange={() => toggleConfirmed(service.id)}
                    />
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{service.name}</td>
                  <td style={{ padding: 12 }}>{service.capabilitySummary}</td>
                  <td style={{ padding: 12 }}>¥{service.costYen.toLocaleString()}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{service.latestUpdateSummary}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {dayjs(service.latestUpdatedAt).format('YYYY/MM/DD HH:mm')}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <a href={service.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                      {service.sourceUrl}
                    </a>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleShare(service)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white' }}
                    >
                      共有
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shareMessage && <div style={{ fontSize: 12, color: '#16a34a' }}>{shareMessage}</div>}
      </section>

      <section style={{ display: 'grid', gap: 12, border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>新しいサービスを追加</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <input
            value={newService.name}
            onChange={event => setNewService(prev => ({ ...prev, name: event.target.value }))}
            placeholder="サービス名"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
          <input
            value={newService.capabilitySummary}
            onChange={event => setNewService(prev => ({ ...prev, capabilitySummary: event.target.value }))}
            placeholder="できることの要約"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
          <input
            value={newService.costYen}
            onChange={event => setNewService(prev => ({ ...prev, costYen: event.target.value }))}
            placeholder="コスト（円）"
            type="number"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
          <input
            value={newService.sourceUrl}
            onChange={event => setNewService(prev => ({ ...prev, sourceUrl: event.target.value }))}
            placeholder="根拠URL"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
          <input
            value={newService.latestUpdateSummary}
            onChange={event => setNewService(prev => ({ ...prev, latestUpdateSummary: event.target.value }))}
            placeholder="最新更新の要約"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
          <input
            value={newService.latestUpdatedAt}
            onChange={event => setNewService(prev => ({ ...prev, latestUpdatedAt: event.target.value }))}
            type="datetime-local"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </div>
        <button
          onClick={addService}
          style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db' }}
        >
          サービスを追加
        </button>
      </section>

      <section style={{ display: 'grid', gap: 12, border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>通知設定</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            通知ツール
            <select
              value={notificationTool}
              onChange={event => setNotificationTool(event.target.value as NotificationPlan['tool'])}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
            >
              <option value="LINE">LINE</option>
              <option value="Slack">Slack</option>
              <option value="メール">メール</option>
              <option value="X">X</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            通知タイミング
            <input
              type="datetime-local"
              value={notificationTime}
              onChange={event => setNotificationTime(event.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            通知メッセージ
            <input
              value={notificationMessage}
              onChange={event => setNotificationMessage(event.target.value)}
              placeholder="通知内容の要約"
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>
        </div>
        <button
          onClick={scheduleNotification}
          style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db' }}
        >
          通知を予約
        </button>
        <div style={{ display: 'grid', gap: 8 }}>
          {notificationPlans.map(plan => (
            <div key={plan.id} style={{ padding: 12, borderRadius: 12, background: '#f9fafb' }}>
              <div style={{ fontWeight: 600 }}>
                {plan.tool} に {dayjs(plan.scheduledAt).format('YYYY/MM/DD HH:mm')} 送信予定
              </div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>{plan.message}</div>
            </div>
          ))}
          {notificationPlans.length === 0 && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>通知予約はまだありません。</div>
          )}
        </div>
      </section>
    </main>
  )
}
