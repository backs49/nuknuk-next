import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getTossAuthHeader, TOSS_CONFIRM_URL } from "@/lib/toss";
import { getOrderByNumber, updateOrderPayment } from "@/lib/order-db";
import { sendKakaoAlimtalk } from "@/lib/kakao-notification";
import { spendPoints } from "@/lib/point-db";
import { applyCoupon, applyCodeCoupon, validateCouponCode } from "@/lib/coupon-db";
import { COUPON_POINT_ENABLED } from "@/lib/feature-flags";
import { apiError } from "@/lib/api-error";
import type { Order } from "@/data/order";

// 디스코드 푸시 알림 함수
async function sendDiscordNotification(order: Order) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const itemLines = order.items.map((item) => {
    let line = `• **${item.name}** × ${item.quantity}`;
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      const optDetails = item.selectedOptions.map((o) =>
        o.priceMode === "fixed"
          ? `${o.groupName}: ${o.itemName} (${o.price.toLocaleString()}원)`
          : `${o.groupName}: ${o.itemName} (+${o.price.toLocaleString()}원)`
      ).join("\n  ");
      line += `\n  ${optDetails}`;
    }
    return line;
  }).join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🚨 **[결제 완료]**\n${itemLines}\n- **결제금액:** ${order.finalAmount.toLocaleString()}원`,
      }),
    });
  } catch (error) {
    console.error("Discord 알림 발송 실패:", error);
  }
}

// 이메일 전송 함수
async function sendEmailNotification(order: Order) {
  const userEmail = process.env.GMAIL_USER || "backs491@gmail.com";
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = "backs491@gmail.com";

  if (!appPassword) return;

  const orderName = order.items.map((item) => {
    const optSuffix = item.selectedOptions?.length
      ? ` (${item.selectedOptions.map((o) => o.itemName).join(", ")})`
      : "";
    return `${item.name}${optSuffix} × ${item.quantity}`;
  }).join(", ");
  const amount = order.finalAmount;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: userEmail,
        pass: appPassword,
      },
    });

    const mailOptions = {
      from: `"넉넉 시스템" <${userEmail}>`,
      to: toEmail,
      subject: `[예약금 결제 완료] ${orderName} (${amount.toLocaleString()}원)`,
      text: `새로운 예약금 결제가 발생했습니다.\n\n주문명: ${orderName}\n금액: ${amount.toLocaleString()}원\n자세한 내역은 상점관리자에서 확인하세요.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #6b8e23;">결제가 완료되었습니다 🎉</h2>
          <p><strong>주문명:</strong> ${orderName}</p>
          <p><strong>결제금액:</strong> ${amount.toLocaleString()}원</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 14px;">본 메일은 넉넉 시스템에서 자동 발송되었습니다.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("이메일 발송 실패:", error);
  }
}

export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    // orderId is actually the order_number (NUK-YYYYMMDD-NNN format)
    const order = await getOrderByNumber(orderId);
    if (order) {
      // 주문이 DB에 있으면 금액 검증 (finalAmount 기준)
      if (order.finalAmount !== Number(amount)) {
        return NextResponse.json(
          { error: "결제 금액이 주문 금액과 일치하지 않습니다" },
          { status: 400 }
        );
      }

      // 멱등성/이중결제 방지: 이미 결제 처리된 주문은 Toss 재호출 금지
      // - 동일 paymentKey 재요청 → 성공 반환 (멱등)
      // - 다른 paymentKey 재요청 → 409 (이중결제 차단)
      if (order.status !== "pending") {
        if (order.paymentKey && order.paymentKey === paymentKey) {
          return NextResponse.json({
            success: true,
            data: { orderId: order.orderNumber, alreadyConfirmed: true },
          });
        }
        return NextResponse.json(
          { error: "이미 결제 처리된 주문입니다" },
          { status: 409 }
        );
      }
    }

    // 0원 결제 처리 (포인트/쿠폰으로 전액 할인)
    if (order && order.finalAmount === 0) {
      await updateOrderPayment(order.id, "point-only", "포인트/쿠폰");
      if (COUPON_POINT_ENABLED) await processCouponPoint(order);

      sendDiscordNotification(order).catch(console.error);
      sendEmailNotification(order).catch(console.error);
      sendKakaoAlimtalk(order).catch(console.error);

      return NextResponse.json({ success: true, data: { orderId: order.orderNumber } });
    }

    // 토스페이먼츠 승인 API 호출
    const response = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: getTossAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || "결제 승인 실패", code: errorData.code },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 주문 결제 정보 업데이트
    if (order) {
      try {
        await updateOrderPayment(order.id, paymentKey, data.method || "");
        if (COUPON_POINT_ENABLED) await processCouponPoint(order);
      } catch (e) {
        console.error("주문 결제 정보 업데이트 실패:", e);
      }
    }

    // 알림 비동기 발송 (await 생략하여 결제 응답 속도 최적화)
    if (order) {
      sendDiscordNotification(order).catch(console.error);
      sendEmailNotification(order).catch(console.error);
      sendKakaoAlimtalk(order).catch(console.error);
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return apiError(err, "결제 승인에 실패했습니다", 500, "payments/confirm");
  }
}

// 결제 완료 후 쿠폰/포인트 처리
async function processCouponPoint(order: {
  id: string
  customerId: string | null
  pointUsed: number
  couponId: string | null
  couponCode: string | null
  orderNumber: string
}) {
  if (!order.customerId) return

  // 포인트 차감
  if (order.pointUsed > 0) {
    await spendPoints({
      customerId: order.customerId,
      amount: order.pointUsed,
      orderId: order.id,
      description: `주문 ${order.orderNumber} 포인트 사용`,
    }).catch(console.error)
  }

  // 보유 쿠폰 사용
  if (order.couponId) {
    await applyCoupon(order.couponId, order.id).catch(console.error)
  }

  // 코드 쿠폰 사용
  if (order.couponCode) {
    const template = await validateCouponCode(order.couponCode)
    if (template) {
      await applyCodeCoupon(order.customerId, template.id, order.id).catch(console.error)
    }
  }
}
