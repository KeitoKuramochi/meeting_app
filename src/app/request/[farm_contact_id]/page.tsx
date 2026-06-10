import type { FarmContact } from '@/types/farm'
import { getSupabase } from '@/lib/supabase'
import RequestForm from './RequestForm'

type Props = {
  params: Promise<{ farm_contact_id: string }>
}

export default async function RequestPage({ params }: Props) {
  const { farm_contact_id } = await params

  const { data, error } = await getSupabase()
    .from('farm_contacts')
    .select('*')
    .eq('id', farm_contact_id)
    .single<FarmContact>()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-emerald-50 dark:bg-gray-950 px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-red-200 bg-white dark:bg-gray-900 dark:border-red-800 p-6 text-center shadow-sm">
            <p className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
              相手が見つかりません
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              URLが正しくないか、相手が削除された可能性があります。
            </p>
            <a
              href="/farm"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
            >
              農園に戻る
            </a>
          </div>
        </div>
      </div>
    )
  }

  // この相手との確定済みミーティング回数を取得
  const { data: confirmedRows } = await getSupabase()
    .from('meetings')
    .select('id')
    .eq('farm_contact_id', farm_contact_id)
    .not('confirmed_index', 'is', null)

  const confirmedCount = confirmedRows?.length ?? 0

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <a
          href="/farm"
          className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
          aria-label="農園に戻る"
        >
          ←
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-emerald-800 dark:text-emerald-300 truncate">
            {data.contact_name}さんへリクエスト
          </h1>
          {confirmedCount > 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              これまで{confirmedCount}回ミーティングが確定しています
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              はじめてのリクエストです
            </p>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <RequestForm
          farmContactId={farm_contact_id}
          contactName={data.contact_name}
          confirmedCount={confirmedCount}
        />
      </main>
    </div>
  )
}
