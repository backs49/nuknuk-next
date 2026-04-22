import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setOperatingHours } from '@/lib/closure-db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const openHour = Number(body.openHour)
    const closeHour = Number(body.closeHour)
    const slotMinutes = Number(body.slotMinutes)

    await setOperatingHours({ openHour, closeHour, slotMinutes })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '저장 실패'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
