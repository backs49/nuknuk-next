import { NextRequest, NextResponse } from 'next/server'
import {
  getClosedWeekdays,
  getOperatingHours,
  listClosures,
  expandClosedDates,
} from '@/lib/closure-db'

export const revalidate = 300

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') ?? todayIso()
    const to = searchParams.get('to') ?? addDays(todayIso(), 90)

    const [hours, closedWeekdays, closures] = await Promise.all([
      getOperatingHours(),
      getClosedWeekdays(),
      listClosures({ from, to }),
    ])

    return NextResponse.json({
      openHour: hours.openHour,
      closeHour: hours.closeHour,
      slotMinutes: hours.slotMinutes,
      closedWeekdays,
      closedDates: expandClosedDates(closures),
      closures: closures.map((c) => ({
        startDate: c.startDate,
        endDate: c.endDate,
        reason: c.reason,
      })),
    })
  } catch (err) {
    console.error('[GET /api/shop/operating]', err)
    return NextResponse.json(
      {
        openHour: 10,
        closeHour: 16,
        slotMinutes: 60,
        closedWeekdays: [],
        closedDates: [],
        closures: [],
      },
      { status: 200 }
    )
  }
}
