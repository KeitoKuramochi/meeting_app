-- Phase 3: meetings テーブルに5カラムを追加する

ALTER TABLE meetings ADD COLUMN duration_minutes INTEGER;

ALTER TABLE meetings ADD COLUMN note TEXT;

ALTER TABLE meetings ADD COLUMN alternative_candidates JSONB;

ALTER TABLE meetings ADD COLUMN replied_at TIMESTAMPTZ;

ALTER TABLE meetings ADD COLUMN manually_confirmed BOOLEAN NOT NULL DEFAULT false;
