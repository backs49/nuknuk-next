import crypto from "crypto";
import type { Order } from "@/data/order";
import { formatSelectedOptions } from "@/lib/option-utils";

// ========== 전화번호 정규화 ==========

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("82")) return "0" + digits.slice(2);
  return digits;
}

// ========== 주문상품명 생성 ==========

function buildOrderName(items: Order["items"]): string {
  if (items.length === 0) return "주문 상품";
  const firstName = items[0].name +
    (items[0].selectedOptions?.length
      ? ` (${formatSelectedOptions(items[0].selectedOptions)})`
      : "");
  if (items.length === 1) return firstName;
  return `${firstName} 외 ${items.length - 1}건`;
}

// ========== 솔라피 HMAC-SHA256 인증 ==========

function buildSolapiAuth(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID();
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

// ========== 메인 함수 ==========

export async function sendKakaoAlimtalk(order: Order, referralCode?: string): Promise<void> {
  // 1. 활성화 여부 확인
  if (process.env.KAKAO_ALIMTALK_ENABLED !== "true") {
    console.log("카카오 알림톡 비활성화 상태 — 발송 건너뜀");
    return;
  }

  // 2. 필수 환경변수 확인
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_PFID;
  const senderPhone = process.env.SOLAPI_SENDER_PHONE;

  if (!apiKey || !apiSecret || !pfId || !senderPhone) {
    console.warn("솔라피 필수 환경변수 미설정 — 알림톡 발송 건너뜀");
    return;
  }

  // 3. 템플릿 ID 결정
  const templateId =
    order.deliveryMethod === "pickup"
      ? process.env.SOLAPI_TEMPLATE_ID_PICKUP
      : process.env.SOLAPI_TEMPLATE_ID_SHIPPING;

  if (!templateId) {
    console.warn(
      `솔라피 템플릿 ID 미설정 (${order.deliveryMethod}) — 알림톡 발송 건너뜀`
    );
    return;
  }

  // 4. 수신자 전화번호 정규화
  const to = normalizePhone(order.customerPhone);

  // 5. 템플릿 변수 구성
  const variables: Record<string, string> = {
    orderNumber: order.orderNumber,
    orderName: buildOrderName(order.items),
    totalAmount: order.totalAmount.toLocaleString("ko-KR"),
  };

  if (order.deliveryMethod === "pickup" && order.pickupDate) {
    variables.pickupDate = order.pickupDate;
  }
  if (order.deliveryMethod === "shipping" && order.deliveryAddress) {
    variables.deliveryAddress = order.deliveryAddress;
  }
  if (referralCode) {
    variables.referralCode = referralCode;
  }

  // 6. 솔라피 API 호출
  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        Authorization: buildSolapiAuth(apiKey, apiSecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          to,
          from: senderPhone,
          type: "ATA",
          kakaoOptions: {
            pfId,
            templateId,
            variables,
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("솔라피 알림톡 발송 실패:", res.status, body);
      return;
    }

    console.log(`카카오 알림톡 발송 완료: ${order.orderNumber} → ${to}`);
  } catch (error) {
    console.error("솔라피 알림톡 발송 중 오류:", error);
  }
}
