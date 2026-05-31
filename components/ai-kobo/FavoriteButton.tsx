'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function FavoriteButton({ imageId, initialFavorite }: { imageId: string; initialFavorite: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function toggle() {
    setBusy(true)
    const next = !favorite
    setFavorite(next)
    const response = await fetch('/api/toggle-favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, favorite: next }),
    })
    if (!response.ok) setFavorite(!next)
    setBusy(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={busy} className="rounded-full border border-stone-300 px-4 py-2 font-bold hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-900">
      {favorite ? '★ お気に入り' : '☆ お気に入り'}
    </button>
  )
}
