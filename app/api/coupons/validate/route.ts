import { NextRequest, NextResponse } from 'next/server'
import { validateCouponCode, calculateCouponDiscount } from '@/lib/coupon-db'
import { couponValidateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { INPUT_LIMITS } from '@/lib/input-limits'

export async function POST(request: NextRequest) {
  try {
    const { success, reset } = await couponValidateLimit.limit(getClientIp(request))
    if (!success) return rateLimitResponse(reset)

    const body = await request.json()
    const { code, totalAmount, shippingFee } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, reason: '쿠폰 코드를 입력해주세요' })
    }
    if (code.length > INPUT_LIMITS.couponCode) {
      return NextResponse.json({ valid: false, reason: '쿠폰 코드 형식이 올바르지 않습니다' })
    }

    const template = await validateCouponCode(code)
    if (!template) {
      return NextResponse.json({ valid: false, reason: '유효하지 않은 쿠폰 코드입니다' })
    }

    if (template.minOrderAmount > 0 && totalAmount < template.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        reason: `최소 주문 금액 ${template.minOrderAmount.toLocaleString()}원 이상이어야 합니다`,
      })
    }

    const discount = calculateCouponDiscount(template, totalAmount || 0, shippingFee || 0)

    return NextResponse.json({
      valid: true,
      template,
      discount,
    })
  } catch (error) {
    console.error('Coupon validate error:', error)
    return NextResponse.json({ valid: false, reason: '쿠폰 검증 실패' })
  }
}
