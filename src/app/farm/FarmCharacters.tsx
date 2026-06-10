'use client'

import { FarmContact } from '@/types/farm'

// 農園エリアのサイズ（農園内に均等配置するための基準値）
const FARM_WIDTH = 100  // percent
const FARM_HEIGHT = 100 // percent

// キャラクターの固定配置位置を決定するシードベースのオフセット計算
function getCharacterPosition(index: number, total: number): { left: number; bottom: number } {
  // キャラが農園エリア全体に広がるよう、インデックスから位置を決定
  const cols = Math.ceil(Math.sqrt(total))
  const rows = Math.ceil(total / cols)

  const col = index % cols
  const row = Math.floor(index / cols)

  // 農園エリア内でグリッド配置（端から余白を確保）
  const marginX = 10
  const marginY = 10
  const usableWidth = FARM_WIDTH - marginX * 2
  const usableHeight = FARM_HEIGHT - marginY * 2

  const left = cols > 1
    ? marginX + (col / (cols - 1)) * usableWidth
    : 50

  // bottomは下から配置（bottomは低いほど手前）
  const bottom = rows > 1
    ? marginY + (row / (rows - 1)) * usableHeight
    : 20

  return { left, bottom }
}

type Props = {
  contacts: FarmContact[]
}

export default function FarmCharacters({ contacts }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4 text-center shadow-md">
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            まだ誰もいません。先生を追加しましょう！
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {contacts.map((contact, index) => {
        const { left, bottom } = getCharacterPosition(index, contacts.length)
        return (
          <div
            key={contact.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${left}%`,
              bottom: `${bottom}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <img
              src={`/images/processed_${contact.character_number}.png`}
              alt={contact.contact_name}
              width={64}
              height={64}
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
            />
            <span className="mt-1 rounded-full bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm whitespace-nowrap">
              {contact.contact_name}
            </span>
          </div>
        )
      })}
    </>
  )
}
