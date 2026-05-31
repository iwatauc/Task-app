import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI下絵工房',
  description: 'AI画像を完成品ではなく、イラスト制作の下絵・構図・ポーズ・線画・色ラフ参考として使うための工房アプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
