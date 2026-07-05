# PHASE3_SPRINT_CONTRACT.md — Phase 3 Sprint Contract

作成日: 2026-06-11

---

## TASK-015: DBマイグレーション（meetings テーブル拡張）+ 型定義更新

### 何を作るか

`meetings` テーブルに5カラムを追加するマイグレーションSQLファイルと、それに対応する TypeScript 型定義を作成する。

### 完了条件チェックリスト

- [ ] `supabase/migrations/004_meetings_phase3.sql` が存在する
- [ ] SQL に `duration_minutes INTEGER` の ALTER TABLE 文がある
- [ ] SQL に `note TEXT` の ALTER TABLE 文がある
- [ ] SQL に `alternative_candidates JSONB` の ALTER TABLE 文がある
- [ ] SQL に `replied_at TIMESTAMPTZ` の ALTER TABLE 文がある
- [ ] SQL に `manually_confirmed BOOLEAN NOT NULL DEFAULT false` の ALTER TABLE 文がある
- [ ] `src/types/meeting.ts` の `Meeting` 型に5カラムが追加されている
- [ ] `MeetingInsert` 型が新カラムの optional フィールドを受け入れられる
- [ ] `any` が使われていない
- [ ] `npm run build` がエラーなく通る

### Evaluator 確認手順

1. `supabase/migrations/004_meetings_phase3.sql` を開き、5つの ALTER TABLE 文が存在することを確認する
2. `src/types/meeting.ts` を開き、`Meeting` 型に `duration_minutes: number | null`、`note: string | null`、`alternative_candidates: Candidate[] | null`、`replied_at: string | null`、`manually_confirmed: boolean` が存在することを確認する
3. ターミナルで `npm run build` を実行しエラーが0件であることを確認する
4. コードに `any` が使われていないことを確認する

---

## TASK-016: 送信フォーム改善（カレンダーUI + 30分刻み時間選択）

### 何を作るか

`/request/[farm_contact_id]` の時間入力を `input[type=time]` から 30分刻みの選択UIに変更する。

### 完了条件チェックリスト

- [ ] ブラウザで `/request/[有効なfarm_contact_id]` にアクセスするとフォームが表示される
- [ ] 日付入力欄が `input[type=date]` で、今日の日付より前の日付が選択できない（min 属性）
- [ ] 時間選択が「06:00」「06:30」「07:00」... 「22:00」の30分刻みの選択肢になっている
- [ ] 時間を選択すると選択済みの選択肢がハイライトされる（背景色変化など）
- [ ] 「候補日を追加」ボタンで入力行が増える（5行まで）
- [ ] 削除ボタンで入力行が減る（最低1行）
- [ ] 日付・時間どちらかが未入力の行を含む状態で送信すると、その行がスキップされて有効な行のみ送信される
- [ ] 有効な候補が0件で送信しようとすると「候補日時を少なくとも1件入力してください」と表示される
- [ ] スマホ幅（375px）で時間選択UIがはみ出さない

### Evaluator 確認手順

1. Playwright でブラウザを開き `/request/[有効なfarm_contact_id]` にアクセスする
2. 日付欄をクリックし、過去日が選択不可であることを確認する
3. 時間選択を操作し、30分刻みの選択肢が表示されることを確認する
4. 時間を「10:00」に設定し、「10:00」の選択肢がハイライトされていることを確認する
5. 「候補日を追加」ボタンをクリックして入力行が増えることを確認する
6. 候補を空のまま「送信」ボタンをクリックしエラーメッセージが表示されることを確認する
7. ブラウザの幅を375pxに縮小してUIが崩れていないことを確認する

---

## TASK-017: 送信確認画面 + 「後で」draft保存フロー

### 何を作るか

送信完了後の画面を「今送る / 後で」の確認画面に変更し、「後で」を選んだ場合は localStorage に draft を保存して農園に戻る。農園では対象キャラに「未送信」バッジを表示する。

### 完了条件チェックリスト

- [ ] 送信完了後に「今送りますか？後で送りますか？」の画面（または確認UI）が表示される
- [ ] 「今送る」ボタンをクリックするとURLがクリップボードにコピーされ「コピーしました」と表示される
- [ ] 「後で」ボタンをクリックすると農園ページへ遷移する
- [ ] 「後で」選択後、農園で該当キャラに「未送信」バッジが表示される
- [ ] 「未送信」バッジが表示されているキャラをタップすると保存済みのURLが表示される
- [ ] URLを再コピーできる
- [ ] ブラウザの localStorage に `phase3_draft_{farm_contact_id}` キーでデータが保存されている
- [ ] スマホ幅（375px）で確認画面が崩れない

