// farmsテーブルの行
export type Farm = {
  id: string
  user_id: string
  created_at: string
}

// farm_contactsテーブルの行
export type FarmContact = {
  id: string
  farm_id: string
  contact_name: string
  character_number: number
  created_at: string
}

// FarmCharacters に渡す、確定回数・確定待ち件数を含む拡張型
export type FarmContactWithCount = FarmContact & {
  confirmedCount: number
  pendingCount: number
}
