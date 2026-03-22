# 장바구니 시스템 + 메뉴 개선 설계 (1단계)

## 목표

개별 상품 주문 방식을 장바구니 기반 일괄 결제로 전환하고, 상담형 상품 지원을 추가하여 고객 주문 경험을 개선한다.

## 범위

- 장바구니 시스템 (세션 기반, React Context + sessionStorage)
- 메뉴카드 버튼 개선 (수량/담기/바로구매)
- "상담 후 결정" 배지 및 가격 숨김 기능
- 헤더/히어로/CTA 버튼 전환 (예약하기 → 장바구니)

**범위 밖:** 예약확인 페이지 (2단계 별도 스펙)

---

## 1. DB 스키마 변경

### menu_items 테이블 컬럼 추가

```sql
ALTER TABLE menu_items ADD COLUMN is_consultation BOOLEAN DEFAULT false;
ALTER TABLE menu_items ADD COLUMN hide_price BOOLEAN DEFAULT false;
```

- `is_consultation`: true이면 장바구니/바로구매 버튼 대신 "상담하기" 버튼 표시
- `hide_price`: true이면 프론트에서 가격 대신 "상담 후 결정" 텍스트 표시. 가격은 DB에 저장되어 관리자가 참고 가능.

### 타입 확장

`data/menu.ts`의 `MenuItem` 인터페이스에 추가:

```typescript
export interface MenuItem {
  // ... 기존 필드
  isConsultation?: boolean;
  hidePrice?: boolean;
}
```

`lib/menu-db.ts`의 `toMenuItem()` 변환 함수에 매핑 추가.

### 관리자 MenuForm 변경

`components/admin/MenuForm.tsx`에 체크박스 2개 추가:
- "상담 후 결정" 체크박스 (`is_consultation`) — 체크 시 "가격 숨기기" 체크박스 활성화
- "가격 숨기기" 체크박스 (`hide_price`) — `is_consultation`이 true일 때만 활성화

---

## 2. 장바구니 상태 관리 (CartProvider)

### 파일: `components/CartProvider.tsx`

React Context + sessionStorage 기반. `ReservationProvider`를 대체한다.

### CartItem 타입

```typescript
interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
}
```

### Context 인터페이스

```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;       // 이미 있으면 수량 합산
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;                       // 전체 수량 합계
  totalPrice: number;                       // 전체 금액 합계
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}
```

### 동작 규칙

- `addItem`: 동일 menuItemId가 이미 있으면 수량을 합산한다.
- 수량 범위: 1~99.
- 상태 변경 시 `sessionStorage`에 `cart-items` 키로 JSON 직렬화하여 저장.
- 초기 로드 시 `sessionStorage`에서 복원. 없으면 빈 배열.
- 탭을 닫으면 sessionStorage가 초기화되어 장바구니도 사라짐.

### layout.tsx 적용

`app/layout.tsx`에서 `ReservationProvider`를 `CartProvider`로 교체:

```tsx
// Before
<ReservationProvider>{children}</ReservationProvider>

// After
<CartProvider>{children}</CartProvider>
```

---

## 3. 메뉴카드 개선 (MenuCard)

### 파일: `components/MenuCard.tsx`

현재 하단에 "주문하기" Link 버튼 1개 → 상품 유형에 따라 분기.

### 일반 상품 (isConsultation !== true)

카드 하단 버튼 영역:

```
[ − 1 + ]  [ 담기 ]  [ 바로구매 ]
```

- **수량 스테퍼**: 1~99 범위, − / + 버튼
- **담기 버튼**: `sage-400` 아웃라인. 클릭 시 CartProvider의 `addItem` 호출 + 슬라이드 패널 자동 열기 (또는 토스트 알림)
- **바로구매 버튼**: `sage-400` 채움. 클릭 시 `/order/[menuItemId]?qty={수량}` 으로 이동 (기존 개별 주문 플로우 유지)

### 상담 상품 (isConsultation === true)

- 가격 위치: `hidePrice`이면 "상담 후 결정" 텍스트 (blush-400 색상)
- 배지: "상담 후 결정" 배지 추가 (blush-400, 기존 인기/NEW 배지와 동일 스타일)
- 버튼: 수량/담기/바로구매 대신 "💬 상담하기 (Instagram DM)" 버튼 1개. 인스타그램 DM 링크로 이동.

### 카드 높이 통일

- 카드 컨테이너: `flex flex-col` + 동일 min-height
- 버튼 영역: `mt-auto`로 항상 카드 하단 고정
- 상담 상품도 일반 상품과 동일한 카드 높이 유지

---

## 4. 장바구니 슬라이드 패널 (CartSlidePanel)

### 파일: `components/CartSlidePanel.tsx`

### 구조

화면 오른쪽에서 슬라이드로 열리는 패널. 배경에 반투명 오버레이.