### Evaluator 確認手順

1. Playwright でブラウザを開き `/request/[有効なfarm_contact_id]` にアクセスする
2. 名前・相談内容・候補日を入力して送信ボタンを押す
3. 確認画面（「今送りますか？後で送りますか？」または同等のUI）が表示されることを確認する
4. 「後で」ボタンをクリックして農園ページに遷移することを確認する
5. 農園で該当キャラに「未送信」を示すバッジ・テキストが表示されていることを確認する
6. 該当キャラをクリックして保存済みURLが表示されることを確認する
7. ブラウザの開発者ツール → Application → Local Storage で `phase3_draft_` で始まるキーが存在することを確認する
8. もう一度手順 1〜2 を実行し「今送る」を選択した場合にURLがコピーされ「コピーしました」と表示されることを確認する

---

## TASK-018: 吹き出し状態管理（4状態）

### 何を作るか

農園のキャラ吹き出しを4状態（未送信・確定待ち・返信あり・確定済み）で管理する。

### 完了条件チェックリスト

- [ ] `FarmContactWithCount` 型に `repliedCount: number` が追加されている
- [ ] `/farm/page.tsx` で `replied_at IS NOT NULL` の件数が `repliedCount` として集計されている
- [ ] `confirmedCount = 0` かつ `pendingCount > 0` かつ `repliedCount = 0` のキャラの吹き出しが「確定待ち」または「…」表示になっている
- [ ] `repliedCount > 0` のキャラの吹き出しに a6.png（！）が表示される
- [ ] localStorage に draft があるキャラに「未送信」バッジが表示される（TASK-017 との結合動作）
- [ ] 通常の吹き出しセリフは、未送信・確定待ち・返信あり状態では非表示になっている
- [ ] `npm run build` がエラーなく通る

### Evaluator 確認手順

1. Playwright でブラウザを開き `/farm` にアクセスする（ログイン済みの状態）
2. テストデータとして `replied_at` が入っているミーティングに紐づく farm_contact を持つ農園にアクセスする
3. 該当キャラの吹き出しに「！」表示（a6.png または相当のUI）があることを確認する
4. `pendingCount > 0` のキャラの吹き出しが「確定待ち」または「…」表示になっていることを確認する
5. `confirmedCount = 0` かつ `pendingCount = 0` かつ `repliedCount = 0` のキャラには通常のランダムセリフ吹き出しが表示されることを確認する
6. ブラウザ開発者ツールで `any` 型が使われていないことをソースで確認する（TypeScript エラー 0 件）

---

## TASK-019: 受け取り側ページ拡張（所要時間・備考・別日提案フロー）

### 何を作るか

`/r/[id]` の `CandidateList.tsx` に所要時間選択・備考入力・別日提案フローを追加する。

### 完了条件チェックリスト

- [ ] `/r/[id]` を開くと候補日選択の下に所要時間選択が表示される
- [ ] 所要時間の選択肢は「30分 / 1時間 / 1時間30分 / 2時間 / その他」の5種類ある
- [ ] 「その他」を選ぶと分数を自由入力できるテキスト/数値欄が表示される
- [ ] 備考テキスト入力欄（任意）が表示される
- [ ] 確定ボタンを押した後、Supabase の `meetings` レコードに `duration_minutes` と `note` が保存されている
- [ ] 確定後に「ミーティングが確定しました！」と表示される（確定日時を含む）
- [ ] 「別の日を提案する」ボタンがある
- [ ] クリックで別日提案フォーム（日付 input[type=date] + 30分刻み時間 + 所要時間 + 備考）が表示される
- [ ] 「返信する」ボタンを押した後、Supabase の meetings レコードに `alternative_candidates` と `replied_at` が保存されている
- [ ] 返信ボタン送信後に「提案を送りました」のメッセージが表示される
- [ ] 既存の確定済み表示（confirmed_index != null の初期状態）が崩れていない
- [ ] スマホ幅（375px）でレイアウトが崩れない
- [ ] `npm run build` がエラーなく通る

### Evaluator 確認手順

1. Playwright でブラウザを開き `/r/[テスト用meeting_id]` にアクセスする
2. 候補日一覧が表示されることを確認する
3. 候補日を1つ選択し、所要時間に「1時間」を選択し、備考に「テスト備考」と入力する
4. 「確定する」ボタンをクリックする
5. 「ミーティングが確定しました！」のメッセージが表示されることを確認する
6. Supabase ダッシュボードまたは開発者ツール経由で meetings レコードの `duration_minutes` が 60、`note` が「テスト備考」になっていることを確認する
7. 新しいミーティングIDで `/r/[別のmeeting_id]` にアクセスする
8. 「別の日を提案する」ボタンをクリックする
9. 別日提案フォームに日付・時間・所要時間・備考を入力し「返信する」ボタンをクリックする
10. 「提案を送りました」のメッセージが表示されることを確認する
11. Supabase で meetings レコードの `replied_at` が更新されていることを確認する

