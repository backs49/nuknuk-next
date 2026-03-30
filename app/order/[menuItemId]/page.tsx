"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MenuItem, CategoryInfo, formatPrice } from "@/data/menu";
import OrderForm, { OrderFormData } from "@/components/order/OrderForm";
import PaymentWidget from "@/components/order/PaymentWidget";
import type { SelectedOption } from "@/lib/option-utils";
import { calculateOptionPrice, formatSelectedOptions } from "@/lib/option-utils";

interface CreatedOrder {
  orderNumber: string;
  totalAmount: number;
  finalAmount: number;
  orderName: string;
}

type Step = "loading" | "error" | "form" | "payment";

export default function OrderPage() {
  const params = useParams();
  const menuItemId = params.menuItemId as string;

  const [step, setStep] = useState<Step>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [menuRes, categoriesRes] = await Promise.all([
          fetch(`/api/menu/${menuItemId}`),
          fetch("/api/categories"),
        ]);

        if (!menuRes.ok) {
          setErrorMessage("메뉴를 찾을 수 없습니다.");
          setStep("error");
          return;
        }

        const menuData = await menuRes.json();
        const item: MenuItem = menuData.item || menuData;

        let foundCategory: CategoryInfo | null = null;

        if (categoriesRes.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawCats: any[] = await categoriesRes.json();
          const cats: CategoryInfo[] = rawCats.map((c) => ({
            id: c.id,
            name: c.name,
            nameEn: c.name_en ?? c.nameEn ?? "",
            emoji: c.emoji ?? "",
            availableDeliveryMethods: c.available_delivery_methods ?? c.availableDeliveryMethods ?? ["pickup", "shipping"],
            defaultShippingFee: c.default_shipping_fee ?? c.defaultShippingFee ?? 4000,
          }));
          foundCategory = cats.find((cat) => cat.id === item.category) || null;
        }

        // Fallback to static category data if not found via API
        if (!foundCategory) {
          const { categories } = await import("@/data/menu");
          foundCategory = categories.find((c) => c.id === item.category) || null;
        }

        if (!foundCategory) {
          setErrorMessage("카테고리 정보를 불러올 수 없습니다.");
          setStep("error");
          return;
        }

        setMenuItem(item);
        setCategory(foundCategory);
        setStep("form");
      } catch {
        setErrorMessage("데이터를 불러오는 중 오류가 발생했습니다.");
        setStep("error");
      }
    }

    fetchData();
  }, [menuItemId]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("direct-order-options");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.menuItemId === menuItemId) {
          setSelectedOptions(parsed.options);
        }
        sessionStorage.removeItem("direct-order-options");
      }
    } catch { /* ignore */ }
  }, [menuItemId]);

  async function handleOrderSubmit(formData: OrderFormData) {
    if (!menuItem || !category) return;

    const shippingFee =
      formData.deliveryMethod === "shipping" ? category.defaultShippingFee : 0;

    const unitPrice = selectedOptions.length > 0
      ? calculateOptionPrice(menuItem.price, selectedOptions)
      : menuItem.price;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            menuItemId: menuItem.id,
            quantity: formData.quantity,
            unitPrice,
            selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
          }],
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          deliveryMethod: formData.deliveryMethod,
          deliveryAddress: formData.deliveryAddress,
          pickupDate: formData.pickupDate,
          customerMemo: formData.customerMemo,
          shippingFee,
          couponId: formData.couponId,
          couponCode: formData.couponCode,
          couponDiscount: formData.couponDiscount,
          pointUsed: formData.pointUsed,
          referralCode: formData.referralCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "주문 생성에 실패했습니다.");
      }

      const data = await res.json();
      const order = data.order;

      const totalAmount = unitPrice * formData.quantity + shippingFee;
      const optionSuffix = selectedOptions.length > 0
        ? ` (${formatSelectedOptions(selectedOptions)})`
        : "";

      setCreatedOrder({
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount ?? totalAmount,
        finalAmount: order.finalAmount ?? formData.finalAmount ?? totalAmount,
        orderName: `${menuItem.name}${optionSuffix} × ${formData.quantity}`,
      });
      setCustomerInfo({
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      });
      setStep("payment");
    } catch (err) {
      alert(err instanceof Error ? err.message : "주문 처리 중 오류가 발생했습니다.");
    }
  }

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-sage-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-charcoal-200 text-sm">메뉴 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">😔</div>
          <h1 className="text-xl font-bold text-charcoal-400">{errorMessage}</h1>
          <p className="text-sm text-charcoal-200">
            메뉴 페이지로 돌아가서 다시 시도해 주세요.
          </p>
          <Link href="/" className="btn-primary inline-flex mt-2">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-8 mt-10">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-200 hover:text-charcoal-400 transition mb-4"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            메뉴로 돌아가기
          </Link>

          {step === "form" && (
            <>
              <h1 className="text-3xl font-display font-bold text-charcoal-400">
                주문하기
              </h1>
              <p className="text-charcoal-200">
                {category?.emoji} {menuItem?.name}
                {menuItem?.price !== undefined && (
                  <span className="ml-2 text-sage-400 font-semibold">
                    {formatPrice(
                      selectedOptions.length > 0
                        ? calculateOptionPrice(menuItem.price, selectedOptions)
                        : menuItem.price
                    )}
                  </span>
                )}
              </p>
            </>
          )}

          {step === "payment" && (
            <>
              <h1 className="text-3xl font-display font-bold text-charcoal-400">
                결제하기
              </h1>
              <p className="text-charcoal-200">
                주문이 접수되었습니다. 아래에서 결제를 완료해 주세요.
              </p>
            </>
          )}
        </div>

        {/* 단계 인디케이터 */}
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              step === "form" ? "text-sage-400" : "text-charcoal-200"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "form"
                  ? "bg-sage-400 text-white"
                  : step === "payment"
                  ? "bg-sage-200 text-sage-600"
                  : "bg-gray-200 text-charcoal-200"
              }`}
            >
              {step === "payment" ? "✓" : "1"}
            </div>
            주문 정보
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              step === "payment" ? "text-sage-400" : "text-charcoal-200"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "payment"
                  ? "bg-sage-400 text-white"
                  : "bg-gray-200 text-charcoal-200"
              }`}
            >
              2
            </div>
            결제
          </div>
        </div>

        {/* 본문 콘텐츠 */}
        {step === "form" && menuItem && category && (
          <OrderForm
            menuItem={menuItem}
            category={category}
            selectedOptions={selectedOptions}
            onSubmit={handleOrderSubmit}
          />
        )}

        {step === "payment" && createdOrder && (
          <PaymentWidget
            amount={createdOrder.finalAmount}
            orderNumber={createdOrder.orderNumber}
            orderName={createdOrder.orderName}
            customerName={customerInfo?.name}
            customerEmail={customerInfo?.email}
            customerPhone={customerInfo?.phone}
          />
        )}

        {/* 안내 문구 */}
        <p className="text-center text-xs text-charcoal-100 pb-8">
          주문 관련 문의:{" "}
          <a
            href="http://pf.kakao.com/_paCxdn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-400 hover:underline"
          >
            카카오톡 채널
          </a>
        </p>
      </div>
    </div>
  );
}
