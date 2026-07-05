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
  initialAlternativeCandidates?: Candidate[] | null
  initialRepliedAt?: string | null
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
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={
              selectedPreset === value
                ? { border: '2px solid #d4a030', background: '#fef3c7', color: '#92400e' }
                : { border: '1.5px solid #c8953a', background: '#fffdf7', color: '#6b4c0a' }
            }
          >
            {label}
          </button>
        ))}
      </div>
      {selectedPreset === 'other' && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={480}
              value={customMinutes}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="例：45"
              className="w-24 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
            />
            <span className="text-sm" style={{ color: '#6b4c0a' }}>分</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#8b6914' }}>1〜480分（最大8時間）</p>
        </div>
      )}
    </div>
  )
}

function createEmptyAltCandidate(): Candidate {
  return { date: '', time: '' }
}

export default function CandidateList({
  candidates,
  meetingId,
  isConfirmed: initialIsConfirmed,
  confirmedIndex,
  initialDurationMinutes,
  initialNote,
  initialAlternativeCandidates,
  initialRepliedAt,
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
  const [altCandidates, setAltCandidates] = useState<Candidate[]>([createEmptyAltCandidate()])
  const [altDurationPreset, setAltDurationPreset] = useState<DurationPreset | null>(null)
  const [altDurationCustom, setAltDurationCustom] = useState<string>('')
  const [altNote, setAltNote] = useState<string>('')
  const [isAltSubmitting, setIsAltSubmitting] = useState<boolean>(false)
  const [altErrorMessage, setAltErrorMessage] = useState<string>('')
  const [altSubmitted, setAltSubmitted] = useState<boolean>(
    Boolean(initialRepliedAt) && !initialIsConfirmed
  )
  const [sentAltCandidates, setSentAltCandidates] = useState<Candidate[]>(
    initialAlternativeCandidates ?? []
  )

  function addAltCandidate() {
    if (altCandidates.length < 5) {
      setAltCandidates((prev) => [...prev, createEmptyAltCandidate()])
    }
  }

  function removeAltCandidate(index: number) {
    if (altCandidates.length > 1) {
      setAltCandidates((prev) => prev.filter((_, i) => i !== index))
    }
  }

  function updateAltDate(index: number, date: string) {
    setAltCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, date } : c)))
    setAltErrorMessage('')
  }

  function updateAltTime(index: number, time: string) {
    setAltCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, time } : c)))
    setAltErrorMessage('')
  }

  // 確定済み表示
  if (isConfirmed && selectedIndex !== null && candidates[selectedIndex]) {
    const confirmedCandidate = candidates[selectedIndex]
    const displayDuration = confirmedDurationMinutes
      ? formatDurationMinutes(confirmedDurationMinutes)
      : null
    const displayNote = confirmedNote || null
    return (
      <div className="rounded-xl p-5" style={{ border: '1.5px solid #6ee7b7', background: '#d1fae5' }}>
        <p className="mb-2 text-base font-semibold" style={{ color: '#065f46' }}>
          ミーティングが確定しました！
        </p>
        <p className="mb-1 text-sm" style={{ color: '#047857' }}>
          {formatCandidate(confirmedCandidate)}
        </p>
        {displayDuration && (
          <p className="mb-1 text-sm" style={{ color: '#047857' }}>所要時間: {displayDuration}</p>
        )}
        {displayNote && (
          <p className="text-sm" style={{ color: '#047857' }}>備考: {displayNote}</p>
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
      const now = new Date().toISOString()
      const trimmedNote = confirmNote.trim() || null

      const { error } = await getSupabase()
        .from('meetings')
        .update({
          confirmed_index: selectedIndex,
          confirmed_at: now,
          duration_minutes: durationMinutes,
          note: trimmedNote,
        })
        .eq('id', meetingId)

      if (error) {
        const { error: fallbackError } = await getSupabase()
          .from('meetings')
          .update({
            confirmed_index: selectedIndex,
            confirmed_at: now,
          })
          .eq('id', meetingId)

        if (fallbackError) {
          setErrorMessage('確定に失敗しました。もう一度お試しください。')
          return
        }
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
    const filledAlt = altCandidates.filter((c) => c.date.trim() !== '' && c.time.trim() !== '')
    if (filledAlt.length === 0) {
      setAltErrorMessage('別日の候補を少なくとも1件入力してください')
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
          alternative_candidates: filledAlt,
          replied_at: new Date().toISOString(),
          note: altNote.trim() || null,
          duration_minutes: altDurationMinutes,
        })
        .eq('id', meetingId)

      if (error) {
        const { error: fallbackError } = await getSupabase()
          .from('meetings')
          .update({
            replied_at: new Date().toISOString(),
          })
          .eq('id', meetingId)

        if (fallbackError) {
          setAltErrorMessage('送信に失敗しました。もう一度お試しください。')
          return
        }
      }

      setSentAltCandidates(filledAlt)
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
              className="flex cursor-pointer items-center gap-3 rounded-lg p-4 transition-colors"
              style={
                isSelected
                  ? { border: '2px solid #d4a030', background: '#fef7e4' }
                  : { border: '1.5px solid #c8953a', background: '#fffdf7' }
              }
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
                className="h-5 w-5 flex-shrink-0"
                style={{ accentColor: '#2a5c1e' }}
              />
              <span className="text-base" style={{ color: '#2c1a0e' }}>
                {formatCandidate(candidate)}
              </span>
            </label>
          )
        })}
      </div>

      {/* 所要時間選択 */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium" style={{ color: '#3d2b0e' }}>
          所要時間 <span style={{ color: '#b91c1c' }}>*</span>
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
          className="mb-1 block text-sm font-medium"
          style={{ color: '#3d2b0e' }}
        >
          備考（任意）
        </label>
        <textarea
          id="confirm-note"
          rows={3}
          value={confirmNote}
          onChange={(e) => setConfirmNote(e.target.value)}
          placeholder="ご質問や確認事項があればご記入ください"
          className="w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
        />
      </div>

      {errorMessage && (
        <p
          className="mb-3 rounded-lg px-4 py-3 text-sm"
          style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c' }}
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      {showAlternativeForm && (
        <p className="mb-3 text-sm text-center" style={{ color: '#8b6914' }}>
          別日提案フォームを閉じてから確定できます
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting || showAlternativeForm}
        className="farm-btn mb-4 flex h-12 w-full items-center justify-center text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="w-full rounded-xl py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              style={{ border: '2px solid #c8953a', color: '#4a8c5c', background: '#fef7e4' }}
            >
              別の日を提案する
            </button>
          ) : (
            <div className="farm-card p-5">
              <h3 className="mb-4 text-sm font-semibold" style={{ color: '#2c1a0e' }}>
                別の日を提案する
              </h3>

              {/* 別日候補（複数対応） */}
              <div className="mb-4 space-y-3">
                {altCandidates.map((altC, altIdx) => (
                  <div
                    key={altIdx}
                    className="rounded-lg p-3 space-y-2"
                    style={{ border: '1.5px solid #d4a853', background: '#fef7e4' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: '#3d2b0e' }}>候補 {altIdx + 1}</span>
                      {altCandidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAltCandidate(altIdx)}
                          className="text-xs rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                          style={{ color: '#b91c1c' }}
                        >
                          削除
                        </button>
                      )}
                    </div>

                    {/* 日付 */}
                    <input
                      type="date"
                      min={getTodayString()}
                      value={altC.date}
                      onChange={(e) => updateAltDate(altIdx, e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
                    />

                    {/* 時間 */}
                    <select
                      value={altC.time}
                      onChange={(e) => updateAltTime(altIdx, e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
                    >
                      <option value="">時間を選択</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {altCandidates.length < 5 && (
                <button
                  type="button"
                  onClick={addAltCandidate}
                  className="mb-4 flex h-9 w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                  style={{ borderColor: '#c8953a', color: '#4a8c5c' }}
                >
                  ＋ 候補日を追加
                </button>
              )}

              {/* 所要時間 */}
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium" style={{ color: '#3d2b0e' }}>
                  所要時間 <span style={{ color: '#b91c1c' }}>*</span>
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
                  className="mb-1 block text-sm font-medium"
                  style={{ color: '#3d2b0e' }}
                >
                  備考（任意）
                </label>
                <textarea
                  id="alt-note"
                  rows={3}
                  value={altNote}
                  onChange={(e) => setAltNote(e.target.value)}
                  placeholder="提案理由などがあればご記入ください"
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
                />
              </div>

              {altErrorMessage && (
                <p
                  className="mb-3 rounded-lg px-4 py-3 text-sm"
                  style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c' }}
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
                  className="farm-btn flex h-11 flex-1 items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAltSubmitting ? '送信中...' : '返信する'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAlternativeForm(false)
                    setAltErrorMessage('')
                  }}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-medium focus:outline-none transition-colors"
                  style={{ border: '1.5px solid #d4a853', color: '#6b4c0a', background: '#fffdf7' }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {altSubmitted && (
        <div className="mt-2 rounded-xl p-5" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <p className="text-base font-semibold" style={{ color: '#1e40af' }}>
            提案を送りました
          </p>
          <p className="mt-1 text-sm" style={{ color: '#1d4ed8' }}>
            別日の提案が送信されました。相手の返答をお待ちください。
          </p>
          {sentAltCandidates.length > 0 && (
            <ul className="mt-3 space-y-1">
              {sentAltCandidates.map((c, i) => (
                <li key={i} className="text-sm" style={{ color: '#1e40af' }}>
                  ・{formatCandidate(c)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
