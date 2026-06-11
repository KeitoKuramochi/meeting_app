# PHASE3_TASKS.md — Phase 3 TASK一覧

作成日: 2026-06-11

---

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

### TASK-015: DBマイグレーション（meetings テーブル拡張）+ 型定義更新

**ステータス**: `[x]`

**説明**:
`meetings` テーブルに Phase 3 で必要な5カラムを追加するマイグレーションSQLファイルを作成する。
合わせて `src/types/meeting.ts` の `Meeting` 型を更新する。

追加するカラム:
- `duration_minutes` INTEGER nullable（確定時の所要時間・分単位）
- `note` TEXT nullable（受け取る側が入力した備考）
- `alternative_candidates` JSONB nullable（別日提案時の候補日一覧。`Candidate[]` 形式）
- `replied_at` TIMESTAMPTZ nullable（別日提案が届いた日時）
- `manually_confirmed` BOOLEAN NOT NULL DEFAULT false（送信者が手動確定したかどうか）

**完了条件**:
- [ ] `supabase/migrations/004_meetings_phase3.sql` が作成されている
- [ ] SQL に `ALTER TABLE meetings ADD COLUMN duration_minutes INTEGER;` が含まれている
- [ ] SQL に `ALTER TABLE meetings ADD COLUMN note TEXT;` が含まれている
- [ ] SQL に `ALTER TABLE meetings ADD COLUMN alternative_candidates JSONB;` が含まれている
- [ ] SQL に `ALTER TABLE meetings ADD COLUMN replied_at TIMESTAMPTZ;` が含まれている
- [ ] SQL に `ALTER TABLE meetings ADD COLUMN manually_confirmed BOOLEAN NOT NULL DEFAULT false;` が含まれている
- [ ] `src/types/meeting.ts` の `Meeting` 型に上記5カラムが追加されている（`any` 不使用）
- [ ] `MeetingInsert` 型が新カラムを受け入れられる（nullable カラムは省略可能）
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-016: 送信フォーム改善（カレンダーUI + 30分刻み時間選択）

**ステータス**: `[x]`

**説明**:
`/request/[farm_contact_id]` の `RequestForm.tsx` の候補日入力UIを改善する。
日付は既存の `input[type=date]` を維持しつつ、時間入力を `input[type=time]` から「30分刻みの選択肢ボタングループまたは select」に変更する。
選択肢は 06:00〜22:00 の30分刻み（33個の選択肢）とする。

**完了条件**:
- [ ] `/request/[farm_contact_id]` にアクセスするとフォームが表示される
- [ ] 日付入力が `input[type=date]` で動作し、今日以降の日付のみ選択可能（`min` 属性）
- [ ] 時間選択が「06:00, 06:30, 07:00 ... 22:00」の30分刻みの選択肢から選べる
- [ ] 時間の選択肢が選択済みのとき、その選択肢が視覚的にハイライトされる（または select の selected 状態）
- [ ] 候補日の追加ボタンで候補が増える（最大5件）
- [ ] 候補日の削除ボタンで候補が減る（最低1件）
- [ ] 日付か時間が未入力の候補行は送信時にスキップされる
- [ ] 有効な候補が0件の状態で送信するとエラーメッセージが表示される
- [ ] スマホ幅（375px）でUIが崩れない（時間選択ボタンがはみ出さない）
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-017: 送信確認画面 + 「後で」draft保存フロー

**ステータス**: `[x]`

**説明**:
`RequestForm.tsx` の送信完了後の状態を改善する。
現在の「URLをコピー」だけの完了画面を「今送りますか？後で送りますか？」の確認画面に変更する。

- 「今送る」: URLをクリップボードにコピーし「コピーしました」フィードバックを表示。meetings テーブルの `sent_at`（なければ確認後の状態として記録）を更新、または送信済みフラグをクライアント側で管理
- 「後で」: localStorage に `phase3_draft_{farm_contact_id}` のキーで `{ meetingId, url, savedAt }` を保存し、農園ページへ遷移する

