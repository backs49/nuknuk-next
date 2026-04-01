import { NextResponse } from 'next/server'
import { getSupabaseOrThrow } from '@/lib/db-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseOrThrow()

    const { data, error, count } = await supabase
      .from('faq_items')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ faqs: [], debug: { error: error.message, code: error.code } })
    }

    return NextResponse.json({ faqs: data || [], debug: { count, rowCount: data?.length } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ faqs: [], debug: { caught: message } })
  }
}
