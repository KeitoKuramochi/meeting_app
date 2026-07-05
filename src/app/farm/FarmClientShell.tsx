'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import FarmCharacters from './FarmCharacters'
import LogoutButton from './LogoutButton'
import type { FarmContactWithCount } from '@/types/farm'
import { getSupabase } from '@/lib/supabase'

// Supabase から取得する meetings の部分型（ポーリング用）
type MeetingReplyRow = {
  farm_contact_id: string
  replied_at: string | null
  confirmed_index: number | null
  manually_confirmed: boolean | null
  summary_submitted_at: string | null
}

type Props = {
  contacts: FarmContactWithCount[]
}

type ContactItemProps = {
  contact: FarmContactWithCount
  repliedCount: number
  confirmedCount: number
  pendingCount: number
  hasDraft: boolean
  onOpen: (contactId: string) => void
}

function ContactListItem({ contact, repliedCount, confirmedCount, pendingCount, hasDraft, onOpen }: ContactItemProps) {
  const hasReply = repliedCount > 0
  const hasPending = pendingCount > 0
  const borderColor = hasReply ? '#3b82f6' : hasDraft ? '#d97706' : hasPending ? '#d97706' : '#c8953a'
  const statusColor = hasReply ? '#1d4ed8' : hasDraft ? '#9a3412' : hasPending ? '#92400e' : '#6b4c0a'
  const statusText = hasReply
    ? '📬 返信が届いています'
    : hasDraft
    ? '📋 未送信（URLをまだ送っていません）'
    : hasPending
    ? '⏳ 確定待ち'
    : '✅ ' + confirmedCount + '回確定'

  return (
    <button
      type="button"
      onClick={() => onOpen(contact.id)}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors active:opacity-70 w-full text-left"
      style={{ background: '#fef7e4', border: '1.5px solid ' + borderColor }}
    >
      <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 48, height: 48, background: 'rgba(0,0,0,0.06)' }}>
        <img
          src={'/images/processed_' + contact.character_number + '.png'}
          alt={contact.contact_name}
          width={48}
          height={48}
          className="w-full h-full object-contain pixel-char"
          draggable={false}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: '#2c1a0e' }}>{contact.contact_name}</p>
        <p className="text-xs mt-0.5" style={{ color: statusColor }}>
          {statusText}
        </p>
      </div>
      <span className="shrink-0 text-sm" style={{ color: '#8b6914' }}>›</span>
    </button>
  )
}

