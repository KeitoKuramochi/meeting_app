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

**ステータス**: `[x]`

**説明**:
全ページのUIを仕上げる。余白・色・文字サイズを整え、スマホ幅での表示を確認・修正する。
コンソールエラーをゼロにする。

**完了条件**:
- [x] 全ページでコンソールエラーが0件
- [x] 全ページでスマホ幅（375px）のレイアウトが崩れない
- [x] 横スクロールが発生しない
- [x] 文字サイズが14px以上
- [x] ボタンのタップ領域が44px以上
- [x] `npm run build` が通る
- [x] `git commit` が1件作成されている

**実装メモ**: layout.tsx のメタデータ（title・description）を設定し lang を "ja" に変更。page.tsx の h1 テキストを「ミーティングをリクエストする」に修正。CandidateList.tsx のエラーメッセージに role="alert" を追加。全ボタン h-11/h-12（44px以上）・文字サイズ text-sm/text-base（14px/16px）・全ページ px-4 py-8 のパディングを確認済み。
**commit hash**: 2f33c62

---

## Phase 2: ファームゲーム拡張（認証あり版）

---

### TASK-008: 認証クライアント設定（@supabase/ssr）+ middleware

**ステータス**: `[x]`

**説明**:
`@supabase/ssr` パッケージをインストールし、Next.js App Router 対応の Supabase クライアント関数を作成する。
合わせて Next.js middleware を作成し、`/farm` 以下へのアクセスで未ログイン時は `/` へリダイレクトするセッションチェックを実装する。

> ⚠️ `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` は `.env.local` 設定済みを前提とする。

**完了条件**:
- [x] `@supabase/ssr` パッケージが `package.json` に追加されている
- [x] `src/lib/supabase-server.ts` が作成されており `createServerClient` を使った関数が定義されている
- [x] `src/lib/supabase-browser.ts` が作成されており `createBrowserClient` を使った関数が定義されている
- [x] `src/middleware.ts` が作成されており `/farm` へのアクセス時に未ログインの場合 `/` へリダイレクトする
- [x] ログイン済みの状態で `/farm` にアクセスするとリダイレクトされない
- [x] 既存の `src/lib/supabase.ts` は変更されていない
- [x] `npm run build` がエラーなく通る
- [x] `git commit` が1件作成されている

**実装メモ**: @supabase/ssr ^0.12.0 をインストール。supabase-server.ts は async function + cookies() の getAll/setAll パターン。supabase-browser.ts は createBrowserClient でシンプルに実装。middleware.ts は updateSession パターンで getUser() を呼びセッションをリフレッシュ、/farm 以下への未ログインアクセスを / へリダイレクト。Next.js 16 では middleware.ts は非推奨（proxy.ts が新規約）だが SPRINT_CONTRACT の要件に合わせ middleware.ts を採用（build 警告のみでエラーなし）。
**commit hash**: 1fa2468

---

### TASK-009: DBマイグレーション（farms / farm_contacts + meetings 変更）

**ステータス**: `[x]`

**説明**:
以下のSQLマイグレーションファイルを作成する（Supabase ダッシュボードで人間が実行する）。

- `farms` テーブル（id, user_id, created_at）
- `farm_contacts` テーブル（id, farm_id, contact_name, character_number, created_at）
- `meetings` テーブルへ `farm_contact_id` カラムを追加
- 全テーブルの RLS ポリシー（`auth.uid()` ベース）

> ⚠️ マイグレーション SQL の実行は人間が Supabase ダッシュボードで行う。Generator は SQL ファイルを作成するだけ。

**完了条件**:
- [x] `supabase/migrations/002_create_farms.sql` が作成されている
- [x] SQL に `farms` テーブルの CREATE 文が含まれている（id, user_id UNIQUE, created_at）
- [x] SQL に `farm_contacts` テーブルの CREATE 文が含まれている（id, farm_id FK, contact_name, character_number, created_at）
- [x] SQL に `meetings` テーブルへの `farm_contact_id` カラム追加の ALTER TABLE 文が含まれている
- [x] SQL に `farms`・`farm_contacts` それぞれの RLS ENABLE と SELECT / INSERT / DELETE ポリシーが含まれている
- [x] `src/types/farm.ts` に `Farm` / `FarmContact` 型が定義されている（`any` を使わない）
- [x] `npm run build` がエラーなく通る
- [x] `git commit` が1件作成されている

