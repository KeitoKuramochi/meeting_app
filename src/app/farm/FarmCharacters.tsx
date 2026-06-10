'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FarmContactWithCount } from '@/types/farm'

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
function buildWalkParams(index: number, total: number, isAsleep: boolean): WalkParams {
  const seed = (n: number) => {
    const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453123
    return x - Math.floor(x)
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(total)))
  const rows = Math.max(1, Math.ceil(total / cols))
  const col = index % cols
  const row = Math.floor(index / cols)

  const marginX = 10
  const marginY = 8
  const usableW = 100 - marginX * 2
  const usableH = 100 - marginY * 2

  const baseLeft = cols > 1 ? marginX + (col / (cols - 1)) * usableW : 50
  const baseBottom = rows > 1 ? marginY + (row / (rows - 1)) * usableH : 20

  if (isAsleep) {
    // 眠り：ほぼ動かない、ゆっくり微揺れ
    return {
      duration: 4 + seed(0) * 2,
      delay: -(seed(1) * 4),
      moveX: (seed(2) - 0.5) * 2,   // ±1%
      moveY: (seed(3) - 0.5) * 1,   // ±0.5%
      initLeft: baseLeft,
      initBottom: baseBottom,
    }
  }

  // 起きてる：速く・大きく動く
  return {
    duration: 3 + seed(0) * 3,       // 3〜6秒（速め）
    delay: -(seed(1) * 6),
    moveX: (seed(2) - 0.5) * 50,     // ±25%（広い範囲）
    moveY: (seed(3) - 0.5) * 20,     // ±10%
    initLeft: baseLeft,
    initBottom: baseBottom,
  }
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

  const isAsleep = confirmedCount === 0
  const animName = `walk-${index}`
  const flipName = `flip-${index}`
  // moveX > 0 → 最初は右向き（scaleX=1）、折り返し時に左向き（scaleX=-1）
  const faceRight = moveX >= 0 ? 1 : -1
  const faceLeft = -faceRight

  const styleTag = `
    @keyframes ${animName} {
      0%   { transform: translateX(-50%) translate(0%, 0%); }
      25%  { transform: translateX(-50%) translate(${moveX * 0.5}%, ${moveY * -0.3}%); }
      50%  { transform: translateX(-50%) translate(${moveX}%, ${moveY}%); }
      75%  { transform: translateX(-50%) translate(${moveX * 0.3}%, ${moveY * 0.5}%); }
      100% { transform: translateX(-50%) translate(0%, 0%); }
    }
    @keyframes ${flipName} {
      0%        { transform: scaleX(${faceRight}); }
      49.9%     { transform: scaleX(${faceRight}); }
      50%       { transform: scaleX(${faceLeft}); }
      99.9%     { transform: scaleX(${faceLeft}); }
      100%      { transform: scaleX(${faceRight}); }
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
        {/* 吹き出し（常時表示・確定回数） */}
        <div className="relative mb-1 flex items-center justify-center" style={{ width: 56, height: 44 }}>
          <img
            src="/images/processed_a1.png"
            alt=""
            aria-hidden="true"
            width={56}
            height={44}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          <span className="relative z-10 font-bold text-gray-700 leading-none" style={{ fontSize: 13 }}>
            {confirmedCount}回
          </span>
        </div>

        {/* キャラ本体 + オーバーレイエフェクト */}
        <div className="relative" style={{ width: 64 * scale, height: 64 * scale }}>
          {/* キャラ画像（左右反転アニメーション） */}
          <img
            src={`/images/processed_${contact.character_number}.png`}
            alt={contact.contact_name}
            width={64}
            height={64}
            style={{
              imageRendering: 'pixelated',
              width: '100%',
              height: '100%',
              animation: isAsleep
                ? 'none'
                : `${flipName} ${duration}s ${delay}s step-start infinite`,
            }}
            draggable={false}
          />

          {/* 王冠：頭上中央 */}
          {isCrown && (
            <img
              src="/images/processed_a4.png"
              alt="王冠"
              width={24}
              height={24}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: -20 }}
              draggable={false}
            />
          )}

          {/* ZZZ：右上 */}
          {showZzz && (
            <img
              src="/images/processed_a5.png"
              alt="ZZZ"
              width={20}
              height={20}
              className="absolute"
              style={{ top: -8, right: -8 }}
              draggable={false}
            />
          )}

          {/* キラキラ：左上（確定3以上） */}
          {showKira && !showHeart && (
            <img
              src="/images/processed_a2.png"
              alt="キラキラ"
              width={20}
              height={20}
              className="absolute animate-pulse"
              style={{ top: -8, left: -8 }}
              draggable={false}
            />
          )}

          {/* キラキラ＋ハート交互：左上（確定4以上） */}
          {showHeart && (
            <img
              src={kiraPhase ? '/images/processed_a2.png' : '/images/processed_a3.png'}
              alt={kiraPhase ? 'キラキラ' : 'ハート'}
              width={20}
              height={20}
              className="absolute"
              style={{ top: -8, left: -8 }}
              draggable={false}
            />
          )}
        </div>

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
            まだ誰もいません。相手を追加しましょう！
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
        const walkParams = buildWalkParams(index, contacts.length, contact.confirmedCount === 0)
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
