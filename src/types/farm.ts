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
