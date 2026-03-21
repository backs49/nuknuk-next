// GET /api/admin/orders/[id] — 주문 상세
// PUT /api/admin/orders/[id] — 주문 상태/메모 수정
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderById, updateOrderStatus, updateOrderMemo } from "@/lib/order-db";

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
      return NextResponse.json({ order });
    }

    if (adminMemo !== undefined) {
      await updateOrderMemo(params.id, adminMemo);
      const order = await getOrderById(params.id);
      return NextResponse.json({ order });
    }

    return NextResponse.json(
      { error: "변경할 내용이 없습니다" },
      { status: 400 }
    );
  } catch (error) {
    console.error("주문 수정 에러:", error);
    return NextResponse.json(
      { error: "주문 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}
