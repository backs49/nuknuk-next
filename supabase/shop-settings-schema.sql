-- ================================================
-- 넉넉 운영 설정(shop_settings) 테이블
-- ================================================
-- coupon-point-schema.sql 실행 후 Supabase SQL Editor에서 실행하세요.


-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS shop_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_settings_select" ON shop_settings
  FOR SELECT USING (true);

CREATE POLICY "shop_settings_service_role" ON shop_settings
  FOR ALL USING (auth.role() = 'service_role');


-- 2. 기본 설정값 삽입
INSERT INTO shop_settings (key, value, label, description) VALUES
  ('point_earn_rate', '0.03', '포인트 적립률', '결제 금액 대비 포인트 적립 비율 (예: 0.03 = 3%)'),
  ('referral_reward_points', '1000', '추천 보상 포인트', '추천인에게 지급되는 포인트'),
  ('min_point_use', '0', '최소 포인트 사용', '주문 시 최소 사용 가능한 포인트 (0 = 제한 없음)'),
  ('point_use_unit', '1', '포인트 사용 단위', '포인트 사용 시 단위 (예: 100 = 100P 단위로 사용)')
ON CONFLICT (key) DO NOTHING;
