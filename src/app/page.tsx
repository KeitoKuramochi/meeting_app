import Image from 'next/image'
import OAuthLoginButtons from './_components/OAuthLoginButtons'

export default function TopPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-emerald-50 dark:bg-gray-950">
      {/* 背景農園画像（薄く表示） */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none select-none">
        <Image
          src="/images/nouen.png"
          alt=""
          fill
          className="object-cover object-bottom"
          priority
          sizes="100vw"
        />
      </div>

      {/* コンテンツ */}
      <main className="relative z-10 w-full max-w-sm px-4 py-12 flex flex-col items-center gap-8">
        {/* ロゴ・タイトル */}
        <div className="text-center">
          <div className="text-6xl mb-3" role="img" aria-label="農場">
            🌾
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300">
            のうえんミーティング
          </h1>
          <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            だれとでも、日程調整をもっと楽しく。
          </p>
        </div>

        {/* アプリ説明 */}
        <div className="w-full rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm p-5 shadow-md dark:bg-gray-900/80 dark:border-emerald-800">
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 shrink-0">🌱</span>
              <span>相手をキャラクターとして農園に登録できる</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 shrink-0">📅</span>
              <span>候補日を送るだけで相手がワンクリックで確定</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 shrink-0">🏆</span>
              <span>ミーティングを重ねるごとにキャラが成長する</span>
            </li>
          </ul>
        </div>

        {/* ログインボタン */}
        <div className="w-full">
          <p className="mb-4 text-center text-xs text-gray-500 dark:text-gray-400">
            アカウントでログインして始める
          </p>
          <OAuthLoginButtons />
        </div>
      </main>

      {/* フッター */}
      <footer className="relative z-10 pb-6 text-center text-xs text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} のうえんミーティング
      </footer>
    </div>
  )
}
