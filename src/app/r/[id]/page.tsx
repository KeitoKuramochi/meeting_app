import Link from 'next/link'
import type { Meeting } from '@/types/meeting'
import { getSupabase } from '@/lib/supabase'
import CandidateList from './CandidateList'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params

  const { data, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single<Meeting>()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-4 text-lg font-semibold text-red-600">
              リクエストが見つかりません
            </p>
            <p className="mb-6 text-sm text-gray-500">
              URLが正しくないか、リクエストが削除された可能性があります。
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              トップページへ戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const meeting: Meeting = data
  const isConfirmed = meeting.confirmed_index !== null

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">
            面談リクエストの確認
          </h1>
          {isConfirmed && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              確定済み
            </span>
          )}
        </div>

        {/* 学生情報 */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <dl className="space-y-4">
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                学生名
              </dt>
              <dd className="text-base font-semibold text-gray-900">
                {meeting.student_name}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                相談内容
              </dt>
              <dd className="whitespace-pre-wrap text-base text-gray-800">
                {meeting.purpose}
              </dd>
            </div>
          </dl>
        </div>

        {/* 候補日時 */}
        <div className="mb-6">
          {!isConfirmed && (
            <h2 className="mb-3 text-sm font-medium text-gray-700">
              候補日時を選択してください
            </h2>
          )}
          {meeting.candidates.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white px-4 py-4 text-sm text-gray-500">
              候補日時がありません。
            </p>
          ) : (
            <CandidateList
              candidates={meeting.candidates}
              meetingId={meeting.id}
              isConfirmed={isConfirmed}
              confirmedIndex={meeting.confirmed_index}
            />
          )}
        </div>
      </div>
    </div>
  )
}
