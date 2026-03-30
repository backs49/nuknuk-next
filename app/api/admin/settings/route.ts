import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, updateSetting } from '@/lib/settings-db'

// GET /api/admin/settings — 전체 설정 조회
export async function GET() {
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
