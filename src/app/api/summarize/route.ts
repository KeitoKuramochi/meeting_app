import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { summarizeTranscript, summarizeFromQA } from '@/lib/summarize'
import { QAPair } from '@/types/meeting'

type RequestBody =
  | { mode: 'transcript'; text: string }
  | { mode: 'memo_qa'; memo: string; qa: QAPair[] }

export async function POST(request: Request) {
  // ログイン済みのfarm所有者のみ呼び出せるようにする（未認証だとGemini APIのコストを第三者に消費されうる）
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const body = (await request.json()) as RequestBody

  try {
    const summary =
      body.mode === 'transcript'
        ? await summarizeTranscript(body.text)
        : await summarizeFromQA(body.memo, body.qa)

    return NextResponse.json({ summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : '要約の生成に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
