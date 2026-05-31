'use client'

export default function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <button className="rounded-full border border-stone-300 px-3 py-2 font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-900" type="submit">
        ログアウト
      </button>
    </form>
  )
}
