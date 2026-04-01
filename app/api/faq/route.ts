import { NextResponse } from 'next/server'
import { getActiveFAQs } from '@/lib/faq-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const faqs = await getActiveFAQs()
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('FAQ fetch error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ faqs: [], error: message })
  }
}
