'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type DemoContact = {
  id: string
  contact_name: string
  character_number: number
  created_at: string
}

const TOTAL_CHARACTERS = 100
const STORAGE_KEY = 'demo_contacts'

function loadDemoContacts(): DemoContact[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as DemoContact[]
  } catch {
    return []
  }
}

function saveDemoContacts(contacts: DemoContact[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
}

export default function DemoAddPage() {
  const router = useRouter()
  const [contactName, setContactName] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null)
  const [nameError, setNameError] = useState('')
  const [characterError, setCharacterError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const characterNumbers = Array.from({ length: TOTAL_CHARACTERS }, (_, i) => i + 1)

  function validate(): boolean {
    let valid = true

    if (contactName.trim() === '') {
      setNameError('名前を入力してください')
      valid = false
    } else {
      setNameError('')
    }

    if (selectedCharacter === null) {
      setCharacterError('キャラクターを選んでください')
      valid = false
    } else {
      setCharacterError('')
    }

    return valid
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    const newContact: DemoContact = {
      id: crypto.randomUUID(),
      contact_name: contactName.trim(),
      character_number: selectedCharacter!,
      created_at: new Date().toISOString(),
    }

    const existing = loadDemoContacts()
    saveDemoContacts([...existing, newContact])

    router.push('/demo')
  }

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <Link
          href="/demo"
          className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
          aria-label="デモ農園に戻る"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">キャラを追加（デモ）</h1>
      </header>

      {/* フォームエリア */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3">
          デモモードです。入力したデータはこのブラウザにのみ保存されます。
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* 名前入力 */}
          <div className="mb-6">
            <label
              htmlFor="contact-name"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              相手の名前
            </label>
            <input
              id="contact-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="例：田中さん、田中教授"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 h-12 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
              autoComplete="off"
            />
            {nameError && (
              <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {nameError}
              </p>
            )}
          </div>

          {/* キャラクター選択 */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              キャラクターを選んでください
            </p>

            {/* 選択中プレビュー */}
            {selectedCharacter !== null && (
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl mb-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">選択中</p>
                <div
                  className="rounded-2xl overflow-hidden flex items-center justify-center bg-white/60"
                  style={{ width: 160, height: 160, border: '3px solid #4a8c5c' }}
                >
                  <img
                    src={`/images/processed_${selectedCharacter}.png`}
                    alt={`キャラクター ${selectedCharacter}`}
                    width={160}
                    height={160}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                  キャラ #{selectedCharacter}
                </p>
                {contactName.trim() && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {contactName.trim()} の担当キャラ
                  </p>
                )}
              </div>
            )}

            {/* キャラグリッド */}
            <div
              className="grid gap-1.5 max-h-72 overflow-y-auto rounded-xl p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))' }}
            >
              {characterNumbers.map((num) => {
                const isSelected = selectedCharacter === num
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setSelectedCharacter(num)
                      setCharacterError('')
                    }}
                    className={[
                      'flex flex-col items-center justify-center rounded-lg p-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400',
                      'min-h-[88px]',
                      isSelected
                        ? 'ring-2 ring-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                    ].join(' ')}
                    aria-label={`キャラクター ${num}`}
                    aria-pressed={isSelected}
                  >
                    <img
                      src={`/images/processed_${num}.png`}
                      alt={`キャラクター ${num}`}
                      width={72}
                      height={72}
                      className="object-contain"
                      style={{ width: 72, height: 72 }}
                      loading="lazy"
                      draggable={false}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{num}</span>
                  </button>
                )
              })}
            </div>
            {characterError && (
              <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {characterError}
              </p>
            )}
          </div>

          {/* 登録ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '追加中...' : '追加する'}
          </button>
        </form>
      </main>
    </div>
  )
}
