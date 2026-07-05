# CLAUDE.md — 自律開発環境 運用ルール

このプロジェクトは Planner / Generator / Evaluator の3エージェント構成で動く自律開発環境です。
人間は `idea.md` にアイデアを書くだけで、Claude Code が仕様作成・実装・評価・修正まで回します。

## プロジェクト情報

- GitHub: https://github.com/KeitoKuramochi/meeting_app
- デプロイ先: Vercel（人間が手動で実施）
- ブランチ戦略: main ブランチにマージ後、Vercel が自動デプロイ

---

## エージェント構成

| エージェント | 役割 | 主要ツール・プラグイン |
|---|---|---|
| Planner | idea.md を仕様・TASKに展開する（セキュリティ要件も定義） | context7 MCP, /revise-claude-md |
| Generator | TASKを1つずつ実装・build・commit する | /feature-dev, /commit, /code-review, context7 MCP, Playwright MCP（UI変更時の自己確認）, security-guidance（自動）, typescript-lsp（自動）, frontend-design（自動） |
| Security Auditor | commit後にセキュリティレビューを行う | /security-review, security-guidance |
| Evaluator | Playwright MCPで実際に操作・パフォーマンスを評価する | Playwright MCP, /web-perf, /verify |

### 自動で動くプラグイン（全エージェント共通）

| プラグイン | 動作 |
|---|---|
| **security-guidance** | ファイル編集時・commit時に自動でセキュリティチェック |
| **typescript-lsp** | TypeScriptファイル編集時に型エラーをリアルタイム検出 |
| **frontend-design** | UI実装時にプロダクション品質のデザインを自動適用 |

---

## 運用フロー

```
人間: idea.md を書く
  ↓
Planner: 仕様作成（context7で最新ドキュメント参照）
  → PROJECT_PLAN.md / REQUIREMENTS.md（セキュリティ要件含む）
  → MVP_TASKS.md / SPRINT_CONTRACT.md
  ↓
Generator: TASK を1つ実装
  → 複雑な機能は /feature-dev で7フェーズ実装
  → context7 で最新 API を参照
  → security-guidance の警告に対応
  → npm run build 確認
  → /code-review で自己レビュー
  → /commit でコミット
  ↓
Security Auditor: セキュリティレビュー
  → /security-review でコードベース横断チェック
  → CRITICAL/HIGH があれば Generator に差し戻し
  ↓
Evaluator: 品質評価
  → Playwright MCP で実際にブラウザ操作
  → /web-perf で Core Web Vitals 計測
  → 合格 / 不合格
  ↓ 不合格の場合
Generator: 修正プロンプトで再実装 → Security Auditor → Evaluator
  ↓ 合格の場合
次の TASK へ
  ↓ スプリント完了後
Planner: /revise-claude-md で CLAUDE.md を更新
```

---

## 絶対ルール（全エージェント共通）

- セッション終了時は必ず `docs/STATUS.md` の「セッション履歴」セクションに要約を追記する（コード変更を伴わない対話セッションでも省略しない。詳細は下記「セッション終了時のルール」参照）
- `.env`, `.env.local`, `secret`, `API key` には絶対に触れない・作らない・変更しない
- `git push` は人間の許可なしに行わない（push 先: https://github.com/KeitoKuramochi/meeting_app）
- Vercel へのデプロイは人間が手動で行う（Claude Code は実行しない）
- 外部 API 接続が必要になったら停止して人間に相談する
- DB 導入が必要になったら停止して人間に相談する
- 認証実装が必要になったら停止して人間に相談する
- 危険・不可逆な操作は必ず人間に確認してから行う

---

## セッション終了時のルール（全セッション共通）

**目的**: 過去のセッションの記憶がなくても、`docs/STATUS.md` の「セッション履歴」セクションだけを読めば「これまで何があったか・今どういう状態か・次に何をすべきか」が分かる状態を常に保つ。

- 対象は Planner / Generator / Security Auditor / Evaluator に限らず、人間との対話セッション（質問応答・調査・雑談的なやり取りも含む）すべて
- コードやドキュメントの変更を伴わないセッションでも、会話が一区切りついたら追記する（「何もしなかった」場合はその旨と理由を書けばよい）
- 追記先は `docs/STATUS.md` の「セッション履歴（新しい順）」セクション。新しいエントリは常に先頭に追加する
- フォーマット: `### YYYY-MM-DD セッション種別 — 一言タイトル` の見出し＋箇条書き（やったこと／分かったこと／次にやること）
- 既存の「TASK進捗」「ブロッカー」「Evaluatorの評価履歴」など他のセクションと役割が重複しても構わない。セッション履歴は横断的な要約であり、他のセクションは各観点の詳細記録

---

## Planner のルール

- `idea.md` を読んで仕様を作る
- 「何を作るか」に集中し、「どう作るか」は Generator に委ねる
- 1 TASK は build + commit できる小さな単位にする
- 各 TASK に Evaluator が確認できる完了条件を書く
- 技術スタック・ライブラリ・DBテーブル設計・関数名を決めすぎない

## Generator のルール

- 1 回に 1 TASK だけ実装する
- `npm run build` を実行し、通ることを確認してから commit する
- UI・見た目・操作に関わる変更をした場合は、commit前に Playwright MCP で実際にブラウザを操作して確認する。curlでHTMLを見ただけ・コードを読んだだけの状態を「確認済み」と報告しない。確認できなかった場合は「未確認」と正直に書く
- build エラーは `docs/ERROR_FIX_LOOP.md` に従い最大3回まで修正する
- 3 回修正しても直らなければ停止して人間に相談する
- `any` は使わない
- 指定外の機能追加・大規模リファクタリング・依存関係の追加は禁止
- `build` が通らない状態で commit しない
- commit 後に `docs/STATUS.md` と `docs/MVP_TASKS.md` を更新する

## Evaluator のルール

- Playwright MCP を使って実際にブラウザを操作して評価する
- コードを修正しない・ファイルを書き換えない
- 「概ね良い」「小さい問題だからOK」という判断は禁止
- 1 つでも完了条件を満たさなければ不合格にする
- スタブ・未実装・見た目だけの実装を見逃さない
- 不合格の場合は Generator に渡す具体的な修正プロンプトを作る

---

## 人間が確認すること

- `idea.md` を書く（毎プロジェクト開始時）
- Evaluator の合格 / 不合格を最終確認する（必要に応じて）
- 外部 API / DB / 認証 / デプロイが必要なときに判断する
- `git push` 前に内容を確認する

---

## ファイル構成

```
idea.md                        # 人間が書くアイデア（1〜4行）
CLAUDE.md                      # 本ファイル：運用ルール
docs/
  PROJECT_PLAN.md              # Planner が作る製品仕様書
  REQUIREMENTS.md              # Planner が作る要件定義（セキュリティ要件含む）
  MVP_TASKS.md                 # Planner が作るタスク一覧
  SPRINT_CONTRACT.md           # 各TASKの完了条件（Security Auditor / Evaluator の確認手順含む）
  STATUS.md                    # Generator が更新する進捗
  ERROR_FIX_LOOP.md            # build エラー時の修正ルール
  EVALUATION_CRITERIA.md       # Evaluator の評価基準
.claude/
  agents/
    planner.md                 # Planner エージェント定義（context7 / /revise-claude-md）
    generator.md               # Generator エージェント定義（/feature-dev / /commit / /code-review / context7）
    security-auditor.md        # Security Auditor エージェント定義（/security-review）★新規
    evaluator.md               # Evaluator エージェント定義（Playwright MCP / /web-perf）
```
