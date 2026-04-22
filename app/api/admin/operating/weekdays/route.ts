import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setClosedWeekdays } from '@/lib/closure-db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    if (!Array.isArray(body.weekdays)) {
      return NextResponse.json({ error: 'weekdays 배열이 필요합니다' }, { status: 400 })
    }
    await setClosedWeekdays(body.weekdays.map((n: unknown) => Number(n)))
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '저장 실패'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