**実装メモ**: SQL ファイルのみ作成（Supabase での実行は人間が行う）。farm_contacts の RLS では subquery で自分の farms.id に属することを確認。any 未使用。
**commit hash**: 6784176

---

### TASK-010: ログイン前トップページ + OAuth ログイン + コールバック処理

**ステータス**: `[x]`

**説明**:
`/` をログイン前トップページとして作り直す。
Google / Discord の OAuth ログインボタンを設置し、クリックで Supabase OAuth フローを開始する。
`/auth/callback` ルートを作成し、OAuth コールバックを受けてセッションを確立したあと `/farm` へリダイレクトする。

**完了条件**:
- [x] `http://localhost:3000` を開くとアプリの説明と「Googleでログイン」「Discordでログイン」ボタンが表示される
- [x] ログインボタンをクリックすると OAuth プロバイダーの認証画面へリダイレクトされる（URLが変わる）
- [x] `src/app/auth/callback/route.ts` が作成されている
- [x] OAuth 認証完了後に `/farm` へリダイレクトされる
- [x] ログイン済みのユーザーが `/` にアクセスしたとき `/farm` へリダイレクトされる（ミドルウェア対応）
- [x] スマホ幅（375px）でレイアウトが崩れない
- [x] `npm run build` がエラーなく通る
- [x] `git commit` が1件作成されている

**実装メモ**: page.tsx を農園テーマのログイン前トップページに書き換え。OAuthLoginButtons.tsx（'use client'）で signInWithOAuth を実装。auth/callback/route.ts で exchangeCodeForSession → /farm リダイレクト。middleware.ts にログイン済みの / → /farm リダイレクトを追加。
**commit hash**: 8eef1cb

---

### TASK-011: 農園ページ（/farm）— キャラ静止表示 + ログアウト

**ステータス**: `[x]`

**説明**:
`/farm` ページを作成する。ログインユーザーの `farm_contacts` を Supabase から取得し、`nouen.png` を背景としてキャラクター画像（processed_{n}.png）を静止表示する。
ログアウトボタンも設置する。`/farm/add` への遷移ボタン（「先生を追加」）も設置する。

**完了条件**:
- [x] `/farm` にアクセスすると `nouen.png` が背景として表示される
- [x] ログインユーザーの `farm_contacts` が0件のとき「まだ誰もいません。先生を追加してみましょう」のようなメッセージが表示される
- [x] `farm_contacts` が1件以上のとき `processed_{character_number}.png` が農園上に表示される
- [x] 「先生を追加」ボタンが表示されており、クリックすると `/farm/add` へ遷移する
- [x] ログアウトボタンが表示されており、クリックするとセッションが削除されて `/` へリダイレクトされる
- [x] データ取得中にローディング表示が出る
- [x] `npm run build` がエラーなく通る
- [x] `git commit` が1件作成されている

**commit hash**: 0168079

---

### TASK-012: 相手追加画面（/farm/add）— キャラ選択 + 名前入力

**ステータス**: `[x]`

**説明**:
`/farm/add` ページを作成する。先生の名前を入力し、1〜100 のキャラクターを選んで登録する。
登録内容は Supabase の `farm_contacts` テーブルに保存され、登録後に `/farm` へリダイレクトする。

**完了条件**:
- [x] `/farm/add` にアクセスするとキャラ選択 UI と名前入力欄が表示される
- [x] キャラは `processed_1.png` 〜 `processed_100.png` から選べる（サムネイル一覧またはスクロールで選択）
- [x] キャラを選択すると選択中のキャラが分かるようにハイライトされる
- [x] 名前が空のまま登録ボタンを押すとエラーメッセージが表示される
- [x] キャラを選ばずに登録ボタンを押すとエラーメッセージが表示される
- [x] 正しく入力して登録ボタンを押すと Supabase の `farm_contacts` にレコードが保存される
- [x] 登録後に `/farm` へリダイレクトされる
- [x] スマホ幅（375px）でキャラ選択 UI が崩れない
- [x] `npm run build` がエラーなく通る
- [x] `git commit` が1件作成されている

**commit hash**: 0c33034

---

### TASK-013: ミーティングリクエストフォーム（/request/[farm_contact_id]）

