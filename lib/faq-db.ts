// lib/faq-db.ts
// FAQ CRUD — faq_items 테이블

import { getSupabaseOrThrow } from './db-utils'

export interface DbFAQItem {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function toFAQItem(db: DbFAQItem): FAQItem {
  return {
    id: db.id,
    question: db.question,
    answer: db.answer,
    sortOrder: db.sort_order,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

// 활성 FAQ 목록 (고객용 — is_active=true만, sort_order 오름차순)
export async function getActiveFAQs(): Promise<FAQItem[]> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`FAQ 조회 실패: ${error.message}`)
  return (data as DbFAQItem[]).map(toFAQItem)
}

// 전체 FAQ 목록 (관리자용 — 비활성 포함, sort_order 오름차순)
export async function getAllFAQs(): Promise<FAQItem[]> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`FAQ 조회 실패: ${error.message}`)
  return (data as DbFAQItem[]).map(toFAQItem)
}

// FAQ 항목 추가
export async function createFAQ(input: {
  question: string
  answer: string
}): Promise<FAQItem> {
  const supabase = getSupabaseOrThrow()

  // 현재 최대 sort_order 조회
  const { data: maxRow } = await supabase
    .from('faq_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('faq_items')
    .insert({
      question: input.question,
      answer: input.answer,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) throw new Error(`FAQ 추가 실패: ${error.message}`)
  return toFAQItem(data as DbFAQItem)
}

// FAQ 항목 수정
export async function updateFAQ(
  id: string,
  input: { question?: string; answer?: string; isActive?: boolean }
): Promise<FAQItem> {
  const supabase = getSupabaseOrThrow()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.question !== undefined) updateData.question = input.question
  if (input.answer !== undefined) updateData.answer = input.answer
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  const { data, error } = await supabase
    .from('faq_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`FAQ 수정 실패: ${error.message}`)
  return toFAQItem(data as DbFAQItem)
}

// FAQ 항목 삭제
export async function deleteFAQ(id: string): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { error } = await supabase
    .from('faq_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`FAQ 삭제 실패: ${error.message}`)
}

// FAQ 순서 변경 (id 배열 순서대로 sort_order 업데이트)
export async function reorderFAQs(orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('faq_items')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(`FAQ 순서 변경 실패: ${failed.error.message}`)
}
