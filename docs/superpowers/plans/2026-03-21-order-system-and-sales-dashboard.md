# 주문/결제 시스템 + 매출 대시보드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 넉넉 디저트에 두 가지 결제 채널(고객 직접/사장님 링크)의 주문 시스템과 매출 분석 대시보드를 추가한다.

**Architecture:** Supabase에 orders/order_items 테이블 추가, 기존 토스페이먼츠 결제 플로우를 주문 기반으로 리팩토링, Recharts로 매출 차트 구현. 모든 주문 생성은 서버 API를 통해 서비스 롤 키로 처리.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + RLS), 토스페이먼츠 SDK, NextAuth.js, Recharts, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-21-order-system-and-sales-dashboard-design.md`

---

## 파일 구조

### 새로 생성

```
supabase/
  orders-schema.sql              # orders, order_items 테이블 + 함수 + RLS

lib/
  order-db.ts                    # 주문 DB CRUD 함수
  toss.ts                        # 토스 키 관리 + 결제 확인 유틸

data/
  order.ts                       # 주문 관련 타입 정의 (OrderStatus, Order, OrderItem 등)

app/
  order/[menuItemId]/page.tsx    # 고객 직접 주문 페이지
  pay/[orderNumber]/page.tsx     # 링크 결제 페이지
  pay/success/page.tsx           # 결제 완료 감사 페이지
  pay/fail/page.tsx              # 결제 실패 페이지

  api/
    orders/route.ts              # POST: 고객 주문 생성
    orders/[orderNumber]/route.ts # GET: 주문 조회 (공개, 민감정보 제외)

    admin/orders/route.ts        # GET: 주문 목록 / POST: 사장님 주문 등록
    admin/orders/[id]/route.ts   # GET: 주문 상세 / PUT: 상태 변경

    admin/dashboard/
      summary/route.ts           # GET: 핵심 지표 카드
      sales/route.ts             # GET: 일별/월별 매출 추이
      breakdown/route.ts         # GET: 카테고리/상품/채널별 분석

components/
  order/
    OrderForm.tsx                # 고객 주문 정보 입력 폼
    OrderSummary.tsx             # 주문 요약 + 결제 버튼
    PaymentWidget.tsx            # 토스 결제 위젯 래퍼

  admin/
    OrderTable.tsx               # 주문 목록 테이블
    OrderDetail.tsx              # 주문 상세 뷰
    OrderCreateForm.tsx          # 사장님 주문 등록 폼
    PaymentLinkModal.tsx         # 결제 링크 복사 모달
    SalesChart.tsx               # 매출 차트 컴포넌트 (Recharts)
    DashboardSummaryCards.tsx     # 핵심 지표 카드
    DateRangeFilter.tsx          # 기간 필터 (프리셋 + 날짜 피커)
    SalesBreakdownTable.tsx      # 분석 테이블 (상품별/채널별)

app/  (추가 페이지)
  admin/orders/page.tsx          # 주문 관리 목록 페이지
  admin/orders/new/page.tsx      # 사장님 주문 등록 페이지
  admin/orders/[id]/page.tsx     # 주문 상세 페이지
```

### 수정

```
supabase/schema.sql              # menu_categories에 delivery_methods, shipping_fee 컬럼 추가
lib/menu-db.ts                   # 카테고리 타입에 delivery 필드 추가
data/menu.ts                     # CategoryInfo 타입 확장
components/MenuCard.tsx          # "주문하기" 버튼 추가
app/admin/layout.tsx             # 사이드바에 "주문 관리" 메뉴 추가
app/admin/page.tsx               # 대시보드에 매출 통계 섹션 추가
app/api/payments/confirm/route.ts # 주문 DB 연동 + 금액 검증 + 환경변수 적용
app/checkout/page.tsx            # /order로 리다이렉트 처리
app/checkout/success/page.tsx    # 새 플로우로 리다이렉트 처리
app/checkout/fail/page.tsx       # 새 플로우로 리다이렉트 처리
next.config.mjs                  # 필요 시 설정 추가
package.json                     # recharts 의존성 추가
```

---

## Task 1: 패키지 설치 및 환경변수 설정

**Files:**
- Modify: `package.json`
- Modify: `.env.local` (로컬 설정)

- [ ] **Step 1: recharts 설치**

```bash
npm install recharts
```

- [ ] **Step 2: .env.local에 토스 환경변수 추가**

`.env.local`에 아래 두 줄 추가 (기존 하드코딩된 테스트 키 값 사용):
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
```

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: recharts 설치 및 토스 환경변수 설정"
```

---

## Task 2: 주문 타입 정의

**Files:**
- Create: `data/order.ts`

- [ ] **Step 1: 주문 관련 타입 정의**

```typescript
// data/order.ts

