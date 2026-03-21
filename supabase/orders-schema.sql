-- supabase/orders-schema.sql
-- 주문/결제 시스템 테이블

-- 주문번호 생성 함수 (advisory lock으로 동시성 제어)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  seq INTEGER;
  result TEXT;
BEGIN
  today := TO_CHAR(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYYMMDD');

  -- advisory lock으로 동시 생성 방지 (날짜 해시를 lock key로 사용)
  PERFORM pg_advisory_xact_lock(hashtext('order_number_' || today));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM orders
  WHERE order_number LIKE 'NUK-' || today || '-%';

  result := 'NUK-' || today || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- orders 테이블
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT generate_order_number(),
  channel TEXT NOT NULL CHECK (channel IN ('direct', 'link')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_memo TEXT,
  admin_memo TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'shipping')),
  delivery_address TEXT,
  pickup_date TIMESTAMPTZ,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  payment_key TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_items 테이블
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- orders RLS 정책 (모든 접근은 API를 통해 서비스 롤로 처리)
CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- order_items RLS 정책
CREATE POLICY "Service role full access on order_items"
  ON order_items FOR ALL
  USING (auth.role() = 'service_role');
