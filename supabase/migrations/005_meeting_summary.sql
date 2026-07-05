-- ミーティング要約提出機能: meetingsテーブルに要約関連カラムを追加する

ALTER TABLE meetings ADD COLUMN summary_text TEXT;

ALTER TABLE meetings ADD COLUMN summary_source TEXT;

ALTER TABLE meetings ADD COLUMN summary_raw_input TEXT;

ALTER TABLE meetings ADD COLUMN summary_qa JSONB;

ALTER TABLE meetings ADD COLUMN summary_submitted_at TIMESTAMPTZ;
