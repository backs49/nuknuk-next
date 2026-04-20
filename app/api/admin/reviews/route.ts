// app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminReviews } from '@/lib/review-db'
import { apiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = (searchParams.get('filter') || 'all') as 'all' | 'no_reply' | 'hidden'
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '20')

  try {
    const result = await getAdminReviews({ filter, page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return apiError(err, '조회에 실패했습니다', 500, 'admin/reviews/list')
  }
}
