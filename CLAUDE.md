# CLAUDE.md — 自律開発環境 運用ルール

このプロジェクトは Planner / Generator / Evaluator の3エージェント構成で動く自律開発環境です。
人間は `idea.md` にアイデアを書くだけで、Claude Code が仕様作成・実装・評価・修正まで回します。

## プロジェクト情報

- GitHub: https://github.com/KeitoKuramochi/meeting_app
- デプロイ先: Vercel（人間が手動で実施）
- ブランチ戦略: main ブランチにマージ後、Vercel が自動デプロイ

---

## エージェント構成

| エージェント | 役割 | 使用ツール |
|---|---|---|
| Planner | idea.md を仕様・TASKに展開する | Read, Write, Edit |
| Generator | TASKを1つずつ実装・build・commit する | Read, Write, Edit, Bash |
| Evaluator | Playwright MCPで実際に操作して評価する | Read, mcp__playwright |

---

## 運用フロー

```
人間: idea.md を書く
  ↓
Planner: 仕様作成 → PROJECT_PLAN.md / REQUIREMENTS.md / MVP_TASKS.md / SPRINT_CONTRACT.md
  ↓
Generator: TASK を1つ実装 → build → commit → STATUS.md 更新
  ↓
Evaluator: Playwright MCP で実際に操作 → 合格 / 不合格
  ↓ 不合格の場合
Generator: Evaluator の修正プロンプトで再実装
  ↓ 合格の場合
次の TASK へ
```

---

## 絶対ルール（全エージェント共通）

- `.env`, `.env.local`, `secret`, `API key` には絶対に触れない・作らない・変更しない
- `git push` は人間の許可なしに行わない（push 先: https://github.com/KeitoKuramochi/meeting_app）
- Vercel へのデプロイは人間が手動で行う（Claude Code は実行しない）
- 外部 API 接続が必要になったら停止して人間に相談する
- DB 導入が必要になったら停止して人間に相談する
- 認証実装が必要になったら停止して人間に相談する
- 危険・不可逆な操作は必ず人間に確認してから行う

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
  REQUIREMENTS.md              # Planner が作る要件定義
  MVP_TASKS.md                 # Planner が作るタスク一覧
  SPRINT_CONTRACT.md           # 各TASKの完了条件
  STATUS.md                    # Generator が更新する進捗
  ERROR_FIX_LOOP.md            # build エラー時の修正ルール
  EVALUATION_CRITERIA.md       # Evaluator の評価基準
.claude/
  agents/
    planner.md                 # Planner エージェント定義
    generator.md               # Generator エージェント定義
    evaluator.md               # Evaluator エージェント定義
```
