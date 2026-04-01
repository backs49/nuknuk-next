-- FAQ 항목 테이블
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_items_sort ON faq_items(sort_order);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_items_service_role" ON faq_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "faq_items_public_read" ON faq_items
  FOR SELECT USING (is_active = true);
