'use client'

import { useState, useRef } from 'react'
import type { Candidate, MeetingInsert } from '@/types/meeting'
import { getSupabase } from '@/lib/supabase'

type FormErrors = {
  name?: string
  purpose?: string
  candidates?: string
}

type CandidateWithId = Candidate & { id: number }

export default function Home() {
  const nextIdRef = useRef(1)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [candidates, setCandidates] = useState<CandidateWithId[]>([
    { id: nextIdRef.current++, date: '', time: '' },
  ])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function addCandidate() {
    if (candidates.length < 5) {
      setCandidates((prev) => [
        ...prev,
        { id: nextIdRef.current++, date: '', time: '' },
      ])
    }
  }

  function removeCandidate(id: number) {
    setCandidates((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCandidate(id: number, field: keyof Candidate, value: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  function validate(): FormErrors {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'お名前を入力してください'
    }
    if (!purpose.trim()) {
      newErrors.purpose = '相談内容を入力してください'
    }
    if (candidates.length === 0) {
      newErrors.candidates = '候補日時を1つ以上追加してください'
    } else {
      const hasInvalid = candidates.some((c) => !c.date || !c.time)
      if (hasInvalid) {
        newErrors.candidates = '候補日時を正しく入力してください'
      }
    }

    return newErrors
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const newErrors = validate()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)
    setSubmitError(null)

    const insertData: MeetingInsert = {
      student_name: name.trim(),
      purpose: purpose.trim(),
      candidates: candidates.map(({ date, time }) => ({ date, time })),
    }

    try {
      const { data, error } = await getSupabase()
        .from('meetings')
        .insert([insertData])
        .select()

      if (error || !data || data.length === 0) {
        setSubmitError(error?.message ?? '送信に失敗しました。もう一度お試しください。')
        return
      }

      const id = (data[0] as { id: string }).id
      const url = `${window.location.origin}/r/${id}`
      setSubmittedUrl(url)
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : '送信に失敗しました。もう一度お試しください。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopy() {
    if (!submittedUrl) return
    await navigator.clipboard.writeText(submittedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (submittedUrl) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-green-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="mb-2 text-xl font-bold text-gray-800">
              リクエストを送りました！
            </h1>
            <p className="mb-6 text-sm text-gray-600">
              このURLを先生に送ってください
            </p>

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left">
              <p className="break-all text-sm text-gray-700">{submittedUrl}</p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              {copied ? 'コピーしました ✓' : 'URLをコピー'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-bold text-gray-800">
          ミーティングをリクエストする
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* お名前 */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              お名前
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* 相談内容 */}
          <div>
            <label
              htmlFor="purpose"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              相談内容
              <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="相談したい内容を入力してください"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.purpose}
              </p>
            )}
          </div>

          {/* 候補日時 */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              候補日時
              <span className="ml-1 text-red-500">*</span>
            </p>

            <div className="space-y-3">
              {candidates.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="flex items-end gap-2 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`candidate-date-${candidate.id}`}
                      className="mb-1 block text-xs text-gray-600"
                    >
                      候補 {index + 1} — 日付
                    </label>
                    <input
                      id={`candidate-date-${candidate.id}`}
                      type="date"
                      value={candidate.date}
                      onChange={(e) =>
                        updateCandidate(candidate.id, 'date', e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`candidate-time-${candidate.id}`}
                      className="mb-1 block text-xs text-gray-600"
                    >
                      時間
                    </label>
                    <input
                      id={`candidate-time-${candidate.id}`}
                      type="time"
                      value={candidate.time}
                      onChange={(e) =>
                        updateCandidate(candidate.id, 'time', e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCandidate(candidate.id)}
                    aria-label={`候補 ${index + 1} を削除`}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {errors.candidates && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.candidates}
              </p>
            )}

            {candidates.length < 5 && (
              <button
                type="button"
                onClick={addCandidate}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-dashed border-blue-400 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                ＋ 候補日を追加
              </button>
            )}
          </div>

          {/* 送信エラー */}
          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '送信中...' : 'リクエストを送る'}
          </button>
        </form>
      </div>
    </div>
  )
}
