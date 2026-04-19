// lib/rate-limit.ts
// Upstash Redis 기반 API rate limiting.
//
// 엔드포인트별 SlidingWindow 정책을 인스턴스로 정의하고, 라우트에서 limit(ip) 호출해 429 반환.
// 환경변수: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
//
// 사용 예:
//   const { success, reset } = await customerLookupLimit.limit(getClientIp(request))
//   if (!success) return rateLimitResponse(reset)

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Upstash 키가 없으면 개발 환경에서 noop — 빌드/로컬 실행 깨지지 않도록.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

type Limiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };

function createLimiter(tokens: number, window: `${number} ${"s" | "m" | "h"}`, prefix: string): Limiter {
  if (!redis) {
    // Upstash 미설정 환경에서는 통과시킴 (로컬 dev).
    return {
      async limit() {
        return { success: true, reset: Date.now() };
      },
    };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix,
    analytics: false,
  });
}

// 혜택 조회: 정상 고객은 결제 1회당 1번 호출. 5회/분이면 공격 차단에 충분.
export const customerLookupLimit = createLimiter(5, "1 m", "rl:customer-lookup");

// 주문 조회: /pay/[orderNumber] 리프레시·결제위젯 로딩 시 여러 번 호출 가능.
export const orderLookupLimit = createLimiter(30, "1 m", "rl:order-lookup");

// 쿠폰 검증: 정상 사용은 몇 번, brute force 차단용.
export const couponValidateLimit = createLimiter(10, "1 m", "rl:coupon-validate");

// 주문 생성 POST: 동일 IP에서 주문 남용 방지.
export const orderCreateLimit = createLimiter(10, "1 m", "rl:order-create");

// Vercel / 프록시 뒤에서 클라이언트 IP 추출.
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}

// 429 응답 생성 (Retry-After 헤더 포함)
export function rateLimitResponse(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}
