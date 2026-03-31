# 상품 리뷰 시스템 설계

## 목표

상품 상세 페이지에 고객 리뷰 섹션을 추가하여, 주문 완료 고객이 별점·텍스트·사진 후기를 남기고, 관리자가 답글·관리할 수 있도록 한다. 리뷰 작성 시 포인트를 차등 자동 지급하여 후기 참여를 유도한다.

## 전제 조건

- `NEXT_PUBLIC_ENABLE_REVIEW=true` 환경변수로 기능 전체 ON/OFF 제어.
- `false`이면 리뷰 섹션 숨김, API 비활성(403 반환).
- `lib/feature-flags.ts`에 `REVIEW_ENABLED` 상수 추가.
- 포인트 지급은 `COUPON_POINT_ENABLED`도 `true`일 때만 동작. 리뷰 자체는 포인트 시스템과 독립적으로 노출 가능.

## DB 스키마

### `reviews` 테이블

```sql
CREATE TABLE reviews (
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
```

- `order_id + menu_item_id` 유니크: 같은 주문의 같은 상품에 대해 1회만 리뷰 작성 가능.
- `customer_phone`, `customer_name`: 주문 테이블에서 가져온 값. 프론트에서 마스킹 표시 (김** 등).

### `shop_settings` 추가 키

| key | value | label | description |
|-----|-------|-------|-------------|
| `review_point_text` | `300` | 텍스트 리뷰 포인트 | 텍스트만 작성 시 지급 포인트 |
| `review_point_photo` | `500` | 사진 리뷰 포인트 | 사진 포함 리뷰 시 지급 포인트 |

## 리뷰 작성 자격 확인

### 인증 방식: 주문번호 + 전화번호

1. 고객이 "리뷰 작성" 버튼 클릭
2. 주문번호(NUK-XXXXXXXX-NNN)와 전화번호 입력
3. 서버에서 검증:
   - 해당 주문번호가 존재하는가
   - 전화번호가 주문의 `customer_phone`과 일치하는가
   - 주문 상태가 `completed`인가
   - 해당 주문+상품에 이미 리뷰가 존재하지 않는가
4. 검증 성공 시 주문에 포함된 상품 목록 반환 → 고객이 리뷰할 상품 선택

### 검증 API

`POST /api/reviews/verify`

```typescript
// Request
{ orderNumber: string; phone: string }

// Response (성공)
{
  verified: true;
  orderId: string;
  customerName: string;
  items: Array<{
    menuItemId: string;
    menuItemName: string;
    hasReview: boolean;  // 이미 리뷰 작성 여부
  }>;
}

// Response (실패)
{ verified: false; message: string }
```

## 리뷰 작성

### 작성 폼 구성

- 별점: 1~5 별 선택 (필수)
- 텍스트: 최소 10자, 최대 500자 (필수)
- 사진: 최대 3장, Supabase Storage `review-images` 버킷 업로드 (선택)

### 작성 API

`POST /api/reviews`

```typescript
// Request
{
  orderId: string;
  menuItemId: string;
  phone: string;
  rating: number;
  content: string;
  imageUrls: string[];
}

// Response
{
  review: Review;
  pointRewarded: number;  // 0이면 포인트 미지급 (COUPON_POINT_ENABLED=false)
}
```

### 포인트 지급 로직

1. `COUPON_POINT_ENABLED`가 `false`이면 포인트 미지급 (review.point_rewarded = 0).
2. `imageUrls.length > 0`이면 `review_point_photo` 설정값, 아니면 `review_point_text` 설정값 지급.
3. 주문의 `customer_id`로 고객 조회 → `add_points` RPC 호출 (type: `earn`, description: `리뷰 작성 포인트`).
4. `review.point_rewarded`에 지급액 기록.

## 리뷰 노출

### 상품 상세 페이지 — ReviewSection 컴포넌트

- 배치: 상세 설명 블록 아래, 별도 white 카드 (`bg-white rounded-2xl shadow-sm`)
- `REVIEW_ENABLED`가 `false`이면 렌더링하지 않음

#### 상단 요약 영역

- 좌측: 평균 별점 (소수점 1자리) + 별 아이콘 + 별점별 분포 바
- 우측: "리뷰 작성" 버튼 (sage-400)
- 리뷰 수 표시: "고객 리뷰 N개"

#### 리뷰 목록

- 최신순 정렬
- 각 리뷰: 별점, 마스킹 이름(첫 글자 + **), 날짜, 텍스트, 사진 썸네일(64px 라운딩)
- 사진 클릭 시 라이트박스(큰 이미지 보기)는 범위 외 — 1차에서는 썸네일만
- 관리자 답글: `bg-gray-50` 배경 + sage 색 좌측 세로선 + "넉넉 디저트" 라벨
- `is_visible = false`인 리뷰는 표시하지 않음

#### 빈 상태

- "아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!"

#### 페이지네이션

- 초기 5개 표시, "더보기" 버튼으로 5개씩 추가 로드
- 서버 사이드: 첫 5개는 SSR, 추가 로드는 클라이언트 fetch