export default function FarmClientShell({ contacts }: Props) {
  const [showList, setShowList] = useState(false)
  const [openModalContactId, setOpenModalContactId] = useState<string | null>(null)
  const [draftContactIds, setDraftContactIds] = useState<Set<string>>(new Set())

  // localStorage のドラフト状態を読み込む
  useEffect(() => {
    const ids = new Set<string>()
    for (const c of contacts) {
      if (localStorage.getItem(`phase3_draft_${c.id}`)) ids.add(c.id)
    }
    setDraftContactIds(ids)
  }, [contacts])

  // 確定・確定待ち・返信ありの件数はここでライブ管理する（「なかま一覧」ドロワーと
  // 農園内のキャラクター表示の両方が同じ最新データを参照するようにするため。
  // 以前はキャラクター側だけがポーリングしていて、一覧側はページ読み込み時の
  // 古いスナップショットのままになり、表示がずれるバグがあった）
  const initCounts = useCallback(() => {
    const replied: Record<string, number> = {}
    const confirmed: Record<string, number> = {}
    const pending: Record<string, number> = {}
    const summary: Record<string, number> = {}
    for (const c of contacts) {
      replied[c.id] = c.repliedCount
      confirmed[c.id] = c.confirmedCount
      pending[c.id] = c.pendingCount
      summary[c.id] = c.summaryCount
    }
    return { replied, confirmed, pending, summary }
  }, [contacts])

  const [liveRepliedCounts, setLiveRepliedCounts] = useState<Record<string, number>>(
    () => initCounts().replied
  )
  const [liveConfirmedCounts, setLiveConfirmedCounts] = useState<Record<string, number>>(
    () => initCounts().confirmed
  )
  const [livePendingCounts, setLivePendingCounts] = useState<Record<string, number>>(
    () => initCounts().pending
  )
  const [liveSummaryCounts, setLiveSummaryCounts] = useState<Record<string, number>>(
    () => initCounts().summary
  )

  // ポーリング用 fetchCounts を ref に保持（visibilitychange から呼べるようにする）
  const fetchCountsRef = useRef<() => Promise<void>>(async () => { /* init */ })

  useEffect(() => {
    if (contacts.length === 0) return

    const contactIds = contacts.map(c => c.id)

    const fetchCounts = async () => {
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('meetings')
          .select('farm_contact_id, replied_at, confirmed_index, manually_confirmed, summary_submitted_at')
          .in('farm_contact_id', contactIds)

        // エラー・null・空配列の場合はリセットせず現状維持
        if (error || !data || data.length === 0) return

        const repliedMap: Record<string, number> = {}
        const confirmedMap: Record<string, number> = {}
        const pendingMap: Record<string, number> = {}
        const summaryMap: Record<string, number> = {}
        for (const id of contactIds) {
          repliedMap[id] = 0
          confirmedMap[id] = 0
          pendingMap[id] = 0
          summaryMap[id] = 0
        }
        for (const row of data as MeetingReplyRow[]) {
          const cid = row.farm_contact_id
          if (!(cid in repliedMap)) continue
          const isConfirmedRow = row.confirmed_index !== null || row.manually_confirmed === true
          // 確定済み
          if (isConfirmedRow) {
            confirmedMap[cid] = (confirmedMap[cid] ?? 0) + 1
          } else {
            // 未確定 → 確定待ちカウント
            pendingMap[cid] = (pendingMap[cid] ?? 0) + 1
            // 未確定 かつ 返信あり
            if (row.replied_at !== null) {
              repliedMap[cid] = (repliedMap[cid] ?? 0) + 1
            }
          }
          // 要約提出済み（確定状態とは無関係にキャラクターの成長カウントとして数える）
          if (row.summary_submitted_at !== null) {
            summaryMap[cid] = (summaryMap[cid] ?? 0) + 1
          }
        }
        setLiveRepliedCounts(repliedMap)
        setLiveConfirmedCounts(confirmedMap)
        setLivePendingCounts(pendingMap)
        setLiveSummaryCounts(summaryMap)
      } catch {
        // ポーリングエラーは無視する
      }
    }

    fetchCountsRef.current = fetchCounts
    fetchCounts()
    const intervalId = setInterval(fetchCounts, 10000) // 10秒ごと

    return () => clearInterval(intervalId)
  }, [contacts])

  // タブに戻ったとき即時更新（成長を確実に反映する）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCountsRef.current()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // 手動確定後に各カウントをローカルで即時更新する
  const handleManualConfirmed = useCallback((contactId: string) => {
    setLiveRepliedCounts(prev => ({ ...prev, [contactId]: 0 }))
    setLiveConfirmedCounts(prev => ({ ...prev, [contactId]: (prev[contactId] ?? 0) + 1 }))
    setLivePendingCounts(prev => ({ ...prev, [contactId]: Math.max(0, (prev[contactId] ?? 0) - 1) }))
  }, [])

  // 要約提出後にキャラクターの成長カウントをローカルで即時更新する
  const handleSummarySubmitted = useCallback((contactId: string) => {
    setLiveSummaryCounts(prev => ({ ...prev, [contactId]: (prev[contactId] ?? 0) + 1 }))
  }, [])

  const totalConfirmed = contacts.reduce(
    (sum, c) => sum + (liveConfirmedCounts[c.id] ?? c.confirmedCount),
    0
  )
  const alertCount = contacts.filter(c => (liveRepliedCounts[c.id] ?? c.repliedCount) > 0).length

  function handleOpenModal(contactId: string) {
    setOpenModalContactId(contactId)
    setShowList(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5ede0' }}>
      {/* Wooden-sign header */}
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0 farm-header"
        style={{ position: 'sticky', top: 0, zIndex: 40 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🌾</span>
          <h1 className="text-base font-extrabold" style={{ color: '#f5e6a3', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            のうえんミーティング
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/farm/add"
            className="farm-btn-gold h-9 px-3 flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            ＋ 追加
          </Link>
          <button
            type="button"
            onClick={() => setShowList(true)}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            style={{ color: '#f5e6a3' }}
            aria-label={'なかま一覧' + (alertCount > 0 ? '（' + alertCount + '件の通知）' : '')}
          >
            ☰
            {alertCount > 0 && (
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full"
                style={{ background: '#ef4444' }}
                aria-hidden="true"
              />
            )}
          </button>
          <LogoutButton />
        </div>
      </header>

      {/* Main farm area */}
      <main className="flex-1 p-3 flex flex-col gap-2">
        {contacts.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: '#fef7e4', border: '1.5px solid #d4a853', color: '#6b4c0a' }}
          >
            <span>🐾 {contacts.length}人が農園にいます</span>
            <span>✅ 合計{totalConfirmed}回確定</span>
          </div>
        )}

        <div
          className="relative w-full rounded-2xl overflow-hidden flex-1"
          style={{
            minHeight: '62vh',
            border: '3px solid #7c5c3a',
            boxShadow: '0 4px 20px rgba(107,68,35,0.3)',
          }}
        >
          <Image
            src="/images/nouen.webp"
            alt="農園"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            draggable={false}
          />

          <div className="absolute inset-0">
            <FarmCharacters
              contacts={contacts}
              liveRepliedCounts={liveRepliedCounts}
              liveConfirmedCounts={liveConfirmedCounts}
              livePendingCounts={livePendingCounts}
              liveSummaryCounts={liveSummaryCounts}
              onManualConfirmed={handleManualConfirmed}
              onSummarySubmitted={handleSummarySubmitted}
              openModalContactId={openModalContactId}
              onModalOpened={() => setOpenModalContactId(null)}
              onDraftCleared={(id) => setDraftContactIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
              })}
            />
          </div>

          {contacts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="max-w-xs mx-4 p-6 rounded-2xl text-center"
                style={{ background: 'rgba(254,247,228,0.97)', border: '2px solid #d4a853' }}
              >
                <div className="text-5xl mb-3">🌱</div>
                <h2 className="text-base font-bold mb-2" style={{ color: '#2a5c1e' }}>
                  農園はまだからっぽです
                </h2>
                <p className="text-sm mb-4" style={{ color: '#6b4c0a' }}>
                  「＋ 追加」ボタンから相手を登録すると、キャラクターが農園に住みはじめます
                </p>
                <Link
                  href="/farm/add"
                  className="farm-btn inline-flex items-center gap-1.5 px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  ＋ 相手を追加する
                </Link>
                <Link
                  href="/guide"
                  className="mt-3 text-sm underline inline-block"
                  style={{ color: '#92400e' }}
                >
                  使い方を見る →
                </Link>
              </div>
            </div>
          )}
        </div>

        {contacts.length > 0 && (
          <p className="text-center text-xs" style={{ color: '#8b6914' }}>
            キャラをタップするとリクエスト一覧が開きます ✨
          </p>
        )}
      </main>

      {/* Slide-in list drawer */}
      {showList && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setShowList(false)}
          role="dialog"
          aria-modal="true"
          aria-label="なかま一覧"
        >
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div
            className="w-80 flex flex-col"
            style={{ background: '#f5ede0', height: '100dvh', overflowY: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0 farm-header"
            >
              <h2 className="text-base font-bold" style={{ color: '#f5e6a3' }}>🐾 なかま一覧</h2>
              <button
                type="button"
                onClick={() => setShowList(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-lg focus:outline-none"
                style={{ color: '#f5e6a3' }}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {contacts.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: '#8b6914' }}>
                  まだ誰もいません
                </div>
              ) : (
                contacts.map(c => (
                  <ContactListItem
                    key={c.id}
                    contact={c}
                    repliedCount={liveRepliedCounts[c.id] ?? c.repliedCount}
                    confirmedCount={liveConfirmedCounts[c.id] ?? c.confirmedCount}
                    pendingCount={livePendingCounts[c.id] ?? c.pendingCount}
                    hasDraft={draftContactIds.has(c.id)}
                    onOpen={handleOpenModal}
                  />
                ))
              )}
            </div>

            <div className="p-3 shrink-0" style={{ borderTop: '2px solid #d4a853' }}>
              <Link
                href="/farm/add"
                onClick={() => setShowList(false)}
                className="farm-btn flex h-11 w-full items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                ＋ 相手を追加する
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
