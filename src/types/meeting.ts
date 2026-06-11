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
  // Phase 3 追加カラム
  duration_minutes: number | null
  note: string | null
  alternative_candidates: Candidate[] | null
  replied_at: string | null
  manually_confirmed: boolean
}

// フォーム送信用（idとcreated_at以外）
// Phase 3 カラムは省略可能（nullable は undefined 扱い）
export type MeetingInsert = Omit<
  Meeting,
  | 'id'
  | 'created_at'
  | 'confirmed_index'
  | 'confirmed_at'
  | 'duration_minutes'
  | 'note'
  | 'alternative_candidates'
  | 'replied_at'
  | 'manually_confirmed'
> & {
  duration_minutes?: number | null
  note?: string | null
  alternative_candidates?: Candidate[] | null
  replied_at?: string | null
  manually_confirmed?: boolean
}