また、FarmCharacters.tsx を更新して localStorage の draft を読み取り、該当キャラの吹き出しに「未送信」バッジ（テキストまたはアイコン）を表示できるようにする。

**完了条件**:
- [ ] 送信完了後に「今送りますか？後で送りますか？」の確認画面（または確認ダイアログ）が表示される
- [ ] 「今送る」ボタンを押すとURLがクリップボードにコピーされ「コピーしました」と表示される
- [ ] 「後で」ボタンを押すと `/farm`（または元の農園画面）に戻る
- [ ] 「後で」を選んだ後、農園で該当キャラの吹き出しに「未送信」を示す表示が出る
- [ ] 「後で」状態のキャラをタップすると、保存済みURLが表示される（再コピー可能）
- [ ] localStorage のキーが `phase3_draft_{farm_contact_id}` 形式になっている
- [ ] スマホ幅（375px）で確認画面が崩れない
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-018: 吹き出し状態管理（未送信・確定待ち・返信あり・確定済みの4状態）

**ステータス**: `[x]`

**説明**:
農園ページ（`/farm` または `/demo/farm`）のキャラ吹き出しに、ミーティングの状態を反映した4つの状態を実装する。

| 状態 | 条件 | 吹き出し表示 |
|---|---|---|
| 未送信 | localStorage に draft があり、URLがまだコピーされていない | 「未送信」テキストバッジ |
| 確定待ち | meetings レコードがあり `confirmed_index IS NULL` かつ `replied_at IS NULL` かつ `manually_confirmed = false` | 「確定待ち…」または「…」（a1.png 吹き出し内） |
| 返信あり | `replied_at IS NOT NULL` かつ確定されていない | a6.png（！）吹き出し表示 |
| 確定済み | `confirmed_index IS NOT NULL` または `manually_confirmed = true` | 既存の成長エフェクト（Phase 2 のロジックを流用） |

`FarmContactWithCount` 型に `repliedCount`（replied_at IS NOT NULL のカウント）を追加する。
`FarmCharacters.tsx` の吹き出し表示ロジックを拡張して上記4状態を反映する。

**完了条件**:
- [ ] `FarmContactWithCount` 型に `repliedCount: number` が追加されている
- [ ] `/farm` のデータ取得ロジックで `replied_at IS NOT NULL` の件数が集計されている
- [ ] 確定待ちキャラの吹き出しが「確定待ち」または「…」を示す見た目になっている
- [ ] returned（別日提案あり）キャラの吹き出しに a6.png（！）が表示される
- [ ] localStorage の draft があるキャラに「未送信」バッジが表示される（TASK-017 との連携）
- [ ] 既存の通常吹き出し（ランダムセリフ）は「未送信・確定待ち・返信あり」状態では非表示になるか別扱いになる
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-019: 受け取り側ページ拡張（所要時間・備考・別日提案フロー）

**ステータス**: `[x]`

**説明**:
既存の `/r/[id]` の `CandidateList.tsx` を拡張する。
確定フロー・別日提案フローを追加するが、既存の `confirmed_index` による確定ロジックは変更しない。

**確定フロー追加**:
- 所要時間選択（30分 / 1時間 / 1時間30分 / 2時間 / その他テキスト入力）を候補選択の下に追加
- 備考テキスト入力欄（任意）を追加
- 確定ボタンを押すと `confirmed_index`・`confirmed_at`・`duration_minutes`・`note` を保存
- 確定後「ミーティングが確定しました！」と表示（確定日時・所要時間・備考を含む）

**別日提案フロー**:
- 「別の日を提案する」ボタンを追加
- クリックで別日提案フォームが表示される
  - 日付: `input[type=date]`
  - 時間: 30分刻み選択（TASK-016 と同じUI）
  - 所要時間: 30分 / 1時間 / 1時間30分 / 2時間 / その他
  - 備考: テキスト入力（任意）
- 「返信する」ボタンで `alternative_candidates`・`replied_at`・`note` を保存
- 送信後「提案を送りました」と表示

