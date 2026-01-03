import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Task App',
  description: 'Simple task manager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>{children}</body>
    </html>
  )
}
