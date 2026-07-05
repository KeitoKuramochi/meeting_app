'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getCharacterName } from '@/data/characterNames'

type Props = {
  farmId: string
}

const TOTAL_CHARACTERS = 100

export default function AddContactForm({ farmId }: Props) {
  const router = useRouter()
  const [contactName, setContactName] = useState('')
  const [isNameAutoFilled, setIsNameAutoFilled] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null)
  const [nameError, setNameError] = useState('')
  const [characterError, setCharacterError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const characterNumbers = Array.from({ length: TOTAL_CHARACTERS }, (_, i) => i + 1)

  function handleSelectCharacter(num: number) {
    setSelectedCharacter(num)
    setCharacterError('')
    if (contactName.trim() === '' || isNameAutoFilled) {
      setContactName(getCharacterName(num))
      setIsNameAutoFilled(true)
      setNameError('')
    }
  }

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
      {/* Name input */}
      <div
        className="mb-5 p-4 rounded-2xl"
        style={{ background: '#fef7e4', border: '2px solid #d4a853' }}
      >
        <label
          htmlFor="contact-name"
          className="block text-sm font-bold mb-1"
          style={{ color: '#3d2b0e' }}
        >
          相手の名前
        </label>
        <p className="text-xs mb-2" style={{ color: '#8b6914' }}>
          農園に表示される名前です
        </p>
        <input
          id="contact-name"
          type="text"
          value={contactName}
          onChange={(e) => {
            setContactName(e.target.value)
            setIsNameAutoFilled(false)
          }}
          onFocus={(e) => {
            if (isNameAutoFilled) e.target.select()
          }}
          placeholder="例：田中さん、田中教授"
          className="w-full h-12 rounded-xl px-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          style={{
            border: '2px solid #c8953a',
            background: '#fffdf7',
            color: isNameAutoFilled ? '#b8a888' : '#2c1a0e',
            fontStyle: isNameAutoFilled ? 'italic' : 'normal',
          }}
          autoComplete="off"
        />
        {nameError && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">{nameError}</p>
        )}
      </div>

      {/* Character selection */}
      <div
        className="mb-5 p-4 rounded-2xl"
        style={{ background: '#fef7e4', border: '2px solid #d4a853' }}
      >
        <p className="text-sm font-bold mb-1" style={{ color: '#3d2b0e' }}>
          キャラクターを選ぶ
        </p>
        <p className="text-xs mb-3" style={{ color: '#8b6914' }}>
          相手を表すキャラです。タップして選んでください
        </p>

        {/* Selected character preview */}
        {selectedCharacter !== null && (
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-xl mb-3"
            style={{ background: 'rgba(42,92,30,0.08)', border: '2px solid #4a8c5c' }}
          >
            <p className="text-xs font-bold" style={{ color: '#2a5c1e' }}>選択中</p>
            <div
              className="rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                width: 160, height: 160,
                border: '3px solid #4a8c5c',
                background: 'rgba(255,255,255,0.6)',
                boxSizing: 'content-box',
              }}
            >
              <img
                src={'/images/processed_' + selectedCharacter + '.png'}
                alt={'キャラクター ' + selectedCharacter}
                width={160}
                height={160}
                className="w-full h-full object-contain pixel-char"
                style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}
                draggable={false}
              />
            </div>
            <p className="text-xl font-extrabold" style={{ color: '#2a5c1e' }}>
              {getCharacterName(selectedCharacter)}
            </p>
            {contactName.trim() && (
              <p className="text-sm" style={{ color: '#4a8c5c' }}>
                {contactName.trim()} の担当キャラ
              </p>
            )}
          </div>
        )}

        {/* Character grid */}
        <div
          className="grid gap-1.5 max-h-72 overflow-y-auto rounded-xl p-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            background: '#fffdf7',
            border: '1.5px solid #d4a853',
          }}
        >
          {characterNumbers.map((num) => {
            const isSelected = selectedCharacter === num
            const name = getCharacterName(num)
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleSelectCharacter(num)}
                className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[100px]"
                style={{
                  background: isSelected ? 'rgba(42,92,30,0.15)' : 'transparent',
                  border: isSelected ? '2px solid #4a8c5c' : '2px solid transparent',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                }}
                aria-label={name}
                aria-pressed={isSelected}
                title={name}
              >
                <img
                  src={'/images/processed_' + num + '.png'}
                  alt={name}
                  width={72}
                  height={72}
                  className="object-contain pixel-char"
                  style={{ width: 72, height: 72, minWidth: 72, minHeight: 72 }}
                  loading="lazy"
                  draggable={false}
                />
                <span
                  className="w-full mt-1 text-[10px] leading-tight text-center truncate"
                  style={{ color: '#8b6914' }}
                >
                  {name}
                </span>
              </button>
            )
          })}
        </div>

        {characterError && (
          <p role="alert" className="mt-2 text-sm text-red-600">{characterError}</p>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <p role="alert" className="mb-4 text-sm text-red-600 rounded-lg px-4 py-3"
          style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
          {submitError}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || selectedCharacter === null}
        className="farm-btn w-full h-12 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ opacity: selectedCharacter === null ? 0.5 : 1 }}
      >
        {isSubmitting ? '登録中...' : '農園に追加する 🌱'}
      </button>
    </form>
  )
}
