# PHASE2_PLAN.md — Phase 2: ファームゲーム拡張（認証あり版）製品仕様書

作成日: 2026-06-10（確定要件で全面書き直し）

---

## アプリの目的（Phase 2 追加分）

ミーティング調整アプリに「農園ゲーム」要素と認証を追加する。
ログインした学生が「自分だけの農園」を持ち、ミーティングしたい相手（先生など）をキャラクターとして登録する。
キャラをタップすることでその相手へのミーティングリクエストを送れ、ミーティング確定回数に応じてキャラが成長する。

---

## 対象ユーザー

- 学生（相談者）: ログインして自分の農園を持つ。ミーティングしたい先生のキャラを登録し、タップしてリクエストを送る
- 教員: Phase 1 と同様に固有URLを開いて1クリックで確定する（変更なし）

---

## Phase 2 の概念モデル

- **農園 = ログインユーザーの個人ページ**
- **farm_contacts（農園に登録した相手）= キャラクターとして農園に表示される**
- **キャラをタップ → その相手へのミーティングリクエストフォームへ遷移**
- **ミーティング確定回数が増えるとキャラが成長・エフェクトがつく**
- **農園は本人（ログインユーザー）のみアクセス可能**

---

## 認証方式

- Google OAuth + Discord OAuth（Supabase Auth 経由）
- 認証設定は Supabase ダッシュボードで完了済み
- `@supabase/ssr` パッケージを使用（Next.js App Router 対応）
- コールバック処理: `/auth/callback` ルート

---

## 新規テーブル（Supabase に追加）

### `farms` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID (PK, default gen_random_uuid()) | 農園ID |
| user_id | UUID (NOT NULL, UNIQUE) | auth.users の uid |
| created_at | TIMESTAMPTZ (default now()) | 作成日時 |

RLS: `auth.uid() = user_id` のみ SELECT / INSERT 可能

### `farm_contacts` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID (PK, default gen_random_uuid()) | コンタクトID |
| farm_id | UUID (FK → farms.id) | 所属する農園 |
| contact_name | TEXT (NOT NULL) | 相手の名前（先生名など） |
| character_number | INTEGER (NOT NULL) | 1〜100 のキャラ番号（ユーザーが選択） |
| created_at | TIMESTAMPTZ (default now()) | 作成日時 |

RLS: farms テーブルを JOIN して `auth.uid() = farms.user_id` のみ操作可能

### `meetings` テーブルへの追加
- `farm_contact_id` カラム（UUID, nullable, FK → farm_contacts.id）を追加
- 既存レコードは NULL のまま（Phase 1 データとの後方互換性を維持）

---

## 画面一覧

| 画面名 | URL | 説明 |
|---|---|---|
| ログイン前トップ | `/` | ログインボタン + アプリ説明 |
| OAuthコールバック | `/auth/callback` | OAuth コードを受け取りセッションを確立 |
| 自分の農園 | `/farm` | ログイン必須。登録した相手のキャラが歩き回る |
| 相手を追加 | `/farm/add` | 名前入力 + キャラ選択（1〜100から選ぶ） |
| ミーティングリクエストフォーム | `/request/[farm_contact_id]` | 候補日を入力して送信 |
| 教員側確認ページ | `/r/[id]` | 変更なし（Phase 1 のまま） |

---

## 機能一覧

| 機能 | 説明 | TASK |
|---|---|---|
| 認証クライアント設定 | `@supabase/ssr` を使った server/client 用 Supabase クライアントを作成 | TASK-008 |
| DBマイグレーション | farms / farm_contacts テーブル作成 + meetings に farm_contact_id 追加 | TASK-009 |
| ログイン前トップ + OAuth | `/` にログインボタン。`/auth/callback` でセッション確立 | TASK-010 |
| 農園ページ（キャラ表示） | `/farm` で farm_contacts を取得しキャラを背景上に静止表示 | TASK-011 |
| 相手追加画面 | `/farm/add` でキャラ選択 + 名前入力 → farm_contacts に保存 | TASK-012 |
| リクエストフォーム | `/request/[farm_contact_id]` で候補日入力 → meetings に保存 | TASK-013 |
| ランダムウォーク + 成長エフェクト | キャラがCSS animationで歩き回る + 確定回数に応じたスケール + 特殊エフェクト | TASK-014 |

---

## キャラクター・エフェクト仕様

