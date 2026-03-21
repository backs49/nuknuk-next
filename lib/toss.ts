// lib/toss.ts
// 토스페이먼츠 결제 유틸

export function getTossClientKey(): string {
  const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 설정되지 않았습니다");
  return key;
}

export function getTossSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다");
  return key;
}

export function getTossAuthHeader(): string {
  const secretKey = getTossSecretKey();
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
