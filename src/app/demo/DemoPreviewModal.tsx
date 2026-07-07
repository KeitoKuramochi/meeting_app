'use client'

import Link from 'next/link'

type Props = {
  contactName: string
  onClose: () => void
}

// 手順番号バッジ（1/2/3）。数字はスクリーンリーダーにも読ませたいので aria-hidden にはしない
function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold shrink-0"
      style={{ background: '#d4a030', color: '#fff' }}
    >
      {n}
    </span>
  )
}

// 静的なモック画面（実際の見た目の再現）に付与するスタイル。操作できないことを明示する
const MOCK_STYLE = { pointerEvents: 'none' as const, userSelect: 'none' as const }

// タップ時に開く「実際にはこう使う」のプレビュー。デモではDBに触れず、
// 種まき（リンク作成）→相手が見る画面→肥料をあげる（要約）の3ステップを
// 実際の画面のスタイルをそのまま流用したモックで見せる。
// 見出し・説明文はスクリーンリーダーでも読めるように aria-hidden の外に出し、
// モックUI（偽の入力欄・偽のボタンなど）だけを aria-hidden ＋ 操作無効化にしている。
export default function DemoPreviewModal({ contactName, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,37,9,0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden flex flex-col farm-modal"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-3 text-center shrink-0 farm-header">
          <h2 className="font-farm-title text-base" style={{ color: '#f5e6a3' }}>
            {contactName}の畑（プレビュー）
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: '#c8e6a3' }}>
            ログインすると、実際にここまで使えます
          </p>
        </div>

        {/* スクロールエリア */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4" style={{ background: '#fef7e4' }}>
          {/* STEP 1: 種をまく */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <StepBadge n={1} />
              <p className="text-sm font-bold" style={{ color: '#2c1a0e' }}>
                🌱 種をまく（リンクを作る）
              </p>
            </div>
            <p className="text-xs mb-2" style={{ color: '#6b4c0a' }}>
              相談内容と候補日時を入力すると、日程調整リンクが作れます。
            </p>
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1.5px solid #d4a853', background: '#fffdf7', ...MOCK_STYLE }} aria-hidden="true">
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: '#8b6914' }}>相談内容</p>
                <p className="rounded-lg px-2.5 py-1.5 text-xs" style={{ background: '#fff', border: '1px solid #e5d3a8', color: '#2c1a0e' }}>
                  卒業研究の進め方について相談したいです
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: '#8b6914' }}>候補日時</p>
                <p className="rounded-lg px-2.5 py-1.5 text-xs" style={{ background: '#fff', border: '1px solid #e5d3a8', color: '#2c1a0e' }}>
                  2026/08/10（月）14:00〜
                </p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-center" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                種まき用URLが発行されます ✅
              </div>
            </div>
          </section>

          {/* STEP 2: 相手が見る画面 */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <StepBadge n={2} />
              <p className="text-sm font-bold" style={{ color: '#2c1a0e' }}>
                🙋 {contactName}にはこう見えます
              </p>
            </div>
            <p className="text-xs mb-2" style={{ color: '#6b4c0a' }}>
              {contactName}はログイン不要でリンクを開き、候補日時を選んで確定するだけです。
            </p>
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1.5px solid #d4a853', background: '#fffdf7', ...MOCK_STYLE }} aria-hidden="true">
              <p className="text-xs font-semibold" style={{ color: '#6b4c0a' }}>
                候補日時を選んで確定してください
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ border: '2px solid #d4a030', background: '#fef7e4' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '4px solid #d4a030', display: 'inline-block', flexShrink: 0 }} />
                  <span className="text-xs font-semibold" style={{ color: '#2c1a0e' }}>2026/08/10（月）14:00〜</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ border: '1.5px solid #c8953a', background: '#fff' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #c8953a', display: 'inline-block', flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: '#6b4c0a' }}>2026/08/12（水）10:00〜</span>
                </div>
              </div>
              <div className="flex h-8 w-full items-center justify-center rounded-xl text-xs font-semibold" style={{ background: '#4a8c5c', color: '#fff', opacity: 0.9 }}>
                確定する
              </div>
            </div>
          </section>

          {/* STEP 3: 肥料をあげる */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <StepBadge n={3} />
              <p className="text-sm font-bold" style={{ color: '#2c1a0e' }}>
                🌾 肥料をあげる（要約を記録する）
              </p>
            </div>
            <p className="text-xs mb-2" style={{ color: '#6b4c0a' }}>
              ミーティング後にメモや文字起こしを渡すと、AIが要約を作ってくれます。あげるたびに{contactName}が育ちます 🌟
            </p>
            <div className="rounded-lg px-3 py-2.5 text-xs space-y-1" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', ...MOCK_STYLE }} aria-hidden="true">
              <p className="font-semibold" style={{ color: '#166534' }}>
                📄 要約
                <span className="ml-1 font-normal" style={{ color: '#4d7c0f' }}>（AIが自動作成）</span>
              </p>
              <p className="whitespace-pre-wrap" style={{ color: '#14532d' }}>
                ・卒業研究の進め方について相談{'\n'}
                ・来週までに第1章のドラフトを提出することで合意{'\n'}
                ・次回8/17に進捗を確認する
              </p>
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="px-4 pb-4 pt-3 space-y-2 shrink-0" style={{ borderTop: '2px solid #d4a853' }}>
          <Link
            href="/"
            className="farm-btn-gold flex h-11 w-full items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            ログインして実際に使ってみる →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium focus:outline-none transition-colors"
            style={{ border: '1.5px solid #d4a853', color: '#6b4c0a', background: '#fef7e4' }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
