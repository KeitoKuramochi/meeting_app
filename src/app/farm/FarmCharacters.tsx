'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FarmContactWithCount } from '@/types/farm'

// ===== 定数 =====

const SPEECHES = [
  'そろそろ話しましょ？',
  '最近どう？',
  '相談したいことある？',
  'お時間ありますか？',
  '会いましょ！',
  'ちょっといいですか？',
  '今度話しませんか？',
]

/** 確定回数 → CSS scale */
function getScale(confirmedCount: number): number {
  if (confirmedCount <= 0) return 0.60
  if (confirmedCount === 1) return 0.72
  if (confirmedCount === 2) return 0.84
  if (confirmedCount === 3) return 0.96
  if (confirmedCount === 4) return 1.08
  return 1.20
}

// ===== ランダムウォーク パラメータ =====

type WalkParams = {
  /** アニメーション周期（秒） */
  duration: number
  /** 開始遅延（秒） */
  delay: number
  /** X 移動量（%、正負どちらでも） */
  moveX: number
  /** Y 移動量（%） */
  moveY: number
  /** 初期 left (%) */
  initLeft: number
  /** 初期 bottom (%) */
  initBottom: number
}

/** インデックスから deterministic なシードで生成（SSR/Client で同一値） */
function buildWalkParams(index: number, total: number): WalkParams {
  // 擬似乱数（seedベース、Math.random は使わない）
  const seed = (n: number) => {
    const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453123
    return x - Math.floor(x)
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(total)))
  const rows = Math.max(1, Math.ceil(total / cols))
  const col = index % cols
  const row = Math.floor(index / cols)

  const marginX = 12
  const marginY = 8
  const usableW = 100 - marginX * 2
  const usableH = 100 - marginY * 2

  const baseLeft = cols > 1 ? marginX + (col / (cols - 1)) * usableW : 50
  const baseBottom = rows > 1 ? marginY + (row / (rows - 1)) * usableH : 20

  // 各キャラで異なる動き（seed を使って散らす）
  const duration = 6 + seed(0) * 6        // 6〜12秒
  const delay = -(seed(1) * duration)      // ランダム位相オフセット
  const moveX = (seed(2) - 0.5) * 16      // ±8%
  const moveY = (seed(3) - 0.5) * 10      // ±5%

  return {
    duration,
    delay,
    moveX,
    moveY,
    initLeft: baseLeft,
    initBottom: baseBottom,
  }
}

// ===== 吹き出しコンポーネント =====

type BubbleState = {
  visible: boolean
  text: string
}

