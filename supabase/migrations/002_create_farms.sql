-- farms テーブル
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- farm_contacts テーブル
CREATE TABLE farm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  character_number INTEGER NOT NULL CHECK (character_number >= 1 AND character_number <= 100),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- meetings テーブルへ farm_contact_id カラムを追加
ALTER TABLE meetings
  ADD COLUMN farm_contact_id UUID REFERENCES farm_contacts(id) ON DELETE SET NULL;

-- farms の RLS
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farms_select_own" ON farms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "farms_insert_own" ON farms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "farms_delete_own" ON farms
  FOR DELETE USING (auth.uid() = user_id);

-- farm_contacts の RLS
ALTER TABLE farm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farm_contacts_select_own" ON farm_contacts
  FOR SELECT USING (
    farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
  );

CREATE POLICY "farm_contacts_insert_own" ON farm_contacts
  FOR INSERT WITH CHECK (
    farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
  );

CREATE POLICY "farm_contacts_delete_own" ON farm_contacts
  FOR DELETE USING (
    farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
  );
