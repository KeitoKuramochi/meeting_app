export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5ede0' }}>
      {/* Header */}
      <header
        className="farm-header flex items-center justify-between px-4 py-3 shrink-0"
        style={{ position: 'sticky', top: 0, zIndex: 40 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🌾</span>
          <span className="text-base font-extrabold" style={{ color: '#f5e6a3', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            のうえんミーティング
          </span>
        </div>
        <a
          href="/"
          className="farm-btn-gold h-9 px-3 flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          農園をはじめる
        </a>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Hero */}
        <section className="text-center pt-2">
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#2c1a0e' }}>
            のうえんミーティングの使い方
          </h1>
          <p className="text-sm font-medium" style={{ color: '#8b6914' }}>
            日程調整を農園ゲームにして、もっと楽しく・かんたんに。
          </p>
        </section>

        {/* STEP 1 */}
        <section className="farm-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0"
              style={{ background: '#d4a030', color: '#fff' }}
            >
              1
            </span>
            <h2 className="text-base font-extrabold" style={{ color: '#2c1a0e' }}>相手を農園に追加する</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3d2b0e' }}>
            ヘッダーの「＋ 追加」ボタンから相手の名前とキャラクターを選んで登録します。
            キャラクターは全部で選び放題！お気に入りを選んでください。
          </p>
          <div className="flex items-center justify-center gap-4">
            {['1', '2', '3'].map((n) => (
              <img
                key={n}
                src={`/images/processed_${n}.png`}
                alt={`キャラクター ${n}`}
                width={60}
                height={60}
                style={{ imageRendering: 'pixelated', width: 60, height: 60 }}
              />
            ))}
          </div>
        </section>

        {/* STEP 2 */}
        <section className="farm-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0"
              style={{ background: '#d4a030', color: '#fff' }}
            >
              2
            </span>
            <h2 className="text-base font-extrabold" style={{ color: '#2c1a0e' }}>キャラが農園で動き回る</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3d2b0e' }}>
            登録したキャラクターは農園の中をうろうろ動き回ります。
            ドラッグして移動させ、タップするとリクエスト画面が開きます。
          </p>
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              border: '3px solid #7c5c3a',
              background: 'rgba(139,101,20,0.08)',
              minHeight: 140,
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* 吹き出しバッジ */}
              <div
                className="farm-card"
                style={{
                  padding: '2px 10px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#fef3c7',
                  border: '1.5px solid #d97706',
                  color: '#92400e',
                  marginBottom: 2,
                }}
              >
                タップ！
              </div>
              <img
                src="/images/processed_5.png"
                alt="農園キャラクター"
                width={80}
                height={80}
                style={{ imageRendering: 'pixelated', width: 80, height: 80 }}
              />
              <span className="text-xs font-bold" style={{ color: '#3d2b0e' }}>田中さん</span>
            </div>
          </div>
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#fef3c7', border: '1px solid #d97706', color: '#92400e' }}>
            💡 <span className="font-semibold">Tips:</span> 移動させた直後は少しゆっくり動くので、そのタイミングでタップするとラクです
          </p>
        </section>

        {/* STEP 3 */}
        <section className="farm-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0"
              style={{ background: '#d4a030', color: '#fff' }}
            >
              3
            </span>
            <h2 className="text-base font-extrabold" style={{ color: '#2c1a0e' }}>リクエストフォームに入力する</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3d2b0e' }}>
            名前・相談内容・希望日程を入力すると送付用URLが生成されます。
            そのURLを相手に送るだけで日程調整が始まります。
          </p>
          {/* モックフォーム */}
          <div
            aria-hidden="true"
            className="farm-card rounded-xl p-4 flex flex-col gap-3"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: '#6b4c0a' }}>あなたのお名前</label>
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: '#fff', border: '1.5px solid #c8953a', color: '#2c1a0e' }}
              >
                山田 太郎
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: '#6b4c0a' }}>相談内容</label>
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: '#fff', border: '1.5px solid #c8953a', color: '#2c1a0e', minHeight: 56 }}
              >
                卒業研究の進め方について
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: '#6b4c0a' }}>候補日時</label>
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: '#fff', border: '1.5px solid #c8953a', color: '#2c1a0e' }}
              >
                2026/07/10&nbsp;&nbsp;14:00 〜から
              </div>
            </div>
            <div
              className="rounded-lg px-3 py-2 text-sm font-semibold text-center"
              style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}
            >
              送付URLが生成されます ✅
            </div>
          </div>
        </section>

        {/* STEP 4 */}
        <section className="farm-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0"
              style={{ background: '#d4a030', color: '#fff' }}
            >
              4
            </span>
            <h2 className="text-base font-extrabold" style={{ color: '#2c1a0e' }}>相手がURLを開いて日程を選ぶ</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3d2b0e' }}>
            相手はアカウント登録なし・ログイン不要でURLを開くだけ。
            候補日程の中からひとつ選んで「確定する」を押せば完了です。
          </p>
          {/* モックUI */}
          <div
            aria-hidden="true"
            className="farm-card rounded-xl p-4 flex flex-col gap-3"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <p className="text-sm font-bold" style={{ color: '#2c1a0e' }}>📅 候補日時を選択してください</p>
            <ul className="flex flex-col gap-2">
              {[
                { label: '2026/07/10（木）14:00 〜', selected: true },
                { label: '2026/07/11（金）10:00 〜', selected: false },
                { label: '2026/07/12（土）13:00 〜', selected: false },
              ].map(({ label, selected }) => (
                <li key={label} className="flex items-center gap-2">
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: selected ? '5px solid #d4a030' : '2px solid #c8953a',
                      background: selected ? '#fef7e4' : '#fff',
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-sm" style={{ color: '#2c1a0e', fontWeight: selected ? 700 : 400 }}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="farm-btn w-full py-2.5 text-sm"
              style={{ opacity: 0.9 }}
              tabIndex={-1}
            >
              確定する
            </button>
            <div
              className="flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold self-center"
              style={{ background: '#fef3c7', border: '1px solid #d97706', color: '#92400e' }}
            >
              🔓 相手はログイン不要で返信できます
            </div>
          </div>
        </section>

        {/* STEP 5 */}
        <section className="farm-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0"
              style={{ background: '#d4a030', color: '#fff' }}
            >
              5
            </span>
            <h2 className="text-base font-extrabold" style={{ color: '#2c1a0e' }}>ミーティングが確定するとキャラが成長する</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3d2b0e' }}>
            確定するたびにキャラクターがどんどん大きく育ちます。
            たくさん会うほど農園が賑やかになっていきます！
          </p>
          <div className="flex items-end justify-center gap-8 py-4">
            {/* 小 */}
            <div className="flex flex-col items-center gap-1">
              <img
                src="/images/processed_5.png"
                alt="0回のキャラ"
                width={48}
                height={48}
                style={{ imageRendering: 'pixelated', width: 48, height: 48 }}
              />
              <span className="text-xs font-bold" style={{ color: '#8b6914' }}>0回</span>
            </div>
            {/* 中 */}
            <div className="flex flex-col items-center gap-1">
              <img
                src="/images/processed_5.png"
                alt="3回のキャラ"
                width={67}
                height={67}
                style={{ imageRendering: 'pixelated', width: 67, height: 67 }}
              />
              <span className="text-xs font-bold" style={{ color: '#8b6914' }}>3回</span>
            </div>
            {/* 大 */}
            <div className="flex flex-col items-center gap-1" style={{ position: 'relative' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src="/images/processed_5.png"
                  alt="5回以上のキャラ"
                  width={96}
                  height={96}
                  style={{ imageRendering: 'pixelated', width: 96, height: 96 }}
                />
                <img
                  src="/images/processed_a2.png"
                  alt="キラキラ"
                  width={24}
                  height={24}
                  style={{
                    imageRendering: 'pixelated',
                    width: 24,
                    height: 24,
                    position: 'absolute',
                    top: -4,
                    left: -4,
                  }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: '#8b6914' }}>5回以上</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="farm-header rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
        >
          <p className="text-xl font-extrabold" style={{ color: '#f5e6a3', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            さあ、農園をはじめよう 🌾
          </p>
          <a
            href="/"
            className="farm-btn-gold px-8 py-3 text-base inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            農園をはじめる →
          </a>
          <a
            href="/demo"
            className="text-sm font-medium hover:underline"
            style={{ color: '#c8e6a3' }}
          >
            まずデモを見てみる →
          </a>
        </section>
      </main>

      <footer className="py-6 text-center text-xs" style={{ color: '#8b6914' }}>
        &copy; {new Date().getFullYear()} のうえんミーティング
      </footer>
    </div>
  )
}
