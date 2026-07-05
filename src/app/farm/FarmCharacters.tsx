'use client'

import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { FarmContactWithCount } from '@/types/farm'
import { getSupabase } from '@/lib/supabase'
import { Candidate } from '@/types/meeting'

// localStorage に保存される draft の型
type DraftData = {
  meetingId: string
  url: string
  savedAt: string
}

type MeetingHistoryItem = {
  id: string
  student_name: string
  purpose: string
  candidates: Candidate[]
  confirmed_index: number | null
  confirmed_at: string | null
  created_at: string
  replied_at: string | null
  alternative_candidates: Candidate[] | null
  duration_minutes: number | null
  note: string | null
  manually_confirmed: boolean | null
}

// Supabase から取得する meetings の部分型（ポーリング用）
type MeetingReplyRow = {
  farm_contact_id: string
  replied_at: string | null
  confirmed_index: number | null
  manually_confirmed: boolean | null  // ADD THIS
}

// 型ガード: 読み取った値が DraftData かを検証する
function isDraftData(value: unknown): value is DraftData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.meetingId === 'string' &&
    typeof v.url === 'string' &&
    typeof v.savedAt === 'string'
  )
}

function readDraft(farmContactId: string): DraftData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`phase3_draft_${farmContactId}`)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isDraftData(parsed) ? parsed : null
  } catch {
    return null
  }
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '未設定'
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

function formatDate(dateString: string): string {
  const d = new Date(dateString)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

// 確定待ち状態のドットアニメーションコンポーネント
function PendingDots() {
  const [dotCount, setDotCount] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setDotCount((n) => (n % 3) + 1), 500)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-amber-700">
      確定待ち{'・'.repeat(dotCount)}
    </span>
  )
}

function getScale(confirmedCount: number): number {
  if (confirmedCount <= 0) return 0.60
  if (confirmedCount === 1) return 0.72
  if (confirmedCount === 2) return 0.84
  if (confirmedCount === 3) return 0.96
  if (confirmedCount === 4) return 1.08
  return 1.20
}

function seedRand(index: number, n: number): number {
  const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453123
  return x - Math.floor(x)
}

type WalkState = { x: number; y: number; vx: number; vy: number; timer: number }

type CharacterProps = {
  contact: FarmContactWithCount
  liveRepliedCount: number
  liveConfirmedCount: number
  livePendingCount: number
  index: number
  isCrown: boolean
  onManualConfirmed: (contactId: string) => void
  onDraftCleared?: (contactId: string) => void
  requestedOpen?: boolean
  onModalOpened?: () => void
  positionsRef: RefObject<({ x: number; y: number } | null)[]>
}

