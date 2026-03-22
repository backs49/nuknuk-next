// POST /api/orders — 고객 주문 생성 (단일/다건 지원)
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/order-db";
import { getMenuItem } from "@/lib/menu-db";
import type { DeliveryMethod } from "@/data/order";

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      menuItemId,
      quantity,
      items: itemsArray,
      customerName,
      customerPhone,
      customerEmail,
      deliveryMethod,
      deliveryAddress,
      pickupDate,
      customerMemo,
      shippingFee,
    } = body;

    // 필수값 검증
    if (!customerName || !customerPhone || !deliveryMethod) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    // items 배열 결정: 다건(items) 또는 단건(menuItemId + quantity)
    let orderItems: OrderItemInput[];
    if (Array.isArray(itemsArray) && itemsArray.length > 0) {
      orderItems = itemsArray;
    } else if (menuItemId && quantity) {
      orderItems = [{ menuItemId, quantity }];
    } else {
      return NextResponse.json(
        { error: "주문할 상품을 선택해주세요" },
        { status: 400 }
      );
    }

    // 수량 검증
    for (const item of orderItems) {
      if (!item.menuItemId || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json(
          { error: "수량은 1~99 사이만 가능합니다" },
          { status: 400 }
        );
      }
    }

    // 메뉴 아이템 가격 검증 (서버에서 조회하여 클라이언트 조작 방지)
    const resolvedItems = [];
    for (const item of orderItems) {
      const menuItem = await getMenuItem(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { error: `존재하지 않는 상품입니다: ${item.menuItemId}` },
          { status: 404 }
        );
      }
      resolvedItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: Number(item.quantity),
        unitPrice: menuItem.price,
      });
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
      items: resolvedItems,
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
