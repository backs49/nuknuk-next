// app/api/banner/route.ts
// 공개 API — 배너 설정 조회
import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/settings-db'

export async function GET() {
  try {
    const [enabled, text, link, bgColor, textColor] = await Promise.all([
      getSetting('banner_enabled'),
      getSetting('banner_text'),
      getSetting('banner_link'),
      getSetting('banner_bg_color'),
      getSetting('banner_text_color'),
    ])

    return NextResponse.json({
      enabled: enabled === 'true',
      text: text || '',
      link: link || '',
      bgColor: bgColor || '#6B8E23',
      textColor: textColor || '#FFFFFF',
    })
  } catch {
    return NextResponse.json({ enabled: false })
  }
}
