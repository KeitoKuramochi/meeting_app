'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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

type WalkState = { x: number; y: number; vx: number; vy: number; timer: number }

// トースト表示用コンポーネント
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 2000)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-900/90 text-white text-sm font-medium shadow-lg pointer-events-none">
      {message}
    </div>
  )
}

type CharacterProps = {
  contact: FarmContactWithCount
  index: number
  isCrown: boolean
  onTap: () => void
}

function DemoCharacter({ contact, index, isCrown, onTap }: CharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const hasMovedRef = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

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

  const stateRef = useRef<WalkState>({
    x: 35 + seedRand(index, 2) * 30,
    y: 15 + seedRand(index, 3) * 30,
    vx: 0, vy: 0, timer: 0,
  })

  const startAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const tick = () => {
      if (isDraggingRef.current) { rafRef.current = requestAnimationFrame(tick); return }
      const el = containerRef.current
      const img = imgRef.current
      const s = stateRef.current

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
      const x = Math.max(2, Math.min(96, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.max(3, Math.min(72, ((rect.bottom - clientY) / rect.height) * 100))
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
      stateRef.current.vx = Math.cos(a) * baseSpeed
      stateRef.current.vy = Math.sin(a) * baseSpeed * 0.35
      stateRef.current.timer = Math.floor(60 + Math.random() * 120)
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
    e.preventDefault()
    isDraggingRef.current = true
    hasMovedRef.current = false
    setGrabbing(true)
    stateRef.current.vx = 0
    stateRef.current.vy = 0
  }, [])

  const handleClick = useCallback(() => {
    if (hasMovedRef.current) return
    onTap()
  }, [onTap])

  return (
    <div
      ref={containerRef}
      className="absolute flex flex-col items-center select-none"
      style={{
        left: `${stateRef.current.x}%`,
        bottom: `${stateRef.current.y}%`,
        cursor: grabbing ? 'grabbing' : 'grab',
        zIndex: grabbing ? 50 : 1,
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${contact.contact_name}（デモキャラ）`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onTap()
      }}
    >
      {/* 吹き出し */}
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
        <span className="relative z-10 font-bold text-gray-700 leading-none text-center" style={{ fontSize: 11 }}>
          {confirmedCount}回
        </span>
      </div>

      {/* キャラ本体 + オーバーレイ */}
      <div className="relative" style={{ width: 80 * scale, height: 80 * scale }}>
        <img
          ref={imgRef}
          src={`/images/processed_${contact.character_number}.png`}
          alt={contact.contact_name}
          width={80}
          height={80}
          style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
          draggable={false}
        />

        {isCrown && (
          <img src="/images/processed_a4.png" alt="王冠" width={24} height={24}
            className="absolute left-1/2 -translate-x-1/2" style={{ top: -20 }} draggable={false} />
        )}
        {showZzz && (
          <img src="/images/processed_a5.png" alt="ZZZ" width={20} height={20}
            className="absolute" style={{ top: -8, right: -8 }} draggable={false} />
        )}
        {showKira && !showHeart && (
          <img src="/images/processed_a2.png" alt="キラキラ" width={20} height={20}
            className="absolute animate-pulse" style={{ top: -8, left: -8 }} draggable={false} />
        )}
        {showHeart && (
          <img
            src={kiraPhase ? '/images/processed_a2.png' : '/images/processed_a3.png'}
            alt={kiraPhase ? 'キラキラ' : 'ハート'}
            width={20} height={20}
            className="absolute" style={{ top: -8, left: -8 }} draggable={false}
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

export default function DemoFarmCharacters({ contacts }: Props) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleTap = useCallback(() => {
    setToastMessage('デモモードではリクエストは送れません。ログインして本格利用しましょう！')
  }, [])

  const handleToastClose = useCallback(() => setToastMessage(null), [])

  if (contacts.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4 text-center shadow-md">
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            まだ誰もいません。キャラを追加しましょう！
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
        <DemoCharacter
          key={contact.id}
          contact={contact}
          index={index}
          isCrown={contact.id === crownId}
          onTap={handleTap}
        />
      ))}
      {toastMessage && (
        <Toast message={toastMessage} onClose={handleToastClose} />
      )}
    </>
  )
}
