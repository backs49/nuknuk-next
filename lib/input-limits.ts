import { UserFacingError } from "./api-error";

/**
 * 자유 입력 문자열 필드의 최대 길이.
 * DB 저장 공격, 알림톡/이메일 발송 비용 폭증, 외부 서비스 남용을 방지한다.
 */
export const INPUT_LIMITS = {
  customerName: 50,
  customerPhone: 20,
  customerEmail: 100,
  customerMemo: 500,
  deliveryAddress: 200,
  adminMemo: 1000,
  pickupDate: 20,
  referralCode: 20,
  couponCode: 50,
} as const;

/**
 * 문자열 길이를 검사하고 초과 시 UserFacingError를 던진다.
 * undefined/null은 통과 (필수 체크는 호출측에서).
 */
export function assertMaxLength(
  value: unknown,
  max: number,
  fieldLabel: string
): void {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") {
    throw new UserFacingError(`${fieldLabel} 형식이 올바르지 않습니다`, 400);
  }
  if (value.length > max) {
    throw new UserFacingError(
      `${fieldLabel}가 너무 깁니다 (최대 ${max}자)`,
      400
    );
  }
}

/**
 * 주문 생성 입력 필드 일괄 검증 (공개/관리자 공통).
 */
export function validateOrderInputLengths(body: Record<string, unknown>): void {
  assertMaxLength(body.customerName, INPUT_LIMITS.customerName, "이름");
  assertMaxLength(body.customerPhone, INPUT_LIMITS.customerPhone, "전화번호");
  assertMaxLength(body.customerEmail, INPUT_LIMITS.customerEmail, "이메일");
  assertMaxLength(body.customerMemo, INPUT_LIMITS.customerMemo, "요청사항");
  assertMaxLength(body.adminMemo, INPUT_LIMITS.adminMemo, "관리자 메모");
  assertMaxLength(
    body.deliveryAddress,
    INPUT_LIMITS.deliveryAddress,
    "배송지 주소"
  );
  assertMaxLength(body.pickupDate, INPUT_LIMITS.pickupDate, "픽업 희망일");
  assertMaxLength(body.referralCode, INPUT_LIMITS.referralCode, "추천 코드");
  assertMaxLength(body.couponCode, INPUT_LIMITS.couponCode, "쿠폰 코드");
}
