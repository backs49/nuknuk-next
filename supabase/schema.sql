-- ================================================
-- 넉넉 디저트 관리자 시스템 — Supabase 스키마
-- ================================================
-- Supabase SQL Editor에서 실행하세요.

-- 1. 카테고리 테이블
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  emoji TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_sort_order ON menu_categories(sort_order);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "카테고리 조회는 누구나 가능" ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY "카테고리 수정은 서비스 역할만 가능" ON menu_categories
  FOR ALL USING (auth.role() = 'service_role');

-- 초기 카테고리 데이터
INSERT INTO menu_categories (id, name, name_en, emoji, sort_order) VALUES
  ('rice-cake', '떡', 'Rice Cake', '🍡', 1),
  ('cake', '케이크', 'Cake', '🎂', 2),
  ('cookie', '쿠키·구움과자', 'Cookies', '🍪', 3),
  ('beverage', '음료', 'Beverage', '🍵', 4)
ON CONFLICT (id) DO NOTHING;

-- 2. 메뉴 아이템 테이블
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL CHECK (category IN ('rice-cake', 'cake', 'cookie', 'beverage')),
  image TEXT,
  allergens TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);

-- 4. RLS (Row Level Security) 정책
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (사이트에서 메뉴 표시)
CREATE POLICY "메뉴 조회는 누구나 가능" ON menu_items
  FOR SELECT USING (true);

-- Service Role만 쓰기 가능 (API Route에서 서버키 사용)
CREATE POLICY "메뉴 수정은 서비스 역할만 가능" ON menu_items
  FOR ALL USING (auth.role() = 'service_role');

-- 5. 이미지 스토리지 버킷 생성
-- Supabase Dashboard > Storage에서 'menu-images' 버킷을 생성하고
-- 아래 정책을 적용하세요:
--
-- 공개 읽기:
--   CREATE POLICY "메뉴 이미지 공개 읽기" ON storage.objects
--     FOR SELECT USING (bucket_id = 'menu-images');
--
-- 서비스 역할 쓰기:
--   CREATE POLICY "메뉴 이미지 업로드" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'menu-images');

-- 6. 초기 데이터 (기존 하드코딩 메뉴 마이그레이션)
INSERT INTO menu_items (id, name, name_en, description, price, category, allergens, is_popular, is_new, sort_order) VALUES
  ('mugwort-songpyeon', '쑥 송편', NULL, '국내산 햅쑥으로 빚은 정성 가득 송편. 통깨와 꿀이 넉넉하게.', 15000, 'rice-cake', ARRAY['sesame'], TRUE, FALSE, 1),
  ('injeolmi', '인절미', 'Injeolmi', '고소한 국내산 콩고물을 아낌없이 묻힌 쫀득한 인절미.', 12000, 'rice-cake', ARRAY['soy'], TRUE, FALSE, 2),
  ('gyeongdan', '꿀 경단', NULL, '한 입 크기의 쫀득한 경단에 달콤한 꿀과 콩고물을 듬뿍.', 10000, 'rice-cake', ARRAY['soy', 'sesame'], FALSE, FALSE, 3),
  ('baekseolgi', '백설기', 'Baekseolgi', '순백의 설기. 쌀 본연의 담백한 맛과 부드러운 식감.', 18000, 'rice-cake', ARRAY[]::TEXT[], FALSE, TRUE, 4),
  ('rice-cake-roll', '떡 롤케이크', NULL, '쫀득한 떡 시트에 생크림과 제철 과일을 넉넉하게 말았습니다.', 32000, 'cake', ARRAY['dairy', 'egg', 'gluten'], TRUE, FALSE, 5),
  ('castella', '쌀 카스테라', NULL, '쌀가루로 만든 촉촉한 카스테라. 글루텐프리 옵션 가능.', 28000, 'cake', ARRAY['egg', 'dairy'], FALSE, FALSE, 6),
  ('tiramisu-tteok', '티라미수 떡케이크', NULL, '마스카포네 크림과 쫀득한 떡의 이색적인 만남.', 35000, 'cake', ARRAY['dairy', 'egg', 'gluten'], FALSE, TRUE, 7),
  ('rice-cookie', '쌀 버터쿠키', NULL, '바삭하면서도 입에서 사르르 녹는 쌀 버터쿠키 12개입.', 15000, 'cookie', ARRAY['dairy', 'egg'], TRUE, FALSE, 8),
  ('mugwort-financier', '쑥 휘낭시에', NULL, '국내산 쑥과 버터의 고소한 조화. 6개입.', 18000, 'cookie', ARRAY['dairy', 'egg', 'nut', 'gluten'], FALSE, FALSE, 9),
  ('yakgwa', '미니 약과', 'Mini Yakgwa', '참기름과 꿀로 정성껏 만든 전통 약과. 8개입.', 16000, 'cookie', ARRAY['gluten', 'sesame'], FALSE, TRUE, 10),
  ('sikhye', '수제 식혜', NULL, '직접 만든 전통 식혜. 달콤하고 시원한 맛.', 5000, 'beverage', ARRAY[]::TEXT[], FALSE, FALSE, 11),
  ('omija-ade', '오미자 에이드', NULL, '새콤달콤한 오미자청에 탄산을 더한 시그니처 음료.', 6000, 'beverage', ARRAY[]::TEXT[], TRUE, FALSE, 12),
  ('misugaru-latte', '미숫가루 라떼', NULL, '고소한 미숫가루와 우유의 부드러운 조화.', 5500, 'beverage', ARRAY['dairy', 'soy'], FALSE, FALSE, 13)
ON CONFLICT (id) DO NOTHING;
