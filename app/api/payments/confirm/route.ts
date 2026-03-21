import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getTossAuthHeader, TOSS_CONFIRM_URL } from "@/lib/toss";

// 디스코드 푸시 알림 함수
async function sendDiscordNotification(orderName: string, amount: number) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🚨 **[결제 완료]**\n- **주문명:** ${orderName}\n- **결제금액:** ${amount.toLocaleString()}원\n넉넉 디저트의 예약금이 성공적으로 결제되었습니다! 🎉 (확인: 상점관리자)`,
      }),
    });
  } catch (error) {
    console.error("Discord 알림 발송 실패:", error);
  }
}

// 이메일 전송 함수
async function sendEmailNotification(orderName: string, amount: number) {
  const userEmail = process.env.GMAIL_USER || "backs491@gmail.com";
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = "backs491@gmail.com";

  if (!appPassword) return;

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

    // 알림 비동기 발송 (await 생략하여 결제 응답 속도 최적화)
    const orderName = data?.orderName || "알 수 없는 주문";
    sendDiscordNotification(orderName, amount).catch(console.error);
    sendEmailNotification(orderName, amount).catch(console.error);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "서버 내부 오류";
    return NextResponse.json(
      { message: errorMessage, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
