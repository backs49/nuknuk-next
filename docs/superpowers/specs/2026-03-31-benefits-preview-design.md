# 상품 상세 혜택 미리보기 설계

## 목표

상품 상세 페이지에 네이버 쇼핑 스타일의 혜택 미리보기 섹션을 추가하여, 고객이 주문 시 받을 수 있는 최대 혜택을 미리 보여준다.

## 전제 조건

- `COUPON_POINT_ENABLED === true`일 때만 렌더링. false이면 혜택 섹션 전체 숨김.
- 각 항목은 기존 관리자 설정/쿠폰 템플릿 상태에 따라 자동으로 노출 여부 결정. 별도 토글 설정 없음.

## 표시 항목

### 1. 포인트 적립 예상

- **노출 조건**: `shop_settings.point_earn_rate > 0`
- **표시 형식**: "구매 적립 {금액}P"
- **계산**: `Math.floor(상품 기본가 × point_earn_rate)`
- **동적 업데이트**: 옵션 선택으로 가격 변동 시 `totalPrice` 기준으로 재계산

### 2. 첫 주문 쿠폰

- **노출 조건**: `coupon_templates` 테이블에 `auto_trigger = 'first_order'`이고 `is_active = true`인 템플릿이 1개 이상 존재
- **표시 형식**:
  - `type = 'fixed'`: "첫 주문 시 {value}원 할인"
  - `type = 'percent'`: "첫 주문 시 {value}% 할인" (max_discount가 있으면 "(최대 {max_discount}원)" 부기)
  - `type = 'free_shipping'`: "첫 주문 시 무료배송"
- **여러 개인 경우**: 가장 혜택이 큰 1개만 표시 (fixed 기준 value가 가장 큰 것, percent는 기본가 기준 할인액 계산 후 비교)

### 3. 추천인 혜택

- **노출 조건**: `shop_settings.referral_reward_points > 0`
- **표시 형식**: "친구 추천 시 {referral_reward_points}P"

### 4. 최대 혜택가

- **노출 조건**: 위 항목 중 1개 이상 활성일 때 표시
- **계산**: `기본가 - 첫주문 쿠폰 할인액` (포인트는 현금 할인이 아니므로 혜택가에서 제외)
- **표시 형식**: "최대 혜택가 {금액}원"
- **동적 업데이트**: 옵션 선택으로 가격 변동 시 재계산

## 배치 위치

- **PC (lg:)**: 우측 컬럼 — 가격 표시 바로 아래, 옵션 선택 영역 위
- **모바일**: 가격 아래, 옵션 선택 위 (동일 순서)
- 가격이 있는 동일 white 카드(bg-white) 안에 포함, 점선 구분선으로 분리

## 데이터 흐름

### 서버 사이드 (app/menu/[id]/page.tsx)

`COUPON_POINT_ENABLED`가 true일 때만 아래 데이터를 조회:

1. `getSetting('point_earn_rate')` → 포인트 적립률
2. `getSetting('referral_reward_points')` → 추천 보상 포인트
3. 활성 첫주문 쿠폰 템플릿 조회: `coupon_templates` where `auto_trigger = 'first_order'` AND `is_active = true`

이 데이터를 `benefitsData` prop으로 `MenuDetailClient`에 전달:

```typescript
interface BenefitsData {
  pointEarnRate: number;           // 0이면 포인트 적립 미표시
  referralRewardPoints: number;    // 0이면 추천 혜택 미표시
  firstOrderCoupon: {              // null이면 첫주문 쿠폰 미표시
    type: 'fixed' | 'percent' | 'free_shipping' | 'free_item';
    value: number;
    maxDiscount: number | null;
  } | null;
}
```

### 클라이언트 (BenefitsPreview 컴포넌트)

Props:
- `benefitsData: BenefitsData`
- `basePrice: number` (상품 기본가)
- `totalPrice: number` (옵션 포함 현재 가격)

컴포넌트 내부에서 조건부 렌더링:
- `pointEarnRate > 0` → 포인트 적립 라인
- `firstOrderCoupon !== null` → 첫주문 쿠폰 라인
- `referralRewardPoints > 0` → 추천 혜택 라인
- 위 중 1개 이상 → 최대 혜택가 라인

모든 조건이 false이면 컴포넌트 자체를 렌더링하지 않음 (null 반환).

## 컴포넌트 구조

### 새 파일

- `components/menu/BenefitsPreview.tsx` — 혜택 미리보기 UI 컴포넌트

### 수정 파일

- `app/menu/[id]/page.tsx` — 서버에서 benefitsData 조회 후 props 전달
- `components/menu/MenuDetailClient.tsx` — BenefitsPreview 컴포넌트 배치 (가격 아래, 옵션 위)

## 디자인 상세

- 가격 블록과 동일 카드 내 배치, 점선(`border-dashed`) 구분선으로 분리
- 배경: 연한 녹색 (`bg-[#F8FFF0]` 또는 `bg-sage-50`)
- 제목: "🎁 혜택 안내" (text-sm font-semibold)
- 각 라인: flex justify-between, 좌측 라벨(text-charcoal-200), 우측 값(font-semibold)
- 포인트 값: sage-400 색상
- 쿠폰 할인: blush-400 색상
- 최대 혜택가: 점선 상단 구분, blush-400 + font-bold 강조
- 라운드: 카드 내부이므로 별도 라운딩 불필요, 패딩만 적용

## 범위 외

- 로그인/비로그인 구분 없이 동일하게 표시 (범용 혜택 안내)
- 고객별 보유 쿠폰/포인트 조회는 주문 단계(CouponPointSection)에서 처리
- 관리자 설정 UI 변경 없음 (기존 설정 자동 감지)
