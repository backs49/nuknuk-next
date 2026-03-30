import { NextRequest, NextResponse } from 'next/server'
import { getCustomerByPhone } from '@/lib/customer-db'
import { getCustomerCoupons } from '@/lib/coupon-db'

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone')
    if (!phone) {
      return NextResponse.json({ error: '전화번호가 필요합니다' }, { status: 400 })
    }

    const customer = await getCustomerByPhone(phone)
    if (!customer) {
      return NextResponse.json({ customer: null, coupons: [], pointBalance: 0 })
    }

    const coupons = await getCustomerCoupons(customer.id)

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        pointBalance: customer.pointBalance,
        referralCode: customer.referralCode,
        referredBy: customer.referredBy,
        totalOrders: customer.totalOrders,
      },
      coupons,
      pointBalance: customer.pointBalance,
    })
  } catch (error) {
    console.error('Customer lookup error:', error)
    return NextResponse.json({ error: '고객 조회 실패' }, { status: 500 })
  }
}
