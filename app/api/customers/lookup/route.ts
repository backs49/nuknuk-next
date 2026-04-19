// GET /api/customers/lookup?phone=... — 고객 혜택 조회 (체크아웃용)
//
// 보안: 번호만 알면 호출할 수 있는 엔드포인트이므로 PII(이름 등)를 절대 반환하지 않는다.
// enumeration 공격(번호 전수조사)으로 고객 이름·주문이력 매핑이 유출되는 것을 방지.
// 응답은 체크아웃에 필요한 최소 정보(포인트, 쿠폰, 내 추천코드, 추천코드 입력 가능 여부)만 포함.
//
// 관리자용 전체 고객 정보 조회는 /api/admin/customers/* (세션 가드) 경유.

import { NextRequest, NextResponse } from 'next/server'
import { getCustomerByPhone } from '@/lib/customer-db'
import { getCustomerCoupons } from '@/lib/coupon-db'
import { customerLookupLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const { success, reset } = await customerLookupLimit.limit(getClientIp(request))
    if (!success) return rateLimitResponse(reset)

    const phone = request.nextUrl.searchParams.get('phone')
    if (!phone) {
      return NextResponse.json({ error: '전화번호가 필요합니다' }, { status: 400 })
    }

    const customer = await getCustomerByPhone(phone)
    if (!customer) {
      return NextResponse.json({ customer: null, coupons: [], pointBalance: 0 })
    }

    const coupons = await getCustomerCoupons(customer.id)
    const canUseReferralCode =
      customer.referredBy === null && customer.totalOrders === 0

    return NextResponse.json({
      customer: {
        pointBalance: customer.pointBalance,
        referralCode: customer.referralCode,
        canUseReferralCode,
      },
      coupons,
      pointBalance: customer.pointBalance,
    })
  } catch {
    console.error('Customer lookup error')
    return NextResponse.json({ error: '고객 조회 실패' }, { status: 500 })
  }
}
