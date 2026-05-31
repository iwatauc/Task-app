import Link from 'next/link'
import dayjs from 'dayjs'
import type { AppImage } from '@/lib/types'

export default function ImageCard({ image }: { image: AppImage }) {
  return (
    <Link href={`/images/${image.id}`} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
      <div className="aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.thumbnail_url || image.image_url} alt={image.title || '下絵画像'} className="h-full w-full object-cover transition group-hover:scale-105" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 font-bold">{image.title || image.purpose || '無題の下絵'}</h3>
          <span className="text-lg">{image.favorite ? '★' : '☆'}</span>
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="rounded-full bg-red-50 px-2 py-1 text-red-700 dark:bg-red-950 dark:text-red-200">{image.purpose || '用途未設定'}</span>
          <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{image.source_type}</span>
        </div>
        <p className="text-xs text-stone-500">{dayjs(image.created_at).format('YYYY/MM/DD HH:mm')}</p>
      </div>
    </Link>
  )
}
