// GET /api/admin/orders — 주문 목록
// POST /api/admin/orders — 사장님 주문 등록 (link)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder, getOrders } from "@/lib/order-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await getOrders({
      channel: searchParams.get("channel") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("주문 목록 조회 에러:", error);
    return NextResponse.json(
      { error: "주문 목록 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      adminMemo,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee,
      items,
    } = body;

    if (!customerName || !customerPhone || !deliveryMethod || !items?.length) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    const order = await createOrder({
      channel: "link",
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      adminMemo,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee: shippingFee || 0,
      items,
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 등록 에러:", error);
    return NextResponse.json(
      { error: "주문 등록에 실패했습니다" },
      { status: 500 }
    );
  }
}