### 데이터 흐름

#### 서버 사이드 (`app/menu/[id]/page.tsx`)

`REVIEW_ENABLED`가 true일 때:
1. 해당 상품의 리뷰 조회: `getReviewsByMenuItem(menuItemId, { limit: 5 })`
2. 별점 요약 조회: `getReviewSummary(menuItemId)` → `{ averageRating, totalCount, distribution }`
3. `reviewData` prop으로 `MenuDetailClient`에 전달

```typescript
interface ReviewData {
  reviews: Review[];
  summary: {
    averageRating: number;
    totalCount: number;
    distribution: Record<number, number>; // { 5: 10, 4: 2, 3: 0, 2: 0, 1: 0 }
  };
}
```

## 관리자 기능

### `/admin/reviews` 페이지

- 리뷰 목록 테이블: 상품명, 작성자, 별점, 내용 미리보기, 날짜, 상태(노출/숨김)
- 필터: 전체 / 답글 미작성 / 숨김 처리됨
- 각 리뷰 행에서:
  - **답글 작성/수정**: 인라인 텍스트 입력
  - **숨김/노출 토글**: `is_visible` 변경
  - **삭제**: 확인 모달 → 리뷰 삭제 + 지급 포인트 회수 (`deduct_points`)

### 관리자 API

- `GET /api/admin/reviews` — 리뷰 목록 (필터, 페이지네이션)
- `PATCH /api/admin/reviews/[id]` — 답글 작성, 숨김 토글
- `DELETE /api/admin/reviews/[id]` — 리뷰 삭제 + 포인트 회수

### 포인트 회수 로직

리뷰 삭제 시:
1. `review.point_rewarded > 0`이고 `COUPON_POINT_ENABLED`가 true이면
2. 주문의 `customer_id` 조회
3. `deduct_points` RPC 호출 (type: `admin_deduct`, description: `리뷰 삭제 포인트 회수`)

## 리뷰 작성 폼 UI 플로우

### Step 1: 인증

```
┌─────────────────────────────────┐
│   리뷰 작성                      │
│                                  │
│   주문번호  [NUK-________-___]   │
│   전화번호  [010-____-____]      │
│                                  │
│          [확인]                   │
└─────────────────────────────────┘
```

### Step 2: 상품 선택 (주문에 여러 상품이 있을 경우)

```
┌──────────────────────────────────┐
│   리뷰할 상품을 선택하세요         │
│                                   │
│   ○ 꽃도장송편                    │
│   ○ 바람떡 (이미 작성됨) ← 비활성  │
│                                   │
│          [다음]                    │
└──────────────────────────────────┘
```

### Step 3: 리뷰 작성

```
┌─────────────────────────────────────┐
│   꽃도장송편 리뷰 작성               │
│                                      │
│   ☆ ☆ ☆ ☆ ☆  별점을 선택하세요      │
│                                      │
│   ┌──────────────────────────────┐   │
│   │ 리뷰를 작성해주세요 (10~500자) │   │
│   │                              │   │
│   └──────────────────────────────┘   │
│                                      │
│   📷 사진 추가 (최대 3장)            │
│   [+] [+] [+]                        │
│                                      │
│   💡 사진 포함 시 500P, 텍스트만 300P │
│                                      │
│          [리뷰 등록]                  │
└─────────────────────────────────────┘
```

## 컴포넌트 구조

### 새 파일

- `lib/review-db.ts` — 리뷰 CRUD, 별점 요약, 포인트 연동
- `components/menu/ReviewSection.tsx` — 리뷰 목록 + 별점 요약 (서버 데이터 기반)
- `components/menu/ReviewForm.tsx` — 리뷰 작성 폼 (인증 → 상품 선택 → 작성)
- `app/api/reviews/route.ts` — 리뷰 작성 API (POST)
- `app/api/reviews/verify/route.ts` — 주문 검증 API (POST)
- `app/api/admin/reviews/route.ts` — 관리자 리뷰 목록 (GET)
- `app/api/admin/reviews/[id]/route.ts` — 관리자 답글/숨김/삭제 (PATCH, DELETE)
- `app/admin/reviews/page.tsx` — 관리자 리뷰 관리 페이지

### 수정 파일

- `lib/feature-flags.ts` — `REVIEW_ENABLED` 추가
- `app/menu/[id]/page.tsx` — 리뷰 데이터 서버 사이드 조회
- `components/menu/MenuDetailClient.tsx` — ReviewSection 배치 (상세 설명 아래)

## 범위 외

- 고객 리뷰 수정 (삭제 후 재작성으로 대체)
- 리뷰 신고 기능 (소규모 운영이므로 불필요)
- 리뷰 정렬/필터 (최신순/별점순) — 리뷰 수가 적은 초기엔 최신순 고정
- 사진 라이트박스 (1차에서는 썸네일만 표시)
- 메인 페이지 리뷰 캐러셀 (추후 별도 기능으로 추가 가능)
