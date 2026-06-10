'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FarmContactWithCount } from '@/types/farm'

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

type WalkState = {
  x: number
  y: number
  vx: number
  vy: number
  timer: number
}

type CharacterProps = {
  contact: FarmContactWithCount
  index: number
  isCrown: boolean
  onTap: (id: string) => void
}

function Character({ contact, index, isCrown, onTap }: CharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const stateRef = useRef<WalkState>({
    x: 35 + seedRand(index, 2) * 30,
    y: 15 + seedRand(index, 3) * 30,
    vx: 0,
    vy: 0,
    timer: 0,
  })

  const { confirmedCount } = contact
  const isAsleep = confirmedCount === 0
  const baseSpeed = isAsleep ? 0.12 : 0.4 + seedRand(index, 6) * 0.25

  const showZzz = confirmedCount === 0
  const showKira = confirmedCount >= 3
  const showHeart = confirmedCount >= 4
  const scale = getScale(confirmedCount)

  const [kiraPhase, setKiraPhase] = useState(true)
  useEffect(() => {
    if (!showHeart) return
    const id = setInterval(() => setKiraPhase(p => !p), 800)
    return () => clearInterval(id)
  }, [showHeart])

  useEffect(() => {
    const s = stateRef.current
    const angle = seedRand(index, 1) * Math.PI * 2
    s.vx = Math.cos(angle) * baseSpeed
    s.vy = Math.sin(angle) * baseSpeed * 0.35
    s.timer = Math.floor(80 + seedRand(index, 4) * 100)

    // Set initial DOM position immediately
    if (containerRef.current) {
      containerRef.current.style.left = `${s.x}%`
      containerRef.current.style.bottom = `${s.y}%`
    }

    let rafId: number
    const tick = () => {
      const el = containerRef.current
      const img = imgRef.current

      s.x += s.vx
      s.y += s.vy

      if (s.x < 2)  { s.x = 2;  s.vx =  Math.abs(s.vx) }
      if (s.x > 96) { s.x = 96; s.vx = -Math.abs(s.vx) }
      if (s.y < 3)  { s.y = 3;  s.vy =  Math.abs(s.vy) }
      if (s.y > 72) { s.y = 72; s.vy = -Math.abs(s.vy) }

      s.timer--
      if (s.timer <= 0) {
        const a = Math.random() * Math.PI * 2
        s.vx = Math.cos(a) * baseSpeed
        s.vy = Math.sin(a) * baseSpeed * 0.35
        s.timer = Math.floor(60 + Math.random() * 120)
      }

      if (el) {
        el.style.left   = `${s.x}%`
        el.style.bottom = `${s.y}%`
      }
      if (img) {
        img.style.transform = s.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)'
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [index, baseSpeed])

  return (
    <div
      ref={containerRef}
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{ left: `${stateRef.current.x}%`, bottom: `${stateRef.current.y}%` }}
      onClick={() => onTap(contact.id)}
      role="button"
      tabIndex={0}
      aria-label={`${contact.contact_name}にリクエストを送る`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onTap(contact.id) }}
    >
      {/* 吹き出し（確定回数） */}
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

      {/* キャラ本体 + オーバーレイ */}
      <div className="relative" style={{ width: 64 * scale, height: 64 * scale }}>
        <img
          ref={imgRef}
          src={`/images/processed_${contact.character_number}.png`}
          alt={contact.contact_name}
          width={64}
          height={64}
          style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
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

        {/* キラキラ：左上（確定3） */}
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

        {/* キラキラ＋ハート交互（確定4以上） */}
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
  )
}

type Props = { contacts: FarmContactWithCount[] }

export default function FarmCharacters({ contacts }: Props) {
  const router = useRouter()
  const handleTap = useCallback((id: string) => router.push(`/request/${id}`), [router])

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

  const maxCount = Math.max(...contacts.map(c => c.confirmedCount))
  const crownId = contacts.find(c => c.confirmedCount === maxCount)?.id ?? ''

  return (
    <>
      {contacts.map((contact, index) => (
        <Character
          key={contact.id}
          contact={contact}
          index={index}
          isCrown={contact.id === crownId}
          onTap={handleTap}
        />
      ))}
    </>
  )
}
