# SPRINT_CONTRACT.md

各TASKの完了条件と、Evaluatorの確認手順を定義します。
1つでも満たさなければ不合格です。

---

## 全TASK共通の最低基準

- `npm run build` がエラーなく通ること
- TypeScript型エラーが0件
- `any` を使っていないこと
- 変更ファイルがTASKのスコープ内であること
- `git commit` が1件あること
- `docs/STATUS.md` と `docs/MVP_TASKS.md` が更新されていること

---

## TASK-001: Next.js プロジェクト初期セットアップ

**何を作るか**: Next.js 14 + TypeScript + Tailwind CSS の初期プロジェクト

**Evaluatorの確認手順**:
1. `npm run build` を実行 → エラーなし
2. `npm run dev` を実行 → ポート3000が起動
3. Playwright で `http://localhost:3000` にアクセス → ページが表示される
4. Tailwind CSSが効いているか確認（スタイルが当たっている）
5. `git log --oneline -1` で commit が1件あること

---

## TASK-002: Supabase クライアント設定 + 型定義 + DBマイグレーション

**何を作るか**: Supabaseクライアント・型定義・マイグレーションSQL

**Evaluatorの確認手順**:
1. `src/lib/supabase.ts` が存在すること
2. `src/types/meeting.ts` に `Meeting` 型が定義されていること
3. `supabase/migrations/001_create_meetings.sql` が存在すること
4. SQLに必要なカラムがすべて含まれていること
5. `grep -r "any" src/` で `any` が使われていないこと
6. `npm run build` が通ること

---

## TASK-003: 学生フォームページ UI

**何を作るか**: `/` のフォームUI（送信機能なし）

**Evaluatorの確認手順**:
1. Playwright で `http://localhost:3000` にアクセス → フォームが表示される
2. 「お名前」「相談内容」の入力欄が存在する
3. 候補日時の入力欄が存在する
4. 「候補日を追加」ボタンをクリック → 入力欄が増える
5. 削除ボタンをクリック → 入力欄が減る
6. 空のまま送信ボタンを押す → エラーメッセージが表示される
7. viewport を 375px に変更 → レイアウトが崩れない・横スクロールなし
8. コンソールエラーが0件

---

## TASK-004: フォーム送信 + Supabase保存 + 完了画面

**何を作るか**: フォーム送信ロジック・Supabase保存・URLコピー画面

> ⚠️ 事前条件: `.env.local` にSupabase環境変数が設定されていること
> 設定されていない場合はこのTASKを開始しないこと

**Evaluatorの確認手順**:
1. フォームを正しく入力して送信 → ローディング表示になる
2. 送信完了後 → 完了画面に切り替わる
3. 完了画面に `/r/[uuid形式のID]` のURLが表示される
4. 「URLをコピー」ボタンをクリック → 「コピーしました」が表示される
5. Supabaseダッシュボードで `meetings` テーブルにレコードが追加されていること
6. コンソールエラーが0件

---

## TASK-005: 教員側確認ページ（表示のみ）

**何を作るか**: `/r/[id]` の表示ページ

**Evaluatorの確認手順**:
1. TASK-004で作成したURLにPlaywrightでアクセス → 学生名が表示される
2. 相談内容が表示される
3. 候補日時が一覧で表示される
4. ラジオボタンで選択できる
5. `/r/存在しないID` にアクセス → エラーメッセージが表示される
6. viewport を 375px に変更 → 崩れない
7. コンソールエラーが0件

---

## TASK-006: 教員の確定操作 + 確定済み表示

**何を作るか**: 確定ボタン・Supabase更新・確定済み表示

**Evaluatorの確認手順**:
1. `/r/[id]` でラジオボタンを選択して「確定する」をクリック → ローディング表示
2. 確定後 → 確定済み表示に切り替わる
3. 確定済み表示に確定日時・学生名・相談内容が表示される
4. 確定済みURLを再度開く → 確定済み表示（確定ボタンが存在しない）
5. ラジオ未選択で「確定する」 → エラーメッセージが表示される
6. Supabaseの `confirmed_index` と `confirmed_at` が更新されていること
7. コンソールエラーが0件

