# 장바구니 시스템 + 메뉴 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개별 상품 주문 방식을 장바구니 기반 일괄 결제로 전환하고, 상담형 상품 지원을 추가한다.

**Architecture:** CartProvider(React Context + sessionStorage)를 `app/layout.tsx`에 배치하여 모든 라우트에서 장바구니 접근 가능. MenuCard에서 담기/바로구매 분기, CartSlidePanel로 장바구니 확인, `/cart/checkout`에서 다건 일괄 결제. 상담 상품은 `is_consultation`/`hide_price` 플래그로 분기.

**Tech Stack:** Next.js 14 App Router, TypeScript, React Context, sessionStorage, Tailwind CSS, Framer Motion, Supabase, Toss Payments SDK

**Spec:** `docs/superpowers/specs/2026-03-22-cart-system-and-menu-improvements-design.md`

---

## 파일 구조

### 새로 생성

| 파일 | 역할 |
|------|------|
| `components/CartProvider.tsx` | 장바구니 Context + sessionStorage 동기화 |
| `components/CartSlidePanel.tsx` | 오른쪽 슬라이드 장바구니 패널 UI |
| `app/cart/checkout/page.tsx` | 일괄 결제 페이지 (고객 정보 + 결제) |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `data/menu.ts` | MenuItem에 `isConsultation?`, `hidePrice?` 추가 |
| `lib/menu-db.ts` | DbMenuItem에 `is_consultation`, `hide_price` 추가 + toMenuItem 매핑 |
| `supabase/schema.sql` | menu_items 컬럼 추가 ALTER 문 |
| `components/admin/MenuForm.tsx` | MenuFormData에 `is_consultation`, `hide_price` 추가 + 체크박스 UI |
| `components/MenuCard.tsx` | 주문하기 → 수량/담기/바로구매 또는 상담하기 분기 |
| `app/layout.tsx` | CartProvider 래핑 추가 |
| `app/page.tsx` | ReservationProvider 제거 |
| `components/Header.tsx` | 예약하기 → 장바구니 버튼 + 수량 배지 |
| `components/HeroSection.tsx` | 예약하기 → 장바구니 보기 |
| `components/CTASection.tsx` | 지금 예약하기 → 장바구니 보기 |
| `app/api/orders/route.ts` | 다건 주문(items 배열) 지원 |

### 삭제

| 파일 | 사유 |
|------|------|
| `components/ReservationProvider.tsx` | CartProvider로 대체 |
| `components/ReservationModal.tsx` | 장바구니 패널로 대체 |

---

## Task 1: DB 스키마 + 타입 확장

`menu_items` 테이블에 상담 상품 관련 컬럼을 추가하고, TypeScript 타입을 업데이트한다.

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `data/menu.ts:19-31`
- Modify: `lib/menu-db.ts:142-156` (DbMenuItem) + `lib/menu-db.ts:159-170` (toMenuItem)

- [ ] **Step 1: schema.sql에 ALTER 문 추가**

`supabase/schema.sql` 파일 맨 아래에 마이그레이션 추가:

```sql
-- 2026-03-22: 상담 상품 지원
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_consultation BOOLEAN DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS hide_price BOOLEAN DEFAULT false;
```

- [ ] **Step 2: MenuItem 인터페이스 확장**

`data/menu.ts`의 `MenuItem` 인터페이스에 두 필드 추가:

```typescript
export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  allergens: Allergen[];
  isPopular?: boolean;
  isNew?: boolean;
  isConsultation?: boolean;  // 추가
  hidePrice?: boolean;       // 추가
}
```

- [ ] **Step 3: DbMenuItem 인터페이스 확장**

`lib/menu-db.ts`의 `DbMenuItem`에 추가:

```typescript
export interface DbMenuItem {
  // ... 기존 필드 유지
  is_consultation: boolean;  // 추가
  hide_price: boolean;       // 추가
}
```

- [ ] **Step 4: toMenuItem 매핑 추가**

`lib/menu-db.ts`의 `toMenuItem()` 함수 return 객체에 추가:

```typescript
isConsultation: db.is_consultation,
hidePrice: db.hide_price,
```

- [ ] **Step 5: toDbMenuItem 함수에 새 필드 매핑 추가**

`lib/menu-db.ts`의 `toDbMenuItem()` 함수(line 175-190) return 객체에 추가:

