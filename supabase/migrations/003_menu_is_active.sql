-- ================================================
-- 2026-04-05: 메뉴 공개/숨김 상태 추가
-- ================================================

-- 메뉴 활성 여부 컬럼 추가 (기본값 TRUE — 기존 메뉴는 모두 공개 상태 유지)
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 활성 메뉴 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active
  ON menu_items(is_active);
