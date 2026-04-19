// POST /api/orders — 고객 주문 생성 (단일/다건 지원)
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/order-db";
import { getMenuItem } from "@/lib/menu-db";
import { upsertCustomer, getCustomerByReferralCode, setReferredBy } from "@/lib/customer-db";
import { validateCouponCode, calculateCouponDiscount, getCustomerCoupons } from "@/lib/coupon-db";
import { calculateEarnPoints } from "@/lib/point-db";
import type { DeliveryMethod } from "@/data/order";
import type { CouponTemplate } from "@/data/customer";
import { COUPON_POINT_ENABLED } from "@/lib/feature-flags";
import { getMenuOptions } from "@/lib/menu-option-db";
import { calculateOptionPrice, type SelectedOption } from "@/lib/option-utils";
import { orderCreateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  unitPrice?: number;           // 클라이언트 전송 단가
  selectedOptions?: SelectedOption[];
}

export async function POST(request: NextRequest) {
  try {
    const { success, reset } = await orderCreateLimit.limit(getClientIp(request));
    if (!success) return rateLimitResponse(reset);

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

      let unitPrice = menuItem.price;
      let validatedOptions: SelectedOption[] | undefined;

      if (item.selectedOptions && item.selectedOptions.length > 0) {
        // 서버에서 옵션 가격 검증
        const optionGroups = await getMenuOptions(item.menuItemId);
        for (const opt of item.selectedOptions) {
          const group = optionGroups.find((g) => g.id === opt.groupId);
          if (!group) {
            return NextResponse.json({ error: `존재하지 않는 옵션 그룹: ${opt.groupName}` }, { status: 400 });
          }
          const optItem = group.items.find((i) => i.id === opt.itemId);
          if (!optItem || optItem.price !== opt.price) {
            return NextResponse.json({ error: `옵션 가격이 변경되었습니다: ${opt.itemName}` }, { status: 400 });
          }
        }
        unitPrice = calculateOptionPrice(menuItem.price, item.selectedOptions);
        validatedOptions = item.selectedOptions;

        // 클라이언트 전송 단가 검증
        if (item.unitPrice !== undefined && item.unitPrice !== unitPrice) {
          return NextResponse.json({ error: "가격이 변경되었습니다. 페이지를 새로고침해주세요." }, { status: 400 });
        }
      }

      resolvedItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: Number(item.quantity),
        unitPrice,
        selectedOptions: validatedOptions,
      });
    }

    // 상품 금액 합계
    const itemsTotal = resolvedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice, 0
    );
    const resolvedShippingFee = shippingFee || 0;

    // 쿠폰/포인트 관련 변수 초기화
    let customerId: string | undefined;
    let couponId: string | undefined;
    let couponCode: string | undefined;
    let couponDiscount = 0;
    let appliedTemplate: CouponTemplate | null = null;
    let pointUsed = 0;

    if (COUPON_POINT_ENABLED) {
      // 고객 식별 (전화번호 기반 upsert)
      try {
        const customer = await upsertCustomer(customerPhone, customerName);
        customerId = customer.id;

        // 추천 코드 처리
        if (body.referralCode) {
          const referrer = await getCustomerByReferralCode(body.referralCode);
          if (referrer && referrer.id !== customer.id) {
            await setReferredBy(customer.id, referrer.id).catch(() => {});
          }
        }
      } catch {
        // Supabase 미설정 시 무시
      }

      // 쿠폰 처리
      if (body.couponId && customerId) {
        const coupons = await getCustomerCoupons(customerId);
        const coupon = coupons.find(c => c.id === body.couponId);
        if (coupon && coupon.template) {
          if (coupon.template.minOrderAmount <= itemsTotal) {
            couponId = coupon.id;
            appliedTemplate = coupon.template;
            couponDiscount = calculateCouponDiscount(coupon.template, itemsTotal, resolvedShippingFee);
          }
        }
      } else if (body.couponCode) {
        const template = await validateCouponCode(body.couponCode);
        if (template && template.minOrderAmount <= itemsTotal) {
          couponCode = body.couponCode;
          appliedTemplate = template;
          couponDiscount = calculateCouponDiscount(template, itemsTotal, resolvedShippingFee);
        }
      }

      // 포인트 사용 검증 (실제 차감은 결제 확인 시)
      pointUsed = Math.max(0, Number(body.pointUsed) || 0);
    }

    // 최종 금액 계산
    const totalAmount = itemsTotal + resolvedShippingFee;
    const finalAmount = Math.max(0, totalAmount - couponDiscount - pointUsed);
    const pointEarned = COUPON_POINT_ENABLED ? await calculateEarnPoints(finalAmount) : 0;

    const order = await createOrder({
      channel: "direct",
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      deliveryMethod: deliveryMethod as DeliveryMethod,
      deliveryAddress,
      pickupDate,
      shippingFee: resolvedShippingFee,
      customerId,
      couponId,
      couponCode,
      couponDiscount,
      pointUsed,
      pointEarned,
      finalAmount,
      items: resolvedItems,
    });

    return NextResponse.json({ order, appliedTemplate });
  } catch (error) {
    console.error("주문 생성 에러:", error);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
