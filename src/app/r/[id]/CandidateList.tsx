'use client'

import { useState } from 'react'
import type { Candidate } from '@/types/meeting'

type Props = {
  candidates: Candidate[]
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

export default function CandidateList({ candidates }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
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
              onChange={() => setSelectedIndex(index)}
              className="h-5 w-5 flex-shrink-0 accent-blue-600"
            />
            <span className="text-base text-gray-800">
              {formatCandidate(candidate)}
            </span>
          </label>
        )
      })}
    </div>
  )
}