export type OrderStatus = "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";
export type OrderChannel = "direct" | "link";
export type DeliveryMethod = "pickup" | "shipping";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerMemo: string | null;
  adminMemo: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  pickupDate: string | null;
  totalAmount: number;
  shippingFee: number;
  paymentKey: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// DB 스네이크 케이스 타입
export interface DbOrder {
  id: string;
  order_number: string;
  channel: OrderChannel;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_memo: string | null;
  admin_memo: string | null;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  pickup_date: string | null;
  total_amount: number;
  shipping_fee: number;
  payment_key: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// 주문 생성 입력 타입
export interface CreateOrderInput {
  channel: OrderChannel;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerMemo?: string;
  adminMemo?: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  pickupDate?: string;
  shippingFee?: number;
  items: {
    menuItemId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// 상태 라벨/색상 매핑
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "결제완료", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "확정", color: "bg-green-100 text-green-800" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-800" },
  refunded: { label: "환불", color: "bg-purple-100 text-purple-800" },
};

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  direct: "직접 결제",
  link: "링크 결제",
};

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// DB → 프론트엔드 변환
export function toOrder(dbOrder: DbOrder, dbItems: DbOrderItem[]): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    channel: dbOrder.channel,
    status: dbOrder.status,
    customerName: dbOrder.customer_name,
    customerPhone: dbOrder.customer_phone,
    customerEmail: dbOrder.customer_email,
    customerMemo: dbOrder.customer_memo,
    adminMemo: dbOrder.admin_memo,
    deliveryMethod: dbOrder.delivery_method,
    deliveryAddress: dbOrder.delivery_address,
    pickupDate: dbOrder.pickup_date,
    totalAmount: dbOrder.total_amount,
    shippingFee: dbOrder.shipping_fee,
    paymentKey: dbOrder.payment_key,
    paymentMethod: dbOrder.payment_method,
    paidAt: dbOrder.paid_at,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
    items: dbItems.map((item) => ({
      id: item.id,
      orderId: item.order_id,
      menuItemId: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
    })),
  };
}
```

- [ ] **Step 2: 커밋**

```bash
git add data/order.ts
git commit -m "feat: 주문 관련 타입 정의 추가"
```

---

## Task 3: DB 스키마 — orders, order_items 테이블 + 주문번호 함수

**Files:**
- Create: `supabase/orders-schema.sql`
- Modify: `supabase/schema.sql` (menu_categories에 컬럼 추가)

- [ ] **Step 1: orders-schema.sql 작성**

```sql
-- supabase/orders-schema.sql
-- 주문/결제 시스템 테이블

-- 주문번호 생성 함수 (advisory lock으로 동시성 제어)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  seq INTEGER;
  result TEXT;
BEGIN
  today := TO_CHAR(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYYMMDD');

  -- advisory lock으로 동시 생성 방지 (날짜 해시를 lock key로 사용)
  PERFORM pg_advisory_xact_lock(hashtext('order_number_' || today));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM orders
  WHERE order_number LIKE 'NUK-' || today || '-%';

  result := 'NUK-' || today || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- orders 테이블
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT generate_order_number(),
  channel TEXT NOT NULL CHECK (channel IN ('direct', 'link')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_memo TEXT,
  admin_memo TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'shipping')),
  delivery_address TEXT,
  pickup_date TIMESTAMPTZ,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  payment_key TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_items 테이블
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- orders RLS 정책
CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- 공개 SELECT 없음 — 모든 조회는 API 엔드포인트에서 서비스 롤로 처리
-- order_number를 아는 경우에만 API를 통해 접근 가능

-- order_items RLS 정책
CREATE POLICY "Service role full access on order_items"
  ON order_items FOR ALL
  USING (auth.role() = 'service_role');
```

- [ ] **Step 2: schema.sql에 menu_categories 컬럼 추가 마이그레이션 주석 추가**

`supabase/schema.sql` 파일 하단에 아래 추가:

```sql
-- === 주문 시스템 마이그레이션 ===
-- menu_categories에 배송 방식 컬럼 추가
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS available_delivery_methods TEXT[] DEFAULT '{"pickup"}';
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS default_shipping_fee INTEGER DEFAULT 0;

