'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = {
  farmId: string
}

const TOTAL_CHARACTERS = 100

export default function AddContactForm({ farmId }: Props) {
  const router = useRouter()
  const [contactName, setContactName] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null)
  const [nameError, setNameError] = useState('')
  const [characterError, setCharacterError] = useState('')
  const [submitError, setSubmitError] = useState('')
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('farm_contacts').insert({
        farm_id: farmId,
        contact_name: contactName.trim(),
        character_number: selectedCharacter,
      })

      if (error) {
        setSubmitError('登録に失敗しました。もう一度お試しください。')
        setIsSubmitting(false)
        return
      }

      router.push('/farm')
    } catch {
      setSubmitError('予期しないエラーが発生しました。')
      setIsSubmitting(false)
    }
  }

  return (
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
        {selectedCharacter !== null && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-2">
            キャラクター #{selectedCharacter} を選択中
          </p>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3 max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
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
                  'flex flex-col items-center justify-center rounded-lg p-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400',
                  'min-h-[44px]',
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
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain"
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

      {/* 送信エラー */}
      {submitError && (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}

      {/* 登録ボタン */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '登録中...' : '登録する'}
      </button>
    </form>
  )
}
