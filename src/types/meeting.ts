// 候補日時の1件
export type Candidate = {
  date: string // "YYYY-MM-DD"
  time: string // "HH:MM"
}

// meetingsテーブルの行
export type Meeting = {
  id: string
  student_name: string
  purpose: string
  candidates: Candidate[]
  confirmed_index: number | null
  confirmed_at: string | null
  created_at: string
}

// フォーム送信用（idとcreated_at以外）
export type MeetingInsert = Omit<Meeting, 'id' | 'created_at' | 'confirmed_index' | 'confirmed_at'>
