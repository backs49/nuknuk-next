-- ================================================
-- 비정기 휴무(shop_closures) 테이블
-- ================================================
-- shop-settings-schema.sql 실행 후 Supabase SQL Editor에서 실행하세요.

CREATE TABLE IF NOT EXISTS shop_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT shop_closures_date_order CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_shop_closures_end_date ON shop_closures (end_date);

ALTER TABLE shop_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_closures_select" ON shop_closures
  FOR SELECT USING (true);

CREATE POLICY "shop_closures_service_role" ON shop_closures
  FOR ALL USING (auth.role() = 'service_role');

-- 운영 설정 키 기본값 추가 (shop_settings 테이블에)
INSERT INTO shop_settings (key, value, label, description) VALUES
  ('closed_weekdays', '1', '정기 휴무 요일', '0=일, 1=월, ..., 6=토. 콤마 구분 복수 지정.'),
  ('open_hour', '10', '영업 시작 시각', '24시간 형식 정수 (픽업 첫 슬롯)'),
  ('close_hour', '16', '영업 종료 시각', '24시간 형식 정수 (픽업 마지막 슬롯)'),
  ('pickup_slot_minutes', '60', '픽업 슬롯 간격', '분 단위 (15/30/60)')
ON CONFLICT (key) DO NOTHING;
