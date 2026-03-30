// lib/db-utils.ts
// Shared DB utility — null-safe Supabase client getter
import { getServiceSupabase } from './supabase'

export function getSupabaseOrThrow() {
  const supabase = getServiceSupabase()
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')
  return supabase
}
