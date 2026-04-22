// lib/settings-db.ts
// 운영 설정 조회/수정 — shop_settings 테이블

import { getServiceSupabase } from './supabase'

export interface ShopSetting {
  key: string
  value: string
  label: string
  description: string | null
  updatedAt: string
}

interface DbShopSetting {
  key: string
  value: string
  label: string
  description: string | null
  updated_at: string
}

// 기본값 (DB 미연결 또는 키 미존재 시 fallback)
const DEFAULTS: Record<string, string> = {
  point_earn_rate: '0.03',
  referral_reward_points: '1000',
  min_point_use: '0',
  point_use_unit: '1',
  banner_enabled: 'false',
  banner_text: '',
  banner_link: '',
  banner_bg_color: '#6B8E23',
  banner_text_color: '#FFFFFF',
  closed_weekdays: '1',
  open_hour: '10',
  close_hour: '16',
  pickup_slot_minutes: '60',
}

function toSetting(db: DbShopSetting): ShopSetting {
  return {
    key: db.key,
    value: db.value,
    label: db.label,
    description: db.description,
    updatedAt: db.updated_at,
  }
}

// 전체 설정 조회
export async function getAllSettings(): Promise<ShopSetting[]> {
  const supabase = getServiceSupabase()
  if (!supabase) {
    return Object.entries(DEFAULTS).map(([key, value]) => ({
      key,
      value,
      label: key,
      description: null,
      updatedAt: new Date().toISOString(),
    }))
  }

  const { data, error } = await supabase
    .from('shop_settings')
    .select()
    .order('key')

  if (error || !data) {
    return Object.entries(DEFAULTS).map(([key, value]) => ({
      key,
      value,
      label: key,
      description: null,
      updatedAt: new Date().toISOString(),
    }))
  }

  return (data as DbShopSetting[]).map(toSetting)
}

// 단일 설정 조회 (캐시 없이 매번 DB 조회)
export async function getSetting(key: string): Promise<string> {
  const supabase = getServiceSupabase()
  if (!supabase) return DEFAULTS[key] ?? ''

  const { data } = await supabase
    .from('shop_settings')
    .select('value')
    .eq('key', key)
    .single()

  return (data as { value: string } | null)?.value ?? DEFAULTS[key] ?? ''
}

// 숫자 설정 조회 헬퍼
export async function getSettingNumber(key: string): Promise<number> {
  const value = await getSetting(key)
  return Number(value) || Number(DEFAULTS[key]) || 0
}

// 설정 업데이트 (없으면 생성)
export async function updateSetting(key: string, value: string): Promise<void> {
  const supabase = getServiceSupabase()
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')

  const { error } = await supabase
    .from('shop_settings')
    .upsert(
      { key, value, label: key, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) throw new Error(`설정 업데이트 실패: ${error.message}`)
}