---

## TASK-020: 返信検知ポーリング + 手動確定フロー

### 何を作るか

農園ページで `replied_at` のポーリングを実装し、返信が届いたキャラをタップしたときに返信内容確認モーダルと手動確定フローを提供する。

### 完了条件チェックリスト

- [ ] 農園ページがマウントされた後、一定間隔（15〜30秒）で meetings の `replied_at` をポーリングしている
- [ ] コンポーネントが unmount されると `clearInterval` でポーリングが停止する
- [ ] `replied_at IS NOT NULL` のミーティングに紐づくキャラの吹き出しに「！」（a6.png）が表示される
- [ ] 該当キャラをタップするとモーダルまたはインラインパネルが開く
- [ ] モーダルに別日提案の内容（日付・時間・所要時間・備考）が表示される
- [ ] 「新しいURLを作って送り直す」ボタンをクリックすると `/request/[farm_contact_id]` に遷移する
- [ ] 「手動で確定する」ボタンをクリックすると確認ダイアログが表示される
- [ ] 確認ダイアログに「本当に確定しましたか？」のテキストがある
- [ ] 「はい（確定する）」をクリックすると Supabase の meetings レコードの `manually_confirmed` が `true` になる
- [ ] 「キャンセル」をクリックするとダイアログが閉じてキャラ・農園の状態が変わらない
- [ ] スマホ幅（375px）でモーダルが崩れない
- [ ] `npm run build` がエラーなく通る

### Evaluator 確認手順

1. Playwright でブラウザを開き `/farm` にアクセスする（ログイン済み）
2. ブラウザの開発者ツール → Network タブを開き、一定間隔でミーティングデータを取得するリクエストが送信されていることを確認する（30秒以内に1回以上）
3. テスト用に `replied_at` が入っているミーティングに紐づく farm_contact を作成（または既存を利用）する
4. 農園で該当キャラの吹き出しに「！」（a6.png またはUI相当）が表示されることを確認する
5. 該当キャラをクリックしてモーダル/パネルが表示されることを確認する
6. モーダルに別日提案の内容が表示されていることを確認する
7. 「手動で確定する」ボタンをクリックして確認ダイアログが表示されることを確認する
8. ダイアログで「はい（確定する）」をクリックして Supabase の `manually_confirmed` が `true` になったことを確認する
9. ダイアログで「キャンセル」を選んだとき状態が変わらないことを確認する
10. ページを離れて戻ったとき（またはブラウザ履歴操作）、ポーリングの clearInterval が呼ばれて二重起動しないことを開発者ツールで確認する

---

## TASK-021: 確定後の成長反映（manually_confirmed を confirmedCount に加算）

### 何を作るか

`/farm/page.tsx` の confirmedCounts 集計ロジックを修正し、`manually_confirmed = true` のミーティングも確定回数としてカウントするようにする。

### 完了条件チェックリスト

- [ ] `/farm/page.tsx` の `confirmedCounts` 集計クエリが `confirmed_index IS NOT NULL` と `manually_confirmed = true` の両方をカウントしている
- [ ] `manually_confirmed = true` のミーティングが1件あるキャラが scale 0.72（1回確定相当）で表示される
- [ ] `confirmed_index IS NOT NULL` かつ `manually_confirmed = false` のミーティングが1件あるキャラも scale 0.72 で表示される（既存ロジック維持）
- [ ] 確定回数が 0 のキャラは scale 0.60 で ZZZ 表示のまま（影響なし）
- [ ] `npm run build` がエラーなく通る

### Evaluator 確認手順

1. テスト用に `manually_confirmed = true` かつ `confirmed_index IS NULL` のミーティングを1件用意し、対応する farm_contact の農園にアクセスする
2. 該当キャラのサイズが scale 0.60（0回）ではなく、0.72（1回相当）になっていることをブラウザの開発者ツール（Computed styles または Playwright の evaluate）で確認する
3. `confirmed_index IS NOT NULL` のミーティングが1件ある別のキャラも同様に scale 0.72 で表示されることを確認する（既存ロジック維持）
4. `npm run build` がエラー 0 件で通ることを確認する
