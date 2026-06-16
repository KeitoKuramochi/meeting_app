'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import FarmCharacters from './FarmCharacters'
import LogoutButton from './LogoutButton'
import type { FarmContactWithCount } from '@/types/farm'

type Props = {
  contacts: FarmContactWithCount[]
}

type ContactItemProps = {
  contact: FarmContactWithCount
  onClose: () => void
}

function ContactListItem({ contact, onClose }: ContactItemProps) {
  const hasReply = contact.repliedCount > 0
  const hasPending = contact.pendingCount > 0
  const borderColor = hasReply ? '#3b82f6' : hasPending ? '#d97706' : '#c8953a'

  return (
    <Link
      href={'/request/' + contact.id}
      onClick={onClose}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors active:opacity-70"
      style={{ background: '#fef7e4', border: '1.5px solid ' + borderColor, display: 'flex' }}
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
        <p className="text-xs mt-0.5" style={{ color: hasReply ? '#1d4ed8' : hasPending ? '#92400e' : '#6b4c0a' }}>
          {hasReply ? '📬 返信が届いています' : hasPending ? '⏳ 確定待ち' : '✅ ' + contact.confirmedCount + '回確定'}
        </p>
      </div>
      <span className="shrink-0 text-sm" style={{ color: '#8b6914' }}>›</span>
    </Link>
  )
}

export default function FarmClientShell({ contacts }: Props) {
  const [showList, setShowList] = useState(false)

  const totalConfirmed = contacts.reduce((sum, c) => sum + c.confirmedCount, 0)
  const alertCount = contacts.filter(c => c.repliedCount > 0).length

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
            src="/images/nouen.png"
            alt="農園"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            draggable={false}
          />

          <div className="absolute inset-0">
            <FarmCharacters contacts={contacts} />
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
                  <ContactListItem key={c.id} contact={c} onClose={() => setShowList(false)} />
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