-- 기존 카테고리 배송 방식 설정
UPDATE menu_categories SET available_delivery_methods = '{"pickup"}' WHERE id IN ('rice-cake', 'cake');
UPDATE menu_categories SET available_delivery_methods = '{"pickup", "shipping"}' WHERE id IN ('cookie', 'beverage');
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/orders-schema.sql supabase/schema.sql
git commit -m "feat: 주문 DB 스키마 추가 (orders, order_items, 주문번호 함수, RLS)"
```

---

## Task 4: 카테고리 타입 확장 (배송 방식)

**Files:**
- Modify: `data/menu.ts` — `CategoryInfo`에 `availableDeliveryMethods`, `defaultShippingFee` 추가
- Modify: `lib/menu-db.ts` — `DbCategory` 타입 및 변환 함수 수정

- [ ] **Step 1: data/menu.ts에 CategoryInfo 타입 확장**

`data/menu.ts`의 `CategoryInfo` 인터페이스에 필드 추가:

```typescript
export interface CategoryInfo {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  availableDeliveryMethods: string[];  // 추가
  defaultShippingFee: number;           // 추가
}
```

기존 `categories` 배열의 각 항목에 기본값 추가:

```typescript
{ id: "rice-cake", name: "떡", nameEn: "Rice Cake", emoji: "🍡", availableDeliveryMethods: ["pickup"], defaultShippingFee: 0 },
// ... 나머지도 동일하게
```

- [ ] **Step 2: lib/menu-db.ts의 DbCategory 타입 및 toCategory 함수 수정**

`DbCategory`에 필드 추가:
```typescript
export interface DbCategory {
  // ... 기존 필드
  available_delivery_methods: string[];
  default_shipping_fee: number;
}
```

`toCategory` 함수 수정:
```typescript
function toCategory(dbCat: DbCategory): CategoryInfo {
  return {
    id: dbCat.id,
    name: dbCat.name,
    nameEn: dbCat.name_en || "",
    emoji: dbCat.emoji || "",
    availableDeliveryMethods: dbCat.available_delivery_methods || ["pickup"],
    defaultShippingFee: dbCat.default_shipping_fee || 0,
  };
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
기존 코드에서 CategoryInfo를 사용하는 곳에서 타입 에러가 없는지 확인. 에러 시 수정.

- [ ] **Step 4: 커밋**

```bash
git add data/menu.ts lib/menu-db.ts
git commit -m "feat: 카테고리 타입에 배송 방식/배송비 필드 추가"
```

---

## Task 5: 토스 결제 유틸 + 환경변수 적용

**Files:**
- Create: `lib/toss.ts`
- Modify: `app/checkout/page.tsx` — 하드코딩된 키를 환경변수로 교체
- Modify: `app/api/payments/confirm/route.ts` — 환경변수 적용

- [ ] **Step 1: lib/toss.ts 작성**

```typescript
// lib/toss.ts
export function getTossClientKey(): string {
  const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 설정되지 않았습니다");
  return key;
}

export function getTossSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다");
  return key;
}

export function getTossAuthHeader(): string {
  const secretKey = getTossSecretKey();
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
```

- [ ] **Step 2: app/checkout/page.tsx에서 하드코딩된 클라이언트 키 교체**

```typescript
// 변경 전
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

// 변경 후
const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
```

- [ ] **Step 3: app/api/payments/confirm/route.ts에서 시크릿 키 환경변수 적용**

```typescript
// 변경 전
const secretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

// 변경 후
import { getTossAuthHeader, TOSS_CONFIRM_URL } from "@/lib/toss";
// ...
const response = await fetch(TOSS_CONFIRM_URL, {
  method: "POST",
  headers: {
    Authorization: getTossAuthHeader(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ paymentKey, orderId, amount }),
});
```

- [ ] **Step 4: 커밋**

```bash
git add lib/toss.ts app/checkout/page.tsx app/api/payments/confirm/route.ts
git commit -m "refactor: 토스 API 키를 환경변수로 이동"
```

---

## Task 6: 주문 DB 함수 (order-db.ts)

**Files:**
- Create: `lib/order-db.ts`

- [ ] **Step 1: 주문 CRUD 함수 작성**

```typescript
// lib/order-db.ts
import { getServiceSupabase } from "./supabase";
import { type DbOrder, type DbOrderItem, type CreateOrderInput, type OrderStatus, toOrder, type Order } from "@/data/order";

function getSupabaseOrThrow() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  return supabase;
}

// 주문 생성
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = getSupabaseOrThrow();

  // 주문 총액 계산
  const itemsTotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const shippingFee = input.shippingFee || 0;
  const totalAmount = itemsTotal + shippingFee;

  // 주문 생성
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      channel: input.channel,
      status: input.channel === "direct" ? "pending" : "pending",
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail || null,
      customer_memo: input.customerMemo || null,
      admin_memo: input.adminMemo || null,
      delivery_method: input.deliveryMethod,
      delivery_address: input.deliveryAddress || null,
      pickup_date: input.pickupDate || null,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
    })
    .select()
    .single();

  if (orderError) throw new Error(`주문 생성 실패: ${orderError.message}`);

  // 주문 상품 생성
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId || null,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)
    .select();

  if (itemsError) throw new Error(`주문 상품 생성 실패: ${itemsError.message}`);

  return toOrder(order as DbOrder, items as DbOrderItem[]);
}

// 주문번호로 주문 조회 (공개용 — admin_memo 제외)
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const supabase = getSupabaseOrThrow();

  const { data: order, error } = await supabase
    .from("orders")
    .select()
    .eq("order_number", orderNumber)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", order.id);

  return toOrder(order as DbOrder, (items || []) as DbOrderItem[]);
}

// ID로 주문 조회 (관리자용)
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseOrThrow();

  const { data: order, error } = await supabase
    .from("orders")
    .select()
    .eq("id", id)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", order.id);

  return toOrder(order as DbOrder, (items || []) as DbOrderItem[]);
}

// 주문 목록 조회 (관리자용, relation query로 N+1 방지)
export async function getOrders(params: {
  channel?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; total: number }> {
  const supabase = getSupabaseOrThrow();
  const { channel, status, search, page = 1, limit = 20 } = params;

  let query = supabase.from("orders").select("*, order_items(*)", { count: "exact" });

  if (channel && channel !== "all") query = query.eq("channel", channel);
  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: ordersData, error, count } = await query;

  if (error) throw new Error(`주문 목록 조회 실패: ${error.message}`);

  const orders = (ordersData || []).map((row: any) => {
    const { order_items, ...order } = row;
    return toOrder(order as DbOrder, (order_items || []) as DbOrderItem[]);
  });

  return { orders, total: count || 0 };
}

// 주문 상태 변경
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const supabase = getSupabaseOrThrow();

  const updateData: Record<string, unknown> = { status };
  if (status === "paid") updateData.paid_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`주문 상태 변경 실패: ${error.message}`);

  const { data: items } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", id);

  return toOrder(data as DbOrder, (items || []) as DbOrderItem[]);
}

// 주문 메모 수정
export async function updateOrderMemo(id: string, adminMemo: string): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error } = await supabase
    .from("orders")
    .update({ admin_memo: adminMemo })
    .eq("id", id);

  if (error) throw new Error(`메모 수정 실패: ${error.message}`);
}

// 결제 정보 업데이트
export async function updateOrderPayment(id: string, paymentKey: string, paymentMethod: string): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error } = await supabase
    .from("orders")
    .update({
      payment_key: paymentKey,
      payment_method: paymentMethod,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`결제 정보 업데이트 실패: ${error.message}`);
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/order-db.ts
git commit -m "feat: 주문 DB CRUD 함수 추가"
```

---

## Task 7: 공개 주문 API (고객 주문 생성 + 조회)

**Files:**
- Create: `app/api/orders/route.ts`
- Create: `app/api/orders/[orderNumber]/route.ts`

- [ ] **Step 1: POST /api/orders — 고객 주문 생성**

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/order-db";
import { getMenuItem } from "@/lib/menu-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menuItemId, quantity, customerName, customerPhone, customerEmail, deliveryMethod, deliveryAddress, pickupDate, customerMemo, shippingFee } = body;

    // 입력값 검증
    if (!menuItemId || !quantity || !customerName || !customerPhone || !deliveryMethod) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
    }

    if (quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: "수량은 1~99 사이만 가능합니다" }, { status: 400 });
    }

    // 메뉴 아이템 가격 검증 (서버에서 조회하여 클라이언트 조작 방지)
    const menuItem = await getMenuItem(menuItemId);
    if (!menuItem) {
      return NextResponse.json({ error: "존재하지 않는 상품입니다" }, { status: 404 });
    }

    const order = await createOrder({
      channel: "direct",
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee: shippingFee || 0,
      items: [{
        menuItemId,
        name: menuItem.name,
        quantity,
        unitPrice: menuItem.price,
      }],
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 생성 에러:", error);
    return NextResponse.json({ error: "주문 생성에 실패했습니다" }, { status: 500 });
  }
}
```

- [ ] **Step 2: GET /api/orders/[orderNumber] — 주문 조회 (공개)**

```typescript
// app/api/orders/[orderNumber]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/order-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const order = await getOrderByNumber(params.orderNumber);
    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    }

    // 72시간 만료 체크 (링크 결제)
    if (order.channel === "link" && order.status === "pending") {
      const created = new Date(order.createdAt).getTime();
      const now = Date.now();
      const hours72 = 72 * 60 * 60 * 1000;
      if (now - created > hours72) {
        return NextResponse.json({ error: "결제 링크가 만료되었습니다" }, { status: 410 });
      }
    }

    // 민감 정보 제외 (adminMemo, paymentKey)
    const { adminMemo, paymentKey, ...publicOrder } = order;
    return NextResponse.json({ order: publicOrder });
  } catch (error) {
    console.error("주문 조회 에러:", error);
    return NextResponse.json({ error: "주문 조회에 실패했습니다" }, { status: 500 });
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/orders/route.ts app/api/orders/\[orderNumber\]/route.ts
git commit -m "feat: 공개 주문 API (생성 + 조회) 추가"
```

---

## Task 8: 관리자 주문 API

**Files:**
- Create: `app/api/admin/orders/route.ts`
- Create: `app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: GET/POST /api/admin/orders**

```typescript
// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder, getOrders } from "@/lib/order-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const result = await getOrders({
      channel: searchParams.get("channel") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("주문 목록 조회 에러:", error);
    return NextResponse.json({ error: "주문 목록 조회에 실패했습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { customerName, customerPhone, customerEmail, customerMemo, adminMemo, deliveryMethod, deliveryAddress, pickupDate, shippingFee, items } = body;

    if (!customerName || !customerPhone || !deliveryMethod || !items?.length) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
    }

    const order = await createOrder({
      channel: "link",
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      adminMemo,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee: shippingFee || 0,
      items,
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 등록 에러:", error);
    return NextResponse.json({ error: "주문 등록에 실패했습니다" }, { status: 500 });
  }
}
```

- [ ] **Step 2: GET/PUT /api/admin/orders/[id]**

```typescript
// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderById, updateOrderStatus, updateOrderMemo } from "@/lib/order-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const order = await getOrderById(params.id);
    if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 상세 조회 에러:", error);
    return NextResponse.json({ error: "주문 상세 조회에 실패했습니다" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { status, adminMemo } = body;

    if (status) {
      const order = await updateOrderStatus(params.id, status);
      return NextResponse.json({ order });
    }

    if (adminMemo !== undefined) {
      await updateOrderMemo(params.id, adminMemo);
      const order = await getOrderById(params.id);
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
  } catch (error) {
    console.error("주문 수정 에러:", error);
    return NextResponse.json({ error: "주문 수정에 실패했습니다" }, { status: 500 });
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/admin/orders/route.ts app/api/admin/orders/\[id\]/route.ts
git commit -m "feat: 관리자 주문 API (목록, 등록, 상세, 상태변경) 추가"
```

---

## Task 9: 결제 확인 API 리팩토링 (주문 DB 연동 + 금액 검증)

**Files:**
- Modify: `app/api/payments/confirm/route.ts`

- [ ] **Step 1: payments/confirm 리팩토링**

기존 코드를 수정하여:
1. `orderId`로 DB에서 주문 조회
2. `amount`와 `orders.total_amount` 비교 검증
3. 토스 결제 확인 후 주문 상태/결제 정보 업데이트
4. 환경변수로 시크릿 키 사용

```typescript
// app/api/payments/confirm/route.ts 주요 변경:
import { getOrderByNumber, updateOrderPayment } from "@/lib/order-db";
import { getTossAuthHeader, TOSS_CONFIRM_URL } from "@/lib/toss";

export async function POST(request: NextRequest) {
  const { paymentKey, orderId, amount } = await request.json();

  // 주문 조회 및 금액 검증
  const order = await getOrderByNumber(orderId);
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
  }

  if (order.totalAmount !== Number(amount)) {
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다" }, { status: 400 });
  }

  // 토스 결제 확인
  const response = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.message, code: data.code }, { status: response.status });
  }

  // 주문 결제 정보 업데이트
  await updateOrderPayment(order.id, paymentKey, data.method || "");

  // 알림 발송 (기존 로직 유지)
  // ...

  return NextResponse.json(data);
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/api/payments/confirm/route.ts
git commit -m "refactor: 결제 확인 API에 주문 DB 연동 + 금액 검증 추가"
```

---

## Task 10: 고객 주문 페이지 (/order/[menuItemId])

**Files:**
- Create: `components/order/OrderForm.tsx`
- Create: `components/order/OrderSummary.tsx`
- Create: `components/order/PaymentWidget.tsx`
- Create: `app/order/[menuItemId]/page.tsx`

- [ ] **Step 1: OrderForm 컴포넌트 작성**

`components/order/OrderForm.tsx` — 고객 정보 입력 폼.
- 고객명, 연락처, 이메일(선택), 수량 선택
- 수령 방식 (카테고리의 `availableDeliveryMethods`에 따라 픽업/택배 표시)
- 픽업: 날짜/시간 input
- 택배: 배송지 주소 입력, 배송비 표시
- 메모
- 폼 state를 부모로 전달하는 controlled component

- [ ] **Step 2: OrderSummary 컴포넌트 작성**

`components/order/OrderSummary.tsx` — 주문 요약 표시.
- 상품 정보 (이미지, 이름, 가격 x 수량)
- 배송비 (택배 선택 시)
- 총 결제금액
- "결제하기" 버튼

- [ ] **Step 3: PaymentWidget 컴포넌트 작성**

`components/order/PaymentWidget.tsx` — 토스 결제 위젯 래퍼.
- 기존 `app/checkout/page.tsx`의 결제 로직을 재사용 가능한 컴포넌트로 추출
- props: `amount`, `orderNumber`, `orderName`, `customerName`, `customerEmail`, `customerPhone`
- 성공/실패 URL에 `orderNumber` 포함

- [ ] **Step 4: /order/[menuItemId]/page.tsx 작성**

```typescript
// app/order/[menuItemId]/page.tsx
"use client";
// 플로우:
// 1. menuItemId로 메뉴 아이템 조회 (fetch /api/admin/menu/[id] 또는 서버 컴포넌트)
// 2. OrderForm으로 고객 정보 수집
// 3. OrderSummary로 요약 표시
// 4. "결제하기" 클릭 → POST /api/orders로 주문 생성
// 5. 주문 생성 성공 → PaymentWidget 표시 (주문번호를 orderId로 사용)
```

단계별 UI: 정보 입력 → 요약 확인 → 결제

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```

- [ ] **Step 6: 커밋**

```bash
git add components/order/ app/order/
git commit -m "feat: 고객 직접 주문 페이지 및 주문 폼 컴포넌트 추가"
```

---

## Task 11: 링크 결제 페이지 (/pay/[orderNumber])

**Files:**
- Create: `app/pay/[orderNumber]/page.tsx`
- Create: `app/pay/success/page.tsx`

- [ ] **Step 1: /pay/[orderNumber]/page.tsx 작성**

```typescript
// 플로우:
// 1. GET /api/orders/[orderNumber]로 주문 조회
// 2. 만료/이미 결제된 경우 안내 메시지 표시
// 3. 주문 요약 (읽기 전용) 표시
// 4. PaymentWidget으로 토스 결제
```

- [ ] **Step 2: /pay/success/page.tsx 작성**

결제 완료 감사 페이지. 기존 `/checkout/success`와 유사하되 주문번호 표시.

- [ ] **Step 3: /pay/fail/page.tsx 작성**

결제 실패 페이지. 에러 메시지 표시 + 다시 시도 버튼.

- [ ] **Step 4: 기존 /checkout 전체 리다이렉트 설정**

`app/checkout/page.tsx`, `app/checkout/success/page.tsx`, `app/checkout/fail/page.tsx` 모두 수정하여 새 플로우(`/`)로 리다이렉트 처리.

- [ ] **Step 5: 커밋**

```bash
git add app/pay/ app/checkout/
git commit -m "feat: 링크 결제 페이지, 결제 완료/실패 페이지 추가 및 기존 checkout 리다이렉트"
```

---

## Task 12: MenuCard에 "주문하기" 버튼 추가

**Files:**
- Modify: `components/MenuCard.tsx`

- [ ] **Step 1: MenuCard에 주문 버튼 추가**

기존 MenuCard 하단에 "주문하기" 링크 버튼 추가:

```typescript
import Link from "next/link";

// 카드 하단에 추가:
<Link
  href={`/order/${item.id}`}
  className="btn-primary mt-4 block text-center text-sm"
>
  주문하기
</Link>
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

- [ ] **Step 3: 커밋**

```bash
git add components/MenuCard.tsx
git commit -m "feat: 메뉴 카드에 주문하기 버튼 추가"
```

---

## Task 13: 관리자 사이드바에 주문 관리 메뉴 추가

**Files:**
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: 사이드바 네비게이션에 주문 관리 항목 추가**

기존 사이드바의 네비 아이템 배열에 추가:

```typescript
{ href: "/admin/orders", label: "주문 관리", icon: "..." },
```

"메뉴 관리" 다음, "카테고리 관리" 전에 위치.

- [ ] **Step 2: 커밋**

```bash
git add app/admin/layout.tsx
git commit -m "feat: 관리자 사이드바에 주문 관리 메뉴 추가"
```

---

## Task 14: 관리자 주문 목록 페이지

**Files:**
- Create: `components/admin/OrderTable.tsx`
- Create: `app/admin/orders/page.tsx`

- [ ] **Step 1: OrderTable 컴포넌트 작성**

`components/admin/OrderTable.tsx`:
- 채널 탭 (전체 / 직접 결제 / 링크 결제)
- 상태 필터 드롭다운
- 검색 입력 (주문번호, 고객명, 연락처)
- 테이블: 주문번호, 고객명, 상품 요약(첫 번째 아이템명 + 외 N건), 금액, 상태 뱃지, 수령 방식, 주문일
- 행 클릭 → `/admin/orders/[id]` 이동
- 페이지네이션
- 기존 `app/admin/menu/page.tsx`의 테이블 패턴 참고

- [ ] **Step 2: /admin/orders/page.tsx 작성**

OrderTable을 렌더링하는 페이지 컴포넌트.

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npm run build
git add components/admin/OrderTable.tsx app/admin/orders/page.tsx
git commit -m "feat: 관리자 주문 목록 페이지 추가"
```

---

## Task 15: 관리자 주문 상세 페이지

**Files:**
- Create: `components/admin/OrderDetail.tsx`
- Create: `app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: OrderDetail 컴포넌트 작성**

`components/admin/OrderDetail.tsx`:
- 고객 정보 섹션 (이름, 연락처, 이메일)
- 상품 내역 테이블 (상품명, 수량, 단가, 소계)
- 결제 정보 (결제수단, 결제일시, paymentKey)
- 수령 정보 (방식, 픽업일/배송지)
- 메모 (고객 메모 읽기, 사장님 메모 편집 가능)
- 상태 변경 버튼: 현재 상태에 따라 다음 단계 버튼 표시
  - `paid` → "주문 확정" 버튼
  - `confirmed` → "완료 처리" 버튼
  - `paid`/`confirmed` → "취소" 버튼
  - `completed` → "환불" 버튼
- 링크 결제인 경우: 결제 링크 복사 버튼

- [ ] **Step 2: /admin/orders/[id]/page.tsx 작성**

OrderDetail을 렌더링하는 페이지. `fetch /api/admin/orders/[id]`로 데이터 로드.

- [ ] **Step 3: 커밋**

```bash
git add components/admin/OrderDetail.tsx app/admin/orders/\[id\]/page.tsx
git commit -m "feat: 관리자 주문 상세 페이지 추가"
```

---

## Task 16: 관리자 주문 등록 페이지 (링크 결제)

**Files:**
- Create: `components/admin/OrderCreateForm.tsx`
- Create: `components/admin/PaymentLinkModal.tsx`
- Create: `app/admin/orders/new/page.tsx`

- [ ] **Step 1: OrderCreateForm 컴포넌트 작성**

`components/admin/OrderCreateForm.tsx`:
- 고객명, 연락처, 이메일(선택)
- 상품 추가 영역:
  - "메뉴에서 선택" 버튼 → 드롭다운으로 기존 메뉴 선택 (이름+가격 자동 입력)
  - "커스텀 상품 추가" 버튼 → 상품명, 가격 직접 입력
  - 각 상품: 수량 조절, 삭제 가능
  - 여러 상품 추가 가능 (리스트)
- 수령 방식 (픽업/택배)
- 고객 메모, 사장님 메모
- 총액 자동 계산 표시
- "주문 등록" 버튼 → POST /api/admin/orders

- [ ] **Step 2: PaymentLinkModal 컴포넌트 작성**

`components/admin/PaymentLinkModal.tsx`:
- 주문 등록 성공 후 표시되는 모달
- 결제 링크 URL 표시: `{baseUrl}/pay/{orderNumber}`
- "링크 복사" 버튼 (clipboard API)
- 주문번호, 총액 표시
- "닫기" → `/admin/orders`로 이동

- [ ] **Step 3: /admin/orders/new/page.tsx 작성**

OrderCreateForm + PaymentLinkModal을 조합.

- [ ] **Step 4: 커밋**

```bash
git add components/admin/OrderCreateForm.tsx components/admin/PaymentLinkModal.tsx app/admin/orders/new/page.tsx
git commit -m "feat: 관리자 주문 등록 페이지 (링크 결제) 추가"
```

---

## Task 17: 대시보드 API

**Files:**
- Create: `app/api/admin/dashboard/summary/route.ts`
- Create: `app/api/admin/dashboard/sales/route.ts`
- Create: `app/api/admin/dashboard/breakdown/route.ts`

- [ ] **Step 1: GET /api/admin/dashboard/summary**

핵심 지표 (항상 고정 기간):
- 오늘/어제 매출 → 증감률
- 이번 주/지난 주 매출 → 증감률
- 이번 달/지난 달 매출 → 증감률
- 이번 달/지난 달 주문 건수 → 증감률

Supabase에서 `orders` 테이블의 `paid_at` 기준 `status IN ('paid','confirmed','completed')` 조건으로 `SUM(total_amount)`, `COUNT(*)` 집계.

- [ ] **Step 2: GET /api/admin/dashboard/sales**

쿼리 파라미터: `from`, `to`, `granularity` (daily/monthly)
- daily: 날짜별 매출 합계 + 건수
- monthly: 월별 매출 합계 + 건수

Supabase에서 `paid_at` 기준으로 날짜 그룹핑. PostgreSQL의 `DATE_TRUNC` 사용.

- [ ] **Step 3: GET /api/admin/dashboard/breakdown**

쿼리 파라미터: `type` (category/product/channel), `from`, `to`
- category: 카테고리별 매출/건수/비중
- product: 상품별 매출/건수/비중 (order_items JOIN)
- channel: 직접 결제 vs 링크 결제 매출/건수/비중

- [ ] **Step 4: 커밋**

```bash
git add app/api/admin/dashboard/
git commit -m "feat: 매출 대시보드 API 추가 (summary, sales, breakdown)"
```

---

## Task 18: 대시보드 UI 컴포넌트

**Files:**
- Create: `components/admin/DashboardSummaryCards.tsx`
- Create: `components/admin/SalesChart.tsx`
- Create: `components/admin/DateRangeFilter.tsx`
- Create: `components/admin/SalesBreakdownTable.tsx`

- [ ] **Step 1: DashboardSummaryCards 작성**

`components/admin/DashboardSummaryCards.tsx`:
- 4개 카드 그리드 (2x2 또는 4열)
- 각 카드: 라벨, 금액 (formatPrice), 증감률 (초록/빨강 + 화살표)
- props: `summary` 데이터

- [ ] **Step 2: DateRangeFilter 작성**

`components/admin/DateRangeFilter.tsx`:
- 프리셋 버튼: 오늘, 이번 주, 이번 달, 지난 달
- 커스텀 날짜 입력: 시작일, 종료일 (`<input type="date">`)
- 선택 시 `onChange(from, to)` 콜백

- [ ] **Step 3: SalesChart 작성**

`components/admin/SalesChart.tsx`:
- Recharts `ResponsiveContainer` + `LineChart` (일별)
- Recharts `BarChart` (월별)
- Recharts `PieChart` (카테고리별 도넛)
- props로 데이터 + 차트 타입 전달
- "use client" (Recharts는 클라이언트 전용)

- [ ] **Step 4: SalesBreakdownTable 작성**

`components/admin/SalesBreakdownTable.tsx`:
- 상품별 랭킹: 순위, 상품명, 판매 수량, 매출액, 비중%
- 채널별 비교: 채널명, 건수, 금액, 비중%
- 정렬 가능 (매출액/수량 기준)

- [ ] **Step 5: 커밋**

```bash
git add components/admin/DashboardSummaryCards.tsx components/admin/SalesChart.tsx components/admin/DateRangeFilter.tsx components/admin/SalesBreakdownTable.tsx
git commit -m "feat: 매출 대시보드 UI 컴포넌트 추가"
```

---

## Task 19: 대시보드 페이지 통합

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: 기존 대시보드에 매출 섹션 추가**

기존 메뉴 통계 섹션 위에 매출 대시보드 섹션 추가:
1. `DashboardSummaryCards` — 핵심 지표 (항상 표시)
2. `DateRangeFilter` — 기간 선택
3. `SalesChart` (일별 꺾은선) — 선택 기간
4. `SalesChart` (월별 막대) — 선택 기간
5. `SalesChart` (카테고리 도넛) — 선택 기간
6. `SalesBreakdownTable` (상품별) — 선택 기간
7. `SalesBreakdownTable` (채널별) — 선택 기간
8. 기존 메뉴 통계 (하단으로 이동)

데이터 패칭: useEffect + fetch로 각 API 호출. 기간 변경 시 차트/테이블 API 재호출.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/page.tsx
git commit -m "feat: 관리자 대시보드에 매출 통계 섹션 추가"
```

---

## Task 20: 전체 통합 테스트 + 정리

**Files:**
- 전체 프로젝트

- [ ] **Step 1: 빌드 + 린트 확인**

```bash
npm run lint
npm run build
```

- [ ] **Step 2: 개발 서버에서 주요 플로우 수동 테스트**

1. 메뉴 페이지에서 "주문하기" 클릭 → 주문 폼 → 결제
2. 관리자 > 주문 등록 → 결제 링크 복사 → 링크 결제 페이지
3. 관리자 > 주문 목록 → 필터/검색 → 주문 상세 → 상태 변경
4. 관리자 > 대시보드 → 매출 지표 + 차트 + 분석 테이블 확인
5. 기간 필터 변경 시 차트 업데이트 확인

- [ ] **Step 3: 최종 커밋**

```bash
git add .
git commit -m "feat: 주문/결제 시스템 + 매출 대시보드 통합 완료"
```
