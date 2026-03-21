// POST /api/orders — 고객 주문 생성
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/order-db";
import { getMenuItem } from "@/lib/menu-db";
import type { DeliveryMethod } from "@/data/order";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      menuItemId,
      quantity,
      customerName,
      customerPhone,
      customerEmail,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      customerMemo,
      shippingFee,
    } = body;

    // 입력값 검증
    if (!menuItemId || !quantity || !customerName || !customerPhone || !deliveryMethod) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 99) {
      return NextResponse.json(
        { error: "수량은 1~99 사이만 가능합니다" },
        { status: 400 }
      );
    }

    // 메뉴 아이템 가격 검증 (서버에서 조회하여 클라이언트 조작 방지)
    const menuItem = await getMenuItem(menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { error: "존재하지 않는 상품입니다" },
        { status: 404 }
      );
    }

    const order = await createOrder({
      channel: "direct",
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      deliveryMethod: deliveryMethod as DeliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee: shippingFee || 0,
      items: [
        {
          menuItemId,
          name: menuItem.name,
          quantity: Number(quantity),
          unitPrice: menuItem.price,
        },
      ],
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("주문 생성 에러:", error);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
