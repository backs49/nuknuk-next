import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllFAQs, createFAQ } from '@/lib/faq-db'
import { apiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

// GET: 전체 FAQ 목록 (비활성 포함)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  try {
    const faqs = await getAllFAQs()
    return NextResponse.json({ faqs })
  } catch (error) {
    return apiError(error, 'FAQ 조회에 실패했습니다', 500, 'admin/faq/list')
  }
}

// POST: FAQ 항목 추가
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  try {
    const body = await request.json()
    const { question, answer } = body

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: '질문과 답변을 모두 입력해주세요' }, { status: 400 })
    }

    const faq = await createFAQ({ question: question.trim(), answer: answer.trim() })
    return NextResponse.json({ faq })
  } catch (error) {
    return apiError(error, 'FAQ 추가에 실패했습니다', 500, 'admin/faq/create')
  }
}
