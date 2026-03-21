# 주문/결제 시스템 + 매출 대시보드 설계

## 개요

넉넉 디저트 관리자 페이지에 주문/결제 시스템과 매출 대시보드를 추가한다. 두 가지 결제 채널(고객 직접 결제 / 사장님 링크 결제)을 지원하고, 결제 데이터 기반 매출 분석 대시보드를 제공한다.

## 접근법

Supabase Only — 현재 스택(Supabase + 토스페이먼츠)을 그대로 활용. 차트는 Recharts 사용. 추가 인프라 없이 구현.

---

## 1. 데이터베이스 설계

### `orders` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | 주문 ID |
| `order_number` | TEXT (UNIQUE) | 주문번호 (예: `NUK-20260321-001`) |
| `channel` | TEXT | `direct` (고객 직접) / `link` (사장님 등록) |
| `status` | TEXT | `pending` / `paid` / `confirmed` / `completed` / `cancelled` / `refunded` |
| `customer_name` | TEXT | 고객명 |
| `customer_phone` | TEXT | 연락처 |
| `customer_memo` | TEXT | 고객 메모 (요청사항) |
| `admin_memo` | TEXT | 사장님 메모 (내부용) |
| `delivery_method` | TEXT | `pickup` / `shipping` |
| `delivery_address` | TEXT | 택배 시 배송지 |
| `pickup_date` | TIMESTAMPTZ | 픽업/수령 희망일시 |
| `total_amount` | INTEGER | 총 결제금액 |
| `shipping_fee` | INTEGER | 배송비 (0이면 픽업) |
| `payment_key` | TEXT | 토스 paymentKey |
| `payment_method` | TEXT | 결제수단 (카드, 계좌이체 등) |
| `paid_at` | TIMESTAMPTZ | 결제 완료 시각 |
| `created_at` | TIMESTAMPTZ | 주문 생성일 |
| `updated_at` | TIMESTAMPTZ | 최종 수정일 |

### `order_items` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | |
| `order_id` | UUID (FK → orders) | 주문 참조 |
| `menu_item_id` | TEXT | 메뉴 아이템 참조 (nullable, 커스텀 상품 시) |
| `name` | TEXT | 상품명 (주문 시점 스냅샷) |
| `quantity` | INTEGER | 수량 |
| `unit_price` | INTEGER | 개당 가격 |
| `subtotal` | INTEGER | 소계 |

### `menu_categories` 변경

| 추가 컬럼 | 타입 | 설명 |
|-----------|------|------|
| `available_delivery_methods` | TEXT[] | `['pickup']`, `['shipping']`, `['pickup', 'shipping']` |

### RLS 정책

- `orders`: SELECT/INSERT 공개 (고객 주문 생성용), UPDATE/DELETE 서비스 롤만
- `order_items`: SELECT/INSERT 공개, UPDATE/DELETE 서비스 롤만
- 고객은 자기 주문만 조회할 수 있도록 `order_number` 기반 접근

---

## 2. 주문 플로우

### A) 고객 직접 결제 (고정가 상품)

```
고객이 메뉴 페이지에서 상품 선택
  → 주문 정보 입력 폼 (고객명, 연락처, 수량, 수령 방식, 메모)
  → 카테고리의 available_delivery_methods에 따라 픽업/택배 선택지 표시
  → 픽업 선택 시: 픽업 날짜/시간 선택
  → 택배 선택 시: 배송지 입력 + 배송비 자동 추가
  → 주문 요약 확인
  → 토스페이먼츠 결제
  → 결제 완료 → orders 테이블에 저장 (channel: 'direct', status: 'paid')
  → 디스코드/이메일 알림 발송
```

### B) 사장님 링크 결제 (상담 후)

```
사장님이 관리자 페이지에서 주문 등록
  → 고객명, 연락처, 상품명, 수량, 가격(직접 입력), 수령 방식, 메모 입력
  → 주문 생성 (channel: 'link', status: 'pending')
  → 결제 링크 자동 생성 → URL 복사 버튼
  → 사장님이 고객에게 DM/문자로 링크 전달
  → 고객이 링크 열면 → 주문 요약 + 토스 결제 위젯
  → 결제 완료 → status: 'paid'로 업데이트
  → 알림 발송
```

### 주문 상태 흐름

```
pending (대기) → paid (결제완료) → confirmed (확정) → completed (완료)
                    ↓                    ↓
                cancelled (취소)    cancelled (취소)
                    ↓
                refunded (환불)
```

- `pending`: 링크 결제 대기 중 (직접 결제는 이 단계 건너뜀)
- `paid`: 결제 완료, 사장님 확인 대기
- `confirmed`: 사장님이 주문 확인/수락
- `completed`: 상품 수령 완료
- `cancelled` / `refunded`: 취소 또는 환불

---

## 3. 관리자 주문 관리 페이지

### `/admin/orders` — 주문 목록

- 탭으로 채널 구분: **전체** | **직접 결제** | **링크 결제**
- 상태 필터: 전체 / 대기 / 결제완료 / 확정 / 완료 / 취소·환불
- 검색: 주문번호, 고객명, 연락처
- 테이블 컬럼: 주문번호, 고객명, 상품 요약, 금액, 결제 상태(뱃지), 수령 방식, 주문일
- 각 행 클릭 → 주문 상세로 이동

