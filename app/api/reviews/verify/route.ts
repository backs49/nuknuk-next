// app/api/reviews/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { REVIEW_ENABLED } from '@/lib/feature-flags'
import { getSupabaseOrThrow } from '@/lib/db-utils'

export async function POST(req: NextRequest) {
  if (!REVIEW_ENABLED) {
    return NextResponse.json({ error: '리뷰 기능이 비활성화되어 있습니다' }, { status: 403 })
  }

  const { orderNumber, phone } = await req.json()
  if (!orderNumber || !phone) {
    return NextResponse.json({ verified: false, message: '주문번호와 전화번호를 입력해주세요' })
  }

  const supabase = getSupabaseOrThrow()

  // 주문 조회
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, customer_phone, customer_name, order_items(menu_item_id, name)')
    .eq('order_number', orderNumber.trim())
    .single()

  if (error || !order) {
    return NextResponse.json({ verified: false, message: '주문번호를 찾을 수 없습니다' })
  }

  // 전화번호 비교 (숫자만 추출 후 비교)
  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '')
  if (normalizePhone(order.customer_phone) !== normalizePhone(phone)) {
    return NextResponse.json({ verified: false, message: '전화번호가 일치하지 않습니다' })
  }

  // 주문 상태 체크
  if (order.status !== 'completed') {
    return NextResponse.json({ verified: false, message: '완료된 주문만 리뷰를 작성할 수 있습니다' })
  }

  // 각 상품별 리뷰 존재 여부 체크
  const menuItemIds = (order.order_items as { menu_item_id: string; name: string }[])
    .filter((item) => item.menu_item_id)
    .map((item) => item.menu_item_id)

  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('menu_item_id')
    .eq('order_id', order.id)
    .in('menu_item_id', menuItemIds.length > 0 ? menuItemIds : ['none'])

  const reviewedIds = new Set((existingReviews || []).map((r: { menu_item_id: string }) => r.menu_item_id))

  const items = (order.order_items as { menu_item_id: string; name: string }[])
    .filter((item) => item.menu_item_id)
    .map((item) => ({
      menuItemId: item.menu_item_id,
      menuItemName: item.name,
      hasReview: reviewedIds.has(item.menu_item_id),
    }))

  return NextResponse.json({
    verified: true,
    orderId: order.id,
    customerName: order.customer_name,
    items,
  })
}
