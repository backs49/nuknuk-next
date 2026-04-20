import { NextResponse } from "next/server";

/**
 * 사용자에게 노출해도 안전한 에러.
 * apiError()가 prod에서도 이 메시지는 그대로 전달한다.
 */
export class UserFacingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserFacingError";
    this.status = status;
  }
}

/**
 * API 라우트의 catch 블록에서 사용.
 * - 서버 로그에는 원본 에러 전체를 남김
 * - 클라이언트 응답:
 *   - UserFacingError: 원본 메시지 + 지정 status
 *   - 그 외: prod에서는 fallback, dev에서는 원본 메시지(디버깅용)
 *
 * DB 에러, 스택 트레이스, 내부 경로, env 이름 등이 클라이언트로 새는 것을 방지한다.
 */
export function apiError(
  err: unknown,
  fallback: string,
  status = 500,
  context?: string
): NextResponse {
  const tag = context ? `[API:${context}]` : "[API]";
  console.error(tag, err);

  if (err instanceof UserFacingError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  const isProd = process.env.NODE_ENV === "production";
  const message =
    !isProd && err instanceof Error && err.message ? err.message : fallback;

  return NextResponse.json({ error: message }, { status });
}
