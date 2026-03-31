-- supabase/banner-settings.sql
-- 상단 공지 배너 설정

INSERT INTO shop_settings (key, value, label, description) VALUES
  ('banner_enabled', 'false', '배너 활성화', '상단 공지 배너 표시 여부 (true/false)'),
  ('banner_text', '', '배너 문구', '상단에 표시할 공지 문구'),
  ('banner_link', '', '배너 링크', '배너 클릭 시 이동할 URL (비워두면 링크 없음)'),
  ('banner_bg_color', '#6B8E23', '배너 배경색', '배너 배경 색상 (HEX)'),
  ('banner_text_color', '#FFFFFF', '배너 글자색', '배너 글자 색상 (HEX)')
ON CONFLICT (key) DO NOTHING;
