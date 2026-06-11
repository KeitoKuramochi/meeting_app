'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FarmContactWithCount } from '@/types/farm'
import DemoFarmCharacters from './DemoFarmCharacters'

type DemoContact = {
  id: string
  contact_name: string
  character_number: number
  created_at: string
}

const STORAGE_KEY = 'demo_contacts'

// 型ガード: localStorage から読み込んだ値が DemoContact[] かを検証する
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

function toDemoContactWithCount(contact: DemoContact): FarmContactWithCount {
  return {
    id: contact.id,
    // farm_id は FarmContact に必須だが demo では使わないためダミー値を設定
    farm_id: 'demo',
    contact_name: contact.contact_name,
    character_number: contact.character_number,
    created_at: contact.created_at,
    confirmedCount: 0,
    pendingCount: 0,
    repliedCount: 0,
  }
}

export default function DemoPage() {
  const [contacts, setContacts] = useState<FarmContactWithCount[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const raw = loadDemoContacts()
    setContacts(raw.map(toDemoContactWithCount))
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950 flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="h-11 px-3 flex items-center justify-center rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
          >
            ← ログインして本格利用
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
            デモ
          </span>
          <Link
            href="/demo/add"
            className="h-11 px-4 flex items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            キャラを追加
          </Link>
        </div>
      </header>

      {/* 農園エリア */}
      <main className="flex-1 p-4">
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-lg"
          style={{ minHeight: '60vh' }}
        >
          {/* 農園背景画像 */}
          <img
            src="/images/nouen.png"
            alt="農園"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* キャラクター表示 */}
          <div className="absolute inset-0">
            {isLoaded && <DemoFarmCharacters contacts={contacts} />}
          </div>
        </div>

        {/* キャラ数の表示 */}
        {contacts.length > 0 && (
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            {contacts.length} 人が農園にいます
          </p>
        )}

        {/* デモ説明 */}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-semibold mb-1">デモモードについて</p>
          <ul className="space-y-1 text-amber-700 dark:text-amber-300">
            <li>・キャラを追加して農園を体験できます</li>
            <li>・データはこのブラウザにのみ保存されます</li>
            <li>・リクエスト送信・日程調整はログイン後にご利用いただけます</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
