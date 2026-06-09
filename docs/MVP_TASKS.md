# MVP_TASKS.md

## ステータス凡例

| マーク | 意味 |
|---|---|
| `[ ]` | 未着手 |
| `[~]` | 実装中 |
| `[x]` | 完了（Evaluator合格）|
| `[!]` | 差し戻し（Evaluator不合格）|

---

## TASK一覧

---

### TASK-001: Next.js プロジェクト初期セットアップ

**ステータス**: `[x]`

**説明**:
Next.js 14（App Router）+ TypeScript + Tailwind CSS のプロジェクトを作成する。
`npm run build` と `npm run dev` が動く状態にする。

**完了条件**:
- [x] `npm run build` がエラーなく通る
- [x] `npm run dev` でポート3000が起動する
- [x] `http://localhost:3000` にアクセスするとページが表示される
- [x] TypeScriptエラーが0件
- [x] Tailwind CSSが適用されている（背景色やテキスト色が効いている）
- [x] `git commit` が1件作成されている

**実装メモ**: create-next-app@latest で初期化（Next.js 16.2.7 / Tailwind v4 / TypeScript 5）
**commit hash**: 16366ed

---

### TASK-002: Supabase クライアント設定 + 型定義 + DBマイグレーションファイル

**ステータス**: `[x]`

**説明**:
Supabaseクライアントの設定ファイルを作る。
`meetings` テーブルのTypeScript型定義を作る。
Supabaseで実行するSQLマイグレーションファイル（`supabase/migrations/001_create_meetings.sql`）を作る。
※ 環境変数（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）は `.env.local` に人間が設定する。GeneratorはSupabase接続の実装だけ行う。

**完了条件**:
- [x] `src/lib/supabase.ts` が作成されている
- [x] `src/types/meeting.ts` に `Meeting` 型が定義されている（`any` を使わない）
- [x] `supabase/migrations/001_create_meetings.sql` が作成されている
- [x] SQLに `id`（UUID）, `student_name`, `purpose`, `candidates`（JSONB）, `confirmed_index`（INTEGER nullable）, `confirmed_at`（TIMESTAMPTZ nullable）, `created_at` が含まれている
- [x] `npm run build` が通る
- [x] `git commit` が1件作成されている

**実装メモ**: @supabase/supabase-js をインストール。環境変数未設定時は空文字列にフォールバックしビルドエラーを回避。
**commit hash**: cffaa13

---

### TASK-003: 学生フォームページ UI（送信機能なし）

**ステータス**: `[x]`

**説明**:
`/`（トップページ）に学生がリクエストを作成するフォームを実装する。
この TASKではUIと入力・バリデーションのみ実装し、Supabaseへの送信は次のTASKで行う。

**完了条件**:
- [x] `http://localhost:3000` を開くとフォームが表示される
- [x] 「お名前」テキスト入力欄がある
- [x] 「相談内容」テキスト入力欄がある
- [x] 候補日時の入力欄がある（日付と時間のペア）
- [x] 「候補日を追加」ボタンで入力欄が増える（最大5個）
- [x] 候補日の削除ボタンで入力欄が減る（最低1個）
- [x] 名前・相談内容が空の状態で送信ボタンを押すとエラーメッセージが表示される
- [x] 候補日が0個の状態で送信ボタンを押すとエラーメッセージが表示される
- [x] スマホ幅（375px）でフォームが崩れない
- [x] `npm run build` が通る
- [x] `git commit` が1件作成されている

**実装メモ**: `'use client'` + useState でフォーム状態管理。Candidate型を使用。バリデーションは送信時に一括チェック。送信成功時は console.log のみ（Supabase送信は TASK-004 で実装）。
**commit hash**: 9e9945e

---

### TASK-004: フォーム送信 + Supabase保存 + 完了画面（URLコピー）

**ステータス**: `[x]`

**説明**:
フォームの送信ボタンを押したときにSupabaseに保存し、完了画面（URLコピー）を表示する。

> ⚠️ このTASKを実装する前に、人間が `.env.local` にSupabaseの環境変数を設定する必要がある。
> 設定されていない場合はSTATUS.mdのブロッカー欄に記入して停止すること。