function Character({ contact, liveRepliedCount, liveConfirmedCount, livePendingCount, index, isCrown, onManualConfirmed, onDraftCleared, requestedOpen, onModalOpened, positionsRef }: CharacterProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const hasMovedRef = useRef(false)
  const touchTappedRef = useRef(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const slowdownUntilRef = useRef(0)
  const [grabbing, setGrabbing] = useState(false)

  // localStorage の draft
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [isDraftCopied, setIsDraftCopied] = useState(false)

  // 履歴モーダル
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyItems, setHistoryItems] = useState<MeetingHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null)

  // リクエストページへのナビゲーション中フラグ
  const [isNavigating, setIsNavigating] = useState(false)

  // 手動確定
  const [isConfirming, setIsConfirming] = useState(false)
  const [localManualConfirmed, setLocalManualConfirmed] = useState(false)
  const [locallyConfirmedIds, setLocallyConfirmedIds] = useState<Set<string>>(new Set())

  // 成長検知
  const prevConfirmedRef = useRef(liveConfirmedCount)
  const [showLevelUp, setShowLevelUp] = useState(false)
  useEffect(() => {
    if (liveConfirmedCount > prevConfirmedRef.current) {
      setShowLevelUp(true)
      const t = setTimeout(() => setShowLevelUp(false), 2000)
      prevConfirmedRef.current = liveConfirmedCount
      return () => clearTimeout(t)
    }
    prevConfirmedRef.current = liveConfirmedCount
  }, [liveConfirmedCount])

  useEffect(() => {
    setDraft(readDraft(contact.id))
  }, [contact.id])

  // requestedOpen が true になったらモーダルを開く（リストからの起動）
  const openHistoryModalRef = useRef<(() => void) | null>(null)

  const stateRef = useRef<WalkState>({
    x: 35 + seedRand(index, 2) * 30,
    y: 15 + seedRand(index, 3) * 30,
    vx: 0, vy: 0, timer: 0,
  })

  const effectiveRepliedCount = liveRepliedCount
  const confirmedCount = liveConfirmedCount
  const pendingCount = livePendingCount
  const isAsleep = confirmedCount === 0
  const baseSpeed = isAsleep ? 0.12 : 0.4 + seedRand(index, 6) * 0.25
  const hasDraft = draft !== null
  const showReplied = effectiveRepliedCount > 0 && !localManualConfirmed
  const showPending = pendingCount > 0 && effectiveRepliedCount === 0
  const showZzz = confirmedCount === 0 && pendingCount === 0 && effectiveRepliedCount === 0 && !hasDraft
  const showKira = confirmedCount >= 3
  const showHeart = confirmedCount >= 4
  const scale = getScale(confirmedCount)

  const [kiraPhase, setKiraPhase] = useState(true)
  useEffect(() => {
    if (!showHeart) return
    const id = setInterval(() => setKiraPhase(p => !p), 800)
    return () => clearInterval(id)
  }, [showHeart])

  const startAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const tick = () => {
      if (isDraggingRef.current) { rafRef.current = requestAnimationFrame(tick); return }
      const el = containerRef.current
      const img = imgRef.current
      const s = stateRef.current

      // 画面幅に関わらずピクセル速度を375px基準に統一（デスクトップ高速化防止）
      const parentEl = el?.parentElement
      const cw = parentEl?.offsetWidth ?? 375
      const sf = Math.min(1, 375 / cw)
      // タップ後5秒間はスピードを1/10に落としてタップしやすくする
      const tapSlowMult = Date.now() < slowdownUntilRef.current ? 0.1 : 1.0

      // 他キャラとの距離が近すぎる場合は穏やかに反発させ、重なりを防ぐ
      const others = positionsRef.current
      for (let i = 0; i < others.length; i++) {
        if (i === index) continue
        const other = others[i]
        if (!other) continue
        const dx = s.x - other.x
        const dy = (s.y - other.y) * 2.5
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = 22
        if (dist > 0.0001 && dist < minDist) {
          const push = ((minDist - dist) / minDist) * 0.28
          s.vx += (dx / dist) * push
          s.vy += (dy / dist) * push * 0.35
        }
      }

      s.x += s.vx * sf * tapSlowMult
      s.y += s.vy * sf * tapSlowMult

      // 実際のキャラ表示サイズ（名前ラベル込み）を元に、農園の表示領域からはみ出さない
      // 動的マージンを算出する（translateX(-50%) で中央基準に配置しているため）
      const ch = parentEl?.offsetHeight ?? 1
      const myW = el?.offsetWidth ?? 0
      const myH = el?.offsetHeight ?? 0
      const marginX = Math.min(45, (myW / 2 / cw) * 100)
      const marginYTop = Math.min(90, (myH / ch) * 100)

      if (s.x < marginX)       { s.x = marginX;       s.vx =  Math.abs(s.vx) }
      if (s.x > 100 - marginX) { s.x = 100 - marginX; s.vx = -Math.abs(s.vx) }
      if (s.y < 3)                  { s.y = 3;                  s.vy =  Math.abs(s.vy) }
      if (s.y > 100 - marginYTop)   { s.y = 100 - marginYTop;   s.vy = -Math.abs(s.vy) }

      s.timer--
      if (s.timer <= 0) {
        const a = Math.random() * Math.PI * 2
        s.vx = Math.cos(a) * baseSpeed
        s.vy = Math.sin(a) * baseSpeed * 0.35
        s.timer = Math.floor(60 + Math.random() * 120)
      }

      others[index] = { x: s.x, y: s.y }

      if (el) { el.style.left = `${s.x}%`; el.style.bottom = `${s.y}%` }
      if (img) img.style.transform = s.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)'

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [baseSpeed])

  useEffect(() => {
    const s = stateRef.current
    const angle = seedRand(index, 1) * Math.PI * 2
    s.vx = Math.cos(angle) * baseSpeed
    s.vy = Math.sin(angle) * baseSpeed * 0.35
    s.timer = Math.floor(80 + seedRand(index, 4) * 100)
    if (containerRef.current) {
      containerRef.current.style.left = `${s.x}%`
      containerRef.current.style.bottom = `${s.y}%`
    }
    startAnimation()
    return () => cancelAnimationFrame(rafRef.current)
  }, [index, baseSpeed, startAnimation])

  useEffect(() => {
    const updatePos = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return
      hasMovedRef.current = true
      const el = containerRef.current
      const parent = el?.parentElement
      if (!el || !parent) return
      const rect = parent.getBoundingClientRect()
      const marginX = Math.min(45, (el.offsetWidth / 2 / rect.width) * 100)
      const marginYTop = Math.min(90, (el.offsetHeight / rect.height) * 100)
      const x = Math.max(marginX, Math.min(100 - marginX, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.max(3, Math.min(100 - marginYTop, ((rect.bottom - clientY) / rect.height) * 100))
      stateRef.current.x = x
      stateRef.current.y = y
      el.style.left = `${x}%`
      el.style.bottom = `${y}%`
    }

    const onMouseMove = (e: MouseEvent) => updatePos(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      if (e.touches[0]) updatePos(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setGrabbing(false)
      const a = Math.random() * Math.PI * 2
      if (hasMovedRef.current) {
        // ドロップ後1〜2秒はゆっくり動いてタップしやすくする
        stateRef.current.vx = Math.cos(a) * baseSpeed * 0.08
        stateRef.current.vy = Math.sin(a) * baseSpeed * 0.028
        stateRef.current.timer = Math.floor(90 + Math.random() * 30)
      } else {
        stateRef.current.vx = Math.cos(a) * baseSpeed
        stateRef.current.vy = Math.sin(a) * baseSpeed * 0.35
        stateRef.current.timer = Math.floor(60 + Math.random() * 120)
      }
      startAnimation()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [baseSpeed, startAnimation])

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // マウスのみ preventDefault（タッチでは click イベントを殺さないようにする）
    if (e.type === 'mousedown') e.preventDefault()
    isDraggingRef.current = true
    hasMovedRef.current = false
    touchTappedRef.current = false
    setGrabbing(true)
    stateRef.current.vx = 0
    stateRef.current.vy = 0
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryError(false)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('meetings')
        .select('id, student_name, purpose, candidates, confirmed_index, confirmed_at, created_at, replied_at, alternative_candidates, duration_minutes, note, manually_confirmed')
        .eq('farm_contact_id', contact.id)
        .order('created_at', { ascending: false })
      if (error) {
        setHistoryError(true)
      } else {
        const items = (data as MeetingHistoryItem[]) ?? []
        setHistoryItems(items)
        // 確定済みのミーティングにドラフトが対応していれば自動クリア
        const currentDraft = readDraft(contact.id)
        if (currentDraft) {
          const isConfirmedMeeting = items.some(
            m => m.id === currentDraft.meetingId && (m.confirmed_index !== null || m.manually_confirmed === true)
          )
          if (isConfirmedMeeting) {
            localStorage.removeItem(`phase3_draft_${contact.id}`)
            setDraft(null)
            onDraftCleared?.(contact.id)
          }
        }
      }
    } catch {
      setHistoryError(true)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [contact.id])

  // マウント後にバックグラウンドで履歴を先読みしておく
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const openHistoryModal = useCallback(() => {
    slowdownUntilRef.current = Date.now() + 5000
    setShowHistoryModal(true)
    setHistoryError(false)
    // キャッシュがなければローディング表示しつつ取得
    if (historyItems.length === 0) setIsLoadingHistory(true)
    fetchHistory()
    // スクロールを先頭にリセット（次のフレームで DOM が確実に存在）
    requestAnimationFrame(() => {
      if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0
    })
  }, [fetchHistory, historyItems.length])

  // openHistoryModal の最新版を ref に保持（宣言の直後）
  useEffect(() => {
    openHistoryModalRef.current = openHistoryModal
  }, [openHistoryModal])

  // リストタップなど外部からモーダルを開く要求が来たとき
  useEffect(() => {
    if (requestedOpen) {
      openHistoryModalRef.current?.()
      onModalOpened?.()
    }
  // requestedOpen が true になったときだけ動かす
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedOpen])

  // タッチタップを直接処理（touchstart で e.preventDefault しないと click が来ない端末対策）
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!hasMovedRef.current && isDraggingRef.current) {
      e.preventDefault()
      touchTappedRef.current = true
      isDraggingRef.current = false
      setGrabbing(false)
      const a = Math.random() * Math.PI * 2
      stateRef.current.vx = Math.cos(a) * baseSpeed
      stateRef.current.vy = Math.sin(a) * baseSpeed * 0.35
      stateRef.current.timer = Math.floor(60 + Math.random() * 120)
      startAnimation()
      openHistoryModal()
    }
  }, [openHistoryModal, baseSpeed, startAnimation])

  const handleClick = useCallback(() => {
    if (hasMovedRef.current) return
    if (touchTappedRef.current) { touchTappedRef.current = false; return }
    openHistoryModal()
  }, [openHistoryModal])

  async function handleDraftCopy() {
    if (!draft) return
    try {
      await navigator.clipboard.writeText(draft.url)
      setIsDraftCopied(true)
      setTimeout(() => setIsDraftCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  function handleDraftSent() {
    localStorage.removeItem(`phase3_draft_${contact.id}`)
    setDraft(null)
    setShowHistoryModal(false)
  }

  async function copyMeetingUrl(meetingId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedMeetingId(meetingId)
      setTimeout(() => setCopiedMeetingId(null), 2000)
    } catch {
      // ignore
    }
  }

  async function handleManualConfirmItem(meetingId: string) {
    const ok = window.confirm('本当に確定しましたか？')
    if (!ok) return
    setIsConfirming(true)
    try {
      const supabase = getSupabase()
      await supabase
        .from('meetings')
        .update({ manually_confirmed: true })
        .eq('id', meetingId)
    } catch {
      // DB エラーは無視してローカル表示だけ更新
    } finally {
      setIsConfirming(false)
      setLocallyConfirmedIds(prev => new Set(prev).add(meetingId))
      setLocalManualConfirmed(true)
      onManualConfirmed(contact.id)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      {/* 履歴モーダル */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,37,9,0.65)' }}
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden flex flex-col farm-modal"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="px-5 pt-4 pb-3 text-center shrink-0 farm-header">
              <h2 className="text-base font-bold"
                style={{ color: '#f5e6a3' }}>
                {contact.contact_name}のリクエスト
              </h2>
            </div>

            {/* スクロールエリア */}
            <div ref={scrollAreaRef} className="overflow-y-auto flex-1 px-4 py-3 space-y-3" style={{ background: '#fef7e4' }}>
              {/* 未送信 draft があれば最上部に表示 */}
              {draft && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: '#fff3e0', border: '1.5px solid #f59e0b' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm" role="img" aria-label="未送信">📋</span>
                    <span className="text-xs font-semibold" style={{ color: '#92400e' }}>未送信のURLがあります</span>
                  </div>
                  <p className="break-all text-xs font-mono" style={{ color: '#6b4c0a' }}>{draft.url}</p>
                  <button
                    type="button"
                    onClick={handleDraftCopy}
                    className="farm-btn-gold flex h-11 w-full items-center justify-center text-xs focus:outline-none transition-colors"
                  >
                    {isDraftCopied ? 'コピーしました！' : 'URLをコピー'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDraftSent}
                    className="flex h-11 w-full items-center justify-center rounded-lg text-xs font-semibold focus:outline-none transition-colors"
                    style={{ border: '1.5px solid #f59e0b', color: '#92400e', background: '#fffbeb' }}
                  >
                    送信済みにする（未送信を消す）
                  </button>
                </div>
              )}

              {/* ミーティング履歴 */}
              {isLoadingHistory ? (
                <div className="py-8 text-center text-sm" style={{ color: '#8b6914' }}>
                  読み込み中...
                </div>
              ) : historyError ? (
                <div className="py-8 text-center">
                  <p className="text-sm mb-3" style={{ color: '#b91c1c' }}>
                    履歴の読み込みに失敗しました
                  </p>
                  <button
                    type="button"
                    onClick={fetchHistory}
                    className="farm-btn text-sm px-4 py-2 focus:outline-none"
                  >
                    再試行
                  </button>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: '#8b6914' }}>
                  まだリクエストがありません
                </div>
              ) : (
                historyItems.map(item => {
                  const isConfirmed = item.confirmed_index !== null || item.manually_confirmed === true || locallyConfirmedIds.has(item.id)
                  // 確定済みの場合は返信セクションを表示しない
                  const hasReply = item.replied_at !== null && !isConfirmed
                  // ドラフト（未送信）のアイテムかどうか
                  const isDraftItem = !isConfirmed && !item.replied_at && draft?.meetingId === item.id
                  const confirmedCandidate =
                    item.confirmed_index !== null && item.candidates?.[item.confirmed_index]
                      ? item.candidates[item.confirmed_index]
                      : null
                  const meetingUrl = `${origin}/r/${item.id}`

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-3 space-y-2"
                      style={{ background: '#fffdf7', border: '1.5px solid #d4a853' }}
                    >
                      {/* 上部: 日付・名前 + ステータスバッジ */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs" style={{ color: '#8b6914' }}>
                              {formatDate(item.created_at)}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: '#3d2b0e' }}>
                              {item.student_name}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm font-semibold" style={{ color: '#2c1a0e' }}>
                            {item.purpose}
                          </p>
                        </div>
                        {isConfirmed ? (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#d1fae5', color: '#065f46' }}>
                            ✅ 確定
                          </span>
                        ) : hasReply ? (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#dbeafe', color: '#1e40af' }}>
                            📬 返信あり
                          </span>
                        ) : isDraftItem ? (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#ffedd5', color: '#9a3412' }}>
                            📋 未送信
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#fef3c7', color: '#92400e' }}>
                            ⏳ 確定待ち
                          </span>
                        )}
                      </div>

                      {/* 候補日 */}
                      {item.candidates && item.candidates.length > 0 && (
                        <div className="text-xs" style={{ color: '#6b4c0a' }}>
                          候補: {item.candidates.map((c, i) => (
                            <span key={i}>{i > 0 ? '・' : ''}{c.date} {c.time}</span>
                          ))}
                        </div>
                      )}

                      {/* 確定済みの場合: 確定日時 */}
                      {isConfirmed && confirmedCandidate && (
                        <div className="text-xs font-medium" style={{ color: '#065f46' }}>
                          確定: {confirmedCandidate.date} {confirmedCandidate.time}
                          {item.duration_minutes != null && ` • ${formatDuration(item.duration_minutes)}`}
                        </div>
                      )}
                      {isConfirmed && !confirmedCandidate && (
                        <div className="text-xs font-medium" style={{ color: '#065f46' }}>
                          確定済み
                          {item.duration_minutes != null && ` • ${formatDuration(item.duration_minutes)}`}
                        </div>
                      )}

                      {/* 返信あり: 別日提案内容 + アクションボタン */}
                      {hasReply && (
                        <div className="space-y-2">
                          {item.alternative_candidates && item.alternative_candidates.length > 0 && (
                            <div className="rounded-lg px-2.5 py-2 text-xs space-y-0.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                              <p className="font-semibold" style={{ color: '#1e40af' }}>別日提案:</p>
                              {item.alternative_candidates.map((c, i) => (
                                <p key={i} style={{ color: '#1d4ed8' }}>
                                  {c.date} {c.time}
                                  {item.duration_minutes != null && ` • ${formatDuration(item.duration_minutes)}`}
                                </p>
                              ))}
                              {item.note && (
                                <p style={{ color: '#1d4ed8' }}>備考: {item.note}</p>
                              )}
                            </div>
                          )}
                          <div className="rounded-lg px-2.5 py-1.5 text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                            <p style={{ color: '#78350f' }}>💡 チャットで合意した日時で確定するか、新しいリクエストを作成して別の候補を送れます</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleManualConfirmItem(item.id)}
                            disabled={isConfirming}
                            className="farm-btn flex h-11 w-full items-center justify-center text-xs focus:outline-none transition-colors disabled:opacity-60"
                          >
                            {isConfirming ? '確定中...' : '✅ チャットで確定した（手動確定）'}
                          </button>
                        </div>
                      )}

                      {/* URL コピー */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="flex-1 truncate text-xs font-mono" style={{ color: '#8b6914' }}>
                          {meetingUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyMeetingUrl(item.id, meetingUrl)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none transition-colors"
                          style={{ border: '1.5px solid #d4a853', color: '#6b4c0a', background: '#fffdf7' }}
                        >
                          {copiedMeetingId === item.id ? '✓' : 'コピー'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* フッター */}
            <div className="px-4 pb-4 pt-3 space-y-2 shrink-0"
              style={{ borderTop: '2px solid #d4a853' }}>
              <button
                type="button"
                onClick={() => {
                  setIsNavigating(true)
                  router.push(`/request/${contact.id}`)
                }}
                disabled={isNavigating}
                className="farm-btn flex h-11 w-full items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-75"
              >
                {isNavigating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    移動中...
                  </span>
                ) : '新しいリクエストを送る'}
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium focus:outline-none transition-colors"
                style={{ border: '1.5px solid #d4a853', color: '#6b4c0a', background: '#fef7e4' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="absolute flex flex-col items-center select-none"
        style={{
          left: `${stateRef.current.x}%`,
          bottom: `${stateRef.current.y}%`,
          transform: 'translateX(-50%)',
          cursor: grabbing ? 'grabbing' : 'grab',
          zIndex: grabbing ? 50 : 1,
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${contact.contact_name}のリクエスト履歴を見る`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            openHistoryModal()
          }
        }}
      >
        {/* 吹き出し */}
        <div className={showReplied ? 'relative mb-1 flex items-center justify-center animate-bounce' : 'relative mb-1 flex items-center justify-center'} style={{ width: 56, height: 44 }}>
          <img
            src={showReplied && !hasDraft ? '/images/processed_a6.png' : '/images/processed_a1.png'}
            alt=""
            aria-hidden="true"
            width={56}
            height={44}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          <span className="relative z-10 font-bold leading-none text-center" style={{ fontSize: 11, color: '#3d2b0e' }}>
            {hasDraft ? (
              <span className="text-orange-600">未送信</span>
            ) : showReplied ? (
              <span className="text-red-600">返信あり！</span>
            ) : showPending ? (
              <PendingDots />
            ) : (
              <>{confirmedCount}回</>
            )}
          </span>
        </div>

        {/* 成長バッジ */}
        {showLevelUp && (
          <div
            className="absolute left-1/2 z-20 pointer-events-none animate-badge-float"
            style={{ bottom: '100%' }}
          >
            <span
              className="text-xs font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: '#2a5c1e', color: '#f5e6a3' }}
            >
              🌱 成長した！
            </span>
          </div>
        )}

        {/* キャラ本体 + オーバーレイ */}
        <div
          className={showLevelUp ? 'relative animate-level-up' : 'relative'}
          style={{
            width: 80 * scale,
            height: 80 * scale,
            transition: 'width 0.55s cubic-bezier(0.34,1.56,0.64,1), height 0.55s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <img
            ref={imgRef}
            src={`/images/processed_${contact.character_number}.png`}
            alt={contact.contact_name}
            width={80}
            height={80}
            className="pixel-char"
            style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.28))' }}
            draggable={false}
          />

          {isCrown && (
            <img src="/images/processed_a4.png" alt="王冠" width={40} height={40}
              className="absolute left-1/2 -translate-x-1/2" style={{ top: -36 }} draggable={false} />
          )}
          {showZzz && (
            <img src="/images/processed_a5.png" alt="ZZZ" width={20} height={20}
              className="absolute" style={{ top: -8, right: -8 }} draggable={false} />
          )}
          {showKira && !showHeart && (
            <img src="/images/processed_a2.png" alt="キラキラ" width={80} height={80}
              className="absolute animate-pulse" style={{ top: 0, left: 0, width: '100%', height: '100%' }} draggable={false} />
          )}
          {showHeart && (
            <img
              src={kiraPhase ? '/images/processed_a2.png' : '/images/processed_a3.png'}
              alt={kiraPhase ? 'キラキラ' : 'ハート'}
              width={80} height={80}
              className="absolute" style={{ top: 0, left: 0, width: '100%', height: '100%' }} draggable={false}
            />
          )}
        </div>

        {/* 名前ラベル */}
        <span
          className="mt-1 px-2 py-0.5 text-xs font-bold whitespace-nowrap rounded-full shadow-sm"
          style={{
            background: showReplied ? '#dbeafe' : hasDraft ? '#fed7aa' : 'rgba(255,247,228,0.95)',
            color: showReplied ? '#1d4ed8' : hasDraft ? '#92400e' : '#2c1a0e',
            border: showReplied ? '1px solid #93c5fd' : hasDraft ? '1px solid #fdba74' : '1px solid #d4a853',
          }}
        >
          {contact.contact_name}
        </span>
      </div>
    </>
  )
}

type Props = {
  contacts: FarmContactWithCount[]
  openModalContactId?: string | null
  onModalOpened?: () => void
  onDraftCleared?: (contactId: string) => void
}

export default function FarmCharacters({ contacts, openModalContactId, onModalOpened, onDraftCleared }: Props) {
  const positionsRef = useRef<({ x: number; y: number } | null)[]>([])
  const initCounts = useCallback(() => {
    const replied: Record<string, number> = {}
    const confirmed: Record<string, number> = {}
    const pending: Record<string, number> = {}
    for (const c of contacts) {
      replied[c.id] = c.repliedCount
      confirmed[c.id] = c.confirmedCount
      pending[c.id] = c.pendingCount
    }
    return { replied, confirmed, pending }
  }, [contacts])

  const [liveRepliedCounts, setLiveRepliedCounts] = useState<Record<string, number>>(
    () => initCounts().replied
  )
  const [liveConfirmedCounts, setLiveConfirmedCounts] = useState<Record<string, number>>(
    () => initCounts().confirmed
  )
  const [livePendingCounts, setLivePendingCounts] = useState<Record<string, number>>(
    () => initCounts().pending
  )

  // ポーリング用 fetchCounts を ref に保持（visibilitychange から呼べるようにする）
  const fetchCountsRef = useRef<() => Promise<void>>(async () => { /* init */ })

  useEffect(() => {
    if (contacts.length === 0) return

    const contactIds = contacts.map(c => c.id)

    const fetchCounts = async () => {
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('meetings')
          .select('farm_contact_id, replied_at, confirmed_index, manually_confirmed')
          .in('farm_contact_id', contactIds)

        // エラー・null・空配列の場合はリセットせず現状維持
        if (error || !data || data.length === 0) return

        const repliedMap: Record<string, number> = {}
        const confirmedMap: Record<string, number> = {}
        const pendingMap: Record<string, number> = {}
        for (const id of contactIds) {
          repliedMap[id] = 0
          confirmedMap[id] = 0
          pendingMap[id] = 0
        }
        for (const row of data as MeetingReplyRow[]) {
          const cid = row.farm_contact_id
          if (!(cid in repliedMap)) continue
          const isConfirmedRow = row.confirmed_index !== null || row.manually_confirmed === true
          // 確定済み
          if (isConfirmedRow) {
            confirmedMap[cid] = (confirmedMap[cid] ?? 0) + 1
          } else {
            // 未確定 → 確定待ちカウント
            pendingMap[cid] = (pendingMap[cid] ?? 0) + 1
            // 未確定 かつ 返信あり
            if (row.replied_at !== null) {
              repliedMap[cid] = (repliedMap[cid] ?? 0) + 1
            }
          }
        }
        setLiveRepliedCounts(repliedMap)
        setLiveConfirmedCounts(confirmedMap)
        setLivePendingCounts(pendingMap)
      } catch {
        // ポーリングエラーは無視する
      }
    }

    fetchCountsRef.current = fetchCounts
    fetchCounts()
    const intervalId = setInterval(fetchCounts, 10000)  // 10秒ごと

    return () => clearInterval(intervalId)
  }, [contacts])

  // タブに戻ったとき即時更新（成長を確実に反映する）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCountsRef.current()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // 手動確定後に各カウントをローカルで即時更新する
  const handleManualConfirmed = useCallback((contactId: string) => {
    setLiveRepliedCounts(prev => ({ ...prev, [contactId]: 0 }))
    setLiveConfirmedCounts(prev => ({ ...prev, [contactId]: (prev[contactId] ?? 0) + 1 }))
    setLivePendingCounts(prev => ({ ...prev, [contactId]: Math.max(0, (prev[contactId] ?? 0) - 1) }))
  }, [])

  if (contacts.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="farm-card rounded-2xl px-6 py-4 text-center shadow-md">
          <p className="text-base font-medium" style={{ color: '#3d2b0e' }}>
            まだ誰もいません。相手を追加しましょう！
          </p>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...contacts.map(c => liveConfirmedCounts[c.id] ?? c.confirmedCount))
  const crownId = contacts.find(c => (liveConfirmedCounts[c.id] ?? c.confirmedCount) === maxCount)?.id ?? ''

  return (
    <>
      {contacts.map((contact, index) => (
        <Character
          key={contact.id}
          contact={contact}
          liveRepliedCount={liveRepliedCounts[contact.id] ?? contact.repliedCount}
          liveConfirmedCount={liveConfirmedCounts[contact.id] ?? contact.confirmedCount}
          livePendingCount={livePendingCounts[contact.id] ?? contact.pendingCount}
          index={index}
          isCrown={contact.id === crownId}
          onManualConfirmed={handleManualConfirmed}
          onDraftCleared={onDraftCleared}
          requestedOpen={openModalContactId === contact.id}
          onModalOpened={onModalOpened}
          positionsRef={positionsRef}
        />
      ))}
    </>
  )
}
