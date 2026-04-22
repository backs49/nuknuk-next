// lib/closure-db.ts
// 운영시간(영업시간, 정기휴무) + 비정기 휴무 조회/수정
import { getServiceSupabase } from './supabase'
import { getSupabaseOrThrow } from './db-utils'
import { getSetting, updateSetting } from './settings-db'

export interface ShopClosure {
  id: string
  startDate: string      // YYYY-MM-DD
  endDate: string        // YYYY-MM-DD
  reason: string | null
  createdAt: string
}

export interface OperatingHours {
  openHour: number
  closeHour: number
  slotMinutes: number
}

interface DbShopClosure {
  id: string
  start_date: string
  end_date: string
  reason: string | null
  created_at: string
}

function toClosure(r: DbShopClosure): ShopClosure {
  return {
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    createdAt: r.created_at,
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function assertDate(s: string, label: string) {
  if (!DATE_RE.test(s)) throw new Error(`${label}: YYYY-MM-DD 형식이어야 합니다 (${s})`)
}

// ---- 정기 휴무 요일 ----

export async function getClosedWeekdays(): Promise<number[]> {
  const raw = await getSetting('closed_weekdays')
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
}

export async function setClosedWeekdays(weekdays: number[]): Promise<void> {
  const clean = Array.from(
    new Set(weekdays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))
  ).sort((a, b) => a - b)
  await updateSetting('closed_weekdays', clean.join(','))
}

// ---- 영업시간 ----

function parseIntOr(raw: string, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export async function getOperatingHours(): Promise<OperatingHours> {
  const [openRaw, closeRaw, slotRaw] = await Promise.all([
    getSetting('open_hour'),
    getSetting('close_hour'),
    getSetting('pickup_slot_minutes'),
  ])
  return {
    openHour: parseIntOr(openRaw, 10),
    closeHour: parseIntOr(closeRaw, 16),
    slotMinutes: parseIntOr(slotRaw, 60),
  }
}

export async function setOperatingHours(h: OperatingHours): Promise<void> {
  if (!Number.isInteger(h.openHour) || h.openHour < 0 || h.openHour > 23) {
    throw new Error('openHour는 0-23 정수여야 합니다')
  }
  if (!Number.isInteger(h.closeHour) || h.closeHour < 1 || h.closeHour > 24) {
    throw new Error('closeHour는 1-24 정수여야 합니다')
  }
  if (h.openHour >= h.closeHour) {
    throw new Error('openHour는 closeHour보다 작아야 합니다')
  }
  if (![15, 30, 60].includes(h.slotMinutes)) {
    throw new Error('slotMinutes는 15, 30, 60 중 하나여야 합니다')
  }
  await Promise.all([
    updateSetting('open_hour', String(h.openHour)),
    updateSetting('close_hour', String(h.closeHour)),
    updateSetting('pickup_slot_minutes', String(h.slotMinutes)),
  ])
}

// ---- 비정기 휴무 ----

export async function listClosures(opts?: {
  from?: string
  to?: string
}): Promise<ShopClosure[]> {
  const supabase = getServiceSupabase()
  if (!supabase) return []

  let query = supabase
    .from('shop_closures')
    .select()
    .order('start_date', { ascending: true })

  if (opts?.from) {
    assertDate(opts.from, 'from')
    query = query.gte('end_date', opts.from)
  }
  if (opts?.to) {
    assertDate(opts.to, 'to')
    query = query.lte('start_date', opts.to)
  }

  const { data, error } = await query
  if (error) {
    console.error('[listClosures]', error)
    throw new Error(`휴무 목록 조회 실패: ${error.message}`)
  }
  return (data ?? []).map((r) => toClosure(r as DbShopClosure))
}

export async function createClosure(input: {
  startDate: string
  endDate: string
  reason?: string
}): Promise<ShopClosure> {
  assertDate(input.startDate, 'startDate')
  assertDate(input.endDate, 'endDate')
  if (input.startDate > input.endDate) {
    throw new Error('시작일은 종료일보다 같거나 빨라야 합니다')
  }

  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('shop_closures')
    .insert({
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason?.trim() || null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`휴무 등록 실패: ${error?.message ?? 'unknown'}`)
  return toClosure(data as DbShopClosure)
}

export async function deleteClosure(id: string): Promise<void> {
  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.from('shop_closures').delete().eq('id', id)
  if (error) throw new Error(`휴무 삭제 실패: ${error.message}`)
}

// ---- 날짜 범위 전개 ----

export function expandClosedDates(closures: ShopClosure[]): string[] {
  const set = new Set<string>()
  for (const c of closures) {
    const start = new Date(`${c.startDate}T00:00:00`)
    const end = new Date(`${c.endDate}T00:00:00`)
    const cur = new Date(start)
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      set.add(`${y}-${m}-${d}`)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return Array.from(set).sort()
}
