// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { REVIEW_ENABLED } from '@/lib/feature-flags'
import { COUPON_POINT_ENABLED } from '@/lib/feature-flags'
import { createReview, getReviewsByMenuItem } from '@/lib/review-db'
import { getSettingNumber } from '@/lib/settings-db'
import { addPoints } from '@/lib/point-db'
import { getSupabaseOrThrow } from '@/lib/db-utils'
import { apiError } from '@/lib/api-error'

// GET: 상품별 리뷰 목록 (더보기용)
export async function GET(req: NextRequest) {
  if (!REVIEW_ENABLED) {
    return NextResponse.json({ reviews: [] })
  }

  const { searchParams } = new URL(req.url)
  const menuItemId = searchParams.get('menuItemId')
  const offset = Number(searchParams.get('offset') || '0')
  const limit = Number(searchParams.get('limit') || '5')

  if (!menuItemId) {
    return NextResponse.json({ error: 'menuItemId 필요' }, { status: 400 })
  }

  const reviews = await getReviewsByMenuItem(menuItemId, { limit, offset })
  return NextResponse.json({ reviews })
}

// POST: 리뷰 작성
export async function POST(req: NextRequest) {
  if (!REVIEW_ENABLED) {
    return NextResponse.json({ error: '리뷰 기능이 비활성화되어 있습니다' }, { status: 403 })
  }

  const { orderId, menuItemId, phone, rating, content, imageUrls } = await req.json()

  // 입력 검증
  if (!orderId || !menuItemId || !phone || !rating || !content) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: '별점은 1~5 사이여야 합니다' }, { status: 400 })
  }
  if (content.length < 10 || content.length > 500) {
    return NextResponse.json({ error: '리뷰는 10~500자 사이로 작성해주세요' }, { status: 400 })
  }
  if (imageUrls && imageUrls.length > 3) {
    return NextResponse.json({ error: '사진은 최대 3장까지 첨부할 수 있습니다' }, { status: 400 })
  }

  // 주문 검증 (서버 사이드 재검증)
  const supabase = getSupabaseOrThrow()
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, customer_phone, customer_name, customer_id, order_items(menu_item_id)')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'completed') {
    return NextResponse.json({ error: '유효하지 않은 주문입니다' }, { status: 400 })
  }

  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '')
  if (normalizePhone(order.customer_phone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: '전화번호가 일치하지 않습니다' }, { status: 400 })
  }

  // menuItemId가 주문에 포함되어 있는지 확인
  const orderItemIds = (order.order_items as { menu_item_id: string }[]).map((i) => i.menu_item_id)
  if (!orderItemIds.includes(menuItemId)) {
    return NextResponse.json({ error: '해당 상품은 이 주문에 포함되어 있지 않습니다' }, { status: 400 })
  }

  // 포인트 계산
  let pointRewarded = 0
  if (COUPON_POINT_ENABLED && order.customer_id) {
    const hasPhotos = imageUrls && imageUrls.length > 0
    pointRewarded = hasPhotos
      ? await getSettingNumber('review_point_photo')
      : await getSettingNumber('review_point_text')
  }

  try {
    // 리뷰 생성
    const review = await createReview({
      orderId,
      menuItemId,
      customerPhone: order.customer_phone,
      customerName: order.customer_name,
      rating,
      content,
      imageUrls: imageUrls || [],
      pointRewarded,
    })

    // 포인트 지급
    if (pointRewarded > 0 && order.customer_id) {
      try {
        await addPoints({
          customerId: order.customer_id,
          type: 'earn',
          amount: pointRewarded,
          orderId,
          description: '리뷰 작성 포인트',
        })
      } catch {
        // 포인트 지급 실패해도 리뷰는 유지
      }
    }

    return NextResponse.json({ review, pointRewarded })
  } catch (err) {
    return apiError(err, '리뷰 작성에 실패했습니다', 400, 'reviews/create')
  }
}
