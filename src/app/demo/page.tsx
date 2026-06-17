'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FarmContactWithCount } from '@/types/farm'
import DemoFarmCharacters from './DemoFarmCharacters'

// 成長過程を見せるためのプリセットキャラ（確定0・2・3・5・10回）
const PRESET_CONTACTS: FarmContactWithCount[] = [
  { id: 'preset-0',  farm_id: 'demo', contact_name: '山田先生',  character_number: 42, created_at: '', confirmedCount: 0,  pendingCount: 0, repliedCount: 0 },
  { id: 'preset-2',  farm_id: 'demo', contact_name: '鈴木先生',  character_number: 17, created_at: '', confirmedCount: 2,  pendingCount: 0, repliedCount: 0 },
  { id: 'preset-3',  farm_id: 'demo', contact_name: '田中先生',  character_number: 68, created_at: '', confirmedCount: 3,  pendingCount: 0, repliedCount: 0 },
  { id: 'preset-5',  farm_id: 'demo', contact_name: '佐藤先生',  character_number: 33, created_at: '', confirmedCount: 5,  pendingCount: 0, repliedCount: 0 },
  { id: 'preset-10', farm_id: 'demo', contact_name: '伊藤先生',  character_number: 81, created_at: '', confirmedCount: 10, pendingCount: 0, repliedCount: 0 },
]

const STORAGE_KEY = 'demo_contacts'

type DemoContact = {
  id: string
  contact_name: string
  character_number: number
  created_at: string
}

function isDemoContactArray(value: unknown): value is DemoContact[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).id === 'string' &&
      typeof (item as Record<string, unknown>).contact_name === 'string' &&
      typeof (item as Record<string, unknown>).character_number === 'number' &&
      typeof (item as Record<string, unknown>).created_at === 'string'
  )
}

function loadDemoContacts(): DemoContact[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return isDemoContactArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function DemoPage() {
  const [extraContacts, setExtraContacts] = useState<FarmContactWithCount[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const raw = loadDemoContacts()
    const extras: FarmContactWithCount[] = raw.map(c => ({
      id: c.id,
      farm_id: 'demo',
      contact_name: c.contact_name,
      character_number: c.character_number,
      created_at: c.created_at,
      confirmedCount: 0,
      pendingCount: 0,
      repliedCount: 0,
    }))
    setExtraContacts(extras)
    setIsLoaded(true)
  }, [])

  const contacts = [...PRESET_CONTACTS, ...extraContacts]
  const totalConfirmed = PRESET_CONTACTS.reduce((s, c) => s + c.confirmedCount, 0)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5ede0' }}>
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 farm-header" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🌾</span>
          <h1 className="text-base font-extrabold" style={{ color: '#f5e6a3', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            のうえんミーティング
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e' }}>
            デモ
          </span>
          <Link
            href="/"
            className="farm-btn-gold h-9 px-3 flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* 農園エリア */}
      <main className="flex-1 p-3 flex flex-col gap-2">
        <div
          className="flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: '#fef7e4', border: '1.5px solid #d4a853', color: '#6b4c0a' }}
        >
          <span>🐾 {contacts.length}人が農園にいます</span>
          <span>✅ 合計{totalConfirmed}回確定（デモ）</span>
        </div>

        <div
          className="relative w-full rounded-2xl overflow-hidden flex-1"
          style={{
            minHeight: '62vh',
            border: '3px solid #7c5c3a',
            boxShadow: '0 4px 20px rgba(107,68,35,0.3)',
          }}
        >
          <img
            src="/images/nouen.png"
            alt="農園"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0">
            {isLoaded && <DemoFarmCharacters contacts={contacts} />}
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: '#8b6914' }}>
          キャラをタップしてみよう ✨ 確定回数が多いほど大きく育ちます
        </p>

        {/* デモ説明 */}
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fef7e4', border: '1.5px solid #d4a853' }}>
          <p className="font-semibold mb-1" style={{ color: '#3d2b0e' }}>デモモードについて</p>
          <ul className="space-y-1" style={{ color: '#6b4c0a' }}>
            <li>・ミーティングが確定するたびにキャラが成長します</li>
            <li>・3回以上でキラキラ、4回以上でハートエフェクトが付きます</li>
            <li>・一番確定回数が多い人に王冠がつきます 👑</li>
            <li>・リクエスト送信・日程調整はログイン後にご利用いただけます</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
