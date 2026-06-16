'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="h-9 px-3 flex items-center justify-center rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
      style={{ color: 'rgba(245,230,163,0.8)', border: '1px solid rgba(245,230,163,0.3)' }}
    >
      ログアウト
    </button>
  )
}
