-- ================================================
-- 넉넉 쿠폰·포인트 시스템 — DB 마이그레이션
-- ================================================
-- 기존 schema.sql, orders-schema.sql 실행 후 Supabase SQL Editor에서 실행하세요.


-- ================================================
-- 1. 고객(customers) 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  point_balance INTEGER NOT NULL DEFAULT 0 CHECK (point_balance >= 0),
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_referral_code ON customers(referral_code);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_service_role" ON customers
  FOR ALL USING (auth.role() = 'service_role');


-- ================================================
-- 2. 포인트 거래내역(point_transactions) 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'use', 'admin_add', 'admin_deduct', 'referral', 'cancel_restore', 'cancel_deduct')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_customer_id ON point_transactions(customer_id);
CREATE INDEX idx_point_transactions_order_id ON point_transactions(order_id);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_transactions_service_role" ON point_transactions
  FOR ALL USING (auth.role() = 'service_role');


-- ================================================
-- 3. 쿠폰 템플릿(coupon_templates) 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS coupon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percent', 'free_item', 'free_shipping')),
  value INTEGER NOT NULL DEFAULT 0,
  free_item_id TEXT REFERENCES menu_items(id),
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER,
  valid_days INTEGER,
  category_id TEXT REFERENCES menu_categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  distribution TEXT NOT NULL CHECK (distribution IN ('manual', 'auto', 'code')),
  code TEXT UNIQUE,
  auto_trigger TEXT CHECK (auto_trigger IN ('first_order', 'nth_order', 'referral')),
  auto_trigger_value INTEGER,
  max_issues INTEGER,
  issued_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupon_templates_code ON coupon_templates(code) WHERE code IS NOT NULL;
CREATE INDEX idx_coupon_templates_auto_trigger ON coupon_templates(auto_trigger) WHERE auto_trigger IS NOT NULL;

ALTER TABLE coupon_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_templates_select" ON coupon_templates
  FOR SELECT USING (true);

CREATE POLICY "coupon_templates_service_role" ON coupon_templates
  FOR ALL USING (auth.role() = 'service_role');


-- ================================================
-- 4. 고객 쿠폰(customer_coupons) 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS customer_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES coupon_templates(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_coupons_customer_status ON customer_coupons(customer_id, status);
CREATE INDEX idx_customer_coupons_template_id ON customer_coupons(template_id);

ALTER TABLE customer_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_coupons_service_role" ON customer_coupons
  FOR ALL USING (auth.role() = 'service_role');


-- ================================================
-- 5. 주문(orders) 테이블 확장 — 쿠폰·포인트 컬럼 추가
-- ================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES customer_coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS point_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS point_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_amount INTEGER;

-- 기존 주문 데이터에 final_amount 계산하여 채우기
UPDATE orders SET final_amount = total_amount + shipping_fee WHERE final_amount IS NULL;

ALTER TABLE orders ALTER COLUMN final_amount SET NOT NULL;
ALTER TABLE orders ALTER COLUMN final_amount SET DEFAULT 0;
ALTER TABLE orders ADD CONSTRAINT orders_final_amount_check CHECK (final_amount >= 0);

CREATE INDEX idx_orders_customer_id ON orders(customer_id) WHERE customer_id IS NOT NULL;


-- ================================================
-- 6. 전화번호 정규화 함수
-- ================================================

CREATE OR REPLACE FUNCTION normalize_phone(p TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN REPLACE(REPLACE(p, '-', ''), ' ', '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ================================================
-- 7. 포인트 RPC 함수들
-- ================================================

-- 포인트 적립
CREATE OR REPLACE FUNCTION add_points(
  p_customer_id UUID,
  p_type TEXT,
  p_amount INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_tx_id UUID;
BEGIN
  UPDATE customers
  SET point_balance = point_balance + p_amount
  WHERE id = p_customer_id
  RETURNING point_balance INTO v_balance;

  INSERT INTO point_transactions (customer_id, type, amount, balance_after, order_id, description)
  VALUES (p_customer_id, p_type, p_amount, v_balance, p_order_id, p_description)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'id', v_tx_id,
    'customerId', p_customer_id,
    'type', p_type,
    'amount', p_amount,
    'balanceAfter', v_balance,
    'orderId', p_order_id,
    'description', p_description
  );
END;
$$;

-- 포인트 사용
CREATE OR REPLACE FUNCTION use_points(
  p_customer_id UUID,
  p_amount INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '포인트 사용'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_tx_id UUID;
BEGIN
  UPDATE customers
  SET point_balance = point_balance - p_amount
  WHERE id = p_customer_id AND point_balance >= p_amount
  RETURNING point_balance INTO v_balance;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO point_transactions (customer_id, type, amount, balance_after, order_id, description)
  VALUES (p_customer_id, 'use', -p_amount, v_balance, p_order_id, p_description)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'id', v_tx_id,
    'customerId', p_customer_id,
    'type', 'use',
    'amount', -p_amount,
    'balanceAfter', v_balance,
    'orderId', p_order_id,
    'description', p_description
  );
END;
$$;

-- 포인트 차감 (관리자/취소용)
CREATE OR REPLACE FUNCTION deduct_points(
  p_customer_id UUID,
  p_type TEXT,
  p_amount INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '포인트 차감'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_tx_id UUID;
BEGIN
  UPDATE customers
  SET point_balance = point_balance - p_amount
  WHERE id = p_customer_id AND point_balance >= p_amount
  RETURNING point_balance INTO v_balance;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO point_transactions (customer_id, type, amount, balance_after, order_id, description)
  VALUES (p_customer_id, p_type, -p_amount, v_balance, p_order_id, p_description)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'id', v_tx_id,
    'customerId', p_customer_id,
    'type', p_type,
    'amount', -p_amount,
    'balanceAfter', v_balance,
    'orderId', p_order_id,
    'description', p_description
  );
END;
$$;

-- 고객 주문 통계 증가
CREATE OR REPLACE FUNCTION increment_customer_stats(
  p_customer_id UUID,
  p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET total_orders = total_orders + 1,
      total_spent = total_spent + p_amount
  WHERE id = p_customer_id;
END;
$$;

-- 포인트 무결성 검증
CREATE OR REPLACE FUNCTION check_point_integrity()
RETURNS TABLE(customer_id UUID, phone TEXT, cached INTEGER, calculated BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS customer_id,
    c.phone,
    c.point_balance AS cached,
    COALESCE(SUM(pt.amount), 0)::BIGINT AS calculated
  FROM customers c
  LEFT JOIN point_transactions pt ON pt.customer_id = c.id
  GROUP BY c.id, c.phone, c.point_balance
  HAVING c.point_balance != COALESCE(SUM(pt.amount), 0);
END;
$$;


-- ================================================
-- 8. RPC 접근 제어 — service_role만 호출 가능
-- ================================================

REVOKE EXECUTE ON FUNCTION add_points FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION use_points FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION deduct_points FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_customer_stats FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION check_point_integrity FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION add_points TO service_role;
GRANT EXECUTE ON FUNCTION use_points TO service_role;
GRANT EXECUTE ON FUNCTION deduct_points TO service_role;
GRANT EXECUTE ON FUNCTION increment_customer_stats TO service_role;
GRANT EXECUTE ON FUNCTION check_point_integrity TO service_role;
