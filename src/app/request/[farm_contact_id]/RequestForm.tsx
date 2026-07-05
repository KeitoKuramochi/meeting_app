'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Candidate } from '@/types/meeting'
import { getSupabase } from '@/lib/supabase'

type Props = {
  farmContactId: string
  contactName: string
  confirmedCount: number
}

type FormErrors = {
  studentName?: string
  purpose?: string
  candidates?: string
  submit?: string
}

const MAX_CANDIDATES = 5
const MIN_DATE = new Date().toISOString().split('T')[0]

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

function createEmptyCandidate(): Candidate {
  return { date: '', time: '' }
}

export default function RequestForm({ farmContactId, contactName, confirmedCount }: Props) {
  const router = useRouter()
  const [studentName, setStudentName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([createEmptyCandidate()])
  // 各候補の「詳細な時刻を入力」モード
  const [preciseModes, setPreciseModes] = useState<boolean[]>([false])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedInfo, setSubmittedInfo] = useState<{ meetingId: string; url: string } | null>(null)
  const [sendChoice, setSendChoice] = useState<'now' | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  function addCandidate() {
    if (candidates.length < MAX_CANDIDATES) {
      setCandidates((prev) => [...prev, createEmptyCandidate()])
      setPreciseModes((prev) => [...prev, false])
    }
  }

  function removeCandidate(index: number) {
    setCandidates((prev) => prev.filter((_, i) => i !== index))
    setPreciseModes((prev) => prev.filter((_, i) => i !== index))
  }

  function updateDate(index: number, date: string) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, date } : c)))
  }

  function updateTime(index: number, time: string) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, time } : c)))
  }

  function togglePreciseMode(index: number) {
    setPreciseModes((prev) => prev.map((v, i) => (i === index ? !v : v)))
    // 精密モードに切り替えるとき time をクリア
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, time: '' } : c)))
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    let valid = true

    if (studentName.trim() === '') {
      newErrors.studentName = 'お名前を入力してください'
      valid = false
    }

    if (purpose.trim() === '') {
      newErrors.purpose = '相談内容を入力してください'
      valid = false
    }

    const filledCandidates = candidates.filter(
      (c) => c.date.trim() !== '' && c.time.trim() !== ''
    )
    if (filledCandidates.length === 0) {
      newErrors.candidates = '候補日時を少なくとも1件入力してください'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    if (!validate()) return

    const filledCandidates = candidates.filter(
      (c) => c.date.trim() !== '' && c.time.trim() !== ''
    )

    setIsSubmitting(true)
    try {
      const { data, error } = await getSupabase()
        .from('meetings')
        .insert({
          student_name: studentName.trim(),
          purpose: purpose.trim(),
          candidates: filledCandidates,
          farm_contact_id: farmContactId,
        })
        .select('id')
        .single<{ id: string }>()

      if (error || !data) {
        setErrors({ submit: '送信に失敗しました。もう一度お試しください。' })
        return
      }

      const url = `${window.location.origin}/r/${data.id}`
      setSubmittedInfo({ meetingId: data.id, url })
    } catch {
      setErrors({ submit: '予期しないエラーが発生しました。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopy() {
    if (!submittedInfo) return
    try {
      await navigator.clipboard.writeText(submittedInfo.url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // クリップボードAPIが使えない場合は無視
    }
  }

  function handleSendNow() {
    setSendChoice('now')
    handleCopy()
  }

  function handleSendLater() {
    if (!submittedInfo) return
    const draft = {
      meetingId: submittedInfo.meetingId,
      url: submittedInfo.url,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`phase3_draft_${farmContactId}`, JSON.stringify(draft))
    router.push('/farm')
  }

  // 「今送る」を選んだ後: コピー完了フィードバック → 農園に戻る誘導
  if (submittedInfo && sendChoice === 'now') {
    return (
      <div className="farm-card p-6 space-y-4">
        <div className="text-center">
          <div className="mb-2 text-5xl" role="img" aria-label="完了">🎉</div>
          <h2 className="font-farm-title text-lg" style={{ color: '#2c1a0e' }}>
            URLをコピーしました！
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#8b6914' }}>
            {contactName}さんにURLを送りましょう
          </p>
        </div>

        <div className="rounded-xl px-4 py-3" style={{ border: '1.5px solid #d4a853', background: '#fef7e4' }}>
          <p className="break-all text-sm font-mono" style={{ color: '#2c1a0e' }}>
            {submittedInfo.url}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="farm-btn flex h-12 w-full items-center justify-center text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {isCopied ? 'コピーしました！' : 'もう一度コピー'}
        </button>

        <Link
          href="/farm"
          className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
          style={{ border: '2px solid #c8953a', color: '#4a8c5c', background: '#fef7e4' }}
        >
          農園に戻る
        </Link>
      </div>
    )
  }

  // 未選択状態: 「今送りますか？後で送りますか？」の確認画面
  if (submittedInfo) {
    const nextCount = confirmedCount + 1

    return (
      <div className="farm-card p-6 space-y-4">
        <div className="text-center">
          <div className="mb-2 text-5xl" role="img" aria-label="完了">✅</div>
          <h2 className="font-farm-title text-lg" style={{ color: '#2c1a0e' }}>
            種をまきました！
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#8b6914' }}>
            {confirmedCount === 0
              ? `${contactName}さんへ、はじめての種まきです`
              : `${contactName}さんとは今まで${confirmedCount}回確定済み。今回が${nextCount}回目の種まきです`}
          </p>
        </div>

        <div className="rounded-xl px-4 py-3" style={{ border: '1.5px solid #d4a853', background: '#fef7e4' }}>
          <p className="mb-1 text-xs font-semibold" style={{ color: '#8b6914' }}>種まき用URL</p>
          <p className="break-all text-sm font-mono" style={{ color: '#2c1a0e' }}>
            {submittedInfo.url}
          </p>
        </div>

        <p className="text-sm font-semibold text-center" style={{ color: '#3d2b0e' }}>
          今すぐ{contactName}さんに種を送りますか？
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSendNow}
            className="farm-btn flex h-12 w-full items-center justify-center text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            今まく（URLをコピー）
          </button>

          <button
            type="button"
            onClick={handleSendLater}
            className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
            style={{ border: '2px solid #c8953a', color: '#4a8c5c', background: '#fef7e4' }}
          >
            あとでまく（農園に戻る）
          </button>
        </div>
      </div>
    )
  }

  // フォーム画面
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="farm-card p-6"
    >
      {/* お名前 */}
      <div className="mb-5">
        <label
          htmlFor="student-name"
          className="block text-sm font-semibold mb-1"
          style={{ color: '#3d2b0e' }}
        >
          あなたのお名前
        </label>
        <p className="text-xs mb-2" style={{ color: '#8b6914' }}>
          相手に表示される、あなた自身の名前です
        </p>
        <input
          id="student-name"
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="例：山田 太郎（あなた自身の名前）"
          className="w-full h-12 rounded-xl px-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
          autoComplete="name"
        />
        {errors.studentName && (
          <p role="alert" className="mt-1 text-sm" style={{ color: '#b91c1c' }}>
            {errors.studentName}
          </p>
        )}
      </div>

      {/* 相談内容 */}
      <div className="mb-5">
        <label
          htmlFor="purpose"
          className="block text-sm font-semibold mb-1"
          style={{ color: '#3d2b0e' }}
        >
          相談内容
        </label>
        <textarea
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="例：卒業研究の進め方について相談したいです"
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
        />
        {errors.purpose && (
          <p role="alert" className="mt-1 text-sm" style={{ color: '#b91c1c' }}>
            {errors.purpose}
          </p>
        )}
      </div>

      {/* 候補日時 */}
      <div className="mb-5">
        <p className="text-sm font-semibold mb-2" style={{ color: '#3d2b0e' }}>
          候補日時（最大{MAX_CANDIDATES}件）
        </p>

        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <div
              key={index}
              className="rounded-xl p-3"
              style={{ border: '1.5px solid #d4a853', background: '#fef7e4' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="shrink-0 text-xs font-medium w-5 text-center" style={{ color: '#8b6914' }}>
                  {index + 1}
                </span>
                <span className="text-xs font-medium" style={{ color: '#3d2b0e' }}>候補 {index + 1}</span>
                {candidates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    aria-label={`候補日${index + 1}を削除`}
                    className="ml-auto h-8 w-8 flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                    style={{ color: '#b91c1c' }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* 日付 */}
              <div className="mb-2">
                <input
                  type="date"
                  min={MIN_DATE}
                  value={candidate.date}
                  onChange={(e) => updateDate(index, e.target.value)}
                  aria-label={`候補日${index + 1}の日付`}
                  className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
                />
              </div>

              {/* 時間: 30分刻みセレクト or 精密入力 */}
              <div>
                {!preciseModes[index] ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={candidate.time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      aria-label={`候補日${index + 1}の時間`}
                      className="flex-1 h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: candidate.time ? '#2c1a0e' : '#8b6914' }}
                    >
                      <option value="">時間を選択（30分刻み）</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => togglePreciseMode(index)}
                      className="shrink-0 text-xs px-2 py-1 rounded-lg focus:outline-none transition-colors"
                      style={{ border: '1px solid #c8953a', color: '#6b4c0a', background: '#fffdf7', whiteSpace: 'nowrap' }}
                    >
                      詳細
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={candidate.time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      aria-label={`候補日${index + 1}の時間（詳細）`}
                      className="flex-1 h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePreciseMode(index)}
                      className="shrink-0 text-xs px-2 py-1 rounded-lg focus:outline-none transition-colors"
                      style={{ border: '1px solid #c8953a', color: '#6b4c0a', background: '#fffdf7', whiteSpace: 'nowrap' }}
                    >
                      30分刻み
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.candidates && (
          <p role="alert" className="mt-2 text-sm" style={{ color: '#b91c1c' }}>
            {errors.candidates}
          </p>
        )}

        {candidates.length < MAX_CANDIDATES && (
          <button
            type="button"
            onClick={addCandidate}
            className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
            style={{ borderColor: '#c8953a', color: '#4a8c5c' }}
          >
            <span aria-hidden="true">＋</span> 候補日を追加
          </button>
        )}
      </div>

      {/* 送信エラー */}
      {errors.submit && (
        <p role="alert" className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c' }}>
          {errors.submit}
        </p>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="farm-btn flex h-12 w-full items-center justify-center text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'まいています...' : '🌱 種をまく'}
      </button>
    </form>
  )
}
