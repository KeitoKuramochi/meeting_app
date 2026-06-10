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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
            ミーティングをリクエスト
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {data.contact_name}
            </span>{' '}
            先生への候補日を送信します
          </p>
        </div>
        <RequestForm
          farmContactId={farm_contact_id}
          contactName={data.contact_name}
        />
      </div>
    </div>
  )
}
