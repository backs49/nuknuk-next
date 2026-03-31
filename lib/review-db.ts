// lib/review-db.ts
// 리뷰 CRUD, 별점 요약, 포인트 연동

import { getSupabaseOrThrow } from './db-utils'

export interface DbReview {
  id: string
  order_id: string
  menu_item_id: string
  customer_phone: string
  customer_name: string
  rating: number
  content: string
  image_urls: string[]
  point_rewarded: number
  admin_reply: string | null
  admin_reply_at: string | null
  is_visible: boolean
  created_at: string
}

export interface Review {
  id: string
  orderId: string
  menuItemId: string
  customerPhone: string
  customerName: string
  rating: number
  content: string
  imageUrls: string[]
  pointRewarded: number
  adminReply: string | null
  adminReplyAt: string | null
  isVisible: boolean
  createdAt: string
}

export interface ReviewSummary {
  averageRating: number
  totalCount: number
  distribution: Record<number, number>
}

function toReview(db: DbReview): Review {
  return {
    id: db.id,
    orderId: db.order_id,
    menuItemId: db.menu_item_id,
    customerPhone: db.customer_phone,
    customerName: db.customer_name,
    rating: db.rating,
    content: db.content,
    imageUrls: db.image_urls || [],
    pointRewarded: db.point_rewarded,
    adminReply: db.admin_reply,
    adminReplyAt: db.admin_reply_at,
    isVisible: db.is_visible,
    createdAt: db.created_at,
  }
}

// 상품별 리뷰 목록 (고객용 — is_visible=true만)
export async function getReviewsByMenuItem(
  menuItemId: string,
  params?: { limit?: number; offset?: number }
): Promise<Review[]> {
  const supabase = getSupabaseOrThrow()
  const limit = params?.limit ?? 5
  const offset = params?.offset ?? 0

  const { data, error } = await supabase
    .from('reviews')
    .select()
    .eq('menu_item_id', menuItemId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`리뷰 조회 실패: ${error.message}`)
  return (data as DbReview[]).map(toReview)
}

// 별점 요약 (고객용 — is_visible=true만)
export async function getReviewSummary(menuItemId: string): Promise<ReviewSummary> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('menu_item_id', menuItemId)
    .eq('is_visible', true)

  if (error || !data) {
    return { averageRating: 0, totalCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const reviews = data as { rating: number }[]
  const totalCount = reviews.length
  if (totalCount === 0) {
    return { averageRating: 0, totalCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1
    sum += r.rating
  }

  return {
    averageRating: Math.round((sum / totalCount) * 10) / 10,
    totalCount,
    distribution,
  }
}

// 리뷰 작성
export async function createReview(input: {
  orderId: string
  menuItemId: string
  customerPhone: string
  customerName: string
  rating: number
  content: string
  imageUrls: string[]
  pointRewarded: number
}): Promise<Review> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      order_id: input.orderId,
      menu_item_id: input.menuItemId,
      customer_phone: input.customerPhone,
      customer_name: input.customerName,
      rating: input.rating,
      content: input.content,
      image_urls: input.imageUrls,
      point_rewarded: input.pointRewarded,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('이미 해당 상품에 리뷰를 작성하셨습니다')
    throw new Error(`리뷰 작성 실패: ${error.message}`)
  }
  return toReview(data as DbReview)
}

// 관리자: 전체 리뷰 목록
export async function getAdminReviews(params?: {
  filter?: 'all' | 'no_reply' | 'hidden'
  page?: number
  limit?: number
}): Promise<{ reviews: (Review & { menuItemName?: string })[]; total: number }> {
  const supabase = getSupabaseOrThrow()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('reviews')
    .select('*, menu_items(name)', { count: 'exact' })

  if (params?.filter === 'no_reply') {
    query = query.is('admin_reply', null)
  } else if (params?.filter === 'hidden') {
    query = query.eq('is_visible', false)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`리뷰 목록 조회 실패: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (data as any[]).map((row) => ({
    ...toReview(row as DbReview),
    menuItemName: row.menu_items?.name || '',
  }))

  return { reviews, total: count ?? 0 }
}

// 관리자: 답글 작성/수정
export async function setAdminReply(reviewId: string, reply: string): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { error } = await supabase
    .from('reviews')
    .update({
      admin_reply: reply,
      admin_reply_at: new Date().toISOString(),
    })
    .eq('id', reviewId)

  if (error) throw new Error(`답글 작성 실패: ${error.message}`)
}

// 관리자: 숨김/노출 토글
export async function toggleReviewVisibility(reviewId: string, isVisible: boolean): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { error } = await supabase
    .from('reviews')
    .update({ is_visible: isVisible })
    .eq('id', reviewId)

  if (error) throw new Error(`리뷰 상태 변경 실패: ${error.message}`)
}

// 관리자: 리뷰 조회 (삭제 전 포인트 회수용)
export async function getReviewById(reviewId: string): Promise<Review | null> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('reviews')
    .select()
    .eq('id', reviewId)
    .single()

  if (error) return null
  return toReview(data as DbReview)
}

export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) throw new Error(`리뷰 삭제 실패: ${error.message}`)
}
