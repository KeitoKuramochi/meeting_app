-- farm_contacts を ID で誰でも参照できるようにする
-- （/request/[farm_contact_id] ページはログイン不要でコンタクト名を表示する必要があるため）
CREATE POLICY "farm_contacts_select_public" ON farm_contacts
  FOR SELECT USING (true);
