export default function FarmLoading() {
  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950 flex flex-col">
      {/* ヘッダーのスケルトン */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-11 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-11 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </header>

      {/* 農園エリアのスケルトン */}
      <main className="flex-1 p-4">
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{ minHeight: '60vh' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
              農園を読み込み中...
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
