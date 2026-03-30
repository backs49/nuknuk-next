// lib/customer-db.ts
// 고객 CRUD — 전화번호 기반 식별

import { getSupabaseOrThrow } from './db-utils'
import {
  DbCustomer, Customer, toCustomer, normalizePhone
} from '@/data/customer'

// 전화번호로 고객 조회/생성 (upsert)
export async function upsertCustomer(
  phone: string,
  name: string
): Promise<Customer> {
  const supabase = getSupabaseOrThrow()
  const normalized = normalizePhone(phone)

  const { data, error } = await supabase
    .from('customers')
    .upsert(
      { phone: normalized, name },
      { onConflict: 'phone' }
    )
    .select()
    .single()

  if (error) throw new Error(`고객 조회/생성 실패: ${error.message}`)
  return toCustomer(data as DbCustomer)
}

// ID로 고객 조회
export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from('customers')
    .select()
    .eq('id', id)
    .single()

  if (error) return null
  return toCustomer(data as DbCustomer)
}

// 전화번호로 고객 조회
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const supabase = getSupabaseOrThrow()
  const normalized = normalizePhone(phone)
  const { data, error } = await supabase
    .from('customers')
    .select()
    .eq('phone', normalized)
    .single()

  if (error) return null
  return toCustomer(data as DbCustomer)
}

// 추천 코드로 고객 조회
export async function getCustomerByReferralCode(code: string): Promise<Customer | null> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from('customers')
    .select()
    .eq('referral_code', code.toUpperCase())
    .single()

  if (error) return null
  return toCustomer(data as DbCustomer)
}

// 추천 코드 생성 (NUK-XXXX 형식)
export async function generateReferralCode(customerId: string): Promise<string> {
  const supabase = getSupabaseOrThrow()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  for (let attempt = 0; attempt < 5; attempt++) {
    let code = 'NUK-'
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }

    const { error } = await supabase
      .from('customers')
      .update({ referral_code: code })
      .eq('id', customerId)

    if (!error) return code
  }

  throw new Error('추천 코드 생성 실패 (5회 시도)')
}

// 추천인 설정
export async function setReferredBy(customerId: string, referrerId: string): Promise<void> {
  const supabase = getSupabaseOrThrow()
  const { error } = await supabase
    .from('customers')
    .update({ referred_by: referrerId })
    .eq('id', customerId)
    .is('referred_by', null)

  if (error) throw new Error(`추천인 설정 실패: ${error.message}`)
}

// 관리자용: 고객 목록 조회
export async function getCustomers(params: {
  search?: string
  page?: number
  limit?: number
}): Promise<{ customers: Customer[]; total: number }> {
  const supabase = getSupabaseOrThrow()
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const offset = (page - 1) * limit

  let query = supabase.from('customers').select('*', { count: 'exact' })

  if (params.search) {
    const s = normalizePhone(params.search)
    query = query.or(`phone.ilike.%${s}%,name.ilike.%${params.search}%`)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`고객 목록 조회 실패: ${error.message}`)

  return {
    customers: (data as DbCustomer[]).map(toCustomer),
    total: count ?? 0,
  }
}

// 주문 완료 시 통계 업데이트
export async function incrementCustomerStats(
  customerId: string,
  finalAmount: number
): Promise<void> {
  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.rpc('increment_customer_stats', {
    p_customer_id: customerId,
    p_amount: finalAmount,
  })
  if (error) {
    const customer = await getCustomerById(customerId)
    if (!customer) return
    await supabase
      .from('customers')
      .update({
        total_orders: customer.totalOrders + 1,
        total_spent: customer.totalSpent + finalAmount,
      })
      .eq('id', customerId)
  }
}

// 주문 취소 시 통계 차감
export async function decrementCustomerStats(
  customerId: string,
  finalAmount: number
): Promise<void> {
  const supabase = getSupabaseOrThrow()
  const customer = await getCustomerById(customerId)
  if (!customer) return
  await supabase
    .from('customers')
    .update({
      total_orders: Math.max(0, customer.totalOrders - 1),
      total_spent: Math.max(0, customer.totalSpent - finalAmount),
    })
    .eq('id', customerId)
}
