import Link from 'next/link'

export default function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{body}</p>
      <Link href="/generate" className="mt-5 inline-flex rounded-full bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-600">
        最初の下絵を作る
      </Link>
    </div>
  )
}