---

## TASK-007: UI全体の仕上げ + レスポンシブ確認

**何を作るか**: 全ページの見た目・レスポンシブ対応の最終調整

**Evaluatorの確認手順**:
1. 全ページをPlaywrightで巡回 → コンソールエラーが0件
2. 各ページをviewport 375px で確認 → 崩れなし・横スクロールなし
3. ボタンの高さが44px以上であること
4. 文字サイズが14px以上であること
5. 余白・色が整っていて読みやすいこと

---

---

## Phase 2: ファームゲーム拡張（認証あり版）

---

## TASK-008: 認証クライアント設定（@supabase/ssr）+ middleware

**何を作るか**: `@supabase/ssr` を使った Server/Browser クライアント関数 + `/farm` を守るミドルウェア

**Evaluatorの確認手順**:
1. `package.json` に `@supabase/ssr` が含まれていること
2. `src/lib/supabase-server.ts` が存在すること（`createServerClient` 使用）
3. `src/lib/supabase-browser.ts` が存在すること（`createBrowserClient` 使用）
4. `src/middleware.ts` が存在すること
5. 未ログインの状態で Playwright から `http://localhost:3000/farm` にアクセス → `/` へリダイレクトされること（URLが `/` になること）
6. 既存の `src/lib/supabase.ts` が変更されていないこと（`git diff` で確認）
7. `npm run build` がエラーなく通ること
8. コンソールエラーが0件

---

## TASK-009: DBマイグレーション（farms / farm_contacts + meetings 変更）

**何を作るか**: `farms` / `farm_contacts` テーブル作成 + `meetings` への `farm_contact_id` 追加 + RLS のマイグレーション SQL

**Evaluatorの確認手順**:
1. `supabase/migrations/002_create_farms.sql` が存在すること
2. SQL ファイルを開いて `CREATE TABLE farms` 文が含まれていること（id, user_id UNIQUE, created_at）
3. SQL ファイルに `CREATE TABLE farm_contacts` 文が含まれていること（id, farm_id FK, contact_name, character_number, created_at）
4. SQL ファイルに `ALTER TABLE meetings ADD COLUMN farm_contact_id` 文が含まれていること
5. SQL ファイルに farms・farm_contacts 両テーブルの `ENABLE ROW LEVEL SECURITY` と SELECT / INSERT / DELETE ポリシーが含まれていること
6. `src/types/farm.ts` が存在し `Farm` / `FarmContact` 型が定義されていること（`any` 未使用）
7. `npm run build` がエラーなく通ること
8. コンソールエラーが0件

---

## TASK-010: ログイン前トップページ + OAuth ログイン + コールバック処理

**何を作るか**: ログインボタン付きトップページ + `/auth/callback` ルート

**Evaluatorの確認手順**:
1. Playwright で `http://localhost:3000` にアクセス → アプリの説明文と「Googleでログイン」「Discordでログイン」ボタンが表示される
2. いずれかのボタンをクリック → OAuth プロバイダーの認証画面へのリダイレクトが始まる（URL が変わる）
3. `src/app/auth/callback/route.ts` が存在すること
4. ログイン済み状態でミドルウェアが `/` へのアクセスを `/farm` へリダイレクトすること（コードを読んで確認）
5. viewport を 375px に変更 → ボタンが崩れない・タップ可能な高さ（44px以上）
6. `npm run build` がエラーなく通ること
7. コンソールエラーが0件

---

## TASK-011: 農園ページ（/farm）— キャラ静止表示 + ログアウト

**何を作るか**: ログインユーザーの `farm_contacts` を表示する農園ページ + ログアウト機能

**Evaluatorの確認手順**:
1. ログイン済み状態で Playwright から `http://localhost:3000/farm` にアクセス → `nouen.png` が背景として表示されること
2. `farm_contacts` が0件のとき「まだ誰もいません」的なメッセージが表示されること
3. `farm_contacts` が1件以上のとき `processed_{n}.png` のキャラ画像が農園上に表示されること
4. 「先生を追加」ボタンが表示されており、クリックすると `/farm/add` へ遷移すること
5. ログアウトボタンをクリックするとセッションが削除されて `/` へリダイレクトされること（URLが `/` になること）
6. データ取得中にローディング表示が出ること（実装を目視確認）
7. `npm run build` がエラーなく通ること
8. コンソールエラーが0件

