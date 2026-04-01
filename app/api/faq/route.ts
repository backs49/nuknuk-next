import { NextResponse } from 'next/server'
import { getSupabaseOrThrow } from '@/lib/db-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseOrThrow()

    const { data, error } = await supabase
      .from('faq_items')
      .select('id, question, answer, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)

    return NextResponse.json({ faqs: data || [] })
  } catch (error) {
    console.error('FAQ fetch error:', error)
    return NextResponse.json({ faqs: [] })
  }
}
