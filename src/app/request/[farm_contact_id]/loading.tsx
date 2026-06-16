export default function RequestLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#f5ede0' }}>
      {/* ヘッダースケルトン */}
      <header className="farm-header flex items-center gap-3 px-4 py-3">
        <div className="h-11 w-11 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-40 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="h-3 w-28 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
      </header>

      {/* フォームスケルトン */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="farm-card p-6 space-y-5">
          {/* お名前フィールド */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: '#d4a853' }} />
            <div className="h-12 w-full rounded-xl animate-pulse" style={{ background: '#f0e6cc' }} />
          </div>
          {/* 相談内容フィールド */}
          <div className="space-y-2">
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: '#d4a853' }} />
            <div className="h-24 w-full rounded-xl animate-pulse" style={{ background: '#f0e6cc' }} />
          </div>
          {/* 候補日時フィールド */}
          <div className="space-y-2">
            <div className="h-4 w-32 rounded animate-pulse" style={{ background: '#d4a853' }} />
            <div className="h-14 w-full rounded-xl animate-pulse" style={{ background: '#f0e6cc' }} />
          </div>
          {/* 送信ボタン */}
          <div className="h-12 w-full rounded-xl animate-pulse" style={{ background: '#4a8c5c' }} />
        </div>
      </main>
    </div>
  )
}