---

## TASK-012: 相手追加画面（/farm/add）— キャラ選択 + 名前入力

**何を作るか**: 先生の名前入力 + キャラ選択 → `farm_contacts` に保存する画面

**Evaluatorの確認手順**:
1. Playwright で `http://localhost:3000/farm/add` にアクセス → キャラ選択UIと名前入力欄が表示される
2. キャラ一覧（サムネイル）が複数表示されていること（少なくとも10体以上が視認できること）
3. キャラをクリックすると選択状態が分かるようにハイライトされること
4. 名前が空のまま登録ボタンを押す → エラーメッセージが表示される
5. キャラを選ばずに登録ボタンを押す → エラーメッセージが表示される
6. 正しく入力・選択して登録ボタンを押す → Supabase の `farm_contacts` にレコードが保存され `/farm` へリダイレクトされる（Supabase ダッシュボードで確認可能）
7. viewport を 375px に変更 → キャラ選択UIが崩れない
8. `npm run build` がエラーなく通ること
9. コンソールエラーが0件

---

## TASK-013: ミーティングリクエストフォーム（/request/[farm_contact_id]）

**何を作るか**: 相手指定のミーティングリクエストフォーム → `meetings` に `farm_contact_id` 付きで保存

**Evaluatorの確認手順**:
1. Playwright で `/request/[存在するfarm_contact_id]` にアクセス → 相手の名前（先生名）が表示される
2. 「お名前」「相談内容」入力欄が存在する
3. 候補日時の入力欄が存在する（「候補日を追加」で増やせる）
4. 名前または相談内容が空のまま送信 → エラーメッセージが表示される
5. 候補日が0件のまま送信 → エラーメッセージが表示される
6. 正しく入力して送信 → Supabase の `meetings` テーブルに `farm_contact_id` 付きでレコードが保存される（Supabase ダッシュボードで確認）
7. 送信完了後に `/r/[id]` 形式のURLが表示され「URLをコピー」できる
8. `/request/[存在しないfarm_contact_id]` にアクセスするとエラーメッセージが表示される
9. viewport を 375px に変更 → フォームが崩れない
10. `npm run build` がエラーなく通ること
11. コンソールエラーが0件

---

## TASK-014: ランダムウォーク + 成長スケール + 特殊エフェクト + キャラタップ遷移

**何を作るか**: 農園キャラへのアニメーション・スケール・エフェクト・タップ遷移の追加

**Evaluatorの確認手順**:
1. Playwright で `/farm` を開いてキャラクターが動いていること（3秒以上待機して確認）
2. 複数キャラがいる場合、全員が同一の動きをしていないこと（初期位置または速度が異なる）
3. キャラクターが農園背景の表示領域外にはみ出していないこと
4. 10秒以上待機してもアニメーションが止まらないこと（ループ確認）
5. 各キャラの頭上に吹き出し（a1.png）が表示され、先生名と確定回数のテキストが読めること
6. 確定回数 0 のキャラが目視で明らかに小さく表示され、ZZZ（a5.png）が表示されていること
7. 確定回数 6 以上のキャラに LEVEL UP（a7.png）が表示されていること
8. 最多確定のキャラに王冠（a4.png）が表示されていること
9. 王冠・LEVEL UP・ZZZ が同一キャラに重複して表示されていないこと
10. キャラをクリック → `/request/[farm_contact_id]` へ遷移すること（URLが変わること）
11. viewport を 375px に変更 → レイアウトが崩れない
12. `npm run build` がエラーなく通ること
13. コンソールエラーが0件

---

## 不合格時のフロー

```
Evaluator → 不合格の判定
  ↓
修正プロンプトを作成（問題・再現手順・修正方法）
  ↓
Generator → 修正を実施 → npm run build → commit
  ↓
Evaluator → 再評価
```