```typescript
is_consultation: item.isConsultation ?? false,
hide_price: item.hidePrice ?? false,
```

이 함수는 Supabase 미연결 시 fallback으로 사용되므로, 새 필드가 없으면 `getMenuItem()` fallback 결과에 필드가 누락될 수 있다.

- [ ] **Step 6: Supabase에서 ALTER 실행**

Supabase SQL Editor에서 ALTER 문 실행:

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_consultation BOOLEAN DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS hide_price BOOLEAN DEFAULT false;
```

- [ ] **Step 7: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공 (기존 코드에 영향 없음 — 새 필드는 optional)

- [ ] **Step 8: 커밋**

```bash
git add supabase/schema.sql data/menu.ts lib/menu-db.ts
git commit -m "feat: menu_items에 is_consultation, hide_price 컬럼 및 타입 추가"
```

---

## Task 2: 관리자 MenuForm 상담 체크박스 추가

관리자 메뉴 추가/수정 폼에 "상담 후 결정" 및 "가격 숨기기" 체크박스를 추가한다.

**Files:**
- Modify: `components/admin/MenuForm.tsx:16-28` (MenuFormData) + 폼 UI 영역

- [ ] **Step 1: MenuFormData 인터페이스 확장**

`components/admin/MenuForm.tsx`의 `MenuFormData`에 추가:

```typescript
export interface MenuFormData {
  id: string;
  name: string;
  name_en: string;
  description: string;
  price: number;
  category: string;
  image: string;
  allergens: string[];
  is_popular: boolean;
  is_new: boolean;
  is_consultation: boolean;  // 추가
  hide_price: boolean;       // 추가
  sort_order: number;
}
```

- [ ] **Step 2: 초기값에 새 필드 추가**

MenuForm 컴포넌트 내부의 `useState` 초기값(또는 props에서 받는 초기 데이터)에 `is_consultation: false`, `hide_price: false` 추가. 기존 메뉴 수정 시 서버에서 받은 값으로 초기화.

- [ ] **Step 3: 체크박스 UI 추가**

`is_popular`, `is_new` 체크박스 아래에 새 섹션 추가:

```tsx
{/* 상담 상품 설정 */}
<div className="space-y-3">
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={form.is_consultation}
      onChange={(e) => setForm({ ...form, is_consultation: e.target.checked, hide_price: e.target.checked ? form.hide_price : false })}
      className="w-4 h-4 rounded border-gray-300 text-sage-400 focus:ring-sage-400"
    />
    <span className="text-sm text-charcoal-300">상담 후 결정 상품</span>
  </label>
  <p className="text-xs text-charcoal-100 ml-6">체크 시 장바구니/바로구매 대신 &quot;상담하기&quot; 버튼이 표시됩니다.</p>

  {form.is_consultation && (
    <label className="flex items-center gap-2 cursor-pointer ml-6">
      <input
        type="checkbox"
        checked={form.hide_price}
        onChange={(e) => setForm({ ...form, hide_price: e.target.checked })}
        className="w-4 h-4 rounded border-gray-300 text-sage-400 focus:ring-sage-400"
      />
      <span className="text-sm text-charcoal-300">가격 숨기기</span>
    </label>
  )}
</div>
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add components/admin/MenuForm.tsx
git commit -m "feat: 관리자 MenuForm에 상담/가격숨김 체크박스 추가"
```

---

## Task 3: CartProvider 구현

React Context + sessionStorage 기반 장바구니 상태 관리 Provider를 생성한다.

**Files:**
- Create: `components/CartProvider.tsx`
- Modify: `app/layout.tsx:60-84`

- [ ] **Step 1: CartProvider 구현**

`components/CartProvider.tsx` 생성:

```tsx
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
});

export function useCart() {
  return useContext(CartContext);
}

const STORAGE_KEY = "cart-items";

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // sessionStorage full or unavailable
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 클라이언트 hydration 시 sessionStorage에서 복원
  useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  // items 변경 시 sessionStorage에 저장
  useEffect(() => {
    if (hydrated) {
      saveToStorage(items);
    }
  }, [items, hydrated]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === newItem.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === newItem.menuItemId
            ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, 99) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: Math.min(newItem.quantity, 99) }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity < 1) return;
    const clamped = Math.min(quantity, 99);
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: clamped } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
```

- [ ] **Step 2: layout.tsx에 CartProvider 래핑**

`app/layout.tsx`의 `<body>` 내부에 `CartProvider` 추가:

```tsx
import CartProvider from "@/components/CartProvider";

