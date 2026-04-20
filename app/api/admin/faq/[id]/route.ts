import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateFAQ, deleteFAQ } from '@/lib/faq-db'
import { apiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

// PUT: FAQ 항목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const faq = await updateFAQ(id, body)
    return NextResponse.json({ faq })
  } catch (error) {
    return apiError(error, 'FAQ 수정에 실패했습니다', 500, 'admin/faq/update')
  }
}

// DELETE: FAQ 항목 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params

  try {
    await deleteFAQ(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'FAQ 삭제에 실패했습니다', 500, 'admin/faq/delete')
  }
}