**ステータス**: `[~]`

**説明**:
`/request/[farm_contact_id]` ページを作成する。
`farm_contacts` テーブルから相手の名前を取得して表示し、候補日時（3〜5件）を入力して送信すると `meetings` テーブルに `farm_contact_id` 付きで保存される。
送信完了後に固有URL（`/r/[id]`）を表示する。

**完了条件**:
- [ ] `/request/[存在するfarm_contact_id]` にアクセスすると相手の名前（先生名）が表示される
- [ ] 「お名前」「相談内容」入力欄がある
- [ ] 候補日時の入力欄がある（最低1件〜最大5件）
- [ ] 名前・相談内容が空の状態で送信するとエラーメッセージが表示される
- [ ] 候補日が0件の状態で送信するとエラーメッセージが表示される
- [ ] 正しく入力して送信すると Supabase の `meetings` に `farm_contact_id` 付きでレコードが保存される
- [ ] 送信完了後に `/r/[id]` 形式のURLが表示され、「URLをコピー」できる
- [ ] `/request/[存在しないfarm_contact_id]` にアクセスするとエラーメッセージが表示される
- [ ] スマホ幅（375px）でレイアウトが崩れない
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-014: ランダムウォーク + 成長エフェクト + 特殊エフェクト + キャラタップ遷移

**ステータス**: `[ ]`

**説明**:
農園ページ（`/farm`）のキャラクターに以下の演出を追加する。

#### 成長・エフェクト定義（1回ごとに少しずつ大きくなる）
| 確定回数 | サイズ | 常時エフェクト | イベントエフェクト |
|---|---|---|---|
| 0回 | scale 0.60 | ZZZ（a5.png）常時 | — |
| 1回 | scale 0.72 | 王冠（1人でも無条件） | LEVEL UP（a7.png）大きく表示 |
| 2回 | scale 0.84 | 王冠は最多に移動 | LEVEL UP（a7.png）大きく表示 |
| 3回 | scale 0.96 | キラキラ（a2.png）点滅 | LEVEL UP（a7.png）大きく表示 |
| 4回 | scale 1.08 | キラキラ＋ハート（a3.png）交互 | LEVEL UP（a7.png）大きく表示 |
| 5回以上 | scale 1.20 | キラキラ＋ハート継続 | LEVEL UP（a7.png）大きく表示 |

#### その他エフェクト
- **吹き出し（a1.png）**: ランダムタイミングで出現・消える。ミーティングを促すセリフをランダム表示（例:「そろそろ話しましょ？」「最近どう？」「相談したいことある？」）
- **王冠（a4.png）**: 農園内で確定回数が最多のキャラに常時表示。1人だけでも無条件につく
- **びっくり（a6.png）**: 先生が日程を確定した直後にポップ表示（イベントエフェクト）
- **LEVEL UP（a7.png）**: 確定されるたびに毎回大きくわかりやすく表示（数秒間）

**完了条件**:
- [ ] `/farm` を開くとキャラクターが農園内を動き続けている（CSS animation ループ）
- [ ] 各キャラの動きが互いに異なる（同じ動きにならない）
- [ ] キャラクターが農園の表示領域外にはみ出さない
- [ ] 確定回数 0 のキャラが scale 0.7 で ZZZ（a5.png）が表示される
- [ ] 確定回数 1〜2 のキャラが scale 1.0 で表示される
- [ ] 確定回数 3 のキャラにキラキラ（a2.png）が点滅表示される
- [ ] 確定回数 4 以上のキャラにキラキラ＋ハート（a3.png）が交互表示される
- [ ] 農園内で確定回数最多のキャラに王冠（a4.png）が表示される（1人でも表示）
- [ ] 吹き出し（a1.png）がランダムタイミングでキャラ頭上に出て消える
- [ ] 吹き出しの中にミーティングを促すランダムなセリフが表示される
- [ ] LEVEL UP（a7.png）が確定のたびに大きく表示される
- [ ] キャラをタップすると `/request/[farm_contact_id]` へ遷移する
- [ ] スマホ幅（375px）・PC幅（1280px）どちらでもレイアウトが崩れない
- [ ] ダークモード（`prefers-color-scheme: dark`）でUI全体が正しく表示される
- [ ] ボタンのタップ領域が44px以上
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている
