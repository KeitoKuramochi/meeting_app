export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Farm, FarmContact, FarmContactWithCount } from '@/types/farm'
import FarmCharacters from './FarmCharacters'
import LogoutButton from './LogoutButton'

export default async function FarmPage() {
  const supabase = await createSupabaseServerClient()

  // ログインユーザーを取得（未ログインの場合は / にリダイレクト）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // farms テーブルでユーザーの農園を取得 or 自動作成（upsert）
  const { data: upsertedFarm, error: farmError } = await supabase
    .from('farms')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single<Farm>()

  if (farmError || !upsertedFarm) {
    // upsert が失敗した場合は既存レコードを取得
    const { data: existingFarm } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .single<Farm>()

    if (!existingFarm) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-emerald-50 dark:bg-gray-950">
          <p className="text-gray-700 dark:text-gray-300">農園の読み込みに失敗しました。</p>
        </div>
      )
    }

    return <FarmView farm={existingFarm} />
  }

  return <FarmView farm={upsertedFarm} />
}

// confirmed_count の集計結果の行型
type ConfirmedCountRow = {
  farm_contact_id: string
  count: number
}

async function FarmView({ farm }: { farm: Farm }) {
  const supabase = await createSupabaseServerClient()

  // farm_contacts を取得
  const { data: contacts } = await supabase
    .from('farm_contacts')
    .select('*')
    .eq('farm_id', farm.id)
    .order('created_at', { ascending: true })
    .returns<FarmContact[]>()

  const farmContacts: FarmContact[] = contacts ?? []

  // 各 farm_contact の確定回数を集計
  let confirmedCounts: ConfirmedCountRow[] = []
  if (farmContacts.length > 0) {
    const contactIds = farmContacts.map((c) => c.id)
    const { data: countData } = await supabase
      .from('meetings')
      .select('farm_contact_id')
      .in('farm_contact_id', contactIds)
      .not('confirmed_index', 'is', null)
      .returns<{ farm_contact_id: string }[]>()

    // JavaScriptで集計（rpc を使わずシンプルに実装）
    const countMap: Record<string, number> = {}
    for (const row of countData ?? []) {
      if (row.farm_contact_id) {
        countMap[row.farm_contact_id] = (countMap[row.farm_contact_id] ?? 0) + 1
      }
    }
    confirmedCounts = Object.entries(countMap).map(([farm_contact_id, count]) => ({
      farm_contact_id,
      count,
    }))
  }

  // FarmContactWithCount に変換
  const farmContactsWithCount: FarmContactWithCount[] = farmContacts.map((c) => ({
    ...c,
    confirmedCount: confirmedCounts.find((r) => r.farm_contact_id === c.id)?.count ?? 0,
  }))

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950 flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <h1 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
          のうえんミーティング
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/farm/add"
            className="h-11 px-4 flex items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            相手を追加
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* 農園エリア */}
      <main className="flex-1 p-4">
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-lg"
          style={{ minHeight: '60vh' }}
        >
          {/* 農園背景画像 */}
          <img
            src="/images/nouen.png"
            alt="農園"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* キャラクター表示 */}
          <div className="absolute inset-0">
            <FarmCharacters contacts={farmContactsWithCount} />
          </div>
        </div>

        {/* キャラ数の表示 */}
        {farmContacts.length > 0 && (
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            {farmContacts.length} 人が農園にいます
          </p>
        )}
      </main>
    </div>
  )
}
