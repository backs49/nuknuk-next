// app/api/reviews/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { REVIEW_ENABLED } from '@/lib/feature-flags'
import { getServiceSupabase } from '@/lib/supabase'

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

  // 파일 크기 제한 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하만 가능합니다' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: '지원하지 않는 파일 형식입니다' }, { status: 400 })
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
