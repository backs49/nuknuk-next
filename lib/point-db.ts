// lib/point-db.ts
// 포인트 적립/사용/조정 — atomic balance update

import { getSupabaseOrThrow } from './db-utils'
import { getSettingNumber } from './settings-db'
import {
  DbPointTransaction, PointTransaction, PointTransactionType,
  toPointTransaction, POINT_EARN_RATE
} from '@/data/customer'

// 포인트 적립 (earn, referral, admin_add, cancel_restore)
export async function addPoints(params: {
  customerId: string
  type: PointTransactionType
  amount: number
  orderId?: string
  description: string
}): Promise<PointTransaction> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase.rpc('add_points', {
    p_customer_id: params.customerId,
    p_type: params.type,
    p_amount: params.amount,
    p_order_id: params.orderId || null,
    p_description: params.description,
  })

  if (error) throw new Error(`포인트 적립 실패: ${error.message}`)
  return data as PointTransaction
}

// 포인트 사용 (use) — 잔액 부족 시 에러
export async function spendPoints(params: {
  customerId: string
  amount: number
  orderId?: string
  description: string
}): Promise<PointTransaction> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase.rpc('use_points', {
    p_customer_id: params.customerId,
    p_amount: params.amount,
    p_order_id: params.orderId || null,
    p_description: params.description,
  })

  if (error) throw new Error(`포인트 사용 실패: ${error.message}`)
  if (!data) throw new Error('포인트 잔액이 부족합니다')
  return data as PointTransaction
}

// 포인트 차감 (admin_deduct, cancel_deduct) — 잔액 체크 포함
export async function deductPoints(params: {
  customerId: string
  type: 'admin_deduct' | 'cancel_deduct'
  amount: number
  orderId?: string
  description: string
}): Promise<PointTransaction> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase.rpc('deduct_points', {
    p_customer_id: params.customerId,
    p_type: params.type,
    p_amount: Math.abs(params.amount),
    p_order_id: params.orderId || null,
    p_description: params.description,
  })

  if (error) throw new Error(`포인트 차감 실패: ${error.message}`)
  if (!data) throw new Error('포인트 잔액이 부족합니다')
  return data as PointTransaction
}

// 주문 완료 시 포인트 적립 계산 (DB 설정 우선, fallback: 상수)
export async function calculateEarnPoints(finalAmount: number): Promise<number> {
  try {
    const rate = await getSettingNumber('point_earn_rate')
    return Math.floor(finalAmount * (rate || POINT_EARN_RATE))
  } catch {
    return Math.floor(finalAmount * POINT_EARN_RATE)
  }
}

// 고객의 포인트 거래 이력 조회
export async function getPointTransactions(
  customerId: string,
  params?: { page?: number; limit?: number }
): Promise<{ transactions: PointTransaction[]; total: number }> {
  const supabase = getSupabaseOrThrow()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('point_transactions')
    .select('*', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`포인트 이력 조회 실패: ${error.message}`)

  return {
    transactions: (data as DbPointTransaction[]).map(toPointTransaction),
    total: count ?? 0,
  }
}

// 포인트 잔액 정합성 체크 (관리자용)
export async function checkPointIntegrity(): Promise<
  Array<{ customerId: string; phone: string; cached: number; calculated: number }>
> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase.rpc('check_point_integrity')

  if (error) throw new Error(`정합성 체크 실패: ${error.message}`)
  return data ?? []
}
