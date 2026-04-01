import { NextResponse } from 'next/server'
import { getActiveFAQs } from '@/lib/faq-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const faqs = await getActiveFAQs()
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('FAQ fetch error:', error)
    return NextResponse.json({ faqs: [] })
  }
}
