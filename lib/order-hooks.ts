// lib/order-hooks.ts
// 주문 완료/취소 시 후처리 — 포인트, 추천, 자동 쿠폰

import { getSupabaseOrThrow } from './db-utils'
import { getOrderById } from './order-db'
import { getCustomerById, incrementCustomerStats, decrementCustomerStats, generateReferralCode } from './customer-db'
import { addPoints, deductPoints, calculateEarnPoints } from './point-db'
import { checkAutoTriggers, restoreCoupon, issueCoupon } from './coupon-db'
import { sendKakaoAlimtalk } from './kakao-notification'
import { getSettingNumber } from './settings-db'
import { REFERRAL_REWARD_POINTS } from '@/data/customer'
import { COUPON_POINT_ENABLED } from './feature-flags'

// 주문 완료 시 후처리
export async function onOrderCompleted(orderId: string): Promise<void> {
  if (!COUPON_POINT_ENABLED) return

  const order = await getOrderById(orderId)
  if (!order || !order.customerId) return // legacy order

  const customerId = order.customerId

  // 1. 포인트 적립
  const earnAmount = await calculateEarnPoints(order.finalAmount)
  if (earnAmount > 0) {
    await addPoints({
      customerId,
      type: 'earn',
      amount: earnAmount,
      orderId,
      description: `주문 ${order.orderNumber} 적립`,
    })

    // order에 point_earned 업데이트
    const supabase = getSupabaseOrThrow()
    await supabase
      .from('orders')
      .update({ point_earned: earnAmount })
      .eq('id', orderId)
  }

  // 2. 고객 통계 업데이트
  await incrementCustomerStats(customerId, order.finalAmount)

  // 3. 추천 코드 생성 (없으면)
  const customer = await getCustomerById(customerId)
  if (customer && !customer.referralCode) {
    await generateReferralCode(customerId).catch(() => {})
  }

  // 4. 추천 보상 (첫 주문 + 추천인 있음)
  if (customer && customer.referredBy && customer.totalOrders === 0) {
    // 추천인에게 포인트 지급
    const referralReward = await getSettingNumber('referral_reward_points') || REFERRAL_REWARD_POINTS
    await addPoints({
      customerId: customer.referredBy,
      type: 'referral',
      amount: referralReward,
      orderId,
      description: `추천 보상 (${customer.phone})`,
    }).catch(() => {})

    // 추천 쿠폰 발급 (referral 트리거 템플릿)
    const supabase = getSupabaseOrThrow()
    const { data: referralTemplates } = await supabase
      .from('coupon_templates')
      .select()
      .eq('auto_trigger', 'referral')
      .eq('is_active', true)

    if (referralTemplates) {
      for (const tpl of referralTemplates) {
        await issueCoupon(customerId, tpl.id).catch(() => {})
      }
    }
  }

  // 5. 자동 트리거 쿠폰 체크
  const updatedCustomer = await getCustomerById(customerId)
  if (updatedCustomer) {
    await checkAutoTriggers(customerId, updatedCustomer.totalOrders)
  }

  // 6. 주문 완료 알림톡 (추천 코드 포함)
  const finalCustomer = await getCustomerById(customerId)
  if (finalCustomer?.referralCode) {
    sendKakaoAlimtalk(order, finalCustomer.referralCode).catch(() => {})
  }
}

// 주문 취소 시 후처리
export async function onOrderCancelled(orderId: string): Promise<void> {
  if (!COUPON_POINT_ENABLED) return

  const order = await getOrderById(orderId)
  if (!order || !order.customerId) return

  const customerId = order.customerId

  // 1. 적립 포인트 차감
  if (order.pointEarned > 0) {
    await deductPoints({
      customerId,
      type: 'cancel_deduct',
      amount: order.pointEarned,
      orderId,
      description: `주문 ${order.orderNumber} 취소 — 적립 포인트 차감`,
    }).catch(() => {})
  }

  // 2. 사용 포인트 복원
  if (order.pointUsed > 0) {
    await addPoints({
      customerId,
      type: 'cancel_restore',
      amount: order.pointUsed,
      orderId,
      description: `주문 ${order.orderNumber} 취소 — 포인트 복원`,
    }).catch(() => {})
  }

  // 3. 쿠폰 복원
  if (order.couponId) {
    await restoreCoupon(order.couponId).catch(() => {})
  }

  // 4. 고객 통계 차감
  await decrementCustomerStats(customerId, order.finalAmount)
}
