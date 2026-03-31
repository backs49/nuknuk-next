-- supabase/reviews-schema.sql
-- 상품 리뷰 시스템

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  image_urls TEXT[] DEFAULT '{}',
  point_rewarded INT NOT NULL DEFAULT 0,
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, menu_item_id)
);

CREATE INDEX idx_reviews_menu_item ON reviews(menu_item_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_service_role" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

-- shop_settings 기본값
INSERT INTO shop_settings (key, value, label, description) VALUES
  ('review_point_text', '300', '텍스트 리뷰 포인트', '텍스트만 작성 시 지급 포인트'),
  ('review_point_photo', '500', '사진 리뷰 포인트', '사진 포함 리뷰 시 지급 포인트')
ON CONFLICT (key) DO NOTHING;
