import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reorderFAQs } from '@/lib/faq-db'
import { apiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

// PUT: FAQ 순서 변경
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  try {
    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds 배열이 필요합니다' }, { status: 400 })
    }

    await reorderFAQs(orderedIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, '순서 변경에 실패했습니다', 500, 'admin/faq/reorder')
  }
}
