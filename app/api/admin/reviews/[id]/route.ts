// app/api/admin/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setAdminReply, toggleReviewVisibility, getReviewById, deleteReview } from '@/lib/review-db'
import { COUPON_POINT_ENABLED } from '@/lib/feature-flags'
import { deductPoints } from '@/lib/point-db'
import { getSupabaseOrThrow } from '@/lib/db-utils'

// PATCH: 답글 작성 또는 숨김 토글
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    if (body.adminReply !== undefined) {
      await setAdminReply(id, body.adminReply)
    }
    if (body.isVisible !== undefined) {
      await toggleReviewVisibility(id, body.isVisible)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '업데이트 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: 리뷰 삭제 + 포인트 회수
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params

  try {
    const review = await getReviewById(id)
    if (!review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다' }, { status: 404 })
    }

    // 포인트 회수
    if (review.pointRewarded > 0 && COUPON_POINT_ENABLED) {
      const supabase = getSupabaseOrThrow()
      const { data: order } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('id', review.orderId)
        .single()

      if (order?.customer_id) {
        try {
          await deductPoints({
            customerId: order.customer_id,
            type: 'admin_deduct',
            amount: review.pointRewarded,
            orderId: review.orderId,
            description: '리뷰 삭제 포인트 회수',
          })
        } catch {
          // 잔액 부족 시 무시 (이미 사용한 포인트)
        }
      }
    }

    await deleteReview(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '삭제 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
