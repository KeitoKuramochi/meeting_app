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
  initialDurationMinutes?: number | null
  initialNote?: string | null
}

// 30分刻みの時間選択肢 (06:00〜22:00)
const TIME_OPTIONS: string[] = (() => {
  const options: string[] = []
  for (let h = 6; h <= 22; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) {
      options.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  return options
})()

type DurationPreset = 30 | 60 | 90 | 120 | 'other'

const DURATION_PRESETS: { value: DurationPreset; label: string }[] = [
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1時間30分' },
  { value: 120, label: '2時間' },
  { value: 'other', label: 'その他' },
]

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

function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

function getTodayString(): string {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// 所要時間選択UI（確定フロー・別日提案フロー共通）
type DurationPickerProps = {
  selectedPreset: DurationPreset | null
  customMinutes: string
  onPresetChange: (preset: DurationPreset) => void
  onCustomChange: (value: string) => void
}

function DurationPicker({
  selectedPreset,
  customMinutes,
  onPresetChange,
  onCustomChange,
}: DurationPickerProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPresetChange(value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              selectedPreset === value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {selectedPreset === 'other' && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={480}
            value={customMinutes}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="分数を入力"
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <span className="text-sm text-gray-600">分</span>
        </div>
      )}
    </div>
  )
}

export default function CandidateList({
  candidates,
  meetingId,
  isConfirmed: initialIsConfirmed,
  confirmedIndex,
  initialDurationMinutes,
  initialNote,
}: Props) {
  const router = useRouter()

  // --- 確定フロー状態 ---
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialIsConfirmed ? confirmedIndex : null
  )
  const [isConfirmed, setIsConfirmed] = useState<boolean>(initialIsConfirmed)
  const [durationPreset, setDurationPreset] = useState<DurationPreset | null>(null)
  const [durationCustom, setDurationCustom] = useState<string>('')
  const [confirmNote, setConfirmNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [confirmedDurationMinutes, setConfirmedDurationMinutes] = useState<number | null>(
    initialDurationMinutes ?? null
  )
  const [confirmedNote, setConfirmedNote] = useState<string>(initialNote ?? '')

  // --- 別日提案フロー状態 ---
  const [showAlternativeForm, setShowAlternativeForm] = useState<boolean>(false)
  const [altDate, setAltDate] = useState<string>('')
  const [altTime, setAltTime] = useState<string>('')
  const [altDurationPreset, setAltDurationPreset] = useState<DurationPreset | null>(null)
  const [altDurationCustom, setAltDurationCustom] = useState<string>('')
  const [altNote, setAltNote] = useState<string>('')
  const [isAltSubmitting, setIsAltSubmitting] = useState<boolean>(false)
  const [altErrorMessage, setAltErrorMessage] = useState<string>('')
  const [altSubmitted, setAltSubmitted] = useState<boolean>(false)

  // 確定済み表示
  if (isConfirmed && selectedIndex !== null && candidates[selectedIndex]) {
    const confirmedCandidate = candidates[selectedIndex]
    const displayDuration = confirmedDurationMinutes
      ? formatDurationMinutes(confirmedDurationMinutes)
      : null
    const displayNote = confirmedNote || null
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="mb-2 text-base font-semibold text-green-800">
          ミーティングが確定しました！
        </p>
        <p className="mb-1 text-sm text-green-700">
          {formatCandidate(confirmedCandidate)}
        </p>
        {displayDuration && (
          <p className="mb-1 text-sm text-green-700">所要時間: {displayDuration}</p>
        )}
        {displayNote && (
          <p className="text-sm text-green-700">備考: {displayNote}</p>
        )}
      </div>
    )
  }

  function resolveDurationMinutes(
    preset: DurationPreset | null,
    custom: string
  ): number | null {
    if (preset === null) return null
    if (preset === 'other') {
      const parsed = parseInt(custom, 10)
      return isNaN(parsed) || parsed <= 0 ? null : parsed
    }
    return preset
  }

  async function handleConfirm() {
    if (selectedIndex === null) {
      setErrorMessage('候補日を選択してください')
      return
    }
    if (durationPreset === null) {
      setErrorMessage('所要時間を選択してください')
      return
    }
    if (durationPreset === 'other') {
      const parsed = parseInt(durationCustom, 10)
      if (isNaN(parsed) || parsed <= 0) {
        setErrorMessage('所要時間（分）を正しく入力してください')
        return
      }
    }

    setErrorMessage('')
    setIsSubmitting(true)

    const durationMinutes = resolveDurationMinutes(durationPreset, durationCustom)

    try {
      const { error } = await getSupabase()
        .from('meetings')
        .update({
          confirmed_index: selectedIndex,
          confirmed_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
          note: confirmNote.trim() || null,
        })
        .eq('id', meetingId)

      if (error) {
        setErrorMessage('確定に失敗しました。もう一度お試しください。')
        return
      }

      setConfirmedDurationMinutes(durationMinutes)
      setConfirmedNote(confirmNote.trim())
      setIsConfirmed(true)
      router.refresh()
    } catch {
      setErrorMessage('確定に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAltSubmit() {
    if (!altDate) {
      setAltErrorMessage('日付を入力してください')
      return
    }
    if (!altTime) {
      setAltErrorMessage('時間を選択してください')
      return
    }
    if (altDurationPreset === null) {
      setAltErrorMessage('所要時間を選択してください')
      return
    }
    if (altDurationPreset === 'other') {
      const parsed = parseInt(altDurationCustom, 10)
      if (isNaN(parsed) || parsed <= 0) {
        setAltErrorMessage('所要時間（分）を正しく入力してください')
        return
      }
    }

    setAltErrorMessage('')
    setIsAltSubmitting(true)

    const altDurationMinutes = resolveDurationMinutes(altDurationPreset, altDurationCustom)

    try {
      const { error } = await getSupabase()
        .from('meetings')
        .update({
          alternative_candidates: [{ date: altDate, time: altTime }],
          replied_at: new Date().toISOString(),
          note: altNote.trim() || null,
          duration_minutes: altDurationMinutes,
        })
        .eq('id', meetingId)

      if (error) {
        setAltErrorMessage('送信に失敗しました。もう一度お試しください。')
        return
      }

      setAltSubmitted(true)
    } catch {
      setAltErrorMessage('送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsAltSubmitting(false)
    }
  }

  return (
    <div>
      {/* 候補日選択 */}
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

      {/* 所要時間選択 */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-gray-700">
          所要時間 <span className="text-red-500">*</span>
        </p>
        <DurationPicker
          selectedPreset={durationPreset}
          customMinutes={durationCustom}
          onPresetChange={(p) => {
            setDurationPreset(p)
            setErrorMessage('')
          }}
          onCustomChange={setDurationCustom}
        />
      </div>

      {/* 備考 */}
      <div className="mb-4">
        <label
          htmlFor="confirm-note"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          備考（任意）
        </label>
        <textarea
          id="confirm-note"
          rows={5}
          value={confirmNote}
          onChange={(e) => setConfirmNote(e.target.value)}
          placeholder="ご質問や確認事項があればご記入ください"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {errorMessage && (
        <p
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="mb-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? '確定中...' : '確定する'}
      </button>

      {/* 別日提案セクション */}
      {!altSubmitted && (
        <div className="mt-2">
          {!showAlternativeForm ? (
            <button
              type="button"
              onClick={() => setShowAlternativeForm(true)}
              className="w-full rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              別の日を提案する
            </button>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">
                別の日を提案する
              </h3>

              {/* 日付 */}
              <div className="mb-4">
                <label
                  htmlFor="alt-date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  id="alt-date"
                  type="date"
                  min={getTodayString()}
                  value={altDate}
                  onChange={(e) => {
                    setAltDate(e.target.value)
                    setAltErrorMessage('')
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* 時間 */}
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  時間 <span className="text-red-500">*</span>
                </p>
                <select
                  value={altTime}
                  onChange={(e) => {
                    setAltTime(e.target.value)
                    setAltErrorMessage('')
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">時間を選択</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 所要時間 */}
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  所要時間 <span className="text-red-500">*</span>
                </p>
                <DurationPicker
                  selectedPreset={altDurationPreset}
                  customMinutes={altDurationCustom}
                  onPresetChange={(p) => {
                    setAltDurationPreset(p)
                    setAltErrorMessage('')
                  }}
                  onCustomChange={setAltDurationCustom}
                />
              </div>

              {/* 備考 */}
              <div className="mb-4">
                <label
                  htmlFor="alt-note"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  備考（任意）
                </label>
                <textarea
                  id="alt-note"
                  rows={5}
                  value={altNote}
                  onChange={(e) => setAltNote(e.target.value)}
                  placeholder="提案理由などがあればご記入ください"
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {altErrorMessage && (
                <p
                  className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  role="alert"
                >
                  {altErrorMessage}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAltSubmit}
                  disabled={isAltSubmitting}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAltSubmitting ? '送信中...' : '返信する'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAlternativeForm(false)
                    setAltErrorMessage('')
                  }}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {altSubmitted && (
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-base font-semibold text-blue-800">
            提案を送りました
          </p>
          <p className="mt-1 text-sm text-blue-700">
            別日の提案が送信されました。相手の返答をお待ちください。
          </p>
        </div>
      )}
    </div>
  )
}