// RootLayout 내부:
<body ...>
  <CartProvider>
    {children}
  </CartProvider>
</body>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공. `CartProvider`를 추가만 했고 기존 `ReservationProvider`는 아직 그대로이므로 에러 없어야 함.

- [ ] **Step 4: 커밋**

```bash
git add components/CartProvider.tsx app/layout.tsx
git commit -m "feat: CartProvider 구현 및 layout.tsx에 배치"
```

---

## Task 4: CartSlidePanel 구현

오른쪽에서 슬라이드하는 장바구니 패널 UI를 구현한다.

**Files:**
- Create: `components/CartSlidePanel.tsx`

- [ ] **Step 1: CartSlidePanel 구현**

`components/CartSlidePanel.tsx` 생성:

```tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/data/menu";
import Link from "next/link";

function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
      <button
        onClick={() => onChange(quantity - 1)}
        className="w-7 h-7 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-semibold text-charcoal-400">
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        className="w-7 h-7 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}

export default function CartSlidePanel() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isCartOpen, closeCart } = useCart();

  // ESC 키로 닫기
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isCartOpen, closeCart]);

  // 열려 있을 때 body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
          />

          {/* 패널 */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="장바구니"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-charcoal-400">
                장바구니{" "}
                {totalItems > 0 && (
                  <span className="text-sage-400 text-sm">{totalItems}</span>
                )}
              </h2>
              <button
                onClick={closeCart}
                className="text-gray-400 hover:text-charcoal-300 text-xl leading-none"
                aria-label="장바구니 닫기"
              >
                ✕
              </button>
            </div>

            {/* 상품 목록 */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-charcoal-200 mb-4">장바구니가 비어있습니다</p>
                  <a
                    href="#menu"
                    onClick={closeCart}
                    className="text-sage-400 font-medium text-sm hover:underline"
                  >
                    메뉴 보기
                  </a>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.menuItemId} className="py-3 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-charcoal-400">{item.name}</p>
                        <p className="text-xs text-charcoal-100 mt-0.5">
                          {formatPrice(item.price)} / 개
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.menuItemId)}
                        className="text-gray-300 hover:text-red-400 text-sm"
                        aria-label={`${item.name} 삭제`}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(q) => {
                          if (q < 1) {
                            removeItem(item.menuItemId);
                          } else {
                            updateQuantity(item.menuItemId, q);
                          }
                        }}
                      />
                      <span className="font-bold text-sm text-charcoal-400">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 하단 결제 영역 */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-5 py-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-charcoal-200">
                    상품 합계 ({totalItems}개)
                  </span>
                  <span className="text-sm text-charcoal-400">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-charcoal-400">총 결제금액</span>
                  <span className="font-bold text-sage-400 text-lg">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <Link
                  href="/cart/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3 bg-sage-400 text-white rounded-xl font-bold text-base hover:bg-sage-500 transition-colors"
                >
                  결제하기
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: layout.tsx에 CartSlidePanel 추가**

`app/layout.tsx`의 `CartProvider` 내부, `{children}` 다음에 `CartSlidePanel` 추가:

```tsx
import CartSlidePanel from "@/components/CartSlidePanel";

// body 내부:
<CartProvider>
  {children}
  <CartSlidePanel />
</CartProvider>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add components/CartSlidePanel.tsx app/layout.tsx
git commit -m "feat: CartSlidePanel 슬라이드 장바구니 패널 구현"
```

---

## Task 5: MenuCard 개선 (수량/담기/바로구매 + 상담 분기)

MenuCard의 "주문하기" 버튼을 수량 스테퍼 + 담기 + 바로구매 버튼으로 교체하고, 상담 상품 분기를 추가한다.

**Files:**
- Modify: `components/MenuCard.tsx` (전체 리팩터링)

- [ ] **Step 1: MenuCard에 상태 및 카트 연동 추가**

`components/MenuCard.tsx` 수정:

1. 상단에 import 추가:

```tsx
import { useState } from "react";
import { useCart } from "./CartProvider";
```

2. `Link` import는 유지 (바로구매에 사용).

3. 컴포넌트 내부에 수량 상태 + 카트 훅 추가:

```tsx
export default function MenuCard({ item, index }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCart();
  const style = categoryStyles[item.category] ?? categoryStyles["rice-cake"]; // fallback

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.image,
      category: item.category,
    });
    setQuantity(1); // 리셋
    openCart();
  };
  // ... 나머지 렌더링