**完了条件**:
- [x] 「リクエストを送る」ボタンを押すと送信中のローディング表示になる
- [x] Supabaseにデータが保存される（Supabaseダッシュボードで確認可能）
- [x] 送信成功後にフォームが消えて完了画面に切り替わる
- [x] 完了画面に `/r/[id]` 形式のURLが表示される
- [x] 「URLをコピー」ボタンを押すとクリップボードにコピーされる
- [x] コピー後に「コピーしました」のフィードバックが表示される
- [x] Supabase接続エラー時にユーザーに分かるエラーメッセージが表示される
- [x] `npm run build` が通る
- [x] `git commit` が1件作成されている

**実装メモ**: `getSupabase()` lazy getter を使いSSRプリレンダー時のクライアント初期化エラーを回避。`isSubmitting` / `submittedUrl` / `submitError` の3状態で送信フローを管理。完了画面は2秒フィードバック付きのURLコピーボタンを含む。
**commit hash**: dd8e13d

---

### TASK-005: 教員側確認ページ（データ取得 + 候補日表示）

**ステータス**: `[x]`

**説明**:
`/r/[id]` ページを作成する。URLのIDでSupabaseからデータを取得し、学生名・相談内容・候補日一覧を表示する。
このTASKでは確定操作は実装しない（表示のみ）。

**完了条件**:
- [x] `/r/[存在するID]` にアクセスすると学生名が表示される
- [x] 相談内容が表示される
- [x] 候補日時が一覧で表示される（ラジオボタンで選択可能）
- [x] `/r/[存在しないID]` にアクセスすると「リクエストが見つかりません」のエラーが表示される
- [x] スマホ幅（375px）でレイアウトが崩れない
- [x] `npm run build` が通る
- [x] `git commit` が1件作成されている

**実装メモ**: Server Component でデータ取得（`getSupabase()` 使用）。存在しないIDの場合はエラーUI＋トップページリンクを表示。候補日のラジオボタン選択は `CandidateList.tsx`（Client Component）に分離。確定ボタンはdisabledで表示のみ。
**commit hash**: 8d5cdc7

---

### TASK-006: 教員の確定操作 + 確定済み表示

**ステータス**: `[x]`

**説明**:
教員が候補日を選んで「確定する」ボタンを押すとSupabaseを更新し、確定済み表示に切り替わる。
確定済みのURLを再訪問した場合も確定済み表示になる。

**完了条件**:
- [x] ラジオボタンで候補日を選べる
- [x] 「確定する」ボタンを押すと確定中のローディング表示になる
- [x] Supabaseの `confirmed_index` と `confirmed_at` が更新される
- [x] 確定後にページが確定済み表示に切り替わる
- [x] 確定済み表示には確定した日時と学生名・相談内容が表示される
- [x] 確定済みのURLを再度開いても確定済み表示になる（ボタンが非表示）
- [x] 候補日未選択で「確定する」を押すとエラーメッセージが表示される
- [x] `npm run build` が通る
- [x] `git commit` が1件作成されている

**実装メモ**: CandidateList.tsx に `meetingId`・`isConfirmed`・`confirmedIndex` props を追加。確定操作は Supabase update → `setIsConfirmed(true)` + `router.refresh()` で管理。確定済み時はラジオボタン・確定ボタンを非表示にし確定日時を強調表示。page.tsx に「確定済み」バッジを追加し `confirmed_index !== null` で初期確定状態を判定。
**commit hash**: 062c519

---

### TASK-007: UI全体の仕上げ + レスポンシブ確認

**ステータス**: `[ ]`

**説明**:
全ページのUIを仕上げる。余白・色・文字サイズを整え、スマホ幅での表示を確認・修正する。
コンソールエラーをゼロにする。

**完了条件**:
- [ ] 全ページでコンソールエラーが0件
- [ ] 全ページでスマホ幅（375px）のレイアウトが崩れない
- [ ] 横スクロールが発生しない
- [ ] 文字サイズが14px以上
- [ ] ボタンのタップ領域が44px以上
- [ ] `npm run build` が通る
- [ ] `git commit` が1件作成されている

**実装メモ**: —
**commit hash**: —
