// lib/coupon-db.ts
// 쿠폰 템플릿 CRUD, 발급, 검증, 자동 트리거

import { getSupabaseOrThrow } from './db-utils'
import {
  DbCouponTemplate, CouponTemplate, toCouponTemplate,
  DbCustomerCoupon, CustomerCoupon, toCustomerCoupon,
  CouponType, CouponDistribution, AutoTrigger,
} from '@/data/customer'

// === 쿠폰 템플릿 CRUD ===

export async function createCouponTemplate(input: {
  name: string
  type: CouponType
  value: number
  freeItemId?: string
  minOrderAmount?: number
  maxDiscount?: number
  validDays?: number
  categoryId?: string
  distribution: CouponDistribution
  code?: string
  autoTrigger?: AutoTrigger
  autoTriggerValue?: number
  maxIssues?: number
}): Promise<CouponTemplate> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('coupon_templates')
    .insert({
      name: input.name,
      type: input.type,
      value: input.value,
      free_item_id: input.freeItemId || null,
      min_order_amount: input.minOrderAmount || 0,
      max_discount: input.maxDiscount || null,
      valid_days: input.validDays || null,
      category_id: input.categoryId || null,
      distribution: input.distribution,
      code: input.code?.toUpperCase() || null,
      auto_trigger: input.autoTrigger || null,
      auto_trigger_value: input.autoTriggerValue || null,
      max_issues: input.maxIssues || null,
    })
    .select()
    .single()

  if (error) throw new Error(`쿠폰 템플릿 생성 실패: ${error.message}`)
  return toCouponTemplate(data as DbCouponTemplate)
}

export async function updateCouponTemplate(
  id: string,
  input: Partial<{
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
  }>
): Promise<CouponTemplate> {
  const supabase = getSupabaseOrThrow()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.type !== undefined) updateData.type = input.type
  if (input.value !== undefined) updateData.value = input.value
  if (input.freeItemId !== undefined) updateData.free_item_id = input.freeItemId
  if (input.minOrderAmount !== undefined) updateData.min_order_amount = input.minOrderAmount
  if (input.maxDiscount !== undefined) updateData.max_discount = input.maxDiscount
  if (input.validDays !== undefined) updateData.valid_days = input.validDays
  if (input.categoryId !== undefined) updateData.category_id = input.categoryId
  if (input.isActive !== undefined) updateData.is_active = input.isActive
  if (input.distribution !== undefined) updateData.distribution = input.distribution
  if (input.code !== undefined) updateData.code = input.code?.toUpperCase() || null
  if (input.autoTrigger !== undefined) updateData.auto_trigger = input.autoTrigger
  if (input.autoTriggerValue !== undefined) updateData.auto_trigger_value = input.autoTriggerValue
  if (input.maxIssues !== undefined) updateData.max_issues = input.maxIssues

  const { data, error } = await supabase
    .from('coupon_templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`쿠폰 템플릿 수정 실패: ${error.message}`)
  return toCouponTemplate(data as DbCouponTemplate)
}

export async function getCouponTemplates(params?: {
  isActive?: boolean
  page?: number
  limit?: number
}): Promise<{ templates: CouponTemplate[]; total: number }> {
  const supabase = getSupabaseOrThrow()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const offset = (page - 1) * limit

  let query = supabase.from('coupon_templates').select('*', { count: 'exact' })

  if (params?.isActive !== undefined) {
    query = query.eq('is_active', params.isActive)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`쿠폰 템플릿 목록 조회 실패: ${error.message}`)

  return {
    templates: (data as DbCouponTemplate[]).map(toCouponTemplate),
    total: count ?? 0,
  }
}

export async function getCouponTemplateById(id: string): Promise<CouponTemplate | null> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from('coupon_templates')
    .select()
    .eq('id', id)
    .single()

  if (error) return null
  return toCouponTemplate(data as DbCouponTemplate)
}

// === 쿠폰 발급/사용 ===

export async function issueCoupon(
  customerId: string,
  templateId: string
): Promise<CustomerCoupon> {
  const supabase = getSupabaseOrThrow()

  // 템플릿 조회
  const { data: template, error: tErr } = await supabase
    .from('coupon_templates')
    .select()
    .eq('id', templateId)
    .single()

  if (tErr || !template) throw new Error('쿠폰 템플릿을 찾을 수 없습니다')

  // max_issues 체크
  if (template.max_issues && template.issued_count >= template.max_issues) {
    throw new Error('쿠폰 발급 한도에 도달했습니다')
  }

  // expires_at 계산
  const expiresAt = template.valid_days
    ? new Date(Date.now() + template.valid_days * 86400000).toISOString()
    : null

  // 쿠폰 발급
  const { data: coupon, error: cErr } = await supabase
    .from('customer_coupons')
    .insert({
      customer_id: customerId,
      template_id: templateId,
      status: 'active',
      expires_at: expiresAt,
    })
    .select('*, coupon_templates(*)')
    .single()

  if (cErr) throw new Error(`쿠폰 발급 실패: ${cErr.message}`)

  // issued_count 증가
  await supabase
    .from('coupon_templates')
    .update({ issued_count: template.issued_count + 1 })
    .eq('id', templateId)

  return toCustomerCoupon(coupon as DbCustomerCoupon)
}

