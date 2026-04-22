import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listClosures, createClosure } from '@/lib/closure-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const closures = await listClosures()
    return NextResponse.json({ closures })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '조회 실패'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const startDate = String(body.startDate ?? '').trim()
    const endDate = String(body.endDate ?? '').trim() || startDate
    const reason = body.reason ? String(body.reason) : undefined

    if (!startDate) {
      return NextResponse.json({ error: 'startDate 필수' }, { status: 400 })
    }
    if (reason && reason.length > 200) {
      return NextResponse.json({ error: '사유는 최대 200자입니다' }, { status: 400 })
    }

    const created = await createClosure({ startDate, endDate, reason })
    return NextResponse.json({ closure: created }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '등록 실패'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
