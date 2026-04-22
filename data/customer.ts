// data/customer.ts
// 고객, 포인트, 쿠폰 타입 정의

// === Customer ===
export interface Customer {
  id: string
  phone: string
  name: string | null
  pointBalance: number
  totalOrders: number
  totalSpent: number
  referralCode: string | null
  referredBy: string | null
  marketingConsent: boolean
  lastConsentAt: string | null
  createdAt: string
}

export interface DbCustomer {
  id: string
  phone: string
  name: string | null
  point_balance: number
  total_orders: number
  total_spent: number
  referral_code: string | null
  referred_by: string | null
  marketing_consent: boolean | null
  last_consent_at: string | null
  created_at: string
}

export function toCustomer(db: DbCustomer): Customer {
  return {
    id: db.id,
    phone: db.phone,
    name: db.name,
    pointBalance: db.point_balance,
    totalOrders: db.total_orders,
    totalSpent: db.total_spent,
    referralCode: db.referral_code,
    referredBy: db.referred_by,
    marketingConsent: db.marketing_consent ?? false,
    lastConsentAt: db.last_consent_at,
    createdAt: db.created_at,
  }
}

// === Point Transactions ===
export type PointTransactionType =
  | 'earn'
  | 'use'
  | 'admin_add'
  | 'admin_deduct'
  | 'referral'
  | 'cancel_restore'
  | 'cancel_deduct'

export interface PointTransaction {
  id: string
  customerId: string
  type: PointTransactionType
  amount: number
  balanceAfter: number
  orderId: string | null
  description: string
  createdAt: string
}

export interface DbPointTransaction {
  id: string
  customer_id: string
  type: PointTransactionType
  amount: number
  balance_after: number
  order_id: string | null
  description: string
  created_at: string
}

export function toPointTransaction(db: DbPointTransaction): PointTransaction {
  return {
    id: db.id,
    customerId: db.customer_id,
    type: db.type,
    amount: db.amount,
    balanceAfter: db.balance_after,
    orderId: db.order_id,
    description: db.description,
    createdAt: db.created_at,
  }
}

// === Coupon Templates ===
export type CouponType = 'fixed' | 'percent' | 'free_item' | 'free_shipping'
export type CouponDistribution = 'manual' | 'auto' | 'code'
export type AutoTrigger = 'first_order' | 'nth_order' | 'referral'

export interface CouponTemplate {
  id: string
  name: string
  type: CouponType
  value: number
  freeItemId: string | null
  minOrderAmount: number
  maxDiscount: number | null
  validDays: number | null
  categoryId: string | null
  isActive: boolean
  distribution: CouponDistribution
  code: string | null
  autoTrigger: AutoTrigger | null
  autoTriggerValue: number | null
  maxIssues: number | null
  issuedCount: number
  createdAt: string
}

export interface DbCouponTemplate {
  id: string
  name: string
  type: CouponType
  value: number
  free_item_id: string | null
  min_order_amount: number
  max_discount: number | null
  valid_days: number | null
  category_id: string | null
  is_active: boolean
  distribution: CouponDistribution
  code: string | null
  auto_trigger: AutoTrigger | null
  auto_trigger_value: number | null
  max_issues: number | null
  issued_count: number
  created_at: string
}

export function toCouponTemplate(db: DbCouponTemplate): CouponTemplate {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    value: db.value,
    freeItemId: db.free_item_id,
    minOrderAmount: db.min_order_amount,
    maxDiscount: db.max_discount,
    validDays: db.valid_days,
    categoryId: db.category_id,
    isActive: db.is_active,
    distribution: db.distribution,
    code: db.code,
    autoTrigger: db.auto_trigger,
    autoTriggerValue: db.auto_trigger_value,
    maxIssues: db.max_issues,
    issuedCount: db.issued_count,
    createdAt: db.created_at,
  }
}

// === Customer Coupons ===
export type CouponStatus = 'active' | 'used' | 'expired'

export interface CustomerCoupon {
  id: string
  customerId: string
  templateId: string
  status: CouponStatus
  expiresAt: string | null
  usedAt: string | null
  orderId: string | null
  createdAt: string
  template?: CouponTemplate  // joined
}

export interface DbCustomerCoupon {
  id: string
  customer_id: string
  template_id: string
  status: CouponStatus
  expires_at: string | null
  used_at: string | null
  order_id: string | null
  created_at: string
  coupon_templates?: DbCouponTemplate  // joined
}

export function toCustomerCoupon(db: DbCustomerCoupon): CustomerCoupon {
  return {
    id: db.id,
    customerId: db.customer_id,
    templateId: db.template_id,
    status: db.status,
    expiresAt: db.expires_at,
    usedAt: db.used_at,
    orderId: db.order_id,
    createdAt: db.created_at,
    template: db.coupon_templates ? toCouponTemplate(db.coupon_templates) : undefined,
  }
}

// === Helpers ===
export function normalizePhone(phone: string): string {
  return phone.replace(/[-\s]/g, '')
}

export const POINT_EARN_RATE = 0.03  // 3%
export const REFERRAL_REWARD_POINTS = 1000

export const POINT_TYPE_LABELS: Record<PointTransactionType, string> = {
  earn: '주문 적립',
  use: '포인트 사용',
  admin_add: '관리자 지급',
  admin_deduct: '관리자 차감',
  referral: '추천 보상',
  cancel_restore: '취소 복원',
  cancel_deduct: '취소 차감',
}

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  fixed: '정액 할인',
  percent: '정률 할인',
  free_item: '무료 상품',
  free_shipping: '배송비 무료',
}

export const COUPON_STATUS_LABELS: Record<CouponStatus, { label: string; color: string }> = {
  active: { label: '사용 가능', color: 'text-green-600 bg-green-50' },
  used: { label: '사용 완료', color: 'text-gray-500 bg-gray-50' },
  expired: { label: '만료', color: 'text-red-500 bg-red-50' },
}
