import Image from 'next/image'
import Link from 'next/link'
import OAuthLoginButtons from './_components/OAuthLoginButtons'

type Props = {
  searchParams: Promise<{ auth_error?: string }>
}

export default async function TopPage({ searchParams }: Props) {
  const params = await searchParams
  const authError = params.auth_error

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: '#f5ede0' }}>
      {/* Farm background */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-30">
        <Image src="/images/nouen.webp" alt="" fill className="object-cover object-bottom" priority sizes="100vw" />
      </div>

      <main className="relative z-10 w-full max-w-sm px-4 py-10 flex flex-col items-center gap-7">
        {/* Logo */}
        <div className="text-center">
          <div className="text-7xl mb-3" role="img" aria-label="農場">🌾</div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#1a3d12', textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
            のうえん<wbr />ミーティング
          </h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: '#4a7c59' }}>
            日程調整を、農園ゲームにしよう
          </p>
        </div>

        {/* Feature cards */}
        <div className="w-full rounded-2xl p-4 space-y-3" style={{ background: '#fef7e4', border: '2px solid #c8953a' }}>
          <p className="text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#8b6914' }}>できること</p>
          {[
            { emoji: '🐾', text: '相手をキャラとして農園に登録' },
            { emoji: '📅', text: 'URLを送るだけで日程を確定' },
            { emoji: '🏆', text: '要約を記録するとキャラが成長する' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3 py-1">
              <span className="text-xl shrink-0">{emoji}</span>
              <span className="text-sm font-medium" style={{ color: '#3d2b0e' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* ログインエラー表示 */}
        {authError && (
          <div
            className="w-full rounded-xl px-4 py-3 text-sm"
            role="alert"
            style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c' }}
          >
            <p className="font-semibold mb-0.5">ログインに失敗しました</p>
            <p style={{ color: '#dc2626' }}>{decodeURIComponent(authError)}</p>
          </div>
        )}

        {/* Login */}
        <div className="w-full">
          <p className="mb-3 text-center text-xs font-medium" style={{ color: '#6b4c0a' }}>
            ログインして農園をはじめる
          </p>
          <OAuthLoginButtons />
          <div className="mt-4 text-center flex flex-col gap-2">
            <Link href="/demo" className="text-sm font-medium hover:underline focus:outline-none" style={{ color: '#4a7c59' }}>
              ログインなしでデモを見る →
            </Link>
            <Link href="/guide" className="text-sm underline" style={{ color: '#92400e' }}>
              使い方を見る →
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs" style={{ color: '#8b6914' }}>
        &copy; {new Date().getFullYear()} のうえんミーティング
      </footer>
    </div>
  )
}
