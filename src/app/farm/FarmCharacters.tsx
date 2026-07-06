'use client'

import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { FarmContactWithCount } from '@/types/farm'
import { getSupabase } from '@/lib/supabase'
import { Candidate, SummarySource, QAPair } from '@/types/meeting'

// 要約提出パターン3（メモ＋質問）の固定参考質問
const SUMMARY_REFERENCE_QUESTIONS = [
  '話した主なトピックは？',
  '決まったこと・次のアクションは？',
  '相手の様子・反応は？',
  '次回までに準備することは？',
]

const SUMMARY_SOURCE_LABEL: Record<SummarySource, string> = {
  pasted: '要約済みメモ',
  transcript: '文字起こし',
  memo_qa: 'メモ＋質問',
}

async function requestAiSummary(
  body: { mode: 'transcript'; text: string } | { mode: 'memo_qa'; memo: string; qa: QAPair[] }
): Promise<string> {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? '要約の生成に失敗しました')
  }
  return data.summary as string
}

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
  summary_text: string | null
  summary_source: SummarySource | null
  summary_raw_input: string | null
  summary_qa: QAPair[] | null
  summary_submitted_at: string | null
}

// meetings 履歴取得・直接記録作成の両方で使う共通の select 列
const MEETING_HISTORY_SELECT =
  'id, student_name, purpose, candidates, confirmed_index, confirmed_at, created_at, replied_at, alternative_candidates, duration_minutes, note, manually_confirmed, summary_text, summary_source, summary_raw_input, summary_qa, summary_submitted_at'

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
  liveSummaryCount: number
  index: number
  isCrown: boolean
  onManualConfirmed: (contactId: string) => void
  onSummarySubmitted: (contactId: string) => void
  onDirectFeedCreated: (contactId: string) => void
  onDraftCleared?: (contactId: string) => void
  requestedOpen?: boolean
  onModalOpened?: () => void
  positionsRef: RefObject<({ x: number; y: number } | null)[]>
}