function useBubble(index: number): BubbleState {
  const [state, setState] = useState<BubbleState>({ visible: false, text: '' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Hydration 後にのみランダムタイマーを開始
    const schedule = () => {
      const wait = 5000 + Math.random() * 10000  // 5〜15 秒後
      timerRef.current = setTimeout(() => {
        const text = SPEECHES[Math.floor(Math.random() * SPEECHES.length)]
        setState({ visible: true, text })
        timerRef.current = setTimeout(() => {
          setState({ visible: false, text: '' })
          schedule()
        }, 3000)
      }, wait)
    }

    // 各キャラの初回出現タイミングをずらす
    const initial = setTimeout(() => schedule(), index * 800)

    return () => {
      clearTimeout(initial)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [index])

  return state
}

// ===== 単一キャラコンポーネント =====

type CharacterProps = {
  contact: FarmContactWithCount
  index: number
  isCrown: boolean
  walkParams: WalkParams
  onTap: (farmContactId: string) => void
}

function Character({ contact, index, isCrown, walkParams, onTap }: CharacterProps) {
  const bubble = useBubble(index)
  const { confirmedCount } = contact
  const scale = getScale(confirmedCount)

  const showZzz = confirmedCount === 0
  const showKira = confirmedCount >= 3
  const showHeart = confirmedCount >= 4

  const { duration, delay, moveX, moveY, initLeft, initBottom } = walkParams

  // キラキラ・ハートの交互表示フラグ（clientのみ、500ms トグル）
  const [kiraPhase, setKiraPhase] = useState(true)
  useEffect(() => {
    if (!showHeart) return
    const id = setInterval(() => setKiraPhase((p) => !p), 800)
    return () => clearInterval(id)
  }, [showHeart])

  // CSS keyframes animation 名（各キャラ固有）
  const animName = `walk-${index}`

  const styleTag = `
    @keyframes ${animName} {
      0%   { transform: translateX(-50%) translate(0%, 0%); }
      25%  { transform: translateX(-50%) translate(${moveX * 0.5}%, ${moveY * -0.3}%); }
      50%  { transform: translateX(-50%) translate(${moveX}%, ${moveY}%); }
      75%  { transform: translateX(-50%) translate(${moveX * 0.3}%, ${moveY * 0.5}%); }
      100% { transform: translateX(-50%) translate(0%, 0%); }
    }
  `

  return (
    <>
      {/* per-character keyframes */}
      <style>{styleTag}</style>

      <div
        className="absolute flex flex-col items-center cursor-pointer select-none"
        style={{
          left: `${initLeft}%`,
          bottom: `${initBottom}%`,
          animation: `${animName} ${duration}s ${delay}s ease-in-out infinite`,
          /* translateX(-50%) は keyframes 内に含めているので不要 */
        }}
        onClick={() => onTap(contact.id)}
        role="button"
        tabIndex={0}
        aria-label={`${contact.contact_name}にリクエストを送る`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onTap(contact.id)
        }}
      >
        {/* 吹き出し */}
        {bubble.visible && (
          <div className="relative mb-1 flex flex-col items-center" style={{ minWidth: 80 }}>
            <div
              className="relative rounded-xl bg-white/95 dark:bg-gray-800/95 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-md whitespace-nowrap border border-gray-200 dark:border-gray-600"
              style={{ fontSize: 11 }}
            >
              {bubble.text}
              {/* しっぽ */}
              <span
                className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '6px solid rgba(255,255,255,0.95)',
                }}
              />
            </div>
            <img
              src="/images/a1.png"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="mt-0.5 opacity-0 absolute"
              draggable={false}
            />
          </div>
        )}

        {/* 王冠 */}
        {isCrown && (
          <img
            src="/images/a4.png"
            alt="王冠"
            width={28}
            height={28}
            className="mb-0.5"
            draggable={false}
          />
        )}

        {/* キラキラ / ハート（確定3以上） */}
        {showKira && !showHeart && (
          <img
            src="/images/a2.png"
            alt="キラキラ"
            width={24}
            height={24}
            className="mb-0.5 animate-pulse"
            draggable={false}
          />
        )}
        {showHeart && (
          <>
            {kiraPhase ? (
              <img
                src="/images/a2.png"
                alt="キラキラ"
                width={24}
                height={24}
                className="mb-0.5"
                draggable={false}
              />
            ) : (
              <img
                src="/images/a3.png"
                alt="ハート"
                width={24}
                height={24}
                className="mb-0.5"
                draggable={false}
              />
            )}
          </>
        )}

        {/* キャラ本体 */}
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}>
          <img
            src={`/images/processed_${contact.character_number}.png`}
            alt={contact.contact_name}
            width={64}
            height={64}
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </div>

        {/* ZZZ（確定0） */}
        {showZzz && (
          <img
            src="/images/a5.png"
            alt="ZZZ"
            width={24}
            height={24}
            className="mt-0.5"
            draggable={false}
          />
        )}

        {/* 名前ラベル */}
        <span className="mt-1 rounded-full bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm whitespace-nowrap">
          {contact.contact_name}
        </span>
      </div>
    </>
  )
}

// ===== メインコンポーネント =====

type Props = {
  contacts: FarmContactWithCount[]
}

export default function FarmCharacters({ contacts }: Props) {
  const router = useRouter()

  const handleTap = useCallback(
    (farmContactId: string) => {
      router.push(`/request/${farmContactId}`)
    },
    [router],
  )

  if (contacts.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4 text-center shadow-md">
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            まだ誰もいません。先生を追加しましょう！
          </p>
        </div>
      </div>
    )
  }

  // 王冠：確定回数が最多のキャラ（同率の場合は最初の1人）
  const maxCount = Math.max(...contacts.map((c) => c.confirmedCount))
  const crownId = contacts.find((c) => c.confirmedCount === maxCount)?.id ?? ''

  return (
    <>
      {contacts.map((contact, index) => {
        const walkParams = buildWalkParams(index, contacts.length)
        return (
          <Character
            key={contact.id}
            contact={contact}
            index={index}
            isCrown={contact.id === crownId}
            walkParams={walkParams}
            onTap={handleTap}
          />
        )
      })}
    </>
  )
}
