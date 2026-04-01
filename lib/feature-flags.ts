// lib/feature-flags.ts
// 환경변수 기반 기능 토글

export const COUPON_POINT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_COUPON_POINT === 'true'

export const REVIEW_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_REVIEW === 'true'

export const FAQ_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_FAQ === 'true'
