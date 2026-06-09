'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Candidate } from '@/types/meeting'
import { getSupabase } from '@/lib/supabase'

type Props = {
  candidates: Candidate[]
  meetingId: string
  isConfirmed: boolean
  confirmedIndex: number | null
}

function formatCandidate(candidate: Candidate): string {
  const date = new Date(`${candidate.date}T${candidate.time}:00`)
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  return `${dateStr} ${candidate.time}`
}

export default function CandidateList({
  candidates,
  meetingId,
  isConfirmed: initialIsConfirmed,
  confirmedIndex,
}: Props) {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialIsConfirmed ? confirmedIndex : null
  )
  const [isConfirmed, setIsConfirmed] = useState<boolean>(initialIsConfirmed)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  if (isConfirmed && selectedIndex !== null && candidates[selectedIndex]) {
    const confirmedCandidate = candidates[selectedIndex]
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="text-base font-semibold text-green-800">
          ✅ {formatCandidate(confirmedCandidate)} に確定しました
        </p>
      </div>
    )
  }

  async function handleConfirm() {
    if (selectedIndex === null) {
      setErrorMessage('候補日を選択してください')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const { error } = await getSupabase()
        .from('meetings')
        .update({
          confirmed_index: selectedIndex,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', meetingId)

      if (error) {
        setErrorMessage('確定に失敗しました。もう一度お試しください。')
        return
      }

      setIsConfirmed(true)
      router.refresh()
    } catch {
      setErrorMessage('確定に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-4 space-y-3">
        {candidates.map((candidate, index) => {
          const isSelected = selectedIndex === index
          return (
            <label
              key={index}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="candidate"
                value={index}
                checked={isSelected}
                onChange={() => {
                  setSelectedIndex(index)
                  setErrorMessage('')
                }}
                className="h-5 w-5 flex-shrink-0 accent-blue-600"
              />
              <span className="text-base text-gray-800">
                {formatCandidate(candidate)}
              </span>
            </label>
          )
        })}
      </div>

      {errorMessage && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? '確定中...' : '確定する'}
      </button>
    </div>
  )
}