```

- [ ] **Step 2: 배지 영역에 "상담 후 결정" 배지 추가**

배지 영역 (line 109-120 부근)에 상담 배지 추가:

```tsx
{item.isConsultation && (
  <span className="px-3 py-1 bg-blush-400 text-white text-xs font-bold rounded-full shadow-lg">
    상담 후 결정
  </span>
)}
```

- [ ] **Step 3: 가격 표시 분기**

가격 표시 부분 (line 136-138 부근)을 조건부로 변경:

```tsx
{item.isConsultation && item.hidePrice ? (
  <span className="text-sm font-semibold text-blush-400 whitespace-nowrap">
    상담 후 결정
  </span>
) : (
  <span className="text-lg font-bold text-sage-400 whitespace-nowrap">
    {formatPrice(item.price)}
  </span>
)}
```

- [ ] **Step 4: 하단 버튼 영역을 조건부로 분기**

기존 `<Link href={/order/${item.id}} ... >주문하기</Link>` 부분을 교체:

```tsx
{/* 하단 버튼 영역 */}
<div className="mt-auto pt-4">
  {item.isConsultation ? (
    /* 상담 상품 */
    <a
      href="https://www.instagram.com/nuknuk_dessert/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blush-400 text-white rounded-lg text-sm font-medium hover:bg-blush-500 transition-colors"
    >
      💬 상담하기 (Instagram DM)
    </a>
  ) : (
    /* 일반 상품 */
    <div className="flex items-center gap-2">
      {/* 수량 스테퍼 */}
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-8 h-8 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-semibold text-charcoal-400">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          className="w-8 h-8 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100"
        >
          +
        </button>
      </div>
      {/* 담기 */}
      <button
        onClick={handleAddToCart}
        className="flex-1 h-8 border border-sage-400 text-sage-400 rounded-lg text-xs font-semibold hover:bg-sage-50 transition-colors"
      >
        담기
      </button>
      {/* 바로구매 */}
      <Link
        href={`/order/${item.id}`}
        className="flex-1 h-8 flex items-center justify-center bg-sage-400 text-white rounded-lg text-xs font-semibold hover:bg-sage-500 transition-colors"
      >
        바로구매
      </Link>
    </div>
  )}
</div>
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 6: 수동 테스트**

Run: `npm run dev`
- 일반 상품 카드에 [- 1 +] [담기] [바로구매] 버튼 표시 확인
- 담기 클릭 시 카트 패널 슬라이드 확인
- 바로구매 클릭 시 `/order/[id]`로 이동 확인
- (관리자에서 상담 상품 설정 후) 상담 상품에 "상담 후 결정" 배지 + "상담하기" 버튼 확인

- [ ] **Step 7: 커밋**

```bash
git add components/MenuCard.tsx
git commit -m "feat: MenuCard에 수량/담기/바로구매 버튼 및 상담 상품 분기 추가"
```

---

## Task 6: Header/HeroSection/CTASection 전환 + ReservationProvider 삭제

"예약하기" 버튼을 장바구니 버튼으로 전환하고, ReservationProvider/Modal을 삭제한다.

**Files:**
- Modify: `app/page.tsx` (ReservationProvider 제거)
- Modify: `components/Header.tsx` (전체)
- Modify: `components/HeroSection.tsx`
- Modify: `components/CTASection.tsx`
- Delete: `components/ReservationProvider.tsx`
- Delete: `components/ReservationModal.tsx`

> **중요**: 이 Task에서 ReservationProvider 제거와 useReservation → useCart 전환을 **한 번에** 수행한다. 중간에 커밋하지 않도록 주의.

- [ ] **Step 1: page.tsx에서 ReservationProvider 제거**

`app/page.tsx`에서:
1. `import ReservationProvider` 줄 삭제
2. `<ReservationProvider>` / `</ReservationProvider>` 래핑을 `<>` / `</>`로 교체

