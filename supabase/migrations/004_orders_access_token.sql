-- 004_orders_access_token.sql
-- 주문번호는 NUK-YYYYMMDD-NNN 형식으로 순차 발번되어 enumeration 공격에 취약.
-- access_token 컬럼을 추가해 /api/orders/[orderNumber] 공개 조회 시 필수 검증하도록 함.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS access_token TEXT;

-- 기존 주문에 토큰 백필 (신규 주문은 애플리케이션 레벨에서 생성)
UPDATE orders
SET access_token = REPLACE(gen_random_uuid()::TEXT, '-', '')
WHERE access_token IS NULL;

ALTER TABLE orders
  ALTER COLUMN access_token SET NOT NULL;

-- 토큰 검증 쿼리 최적화용 인덱스 (order_number + access_token 조합 조회)
CREATE INDEX IF NOT EXISTS idx_orders_number_token
  ON orders(order_number, access_token);
