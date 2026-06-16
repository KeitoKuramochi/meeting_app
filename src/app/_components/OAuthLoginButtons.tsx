'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function OAuthLoginButtons() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'discord' | null>(null)

  async function handleLogin(provider: 'google' | 'discord') {
    if (loadingProvider !== null) return
    setLoadingProvider(provider)
    try {
      const supabase = createSupabaseBrowserClient()
      const origin = window.location.origin
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${origin}/auth/callback` },
      })
    } catch {
      // signInWithOAuth は通常ブラウザリダイレクトするため、ここに到達するのはエラー時のみ
      setLoadingProvider(null)
    }
  }

  const isLoading = loadingProvider !== null

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        type="button"
        onClick={() => handleLogin('google')}
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white text-base font-semibold text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'google' ? (
          <Spinner color="#4285F4" />
        ) : (
          <GoogleIcon />
        )}
        {loadingProvider === 'google' ? 'ログイン中...' : 'Google でログイン'}
      </button>

      <button
        type="button"
        onClick={() => handleLogin('discord')}
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'discord' ? (
          <Spinner color="white" />
        ) : (
          <DiscordIcon />
        )}
        {loadingProvider === 'discord' ? 'ログイン中...' : 'Discord でログイン'}
      </button>
    </div>
  )
}

function Spinner({ color }: { color: string }) {
  return (
    <svg
      className="animate-spin h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4" />
      <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        fill="#FFC107"
      />
      <path
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        fill="#FF3D00"
      />
      <path
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        fill="#4CAF50"
      />
      <path
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        fill="#1976D2"
      />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 71 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M60.105 4.898A58.55 58.55 0 0045.653.165a.22.22 0 00-.233.11 40.784 40.784 0 00-1.8 3.697c-5.456-.817-10.886-.817-16.232 0-.485-1.164-1.201-2.587-1.815-3.697a.228.228 0 00-.233-.11 58.386 58.386 0 00-14.451 4.733.207.207 0 00-.095.082C1.578 18.73-.944 32.144.293 45.39a.244.244 0 00.093.167c6.073 4.463 11.955 7.17 17.729 8.962a.23.23 0 00.249-.082 42.08 42.08 0 003.627-5.9.225.225 0 00-.123-.312 38.772 38.772 0 01-5.539-2.64.228.228 0 01-.022-.378 31.17 31.17 0 001.1-.862.22.22 0 01.23-.031c11.62 5.307 24.198 5.307 35.68 0a.219.219 0 01.232.028c.354.295.728.586 1.103.865a.228.228 0 01-.02.378 36.384 36.384 0 01-5.54 2.637.227.227 0 00-.121.315 47.249 47.249 0 003.624 5.897.225.225 0 00.249.084c5.801-1.794 11.684-4.502 17.757-8.961a.228.228 0 00.092-.164c1.48-15.315-2.48-28.618-10.497-40.412a.18.18 0 00-.093-.084zM23.725 37.332c-3.497 0-6.38-3.211-6.38-7.156 0-3.944 2.827-7.156 6.38-7.156 3.583 0 6.438 3.24 6.382 7.156 0 3.945-2.827 7.156-6.382 7.156zm23.593 0c-3.498 0-6.381-3.211-6.381-7.156 0-3.944 2.826-7.156 6.381-7.156 3.582 0 6.437 3.24 6.381 7.156 0 3.945-2.826 7.156-6.381 7.156z"
        fill="white"
      />
    </svg>
  )
}
