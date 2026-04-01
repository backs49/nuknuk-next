# FAQ 섹션 설계 스펙

## 목적

자주 묻는 질문을 홈페이지 메인에 노출하여 카카오톡 상담 부담을 줄이고, 고객이 주문 전 궁금증을 즉시 해소할 수 있도록 한다.

## 요구사항 요약

- 홈페이지 메인에 아코디언 형태의 FAQ 섹션 추가 (LocationSection 아래, InstagramFeed 위)
- 관리자가 FAQ 항목을 추가/수정/삭제/순서 변경 가능
- 카테고리 분류 없이 단순 목록
- 고객은 읽기만 가능 (질문 입력 없음)
- `NEXT_PUBLIC_ENABLE_FAQ` 환경변수로 섹션 활성화/비활성화

## 데이터베이스

### `faq_items` 테이블

```sql
CREATE TABLE faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_faq_items_sort ON faq_items(sort_order);
```

- `question`: 질문 텍스트
- `answer`: 답변 텍스트
- `sort_order`: 표시 순서 (낮을수록 먼저 표시)
- `is_active`: 개별 항목 활성/비활성

## API

### 공개 API

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/api/faq` | GET | 활성 FAQ 목록 조회 (sort_order 오름차순) |

- `force-dynamic` 설정으로 Vercel 캐시 방지
- `is_active = true`인 항목만 반환
- 반환 필드: id, question, answer, sort_order

### 관리자 API

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/api/admin/faq` | GET | 전체 FAQ 목록 (비활성 포함) |
| `/api/admin/faq` | POST | FAQ 항목 추가 |
| `/api/admin/faq/[id]` | PUT | FAQ 항목 수정 (질문, 답변, 활성 여부) |
| `/api/admin/faq/[id]` | DELETE | FAQ 항목 삭제 |
| `/api/admin/faq/reorder` | PUT | 순서 변경 (id 배열 순서대로 sort_order 업데이트) |

모든 관리자 API는 `force-dynamic` 설정.

## 관리자 페이지 (`/admin/faq`)

### 레이아웃

- 제목: "FAQ 관리"
- 설명: "자주 묻는 질문을 관리합니다."
- 우측 상단: [항목 추가] 버튼

### 목록

- 카드 형태로 각 항목 표시
- 각 카드에 표시: 질문 (굵게), 답변 (아래에 회색), 활성/비활성 토글
- 각 카드 액션: ▲▼ 순서 버튼, 수정 버튼, 삭제 버튼
- 비활성 항목은 시각적으로 구분 (opacity 낮춤)

### 추가/수정

- 인라인 폼: 목록 상단에 질문 input + 답변 textarea + 저장 버튼
- 수정 시: 해당 카드가 편집 모드로 전환

## 고객 화면 (`FAQSection` 컴포넌트)

### 위치

홈페이지 메인, LocationSection 아래 / InstagramFeed 위.

### UI

- 섹션 제목: "자주 묻는 질문" (영문 서브: "FAQ")
- 아코디언 UI: 질문 클릭 시 답변 펼침/접힘
- 한 번에 하나만 펼쳐짐 (다른 항목 클릭 시 이전 항목 자동 접힘)
- Framer Motion으로 펼침/접힘 애니메이션
- FadeIn 래퍼로 스크롤 등장 효과 (기존 섹션 패턴 동일)
- 하단에 "더 궁금한 점이 있으신가요?" + 카카오톡 채널 링크

### 헤더 연동

- 헤더 네비게이션에 "FAQ" 링크 추가 (`href="#faq"`)
- FAQ 섹션에 `id="faq"` 설정

### 환경변수 제어

- `NEXT_PUBLIC_ENABLE_FAQ !== 'true'`이면 FAQSection 렌더링하지 않음
- 헤더 네비의 FAQ 링크도 함께 숨김

## 환경변수

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_ENABLE_FAQ` | FAQ 섹션 활성화 | 미설정 시 비활성 |

## 파일 구조

### 신규 생성

- `supabase/faq-schema.sql` — DDL
- `lib/faq-db.ts` — DB 함수 (getActiveFAQs, getAllFAQs, createFAQ, updateFAQ, deleteFAQ, reorderFAQs)
- `app/api/faq/route.ts` — 공개 API
- `app/api/admin/faq/route.ts` — 관리자 목록 조회 + 추가
- `app/api/admin/faq/[id]/route.ts` — 관리자 수정 + 삭제
- `app/api/admin/faq/reorder/route.ts` — 순서 변경
- `app/admin/faq/page.tsx` — 관리자 FAQ 관리 페이지
- `components/FAQSection.tsx` — 고객 화면 아코디언 컴포넌트

### 수정

- `app/page.tsx` — FAQSection 추가
- `app/admin/layout.tsx` — FAQ 관리 네비 항목 추가
- `components/Header.tsx` — FAQ 네비 링크 추가
- `.env.example` — NEXT_PUBLIC_ENABLE_FAQ 추가

## 범위 외

- 카테고리 분류
- 고객 질문 입력
- 검색 기능
- 답변에 이미지/링크 등 리치 텍스트