**完了条件**:
- [ ] `/r/[id]` で候補日選択の下に所要時間選択（30分/1時間/1時間30分/2時間/その他）が表示される
- [ ] 「その他」を選ぶとテキスト入力欄が表示される
- [ ] 備考入力欄（任意）が表示される
- [ ] 確定ボタンを押すと `duration_minutes` と `note` が meetings テーブルに保存される（Supabaseで確認可能）
- [ ] 確定後に「ミーティングが確定しました！」のメッセージが表示される
- [ ] 「別の日を提案する」ボタンがある
- [ ] クリックで別日提案フォーム（日付・時間・所要時間・備考）が表示される
- [ ] 「返信する」ボタンを押すと `alternative_candidates` と `replied_at` が保存される
- [ ] 別日提案送信後に「提案を送りました」のメッセージが表示される
- [ ] 既存の確定済み表示（confirmed_index != null）が崩れていない
- [ ] スマホ幅（375px）でレイアウトが崩れない
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-020: 返信検知ポーリング + 手動確定フロー

**ステータス**: `[x]`

**説明**:
送信者側（農園ページ）で、`replied_at` のポーリングを実装する。
返信が届いたキャラをタップしたときに「返信が届きました」モーダルを表示し、以下の操作を提供する。

- 「新しいURLを作って送り直す」→ `/request/[farm_contact_id]` へ遷移
- 「手動で確定する」→ 確認ダイアログ（「本当に確定しましたか？」Yes / Cancel）→ Yes で `manually_confirmed = true` を保存

ポーリングは `FarmCharacters.tsx` またはページレベルで実装。コンポーネント unmount 時に `clearInterval` で停止。

**完了条件**:
- [ ] 農園ページで `replied_at` のポーリングが動作している（間隔: 15〜30秒）
- [ ] ポーリングはコンポーネントが unmount されると停止する（`clearInterval` が呼ばれる）
- [ ] `replied_at IS NOT NULL` のミーティングに紐づくキャラの吹き出しに「！」（a6.png）が表示される
- [ ] 該当キャラをタップすると「返信が届きました」のモーダルまたはインラインパネルが表示される
- [ ] モーダル内に別日提案の内容（日付・時間・所要時間・備考）が表示される
- [ ] 「新しいURLを作って送り直す」ボタンをクリックすると `/request/[farm_contact_id]` へ遷移する
- [ ] 「手動で確定する」ボタンをクリックすると「本当に確定しましたか？」という確認ダイアログが表示される
- [ ] 確認ダイアログで「はい（確定する）」を押すと meetings の `manually_confirmed` が `true` に更新される
- [ ] 確認ダイアログで「キャンセル」を押すとダイアログが閉じるだけ（何も変わらない）
- [ ] 手動確定後にキャラが成長エフェクトを表示する（TASK-021 との連携、または仮の成長表示でも可）
- [ ] スマホ幅（375px）でモーダルが崩れない
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている

---

### TASK-021: 確定後の成長反映（manually_confirmed を confirmedCount に加算）

**ステータス**: `[~]`

**説明**:
農園ページのデータ取得ロジック（`/farm/page.tsx`）を修正する。
`confirmed_index IS NOT NULL` に加えて `manually_confirmed = true` のミーティングも `confirmedCount` としてカウントするよう集計クエリを変更する。
これにより Phase 3 の手動確定フローを経たキャラも成長エフェクトが反映される。

**完了条件**:
- [ ] `/farm/page.tsx` の `confirmedCounts` 集計クエリが `confirmed_index IS NOT NULL OR manually_confirmed = true` の条件でカウントしている
- [ ] `manually_confirmed = true` のミーティングが1件あるキャラが scale 0.72（1回確定相当）で表示される（開発者ツールで確認可能）
- [ ] 既存の `confirmed_index IS NOT NULL` での確定回数カウントが引き続き動作する
- [ ] `FarmContactWithCount` 型の変更が不要な場合はそのままで良い（confirmedCount の計算方法変更のみ）
- [ ] `npm run build` がエラーなく通る
- [ ] `git commit` が1件作成されている