```
┌──────────────────────────────┐
│ 장바구니  3              ✕   │ ← 헤더 (상품 수 + 닫기)
├──────────────────────────────┤
│                              │
│ 쑥 송편                 ✕    │ ← 상품별 행
│ 95,000원 / 개                │
│ [− 2 +]          190,000원   │ ← 수량 조절 + 소계
│                              │
│ ─────────────────────────── │
│                              │
│ 인절미                  ✕    │
│ 92,000원 / 개                │
│ [− 1 +]           92,000원   │
│                              │
├──────────────────────────────┤
│ 상품 합계 (3개)   282,000원  │ ← 합계
│ 총 결제금액       282,000원  │
│                              │
│ ┌──────────────────────────┐ │
│ │       결제하기            │ │ ← /cart/checkout으로 이동
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 동작

- **열기**: 헤더 장바구니 버튼 클릭, 또는 "담기" 버튼 클릭 시 자동 열기
- **닫기**: ✕ 버튼, 오버레이 클릭, ESC 키
- **수량 수정**: 스테퍼로 조절 (1 미만 시 삭제 확인)
- **삭제**: ✕ 버튼으로 개별 삭제
- **비었을 때**: "장바구니가 비어있습니다" + "메뉴 보기" 버튼 (메뉴 섹션으로 스크롤)
- **결제하기**: `/cart/checkout`으로 이동

### 애니메이션

- 열기: `translate-x-full` → `translate-x-0` (300ms ease-out)
- 닫기: `translate-x-0` → `translate-x-full` (200ms ease-in)
- 오버레이: `opacity-0` → `opacity-50` 페이드

---

## 5. 일괄 결제 페이지

### 파일: `app/cart/checkout/page.tsx`

### 플로우

1. CartProvider에서 장바구니 items를 읽어 주문 요약 표시
2. 고객 정보 입력 (이름, 전화번호, 이메일, 수령 방식, 메모)
3. "결제하기" 클릭 → POST `/api/orders` (items 배열로 다건 주문 생성)
4. 주문 생성 성공 → 토스 결제 위젯으로 결제
5. 결제 성공 → `/pay/success` → 장바구니 비우기

### 주문 API 확장

현재 `/api/orders` POST는 단일 menuItemId + quantity를 받는다. 다건 주문을 지원하도록 확장:

```typescript
// 기존: 단일 상품
{ menuItemId: string, quantity: number, ... }

// 확장: 복수 상품 (items 배열이 있으면 다건 처리)
{
  items: [
    { menuItemId: string, quantity: number },
    { menuItemId: string, quantity: number },
  ],
  customerName: string,
  customerPhone: string,
  // ... 나머지 동일
}
```

기존 단일 상품 요청도 하위 호환 유지 (바로구매에서 사용).

### 고객 정보 폼

`OrderForm` 컴포넌트의 고객 정보 입력 부분을 재사용하되, 상품 선택 영역은 장바구니 요약으로 대체.

---

## 6. 헤더/히어로/CTA 변경

### Header.tsx

- "예약하기" 버튼 → 🛒 장바구니 버튼
- 장바구니에 상품이 있으면 `blush-400` 배경 원형 배지로 수량 표시
- 클릭 시: 상품이 있으면 `CartSlidePanel` 열기, 없으면 `#menu` 섹션으로 스크롤
- `useReservation()` → `useCart()` 전환
- 모바일 메뉴에서도 동일하게 장바구니 버튼으로 변경

### HeroSection.tsx

- "예약하기" 버튼 → "장바구니 보기" 버튼
- 클릭 시: 상품이 있으면 패널 열기, 없으면 `#menu`로 스크롤
- `useReservation()` → `useCart()` 전환

### CTASection.tsx

- "지금 예약하기" → "장바구니 보기"
- 네이버 예약 링크는 유지 (별도 예약 채널로)
- `useReservation()` → `useCart()` 전환

---

## 7. 제거 대상

### ReservationProvider / ReservationModal

- `components/ReservationProvider.tsx` — `CartProvider`로 대체, 파일 삭제
- `components/ReservationModal.tsx` — 더 이상 사용하지 않음, 파일 삭제
- 인스타그램 DM 링크: 상담 상품 카드 + 푸터에서 접근 가능

### 개별 주문 페이지 (유지)

- `app/order/[menuItemId]/page.tsx` — **유지**. "바로구매" 버튼에서 사용.
- `components/order/OrderForm.tsx` — **유지**. 바로구매 + 일괄 결제에서 고객 정보 부분 재사용.

---

## 8. 파일 구조 요약

### 새로 생성

| 파일 | 역할 |
|------|------|
| `components/CartProvider.tsx` | 장바구니 Context + sessionStorage |
| `components/CartSlidePanel.tsx` | 오른쪽 슬라이드 장바구니 패널 |
| `app/cart/checkout/page.tsx` | 일괄 결제 페이지 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `components/MenuCard.tsx` | 주문하기 → 수량/담기/바로구매 또는 상담하기 |
| `components/Header.tsx` | 예약하기 → 장바구니 버튼 + 배지 |
| `components/HeroSection.tsx` | 예약하기 → 장바구니 보기 |
| `components/CTASection.tsx` | 예약하기 → 장바구니 보기 |
| `components/admin/MenuForm.tsx` | 상담/가격숨김 체크박스 추가 |
| `data/menu.ts` | MenuItem에 isConsultation, hidePrice 추가 |
| `lib/menu-db.ts` | toMenuItem()에 새 필드 매핑 |
| `app/api/orders/route.ts` | 다건 주문(items 배열) 지원 |
| `app/layout.tsx` | ReservationProvider → CartProvider |
| `supabase/schema.sql` | menu_items 컬럼 추가 마이그레이션 |

### 삭제

| 파일 | 사유 |
|------|------|
| `components/ReservationProvider.tsx` | CartProvider로 대체 |
| `components/ReservationModal.tsx` | 장바구니 패널로 대체 |
