// GET /api/admin/orders/[id] — 주문 상세
// PUT /api/admin/orders/[id] — 주문 상태/메모 수정
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderById, updateOrderStatus, updateOrderMemo } from "@/lib/order-db";
import { onOrderCompleted, onOrderCancelled } from "@/lib/order-hooks";
import { assertMaxLength, INPUT_LIMITS } from "@/lib/input-limits";
import { apiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 상세 조회 에러:", error);
    return NextResponse.json(
      { error: "주문 상세 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, adminMemo } = body;

    if (status) {
      const order = await updateOrderStatus(params.id, status);

      // 주문 완료/취소 시 후처리 (포인트, 쿠폰, 추천)
      if (status === "completed") {
        onOrderCompleted(params.id).catch(console.error);
      } else if (status === "cancelled" || status === "refunded") {
        onOrderCancelled(params.id).catch(console.error);
      }

      return NextResponse.json({ order });
    }

    if (adminMemo !== undefined) {
      assertMaxLength(adminMemo, INPUT_LIMITS.adminMemo, "관리자 메모");
      await updateOrderMemo(params.id, adminMemo);
      const order = await getOrderById(params.id);
      return NextResponse.json({ order });
    }

    return NextResponse.json(
      { error: "변경할 내용이 없습니다" },
      { status: 400 }
    );
  } catch (error) {
    return apiError(error, "주문 수정에 실패했습니다", 500, "admin/orders/update");
  }
}
