// 候補日時の1件
export type Candidate = {
  date: string // "YYYY-MM-DD"
  time: string // "HH:MM"
}

// 要約の提出方法
export type SummarySource = 'pasted' | 'transcript' | 'memo_qa'

// メモ+質問パターンの質問・回答1件
export type QAPair = {
  question: string
  answer: string
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
  // 要約提出機能 追加カラム
  summary_text: string | null
  summary_source: SummarySource | null
  summary_raw_input: string | null
  summary_qa: QAPair[] | null
  summary_submitted_at: string | null
}

// フォーム送信用（idとcreated_at以外）
// Phase 3 / 要約提出 カラムは省略可能（nullable は undefined 扱い）
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
  | 'summary_text'
  | 'summary_source'
  | 'summary_raw_input'
  | 'summary_qa'
  | 'summary_submitted_at'
> & {
  duration_minutes?: number | null
  note?: string | null
  alternative_candidates?: Candidate[] | null
  replied_at?: string | null
  manually_confirmed?: boolean
  summary_text?: string | null
  summary_source?: SummarySource | null
  summary_raw_input?: string | null
  summary_qa?: QAPair[] | null
  summary_submitted_at?: string | null
}
