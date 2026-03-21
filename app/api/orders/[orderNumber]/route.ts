// GET /api/orders/[orderNumber] — 주문 조회 (공개, 민감정보 제외)
import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/order-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    const order = await getOrderByNumber(orderNumber);
    if (!order) {
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

    // 민감 정보 제외 (adminMemo, paymentKey)
    const { adminMemo, paymentKey, ...publicOrder } = order;
    return NextResponse.json({ order: publicOrder });
  } catch (error) {
    console.error("주문 조회 에러:", error);
    return NextResponse.json(
      { error: "주문 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