### キャラ画像
- `/public/images/processed_1.png` 〜 `processed_100.png`（100体）
- キャラ番号は farm_contacts テーブルの `character_number` カラムに保存
- ユーザーが `/farm/add` 画面で選ぶ

### 農園背景
- `/public/images/nouen.png`

### エフェクト画像
| ファイル名 | 内容 | 表示条件 |
|---|---|---|
| `a1.png` | 吹き出し | ランダムタイミングでポコっと出て消える。中にミーティングを促すセリフ（「そろそろ話しましょ？」「最近どう？」など）をランダム表示 |
| `a2.png` | キラキラ | 確定回数 3回以上のキャラに点滅表示。4回以上はハートと交互 |
| `a3.png` | ハート | 確定回数 4回以上のキャラにキラキラと交互表示 |
| `a4.png` | 王冠 | 農園内で確定回数が最多のキャラに常時表示（1人だけでも無条件につく） |
| `a5.png` | ZZZ | 確定回数 0 のキャラに常時表示 |
| `a6.png` | びっくり！ | 先生が日程を確定した瞬間にポップ表示（イベントエフェクト） |
| `a7.png` | LEVEL UP | 確定されるたびに毎回大きくわかりやすく表示（イベントエフェクト） |

### 成長・エフェクト定義
| 確定回数 | サイズ | 常時エフェクト | イベントエフェクト |
|---|---|---|---|
| 0回 | scale 0.60 | ZZZ常時 | — |
| 1回 | scale 0.72 | 王冠（1人でも無条件） | LEVEL UP モーション |
| 2回 | scale 0.84 | 王冠は最多に移動 | LEVEL UP モーション |
| 3回 | scale 0.96 | キラキラ点滅 | LEVEL UP モーション |
| 4回 | scale 1.08 | キラキラ＋ハート交互 | LEVEL UP モーション |
| 5回以上 | scale 1.20 | キラキラ＋ハート継続 | LEVEL UP モーション |

王冠は常に農園内で確定回数最多のキャラに1つだけ表示。1人しかいない場合も無条件に表示。

### レスポンシブ・ダークモード
- スマホ（375px〜）・タブレット・PC 全幅対応
- `prefers-color-scheme: dark` に対応（Tailwind の `dark:` クラスを使用）
- ダークモード時は農園背景・UI パネル・テキストすべて対応
- ボタンのタップ領域は44px以上（スマホ操作対応）

---

## MVP の範囲

**含めること（Phase 2 MVP）**:
- Google / Discord OAuth ログイン + ログアウト
- `/auth/callback` コールバック処理
- `/farm` 農園ページ（ログイン必須）
- `/farm/add` 相手追加画面
- `/request/[farm_contact_id]` ミーティングリクエストフォーム
- ランダムウォーク CSS アニメーション
- 吹き出し（名前・確定回数）
- 成長スケール
- 王冠・ZZZ・LEVEL UP エフェクト

**含めないこと**:
- キャラ詳細プロフィールページ
- リアルタイム更新（WebSocket等）
- 通知機能
- 確定時のその場エフェクト（キラキラ・ハートアニメーション）

---

## ユーザーフロー

```
学生がトップページ（/）にアクセス
  ↓
「Googleでログイン」または「Discordでログイン」をクリック
  ↓
/auth/callback でセッション確立 → /farm へリダイレクト
  ↓
/farm で農園を確認（初回は空）
  ↓
「先生を追加」ボタンで /farm/add へ
  ↓
先生の名前を入力 + キャラを選択 → 登録
  ↓
/farm に戻るとキャラが歩き回っている
  ↓
キャラをタップ → /request/[farm_contact_id] のフォームへ
  ↓
候補日を入力して送信 → 固有URL（/r/[id]）が生成される
  ↓
先生がURLを開いて1クリックで確定
  ↓
確定回数が増えるとキャラが成長・王冠がつく
```

---

## 技術制約（Generator への引き渡し事項）

- 認証クライアントは `@supabase/ssr` を使う（`createBrowserClient` / `createServerClient`）
- 既存の `src/lib/supabase.ts`（`getSupabase()` lazy getter）は変更しない
- 認証用クライアントは別ファイルに作成する
- Next.js App Router の middleware でセッションリフレッシュを行う
- `/farm` 以下はミドルウェアで認証チェック（未ログインは `/` へリダイレクト）
- アニメーションは CSS animation / keyframes のみ（追加ライブラリ禁止）
- `any` を使わない
- `npm run build` が通ること
- Phase 1 の `/r/[id]` ページは変更しない
