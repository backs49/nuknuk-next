// GET /api/orders/[orderNumber]?token=xxx — 주문 조회 (공개)
// access_token 미일치 시 404. 민감정보(admin_memo, payment_key)는 응답에서 제거.
import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumberAndToken } from "@/lib/order-db";
import { orderLookupLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { success, reset } = await orderLookupLimit.limit(getClientIp(request));
    if (!success) return rateLimitResponse(reset);

    const { orderNumber } = params;
    const token = request.nextUrl.searchParams.get("token") || "";

    const order = await getOrderByNumberAndToken(orderNumber, token);
    if (!order) {
      // 토큰 불일치 / 존재하지 않음 모두 404로 통일 (존재 여부 누출 방지)
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 72시간 만료 체크 (링크 결제)
    if (order.channel === "link" && order.status === "pending") {
      const created = new Date(order.createdAt).getTime();
      const now = Date.now();
      const hours72 = 72 * 60 * 60 * 1000;
      if (now - created > hours72) {
        return NextResponse.json(
          { error: "결제 링크가 만료되었습니다" },
          { status: 410 }
        );
      }
    }

    // 민감 정보 제외 (adminMemo, paymentKey, accessToken)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { adminMemo, paymentKey, accessToken, ...publicOrder } = order;
    return NextResponse.json({ order: publicOrder });
  } catch (error) {
    console.error("주문 조회 에러:", error);
    return NextResponse.json(
      { error: "주문 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