// 고객 보유 쿠폰 목록 (활성 쿠폰만)
export async function getCustomerCoupons(
  customerId: string,
  includeUsed = false
): Promise<CustomerCoupon[]> {
  const supabase = getSupabaseOrThrow()

  let query = supabase
    .from('customer_coupons')
    .select('*, coupon_templates(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (!includeUsed) {
    query = query.eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
  }

  const { data, error } = await query
  if (error) throw new Error(`쿠폰 목록 조회 실패: ${error.message}`)

  return (data as DbCustomerCoupon[]).map(toCustomerCoupon)
}

// 쿠폰 사용 처리
export async function applyCoupon(couponId: string, orderId: string): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { error } = await supabase
    .from('customer_coupons')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
      order_id: orderId,
    })
    .eq('id', couponId)
    .eq('status', 'active')

  if (error) throw new Error(`쿠폰 사용 처리 실패: ${error.message}`)
}

// 코드 쿠폰 검증
export async function validateCouponCode(code: string): Promise<CouponTemplate | null> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('coupon_templates')
    .select()
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  const template = data as DbCouponTemplate
  if (template.max_issues && template.issued_count >= template.max_issues) return null

  return toCouponTemplate(template)
}

// 코드 쿠폰 사용 (발급 + 즉시 사용)
export async function applyCodeCoupon(
  customerId: string,
  templateId: string,
  orderId: string
): Promise<CustomerCoupon> {
  const supabase = getSupabaseOrThrow()

  // 중복 사용 방지 (I3)
  const existing = await supabase
    .from('customer_coupons')
    .select('id')
    .eq('customer_id', customerId)
    .eq('template_id', templateId)
    .single()
  if (existing.data) throw new Error('이미 사용한 쿠폰 코드입니다')

  // 발급 + 즉시 사용
  const { data: coupon, error } = await supabase
    .from('customer_coupons')
    .insert({
      customer_id: customerId,
      template_id: templateId,
      status: 'used',
      used_at: new Date().toISOString(),
      order_id: orderId,
    })
    .select('*, coupon_templates(*)')
    .single()

  if (error) throw new Error(`코드 쿠폰 사용 실패: ${error.message}`)

  // issued_count 증가
  const { error: rpcError } = await supabase.rpc('increment_issued_count', { p_template_id: templateId })
  if (rpcError) {
    // fallback: direct update
    await supabase
      .from('coupon_templates')
      .update({ issued_count: (coupon as DbCustomerCoupon).coupon_templates!.issued_count + 1 })
      .eq('id', templateId)
  }

  return toCustomerCoupon(coupon as DbCustomerCoupon)
}

// 쿠폰 복원 (주문 취소 시)
export async function restoreCoupon(couponId: string): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { data: coupon } = await supabase
    .from('customer_coupons')
    .select()
    .eq('id', couponId)
    .single()

  if (!coupon) return

  // 만료 전이면 active로 복원
  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
  if (!isExpired) {
    await supabase
      .from('customer_coupons')
      .update({ status: 'active', used_at: null, order_id: null })
      .eq('id', couponId)
  }
}

// 쿠폰 유형별 할인 금액 계산
export function calculateCouponDiscount(
  template: CouponTemplate,
  totalAmount: number,
  shippingFee: number,
  freeItemPrice?: number
): number {
  switch (template.type) {
    case 'fixed':
      return Math.min(template.value, totalAmount)
    case 'percent': {
      const discount = Math.floor(totalAmount * template.value / 100)
      return template.maxDiscount ? Math.min(discount, template.maxDiscount) : discount
    }
    case 'free_item':
      return freeItemPrice ?? 0
    case 'free_shipping':
      return shippingFee
    default:
      return 0
  }
}

// 자동 트리거 체크 + 쿠폰 발급
export async function checkAutoTriggers(
  customerId: string,
  orderCount: number
): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { data: templates } = await supabase
    .from('coupon_templates')
    .select()
    .eq('is_active', true)
    .not('auto_trigger', 'is', null)

  if (!templates || templates.length === 0) return

  for (const tpl of templates as DbCouponTemplate[]) {
    let shouldIssue = false

    if (tpl.auto_trigger === 'first_order' && orderCount === 1) {
      shouldIssue = true
    } else if (tpl.auto_trigger === 'nth_order' && tpl.auto_trigger_value && orderCount === tpl.auto_trigger_value) {
      shouldIssue = true
    }

    if (!shouldIssue) continue

    // 중복 발급 방지 (I4)
    const existing = await supabase
      .from('customer_coupons')
      .select('id')
      .eq('customer_id', customerId)
      .eq('template_id', tpl.id)
      .in('status', ['active', 'used'])
      .single()
    if (existing.data) continue

    try {
      await issueCoupon(customerId, tpl.id)
    } catch {
      // 발급 실패 시 무시 (로깅은 추후)
    }
  }
}
