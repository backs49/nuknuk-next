-- 005_consent_tracking.sql
-- 개인정보 수집·이용 동의 추적
-- customers: 마케팅 수신 동의 이력 (재주문 시 자동 체크용)
-- orders: 주문 시점의 동의 스냅샷 (분쟁 시 입증용)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_consent_at TIMESTAMPTZ;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS consent_collected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- 기존 레코드 안내:
-- - 이 마이그레이션 이전에 생성된 주문은 consent_collected_at=NULL, marketing_consent=false로 남음
-- - 이는 동의 기록 부재를 의미하며, 재동의 수집 시점부터 기록이 쌓임
