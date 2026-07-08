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
      <div className="min-h-screen px-4 py-8" style={{ background: '#f5ede0' }}>
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl p-6 text-center" style={{ background: '#fef7e4', border: '2px solid #fca5a5' }}>
            <p className="mb-2 text-lg font-semibold" style={{ color: '#b91c1c' }}>
              ページが見つかりません
            </p>
            <p className="mb-6 text-sm" style={{ color: '#6b4c0a' }}>
              URLが正しくないか、ミーティングの予定が削除された可能性があります。<br />
              リンクを送ってくれた方にご確認ください。
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              style={{ background: '#4a8c5c' }}
            >
              トップページへ戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return renderReviewPage(data)
}

function renderReviewPage(meeting: Meeting) {
  // confirmed_index による確定（このページ経由）だけでなく、送信側の「手動確定」も確定として扱う
  const isConfirmed = meeting.confirmed_index !== null || meeting.manually_confirmed === true

  return (
    <div className="min-h-screen" style={{ background: '#f5ede0' }}>
      {/* ヘッダー */}
      <header className="farm-header flex items-center gap-3 px-4 py-3">
        <span className="text-xl" aria-hidden="true">🌾</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: '#f5e6a3' }}>
            ミーティング日程のご確認
          </h1>
          {isConfirmed && (
            <p className="text-xs" style={{ color: '#c8e6a3' }}>確定済みです</p>
          )}
        </div>
        {isConfirmed && (
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(209,250,229,0.9)', color: '#065f46' }}
          >
            ✅ 確定済み
          </span>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 学生情報カード */}
        <div className="rounded-2xl p-5" style={{ background: '#fef7e4', border: '2px solid #d4a853' }}>
          <dl className="space-y-4">
            <div>
              <dt className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8b6914' }}>
                お名前
              </dt>
              <dd className="text-base font-semibold" style={{ color: '#2c1a0e' }}>
                {meeting.student_name}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8b6914' }}>
                相談内容
              </dt>
              <dd className="whitespace-pre-wrap text-sm" style={{ color: '#3d2b0e' }}>
                {meeting.purpose}
              </dd>
            </div>
          </dl>
        </div>

        {/* 候補日時セクション */}
        <div>
          {!isConfirmed && (
            <h2 className="mb-2 text-sm font-semibold" style={{ color: '#3d2b0e' }}>
              候補日時を選んで確定してください
            </h2>
          )}
          {meeting.candidates.length === 0 ? (
            <div
              className="rounded-2xl px-4 py-5 text-sm text-center"
              style={{ background: '#fef7e4', border: '1.5px solid #d4a853' }}
            >
              <p style={{ color: '#6b4c0a' }}>候補日時が設定されていません。</p>
              <p className="mt-1 text-xs" style={{ color: '#8b6914' }}>
                リンクを送ってくれた方にご連絡ください。
              </p>
            </div>
          ) : (
            <CandidateList
              candidates={meeting.candidates}
              meetingId={meeting.id}
              isConfirmed={isConfirmed}
              confirmedIndex={meeting.confirmed_index}
              initialDurationMinutes={meeting.duration_minutes}
              initialNote={meeting.note}
              initialAlternativeCandidates={meeting.alternative_candidates}
              initialRepliedAt={meeting.replied_at}
            />
          )}
        </div>
      </main>
    </div>
  )
}