### `/admin/orders/[id]` — 주문 상세

- 주문 정보 전체 표시 (고객 정보, 상품 내역, 결제 정보)
- 상태 변경 버튼: `결제완료 → 확정`, `확정 → 완료`, `취소`, `환불`
- 사장님 메모 편집
- 링크 결제인 경우: 결제 링크 복사 버튼, 결제 여부 표시

### `/admin/orders/new` — 사장님 주문 등록 (링크 결제용)

- 고객명, 연락처 입력
- 상품 추가: 메뉴에서 선택 또는 커스텀 상품명+가격 직접 입력
- 수량, 수령 방식, 메모
- 저장 시 → 결제 링크 생성 → URL 복사 모달 표시

---

## 4. 매출 대시보드

### 위치

기존 `/admin` 대시보드를 확장. 메뉴 통계(현재)와 매출 통계를 함께 표시.

### 상단: 핵심 지표 카드

| 카드 | 내용 |
|------|------|
| 오늘 매출 | 금액 + 전일 대비 증감% |
| 이번 주 매출 | 금액 + 전주 대비 증감% |
| 이번 달 매출 | 금액 + 전월 대비 증감% |
| 총 주문 건수 | 이번 달 기준 + 전월 대비 |

### 중단: 차트 영역 (Recharts)

- **일별 매출 추이** — 꺾은선 그래프 (기본: 최근 30일)
- **월별 매출 추이** — 막대 그래프 (기본: 최근 12개월)
- **카테고리별 매출 비중** — 도넛 차트

### 하단: 분석 테이블

- **상품별 매출 랭킹** — 상품명, 판매 수량, 매출액, 비중% (정렬 가능)
- **결제 채널 비교** — 직접 결제 vs 링크 결제: 건수, 금액, 비중

### 기간 필터

페이지 상단에 공통 기간 필터:
- 프리셋: 오늘 / 이번 주 / 이번 달 / 지난 달
- 커스텀: 시작일 ~ 종료일 날짜 피커
- 선택한 기간이 모든 차트와 지표에 동시 적용

---

## 5. 고객 주문 페이지

### `/order/[menuItemId]` — 고객 직접 주문

메뉴 카드에 "주문하기" 버튼 추가 → 클릭 시 주문 페이지로 이동.

**주문 폼:**
1. 상품 정보 표시 (이미지, 이름, 가격)
2. 수량 선택
3. 고객 정보: 이름, 연락처
4. 수령 방식: 카테고리의 `available_delivery_methods`에 따라 표시
   - 픽업: 날짜/시간 선택
   - 택배: 배송지 입력 + 배송비 표시
5. 메모 (요청사항)
6. 주문 요약 (상품 + 배송비 = 총액)
7. 결제하기 → 토스페이먼츠 위젯

### `/pay/[orderId]` — 링크 결제 페이지

사장님이 생성한 결제 링크의 도착 페이지.

1. 주문 요약 표시 (상품 내역, 총액) — 읽기 전용
2. 토스페이먼츠 결제 위젯
3. 결제 완료 시 → 감사 페이지

### 기존 `/checkout` 페이지

새로운 주문 플로우로 대체되므로 제거 또는 리다이렉트 처리.

---

## 6. API 엔드포인트

### 주문 API

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| POST | `/api/orders` | 없음 | 고객 주문 생성 (direct) |
| GET | `/api/orders/[id]` | 없음 | 주문 조회 (결제 링크 페이지용, order_number 기반) |
| GET | `/api/admin/orders` | 관리자 | 주문 목록 (필터, 검색, 페이지네이션) |
| POST | `/api/admin/orders` | 관리자 | 사장님 주문 등록 (link) |
| GET | `/api/admin/orders/[id]` | 관리자 | 주문 상세 |
| PUT | `/api/admin/orders/[id]` | 관리자 | 주문 상태 변경, 메모 수정 |

### 결제 API

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| POST | `/api/payments/confirm` | 없음 | 토스 결제 확인 (기존 수정) |

### 대시보드 API

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/admin/dashboard/summary` | 관리자 | 핵심 지표 (오늘/주/월 매출, 주문 건수) |
| GET | `/api/admin/dashboard/daily` | 관리자 | 일별 매출 데이터 (기간 파라미터) |
| GET | `/api/admin/dashboard/monthly` | 관리자 | 월별 매출 데이터 |
| GET | `/api/admin/dashboard/categories` | 관리자 | 카테고리별 매출 |
| GET | `/api/admin/dashboard/products` | 관리자 | 상품별 매출 랭킹 |
| GET | `/api/admin/dashboard/channels` | 관리자 | 채널별 비교 |

---

## 7. 기술 스택 추가

| 패키지 | 용도 |
|--------|------|
| `recharts` | 매출 차트 (꺾은선, 막대, 도넛) |
| `react-datepicker` 또는 커스텀 | 기간 선택 날짜 피커 |

기존 스택 유지: Next.js 14, Supabase, 토스페이먼츠, NextAuth, Framer Motion, Tailwind CSS.

---

## 8. 향후 확장 (이번 스펙 범위 밖)

- 예약 캘린더 (orders 데이터의 pickup_date 기반)
- 회계 관리 (매입/비용 테이블 추가)
- 고객 관리 (재주문 고객 추적)
- 환불 API 연동 (토스 취소 API)
