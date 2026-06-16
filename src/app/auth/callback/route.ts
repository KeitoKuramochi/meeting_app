import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.headers.get('origin') ??
    new URL(request.url).origin

  // OAuth プロバイダーが認可拒否などのエラーを返した場合
  if (errorParam) {
    const msg = errorDescription ?? errorParam
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(msg)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/farm`)
    }
    // セッション交換失敗
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent('ログインに失敗しました。もう一度お試しください。')}`
    )
  }

  // コードがない場合はトップページへ
  return NextResponse.redirect(`${origin}/`)
}
