// app/api/reviews/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { REVIEW_ENABLED } from '@/lib/feature-flags'
import { getServiceSupabase } from '@/lib/supabase'
import { getSupabaseOrThrow } from '@/lib/db-utils'

// 허용 MIME 타입
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(req: NextRequest) {
  if (!REVIEW_ENABLED) {
    return NextResponse.json({ error: '리뷰 기능이 비활성화되어 있습니다' }, { status: 403 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 미설정' }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
  }

  // 주문 검증 (업로드 남용 방지)
  const orderId = formData.get('orderId') as string
  const phone = formData.get('phone') as string
  if (!orderId || !phone) {
    return NextResponse.json({ error: '주문 정보가 필요합니다' }, { status: 400 })
  }

  const db = getSupabaseOrThrow()
  const { data: order } = await db
    .from('orders')
    .select('id, status, customer_phone')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'completed') {
    return NextResponse.json({ error: '유효하지 않은 주문입니다' }, { status: 400 })
  }
  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '')
  if (normalizePhone(order.customer_phone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: '전화번호가 일치하지 않습니다' }, { status: 400 })
  }

  // 파일 크기 제한 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하만 가능합니다' }, { status: 400 })
  }

  // MIME 타입 검증
  const ext = ALLOWED_MIME[file.type]
  if (!ext) {
    return NextResponse.json({ error: '지원하지 않는 파일 형식입니다 (jpg, png, webp만 가능)' }, { status: 400 })
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('review-images')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('review-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: publicUrl })
}
