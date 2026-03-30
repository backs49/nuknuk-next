-- ================================================
-- 상품 상세 페이지 + 메뉴 옵션 시스템 마이그레이션
-- ================================================

-- 1. 상품 이미지 테이블
CREATE TABLE IF NOT EXISTS menu_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_item_images_menu ON menu_item_images(menu_item_id, sort_order);

ALTER TABLE menu_item_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "이미지 조회는 누구나 가능" ON menu_item_images
  FOR SELECT USING (true);

CREATE POLICY "이미지 수정은 서비스 역할만 가능" ON menu_item_images
  FOR ALL USING (auth.role() = 'service_role');

-- 2. 상세 설명 블록 테이블
CREATE TABLE IF NOT EXISTS menu_detail_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_detail_blocks_menu ON menu_detail_blocks(menu_item_id, sort_order);

ALTER TABLE menu_detail_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "상세블록 조회는 누구나 가능" ON menu_detail_blocks
  FOR SELECT USING (true);

CREATE POLICY "상세블록 수정은 서비스 역할만 가능" ON menu_detail_blocks
  FOR ALL USING (auth.role() = 'service_role');

-- 3. 메뉴 옵션 그룹 테이블
CREATE TABLE IF NOT EXISTS menu_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multi')),
  required BOOLEAN NOT NULL DEFAULT false,
  price_mode TEXT NOT NULL CHECK (price_mode IN ('additional', 'fixed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_option_groups_menu ON menu_option_groups(menu_item_id, sort_order);

ALTER TABLE menu_option_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "옵션그룹 조회는 누구나 가능" ON menu_option_groups
  FOR SELECT USING (true);

CREATE POLICY "옵션그룹 수정은 서비스 역할만 가능" ON menu_option_groups
  FOR ALL USING (auth.role() = 'service_role');

-- 4. 메뉴 옵션 항목 테이블
CREATE TABLE IF NOT EXISTS menu_option_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES menu_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_option_items_group ON menu_option_items(group_id, sort_order);

ALTER TABLE menu_option_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "옵션항목 조회는 누구나 가능" ON menu_option_items
  FOR SELECT USING (true);

CREATE POLICY "옵션항목 수정은 서비스 역할만 가능" ON menu_option_items
  FOR ALL USING (auth.role() = 'service_role');

-- 5. order_items에 selected_options 컬럼 추가
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT NULL;
