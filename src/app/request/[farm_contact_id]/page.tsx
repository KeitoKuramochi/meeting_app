import Link from 'next/link'
import type { FarmContact } from '@/types/farm'
import { getSupabase } from '@/lib/supabase'
import RequestForm from './RequestForm'

type Props = {
  params: Promise<{ farm_contact_id: string }>
}

export default async function RequestPage({ params }: Props) {
  const { farm_contact_id } = await params

  const supabase = getSupabase()

  // 2つのクエリを並列実行してレイテンシを削減
  const [{ data, error }, { data: confirmedRows }] = await Promise.all([
    supabase
      .from('farm_contacts')
      .select('*')
      .eq('id', farm_contact_id)
      .single<FarmContact>(),
    supabase
      .from('meetings')
      .select('id')
      .eq('farm_contact_id', farm_contact_id)
      .or('confirmed_index.not.is.null,manually_confirmed.eq.true'),
  ])

  if (error || !data) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: '#f5ede0' }}>
        <div className="mx-auto max-w-lg">
          <div className="farm-card p-6 text-center">
            <p className="mb-2 text-lg font-semibold" style={{ color: '#b91c1c' }}>
              相手が見つかりません
            </p>
            <p className="text-sm" style={{ color: '#6b4c0a' }}>
              URLが正しくないか、相手が削除された可能性があります。
            </p>
            <Link
              href="/farm"
              className="farm-btn mt-4 inline-flex h-11 items-center justify-center px-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              農園に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const confirmedCount = confirmedRows?.length ?? 0

  return (
    <div className="min-h-screen" style={{ background: '#f5ede0' }}>
      {/* ヘッダー */}
      <header className="farm-header flex items-center gap-3 px-4 py-3">
        <Link
          href="/farm"
          className="h-11 w-11 flex items-center justify-center rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
          style={{ color: '#f5e6a3' }}
          aria-label="農園に戻る"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: '#f5e6a3' }}>
            {data.contact_name}さんに種をまく
          </h1>
          {confirmedCount > 0 ? (
            <p className="text-xs" style={{ color: '#c8e6a3' }}>
              これまで{confirmedCount}回ミーティングが確定しています
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#c8e6a3' }}>
              はじめての種まきです
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