```tsx
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MenuSection from "@/components/MenuSection";
import AboutSection from "@/components/AboutSection";
import LocationSection from "@/components/LocationSection";
import InstagramFeed from "@/components/InstagramFeed";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { getMenuItems, getCategories } from "@/lib/menu-db";

export const revalidate = 60;

export default async function Home() {
  const [menuItems, categoryList] = await Promise.all([
    getMenuItems(),
    getCategories(),
  ]);

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <MenuSection items={menuItems} categories={categoryList} />
        <AboutSection />
        <LocationSection />
        <InstagramFeed />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Header.tsx 수정**

`components/Header.tsx` 전체 수정:

1. `useReservation` import를 `useCart`로 교체:

```tsx
import { useCart } from "@/components/CartProvider";
```

2. 컴포넌트 내부:

```tsx
const { totalItems, openCart } = useCart();

const handleCartClick = () => {
  if (totalItems > 0) {
    openCart();
  } else {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }
};
```

3. 데스크톱 "예약하기" 버튼 교체 (line 66-71):

```tsx
<button
  onClick={handleCartClick}
  className="relative btn-primary text-sm !px-6 !py-2.5"
>
  🛒 장바구니
  {totalItems > 0 && (
    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blush-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {totalItems > 99 ? "99+" : totalItems}
    </span>
  )}
</button>
```

4. 모바일 "예약하기" 버튼 교체 (line 119-130):

```tsx
<motion.button
  className="btn-primary mt-4 relative"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
  onClick={() => {
    setMobileOpen(false);
    handleCartClick();
  }}
>
  🛒 장바구니
  {totalItems > 0 && (
    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blush-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {totalItems > 99 ? "99+" : totalItems}
    </span>
  )}
</motion.button>
```

- [ ] **Step 3: HeroSection.tsx 수정**

`components/HeroSection.tsx` 수정:

1. import 교체:

```tsx
import { useCart } from "./CartProvider";
```

2. 훅 사용:

```tsx
const { totalItems, openCart } = useCart();

const handleCartClick = () => {
  if (totalItems > 0) {
    openCart();
  } else {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }
};
```

3. "예약하기" 버튼 교체 (line 98-103):

```tsx
<button
  onClick={handleCartClick}
  className="btn-secondary text-base"
>
  장바구니 보기
</button>
```

- [ ] **Step 4: CTASection.tsx 수정**

`components/CTASection.tsx` 수정:

1. import 교체:

```tsx
import { useCart } from "./CartProvider";
```

2. 훅 사용:

```tsx
const { totalItems, openCart } = useCart();

const handleCartClick = () => {
  if (totalItems > 0) {
    openCart();
  } else {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }
};
```

3. "지금 예약하기" 버튼 교체 (line 46-50):

```tsx
<button
  onClick={handleCartClick}
  className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-white text-sage-400 font-bold text-base hover:bg-cream-100 active:scale-95 transition-all duration-300 shadow-xl hover:shadow-2xl"
>
  장바구니 보기