function Character({ contact, liveRepliedCount, liveConfirmedCount, livePendingCount, liveSummaryCount, index, isCrown, onManualConfirmed, onSummarySubmitted, onDirectFeedCreated, onDraftCleared, requestedOpen, onModalOpened, positionsRef }: CharacterProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const hasMovedRef = useRef(false)
  const touchTappedRef = useRef(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const slowdownUntilRef = useRef(0)
  // fetchHistory の取得結果が、後から行われた直接記録の作成より古ければ捨てるための世代カウンタ
  const fetchGenerationRef = useRef(0)
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

  // リンク経由以外（肥料をあげる＝直接要約を記録する）の登録フォームの開閉
  const [isDirectFeedFormOpen, setIsDirectFeedFormOpen] = useState(false)

  // 手動確定
  const [isConfirming, setIsConfirming] = useState(false)
  const [localManualConfirmed, setLocalManualConfirmed] = useState(false)
  const [locallyConfirmedIds, setLocallyConfirmedIds] = useState<Set<string>>(new Set())

  // 要約提出フォーム
  const [summaryFormItemId, setSummaryFormItemId] = useState<string | null>(null)
  const [summaryTab, setSummaryTab] = useState<SummarySource>('pasted')
  const [summaryPastedText, setSummaryPastedText] = useState('')
  const [summaryTranscriptText, setSummaryTranscriptText] = useState('')
  const [summaryMemoText, setSummaryMemoText] = useState('')
  const [summaryQaAnswers, setSummaryQaAnswers] = useState<string[]>(
    SUMMARY_REFERENCE_QUESTIONS.map(() => '')
  )
  const [isSubmittingSummary, setIsSubmittingSummary] = useState(false)
  const [summarySubmitError, setSummarySubmitError] = useState<string | null>(null)
  const canSubmitSummary =
    summaryTab === 'pasted'
      ? summaryPastedText.trim().length > 0
      : summaryTab === 'transcript'
      ? summaryTranscriptText.trim().length > 0
      : summaryMemoText.trim().length > 0 || summaryQaAnswers.some(a => a.trim().length > 0)

  // 成長検知（要約提出回数がトリガー）
  const prevSummaryRef = useRef(liveSummaryCount)
  const [showLevelUp, setShowLevelUp] = useState(false)
  useEffect(() => {
    if (liveSummaryCount > prevSummaryRef.current) {
      setShowLevelUp(true)
      const t = setTimeout(() => setShowLevelUp(false), 2000)
      prevSummaryRef.current = liveSummaryCount
      return () => clearTimeout(t)
    }
    prevSummaryRef.current = liveSummaryCount
  }, [liveSummaryCount])

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
  const summaryCount = liveSummaryCount
  const isAsleep = confirmedCount === 0
  const baseSpeed = isAsleep ? 0.12 : 0.4 + seedRand(index, 6) * 0.25
  const hasDraft = draft !== null
  const showReplied = effectiveRepliedCount > 0 && !localManualConfirmed
  const showPending = pendingCount > 0 && effectiveRepliedCount === 0
  const showZzz = confirmedCount === 0 && pendingCount === 0 && effectiveRepliedCount === 0 && !hasDraft
  // キャラクターの見た目の成長（拡大・キラキラ/ハート演出）は要約提出回数で決まる
  const showKira = summaryCount >= 3
  const showHeart = summaryCount >= 4
  const scale = getScale(summaryCount)

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
    const gen = ++fetchGenerationRef.current
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('meetings')
        .select(MEETING_HISTORY_SELECT)
        .eq('farm_contact_id', contact.id)
        .order('created_at', { ascending: false })
      // 取得中に「肥料をあげる」等で新しい記録が作られていたら、古い結果で上書きしない
      if (gen !== fetchGenerationRef.current) return
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

  function resetSummaryFormFields() {
    setSummaryTab('pasted')
    setSummaryPastedText('')
    setSummaryTranscriptText('')
    setSummaryMemoText('')
    setSummaryQaAnswers(SUMMARY_REFERENCE_QUESTIONS.map(() => ''))
    setSummarySubmitError(null)
  }

  function openSummaryForm(itemId: string) {
    setSummaryFormItemId(itemId)
    setIsDirectFeedFormOpen(false)
    resetSummaryFormFields()
  }

  // 提出済みの要約を編集する: 元の入力内容をフォームに復元してから開く
  function openSummaryEditForm(item: MeetingHistoryItem) {
    setSummaryFormItemId(item.id)
    setIsDirectFeedFormOpen(false)
    setSummarySubmitError(null)
    const source = item.summary_source ?? 'pasted'
    setSummaryTab(source)
    setSummaryPastedText(source === 'pasted' ? item.summary_text ?? '' : '')
    setSummaryTranscriptText(source === 'transcript' ? item.summary_raw_input ?? '' : '')
    setSummaryMemoText(source === 'memo_qa' ? item.summary_raw_input ?? '' : '')
    setSummaryQaAnswers(
      SUMMARY_REFERENCE_QUESTIONS.map((_, i) => item.summary_qa?.[i]?.answer ?? '')
    )
  }

  function closeSummaryForm() {
    setSummaryFormItemId(null)
  }

  // 編集時: AIを呼ばず、手を入れたメモ・質問への回答だけをそのまま保存する（既存の要約文はそのまま）
  async function handleSaveNotesOnly(meetingId: string) {
    if (!canSubmitSummary) return
    setSummarySubmitError(null)
    setIsSubmittingSummary(true)
    try {
      const summaryRawInput =
        summaryTab === 'transcript' ? summaryTranscriptText.trim() : summaryMemoText.trim()
      const summaryQa =
        summaryTab === 'memo_qa'
          ? SUMMARY_REFERENCE_QUESTIONS.map((question, i) => ({
              question,
              answer: summaryQaAnswers[i] ?? '',
            }))
          : null
      const supabase = getSupabase()
      const { error } = await supabase
        .from('meetings')
        .update({ summary_raw_input: summaryRawInput, summary_qa: summaryQa })
        .eq('id', meetingId)
      if (error) {
        setSummarySubmitError('保存に失敗しました。もう一度お試しください')
        return
      }
      setHistoryItems(prev =>
        prev.map(item =>
          item.id === meetingId
            ? { ...item, summary_raw_input: summaryRawInput, summary_qa: summaryQa }
            : item
        )
      )
      closeSummaryForm()
    } catch {
      setSummarySubmitError('保存に失敗しました。もう一度お試しください')
    } finally {
      setIsSubmittingSummary(false)
    }
  }

  // 「肥料をあげる」: 内容を書く前にレコードを作らず、まず入力フォームだけを開く
  // （内容が空の記録がどんどん保存されるのを防ぐため、実際の保存は提出時の1回のみ）
  function openDirectFeedForm() {
    setIsDirectFeedFormOpen(true)
    setSummaryFormItemId(null)
    resetSummaryFormFields()
  }

  function closeDirectFeedForm() {
    setIsDirectFeedFormOpen(false)
  }

  // meetingId が null の場合は「肥料をあげる」からの新規記録として、要約と同時にmeetings行を作成する
  async function handleSummarySubmit(meetingId: string | null) {
    let summaryRawInput: string | null = null
    let summaryQa: QAPair[] | null = null

    if (!canSubmitSummary) return

    setSummarySubmitError(null)
    setIsSubmittingSummary(true)
    try {
      let summaryText: string
      if (summaryTab === 'pasted') {
        summaryText = summaryPastedText.trim()
      } else if (summaryTab === 'transcript') {
        summaryRawInput = summaryTranscriptText.trim()
        summaryText = await requestAiSummary({ mode: 'transcript', text: summaryRawInput })
      } else {
        summaryRawInput = summaryMemoText.trim()
        summaryQa = SUMMARY_REFERENCE_QUESTIONS.map((question, i) => ({
          question,
          answer: summaryQaAnswers[i] ?? '',
        }))
        summaryText = await requestAiSummary({ mode: 'memo_qa', memo: summaryMemoText, qa: summaryQa })
      }

      const submittedAt = new Date().toISOString()
      const supabase = getSupabase()

      if (meetingId === null) {
        const { data, error } = await supabase
          .from('meetings')
          .insert({
            student_name: contact.contact_name,
            purpose: '🌾 肥料やり（直接記録）',
            candidates: [],
            farm_contact_id: contact.id,
            manually_confirmed: true,
            summary_text: summaryText,
            summary_source: summaryTab,
            summary_raw_input: summaryRawInput,
            summary_qa: summaryQa,
            summary_submitted_at: submittedAt,
          })
          .select(MEETING_HISTORY_SELECT)
          .single<MeetingHistoryItem>()
        if (error || !data) {
          setSummarySubmitError('保存に失敗しました。もう一度お試しください')
          return
        }
        // 進行中の fetchHistory がこの新しい記録より古い結果で上書きしないよう世代を進める
        fetchGenerationRef.current++
        setHistoryItems(prev => [data, ...prev])
        onDirectFeedCreated(contact.id)
        onSummarySubmitted(contact.id)
        closeDirectFeedForm()
      } else {
        // 既に要約が提出済みの記録を編集した場合は、成長カウントを重複加算しない
        const isFirstSubmission = !historyItems.find(item => item.id === meetingId)?.summary_submitted_at
        const { error } = await supabase
          .from('meetings')
          .update({
            summary_text: summaryText,
            summary_source: summaryTab,
            summary_raw_input: summaryRawInput,
            summary_qa: summaryQa,
            summary_submitted_at: submittedAt,
          })
          .eq('id', meetingId)
        if (error) {
          setSummarySubmitError('保存に失敗しました。もう一度お試しください')
          return
        }
        setHistoryItems(prev =>
          prev.map(item =>
            item.id === meetingId
              ? {
                  ...item,
                  summary_text: summaryText,
                  summary_source: summaryTab,
                  summary_raw_input: summaryRawInput,
                  summary_qa: summaryQa,
                  summary_submitted_at: submittedAt,
                }
              : item
          )
        )
        if (isFirstSubmission) onSummarySubmitted(contact.id)
        closeSummaryForm()
      }
    } catch (e) {
      setSummarySubmitError(e instanceof Error ? e.message : '要約の生成に失敗しました')
    } finally {
      setIsSubmittingSummary(false)
    }
  }

  // 要約入力フォームの中身（既存記録への追記／「肥料をあげる」の新規記録、両方で共有する）
  function renderSummaryFormFields(onSubmit: () => void, onCancel: () => void, onSaveNotesOnly?: () => void) {
    // 「内容だけ保存」は既存の要約を編集する場合のみ意味を持つ（貼り付けモードは元々AIを使わない）
    const canSaveNotesOnly = onSaveNotesOnly !== undefined && summaryTab !== 'pasted'
    return (
      <div className="rounded-lg p-2.5 space-y-2" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
        <div className="flex gap-1">
          {(['pasted', 'transcript', 'memo_qa'] as SummarySource[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => { setSummaryTab(tab); setSummarySubmitError(null) }}
              className="flex-1 rounded-md px-1.5 py-1.5 text-xs font-semibold focus:outline-none transition-colors"
              style={{
                background: summaryTab === tab ? '#2a5c1e' : '#fffdf7',
                color: summaryTab === tab ? '#f5e6a3' : '#6b4c0a',
                border: '1px solid #d4a853',
              }}
            >
              {SUMMARY_SOURCE_LABEL[tab]}
            </button>
          ))}
        </div>

        {summaryTab === 'pasted' && (
          <textarea
            value={summaryPastedText}
            onChange={e => setSummaryPastedText(e.target.value)}
            placeholder="Granolaなどで作った要約を貼り付けてください"
            className="w-full rounded-md p-2 text-xs focus:outline-none"
            style={{ border: '1px solid #d4a853', background: '#fffdf7', color: '#2c1a0e' }}
            rows={4}
          />
        )}

        {summaryTab === 'transcript' && (
          <div className="space-y-1">
            <textarea
              value={summaryTranscriptText}
              onChange={e => setSummaryTranscriptText(e.target.value)}
              placeholder="文字起こしをそのまま貼り付けてください"
              className="w-full rounded-md p-2 text-xs focus:outline-none"
              style={{ border: '1px solid #d4a853', background: '#fffdf7', color: '#2c1a0e' }}
              rows={4}
            />
            <p className="text-xs" style={{ color: '#92400e' }}>
              ※ AIが自動で要約を作成します
            </p>
          </div>
        )}

        {summaryTab === 'memo_qa' && (
          <div className="space-y-2">
            <textarea
              value={summaryMemoText}
              onChange={e => setSummaryMemoText(e.target.value)}
              placeholder="簡単なメモ（任意）"
              className="w-full rounded-md p-2 text-xs focus:outline-none"
              style={{ border: '1px solid #d4a853', background: '#fffdf7', color: '#2c1a0e' }}
              rows={2}
            />
            {SUMMARY_REFERENCE_QUESTIONS.map((q, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs font-medium" style={{ color: '#6b4c0a' }}>{q}</p>
                <textarea
                  value={summaryQaAnswers[i]}
                  onChange={e => setSummaryQaAnswers(prev => {
                    const next = [...prev]
                    next[i] = e.target.value
                    return next
                  })}
                  className="w-full rounded-md p-2 text-xs focus:outline-none"
                  style={{ border: '1px solid #d4a853', background: '#fffdf7', color: '#2c1a0e' }}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}

        {summarySubmitError && (
          <p className="text-xs" style={{ color: '#b91c1c' }}>{summarySubmitError}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmittingSummary || !canSubmitSummary}
            className="farm-btn flex-1 flex h-10 items-center justify-center text-xs focus:outline-none transition-colors disabled:opacity-60"
          >
            {isSubmittingSummary
              ? (summaryTab === 'pasted' ? '送信中...' : 'AIが要約中...')
              : (canSaveNotesOnly ? '🔄 AIで要約を作り直す' : '要約を提出する')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 px-3 items-center justify-center rounded-lg text-xs font-medium focus:outline-none transition-colors"
            style={{ border: '1.5px solid #d4a853', color: '#6b4c0a', background: '#fffdf7' }}
          >
            キャンセル
          </button>
        </div>
        {canSaveNotesOnly && (
          <button
            type="button"
            onClick={onSaveNotesOnly}
            disabled={isSubmittingSummary || !canSubmitSummary}
            className="flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium focus:outline-none transition-colors disabled:opacity-60"
            style={{ border: '1.5px solid #d4a853', color: '#6b4c0a', background: '#fffdf7' }}
          >
            💾 内容だけ保存する（要約はそのまま）
          </button>
        )}
      </div>
    )
  }

  // 直近に提出された要約（次回ミーティング前にすぐ見返せるようにする）
  const latestSummaryItem = historyItems
    .filter(item => item.summary_submitted_at !== null)
    .sort((a, b) => new Date(b.summary_submitted_at!).getTime() - new Date(a.summary_submitted_at!).getTime())[0] ?? null

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
              <h2 className="font-farm-title text-base"
                style={{ color: '#f5e6a3' }}>
                {contact.contact_name}の畑
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

              {/* 直近の要約を常に見返せるように最上部に表示 */}
              {latestSummaryItem && (
                <div className="rounded-xl p-3 space-y-1" style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7' }}>
                  <p className="text-xs font-semibold" style={{ color: '#065f46' }}>
                    📄 前回のまとめ
                    {latestSummaryItem.summary_source && (
                      <span className="ml-1 font-normal" style={{ color: '#4d7c0f' }}>
                        （{SUMMARY_SOURCE_LABEL[latestSummaryItem.summary_source]}）
                      </span>
                    )}
                  </p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: '#14532d' }}>{latestSummaryItem.summary_text}</p>
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
                  まだ種をまいていません
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
                  // リンク経由ではなく「肥料をあげる」から直接作られた記録（候補日を持たない）
                  const isDirectFeedItem = item.candidates.length === 0 && item.manually_confirmed === true
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
                      {isConfirmed && !confirmedCandidate && !isDirectFeedItem && (
                        <div className="text-xs font-medium" style={{ color: '#065f46' }}>
                          確定済み
                          {item.duration_minutes != null && ` • ${formatDuration(item.duration_minutes)}`}
                        </div>
                      )}

                      {/* 要約: 提出済みなら表示、未提出（確定済みのみ）なら記録ボタン/フォーム */}
                      {isConfirmed && item.summary_submitted_at && summaryFormItemId !== item.id && (
                        <div className="rounded-lg px-2.5 py-2 text-xs space-y-1" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold" style={{ color: '#166534' }}>
                              📄 要約
                              {item.summary_source && (
                                <span className="ml-1 font-normal" style={{ color: '#4d7c0f' }}>
                                  （{SUMMARY_SOURCE_LABEL[item.summary_source]}）
                                </span>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => openSummaryEditForm(item)}
                              className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none transition-colors"
                              style={{ color: '#166534', textDecoration: 'underline' }}
                            >
                              ✏️ 編集する
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap" style={{ color: '#14532d' }}>{item.summary_text}</p>
                        </div>
                      )}
                      {isConfirmed && !item.summary_submitted_at && summaryFormItemId !== item.id && (
                        <button
                          type="button"
                          onClick={() => openSummaryForm(item.id)}
                          className="farm-btn flex h-10 w-full items-center justify-center text-xs focus:outline-none transition-colors"
                        >
                          📝 要約を記録する
                        </button>
                      )}
                      {summaryFormItemId === item.id &&
                        renderSummaryFormFields(
                          () => handleSummarySubmit(item.id),
                          closeSummaryForm,
                          item.summary_submitted_at ? () => handleSaveNotesOnly(item.id) : undefined
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
                            <p style={{ color: '#78350f' }}>💡 チャットで合意した日時で確定するか、新しく種をまいて別の候補を送れます</p>
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

                      {/* URL コピー（リンク経由の記録のみ。肥料をあげる記録には返信リンクが存在しないため非表示） */}
                      {!isDirectFeedItem && (
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
                      )}
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
                ) : '🌱 新しい種をまく'}
              </button>
              {!isDirectFeedFormOpen ? (
                <button
                  type="button"
                  onClick={openDirectFeedForm}
                  className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold focus:outline-none transition-colors"
                  style={{ border: '1.5px solid #4d7c0f', color: '#365314', background: '#ecfccb' }}
                >
                  🌾 肥料をあげる（要約を記録する）
                </button>
              ) : (
                renderSummaryFormFields(() => handleSummarySubmit(null), closeDirectFeedForm)
              )}
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
        aria-label={`${contact.contact_name}の畑を見る`}
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
              <>{summaryCount}回</>
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
  liveRepliedCounts: Record<string, number>
  liveConfirmedCounts: Record<string, number>
  livePendingCounts: Record<string, number>
  liveSummaryCounts: Record<string, number>
  onManualConfirmed: (contactId: string) => void
  onSummarySubmitted: (contactId: string) => void
  onDirectFeedCreated: (contactId: string) => void
  openModalContactId?: string | null
  onModalOpened?: () => void
  onDraftCleared?: (contactId: string) => void
}

export default function FarmCharacters({
  contacts,
  liveRepliedCounts,
  liveConfirmedCounts,
  livePendingCounts,
  liveSummaryCounts,
  onManualConfirmed,
  onSummarySubmitted,
  onDirectFeedCreated,
  openModalContactId,
  onModalOpened,
  onDraftCleared,
}: Props) {
  const positionsRef = useRef<({ x: number; y: number } | null)[]>([])

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

  // 王冠（最も成長している=要約提出回数が最も多い相手）
  const maxCount = Math.max(...contacts.map(c => liveSummaryCounts[c.id] ?? c.summaryCount))
  const crownId = contacts.find(c => (liveSummaryCounts[c.id] ?? c.summaryCount) === maxCount)?.id ?? ''

  return (
    <>
      {contacts.map((contact, index) => (
        <Character
          key={contact.id}
          contact={contact}
          liveRepliedCount={liveRepliedCounts[contact.id] ?? contact.repliedCount}
          liveConfirmedCount={liveConfirmedCounts[contact.id] ?? contact.confirmedCount}
          livePendingCount={livePendingCounts[contact.id] ?? contact.pendingCount}
          liveSummaryCount={liveSummaryCounts[contact.id] ?? contact.summaryCount}
          index={index}
          isCrown={contact.id === crownId}
          onManualConfirmed={onManualConfirmed}
          onSummarySubmitted={onSummarySubmitted}
          onDirectFeedCreated={onDirectFeedCreated}
          onDraftCleared={onDraftCleared}
          requestedOpen={openModalContactId === contact.id}
          onModalOpened={onModalOpened}
          positionsRef={positionsRef}
        />
      ))}
    </>
  )
}
