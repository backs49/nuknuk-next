import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllSettings, updateSetting } from '@/lib/settings-db'

export const dynamic = 'force-dynamic'

// GET /api/admin/settings — 전체 설정 조회
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await getAllSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: '설정 조회 실패' }, { status: 500 })
  }
}

// PUT /api/admin/settings — 설정 업데이트
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: 'key와 value가 필요합니다' }, { status: 400 })
    }

    await updateSetting(key, String(value))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: '설정 업데이트 실패' }, { status: 500 })
  }
}