</button>
```

네이버 예약 링크는 그대로 유지.

- [ ] **Step 5: ReservationProvider.tsx 삭제**

```bash
rm components/ReservationProvider.tsx
```

- [ ] **Step 6: ReservationModal.tsx 삭제**

```bash
rm components/ReservationModal.tsx
```

- [ ] **Step 7: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공. 모든 `useReservation` 참조가 `useCart`로 교체되었으므로 에러 없어야 함.

빌드 에러가 나면 `useReservation` 또는 `ReservationProvider`/`ReservationModal`을 import하는 파일이 남아있는지 확인:

```bash
grep -r "useReservation\|ReservationProvider\|ReservationModal" --include="*.tsx" --include="*.ts" components/ app/
```

- [ ] **Step 8: 커밋**

```bash
git add components/Header.tsx components/HeroSection.tsx components/CTASection.tsx app/page.tsx
git rm components/ReservationProvider.tsx components/ReservationModal.tsx
git commit -m "feat: 예약하기 → 장바구니 버튼 전환, ReservationProvider/Modal 삭제"
```

---

## Task 7: 주문 API 다건 지원

`/api/orders` POST 핸들러를 확장하여 `items` 배열로 다건 주문을 지원한다.

**Files:**
- Modify: `app/api/orders/route.ts`

- [ ] **Step 1: POST 핸들러 수정**

`app/api/orders/route.ts` 전체 교체:

```typescript
// POST /api/orders — 고객 주문 생성 (단일/다건 지원)
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/order-db";
import { getMenuItem } from "@/lib/menu-db";
import type { DeliveryMethod } from "@/data/order";

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      menuItemId,
      quantity,
      items: itemsArray,
      customerName,
      customerPhone,
      customerEmail,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      customerMemo,
      shippingFee,
    } = body;

    // 필수값 검증
    if (!customerName || !customerPhone || !deliveryMethod) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    // items 배열 결정: 다건(items) 또는 단건(menuItemId + quantity)
    let orderItems: OrderItemInput[];
    if (Array.isArray(itemsArray) && itemsArray.length > 0) {
      orderItems = itemsArray;
    } else if (menuItemId && quantity) {
      orderItems = [{ menuItemId, quantity }];
    } else {
      return NextResponse.json(
        { error: "주문할 상품을 선택해주세요" },
        { status: 400 }
      );
    }

    // 수량 검증
    for (const item of orderItems) {
      if (!item.menuItemId || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json(
          { error: "수량은 1~99 사이만 가능합니다" },
          { status: 400 }
        );
      }
    }

    // 메뉴 아이템 가격 검증 (서버에서 조회하여 클라이언트 조작 방지)
    const resolvedItems = [];
    for (const item of orderItems) {
      const menuItem = await getMenuItem(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { error: `존재하지 않는 상품입니다: ${item.menuItemId}` },
          { status: 404 }
        );
      }
      resolvedItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: Number(item.quantity),
        unitPrice: menuItem.price,
      });
    }

    const order = await createOrder({
      channel: "direct",
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      deliveryMethod: deliveryMethod as DeliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee: shippingFee || 0,
      items: resolvedItems,
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 생성 에러:", error);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/api/orders/route.ts
git commit -m "feat: /api/orders POST 다건 주문(items 배열) 지원"
```

---

## Task 8: 일괄 결제 페이지 (/cart/checkout)

장바구니 상품을 한 번에 결제하는 checkout 페이지를 구현한다.

**Files:**
- Create: `app/cart/checkout/page.tsx`

- [ ] **Step 1: checkout 페이지 구현**

`app/cart/checkout/page.tsx` 생성:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice, type CategoryInfo } from "@/data/menu";
import PaymentWidget from "@/components/order/PaymentWidget";

interface CreatedOrder {
  orderNumber: string;
  totalAmount: number;
  orderName: string;
}

type Step = "form" | "payment";

export default function CartCheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [step, setStep] = useState<Step>("form");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  // 카테고리 정보 (수령 방식 결정용)
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  // 폼 상태
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerMemo, setCustomerMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 카테고리 정보 fetch
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(
          cats.map((c: Record<string, unknown>) => ({
            id: (c.id as string) || "",
            name: (c.name as string) || "",
            nameEn: (c.name_en as string) || "",
            emoji: (c.emoji as string) || "",
            availableDeliveryMethods: (c.available_delivery_methods as string[]) ?? (c.availableDeliveryMethods as string[]) ?? ["pickup"],
            defaultShippingFee: (c.default_shipping_fee as number) ?? (c.defaultShippingFee as number) ?? 0,
          }))
        );
      })
      .catch(() => {});
  }, []);

  // 수령 방식: 장바구니 상품 카테고리들의 교집합
  const availableMethods = (() => {
    if (categories.length === 0 || items.length === 0) return ["pickup"];
    const itemCategories = [...new Set(items.map((i) => i.category))];
    const methodSets = itemCategories.map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      return new Set(cat?.availableDeliveryMethods ?? ["pickup"]);
    });
    const intersection = methodSets.reduce((acc, set) => {
      return new Set([...acc].filter((m) => set.has(m)));
    });
    return intersection.size > 0 ? [...intersection] : ["pickup"];
  })();

  // 수령 방식이 교집합에 포함되지 않으면 첫 번째 방식으로 자동 전환
  useEffect(() => {
    if (!availableMethods.includes(deliveryMethod)) {
      setDeliveryMethod(availableMethods[0] as "pickup" | "shipping");
    }
  }, [availableMethods, deliveryMethod]);

  // 배송비 계산
  const shippingFee = (() => {
    if (deliveryMethod !== "shipping") return 0;
    const itemCategories = [...new Set(items.map((i) => i.category))];
    const fees = itemCategories.map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      return cat?.defaultShippingFee ?? 0;
    });
    return Math.max(...fees, 0);
  })();

  const grandTotal = totalPrice + shippingFee;

  // 장바구니 비어있으면 리다이렉트
  if (items.length === 0 && step === "form") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal-200 mb-4">장바구니가 비어있습니다</p>
          <Link href="/" className="text-sage-400 font-medium hover:underline">
            메뉴 보기
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("이름과 전화번호를 입력해주세요.");
      return;
    }
    if (deliveryMethod === "pickup" && !pickupDate) {
      setError("수령 희망일을 선택해주세요.");
      return;
    }
    if (deliveryMethod === "shipping" && !deliveryAddress.trim()) {
      setError("배송 주소를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
          customerName: customerName.trim(),
          customerPhone: customerPhone.replace(/-/g, ""),
          customerEmail: customerEmail.trim() || undefined,
          deliveryMethod,
          pickupDate: deliveryMethod === "pickup" ? pickupDate : undefined,
          deliveryAddress: deliveryMethod === "shipping" ? deliveryAddress.trim() : undefined,
          customerMemo: customerMemo.trim() || undefined,
          shippingFee,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "주문 생성 실패");

      const order = data.order;
      const orderName =
        items.length === 1
          ? items[0].name
          : `${items[0].name} 외 ${items.length - 1}건`;

      setCreatedOrder({
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderName,
      });
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 생성에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "payment" && createdOrder) {
    return (
      <div className="min-h-screen bg-cream-100 py-12">
        <div className="max-w-lg mx-auto px-5">
          <h1 className="text-2xl font-bold text-charcoal-400 mb-6">결제</h1>
          <PaymentWidget
            amount={createdOrder.totalAmount}
            orderNumber={createdOrder.orderNumber}
            orderName={createdOrder.orderName}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone.replace(/-/g, "")}
          />
        </div>
      </div>
    );
  }

  // 최소 수령일: 2일 후
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-cream-100 py-12">
      <div className="max-w-2xl mx-auto px-5">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-charcoal-200 hover:text-charcoal-400">
            ← 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-charcoal-400">주문서</h1>
        </div>

        {/* 주문 상품 요약 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-charcoal-400 mb-4">주문 상품</h2>
          {items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <span className="text-sm text-charcoal-400">{item.name}</span>
                <span className="text-xs text-charcoal-100 ml-2">x {item.quantity}</span>
              </div>
              <span className="text-sm font-medium text-charcoal-400">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
            <span className="font-bold text-charcoal-400">상품 합계</span>
            <span className="font-bold text-sage-400">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* 고객 정보 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-bold text-charcoal-400 mb-2">고객 정보</h2>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              전화번호 <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              placeholder="example@email.com"
            />
          </div>
        </div>

        {/* 수령 방식 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-bold text-charcoal-400 mb-2">수령 방식</h2>

          <div className="flex gap-3">
            {availableMethods.includes("pickup") && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                  className="text-sage-400 focus:ring-sage-400"
                />
                <span className="text-sm text-charcoal-300">매장 수령</span>
              </label>
            )}
            {availableMethods.includes("shipping") && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="shipping"
                  checked={deliveryMethod === "shipping"}
                  onChange={() => setDeliveryMethod("shipping")}
                  className="text-sage-400 focus:ring-sage-400"
                />
                <span className="text-sm text-charcoal-300">택배 배송</span>
              </label>
            )}
          </div>

          {deliveryMethod === "pickup" && (
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                수령 희망일 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={minDateStr}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              />
              <p className="text-xs text-charcoal-100 mt-1">최소 2일 전 주문 부탁드립니다.</p>
            </div>
          )}

          {deliveryMethod === "shipping" && (
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                배송 주소 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
                placeholder="서울시 강남구..."
              />
              <p className="text-xs text-charcoal-100 mt-1">
                배송비: {formatPrice(shippingFee)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              요청사항
            </label>
            <textarea
              value={customerMemo}
              onChange={(e) => setCustomerMemo(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50 resize-none"
              placeholder="요청사항을 입력해주세요"
            />
          </div>
        </div>

        {/* 결제 요약 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-charcoal-200">상품 합계</span>
            <span className="text-sm text-charcoal-400">{formatPrice(totalPrice)}</span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-sm text-charcoal-200">배송비</span>
              <span className="text-sm text-charcoal-400">{formatPrice(shippingFee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-bold text-lg text-charcoal-400">총 결제금액</span>
            <span className="font-bold text-lg text-sage-400">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-sage-400 text-white rounded-xl font-bold text-base hover:bg-sage-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "처리 중..." : `${formatPrice(grandTotal)} 결제하기`}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 수동 테스트**

Run: `npm run dev`
1. 메뉴카드에서 상품 2개를 장바구니에 담기
2. 장바구니 패널에서 "결제하기" 클릭
3. `/cart/checkout` 페이지에서 주문 상품 요약 확인
4. 고객 정보 입력 후 결제 버튼 클릭
5. 토스 결제 위젯 표시 확인

- [ ] **Step 4: 커밋**

```bash
git add app/cart/checkout/page.tsx
git commit -m "feat: 장바구니 일괄 결제 페이지 (/cart/checkout) 구현"
```

---

## Task 9: 결제 성공 시 장바구니 비우기

결제 성공 페이지(`/pay/success`)에서 장바구니를 비우도록 처리한다.

**Files:**
- Modify: `app/pay/success/page.tsx`

- [ ] **Step 1: pay/success 페이지에 장바구니 비우기 추가**

`app/pay/success/page.tsx`의 `SuccessContent` 컴포넌트에서:

1. import 추가 (line 3 부근):

```tsx
import { useCart } from "@/components/CartProvider";
```

2. `SuccessContent` 함수 상단에 훅 추가 (line 8 이후):

```tsx
const { clearCart } = useCart();
```

3. `confirmPayment()` 내부, `setStatus("success")` 직후 (line 33)에 추가:

```tsx
if (response.ok) {
  setStatus("success");
  clearCart();  // ← 이 줄 추가

  // 3초 후 메인 페이지로 자동 이동
  setTimeout(() => {
    router.push("/");
  }, 3000);
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/pay/success/page.tsx
git commit -m "feat: 결제 성공 시 장바구니 자동 비우기"
```

---

## Task 10: 최종 통합 테스트 및 정리

전체 플로우를 검증하고 불필요한 파일을 정리한다.

**Files:**
- 전체 프로젝트

- [ ] **Step 1: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

- [ ] **Step 2: ESLint 확인**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 삭제된 파일 참조 확인**

ReservationProvider/Modal 참조가 남아있지 않은지 확인:

```bash
grep -r "ReservationProvider\|ReservationModal\|useReservation\|openReservation" --include="*.tsx" --include="*.ts" components/ app/ lib/ data/
```

Expected: 결과 없음 (0 matches)

- [ ] **Step 4: 수동 E2E 테스트**

Run: `npm run dev`

테스트 시나리오:
1. 메인 페이지 로드 → 헤더에 "장바구니" 버튼 확인
2. 장바구니 비어있을 때 헤더 버튼 클릭 → `#menu`로 스크롤
3. 메뉴카드에서 수량 조절 후 "담기" 클릭 → 패널 슬라이드 열림, 상품 표시
4. 다른 상품도 담기 → 패널에 2개 상품, 합계 정확
5. 패널에서 수량 변경 → 소계/합계 즉시 반영
6. 패널에서 상품 삭제 → 목록에서 제거
7. "결제하기" 클릭 → `/cart/checkout` 이동, 장바구니 요약 정확
8. 고객 정보 입력 + 결제 → 토스 위젯 표시
9. "바로구매" 클릭 → `/order/[id]`로 이동 (기존 플로우 정상)
10. 히어로 "장바구니 보기" 버튼 → 상품 있으면 패널, 없으면 메뉴로 스크롤
11. CTA "장바구니 보기" 버튼 → 동일 동작
12. 관리자에서 상담 상품 설정 → 메뉴카드에 "상담 후 결정" 배지, "상담하기" 버튼
13. 상담 상품의 "가격 숨기기" → 가격 대신 "상담 후 결정" 텍스트
14. 탭 닫고 다시 열기 → 장바구니 비어있음 (sessionStorage 초기화)

- [ ] **Step 5: 커밋**

필요한 변경사항이 있을 경우에만 커밋:

```bash
git add -u
git commit -m "chore: 장바구니 시스템 최종 정리 및 통합 검증"
```
