import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import { QAPair } from '@/types/meeting'

const CLAUDE_MODEL = 'claude-haiku-4-5'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'

function buildTranscriptPrompt(rawText: string): string {
  return `以下はミーティングの文字起こしです。次回のミーティング前にすぐ見返せるように、話した内容・決まったこと・次のアクションを中心に簡潔に要約してください。\n\n---\n${rawText}`
}

function buildQaPrompt(memo: string, qa: QAPair[]): string {
  const qaText = qa
    .filter(pair => pair.answer.trim())
    .map(pair => `Q: ${pair.question}\nA: ${pair.answer.trim()}`)
    .join('\n\n')
  const memoText = memo.trim() ? `【メモ】\n${memo.trim()}\n\n` : ''
  return `以下はミーティング後のメモと、内容を振り返るための質問への回答です。次回のミーティング前にすぐ見返せるように、話した内容・決まったこと・次のアクションを中心に簡潔な要約にまとめてください。\n\n${memoText}${qaText}`
}

// メイン: Gemini（無料枠があるため、通常の要約生成はこちらを優先する）
async function summarizeWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY が設定されていません')
  }
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  })
  if (!response.text) {
    throw new Error('Geminiからの要約生成に失敗しました')
  }
  return response.text
}

// フォールバック: Claude Haiku（Geminiが使えない・失敗した場合のみ使用）
async function summarizeWithClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません')
  }
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text' || !block.text) {
    throw new Error('Claudeからの要約生成に失敗しました')
  }
  return block.text
}

async function generateSummary(prompt: string): Promise<string> {
  try {
    return await summarizeWithGemini(prompt)
  } catch (geminiError) {
    console.error('[summarize] Geminiでの要約生成に失敗、Claudeにフォールバックします:', geminiError)
    try {
      return await summarizeWithClaude(prompt)
    } catch (claudeError) {
      console.error('[summarize] Claudeでの要約生成にも失敗しました:', claudeError)
      throw new Error('要約の生成に失敗しました（Gemini・Claudeともにエラー）')
    }
  }
}

export async function summarizeTranscript(rawText: string): Promise<string> {
  return generateSummary(buildTranscriptPrompt(rawText))
}

export async function summarizeFromQA(memo: string, qa: QAPair[]): Promise<string> {
  return generateSummary(buildQaPrompt(memo, qa))
}
