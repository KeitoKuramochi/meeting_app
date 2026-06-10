import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Farm } from '@/types/farm'
import AddContactForm from './AddContactForm'

export default async function FarmAddPage() {
  const supabase = await createSupabaseServerClient()

  // ログインユーザーを取得（未ログインは / にリダイレクト）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // ユーザーの farms レコードを取得 or 作成
  const { data: upsertedFarm, error: farmUpsertError } = await supabase
    .from('farms')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single<Farm>()

  let farmId: string | null = null

  if (!farmUpsertError && upsertedFarm) {
    farmId = upsertedFarm.id
  } else {
    // upsert 失敗時は既存レコードを取得
    const { data: existingFarm } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .single<Farm>()
    farmId = existingFarm?.id ?? null
  }

  if (!farmId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 dark:bg-gray-950 px-4">
        <p className="text-gray-700 dark:text-gray-300">農園の読み込みに失敗しました。</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <Link
          href="/farm"
          className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
          aria-label="農園に戻る"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">先生を追加</h1>
      </header>

      {/* フォームエリア */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <AddContactForm farmId={farmId} />
      </main>
    </div>
  )
}
