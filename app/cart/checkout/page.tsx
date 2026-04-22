"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice, type CategoryInfo } from "@/data/menu";
import PaymentWidget from "@/components/order/PaymentWidget";
import CouponPointSection, { type DiscountData } from "@/components/order/CouponPointSection";
import { COUPON_POINT_ENABLED } from "@/lib/feature-flags";
import { formatKoreanPhone } from "@/lib/format-phone";
import PickupDateTimePicker from "@/components/form/PickupDateTimePicker";

interface CreatedOrder {
  orderNumber: string;
  totalAmount: number;
  finalAmount: number;
  orderName: string;
}

type Step = "form" | "payment";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2Hour(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatWeekdays(days: number[]): string {
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d])
    .join("/");
}

export default function CartCheckoutPage() {
  const { items, totalPrice } = useCart();

  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  // 페이지 마운트 시 availability 체크
  useEffect(() => {
    if (items.length === 0) {
      setUnavailableIds(new Set());
      return;
    }
    const ids = Array.from(new Set(items.map((i) => i.menuItemId)));
    fetch("/api/menu/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.json())
      .then((data: { unavailableIds: string[] }) => {
        setUnavailableIds(new Set(data.unavailableIds ?? []));
      })
      .catch(() => {
        setUnavailableIds(new Set());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnavailable = unavailableIds.size > 0;

  const [step, setStep] = useState<Step>("form");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  // 카테고리 정보 (수령 방식 결정용)
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  // 폼 상태
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerMemo, setCustomerMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 개인정보 동의 상태
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [thirdPartyConsent, setThirdPartyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [consentPrefilled, setConsentPrefilled] = useState(false);
  const [returningCustomer, setReturningCustomer] = useState(false);
  const [discount, setDiscount] = useState<DiscountData>({
    couponDiscount: 0,
    pointUsed: 0,
  });
  const [operating, setOperating] = useState<{
    openHour: number;
    closeHour: number;
    slotMinutes: number;
    closedWeekdays: number[];
    closedDates: string[];
    closures: { startDate: string; endDate: string; reason: string | null }[];
  }>({
    openHour: 10,
    closeHour: 16,
    slotMinutes: 60,
    closedWeekdays: [],
    closedDates: [],
    closures: [],
  });

  useEffect(() => {
    fetch("/api/shop/operating", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setOperating({ closures: [], ...d });
      })
      .catch(() => {});
  }, []);

  // 카테고리 정보 fetch
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(
          cats.map((c: Record<string, unknown>) => ({
            id: (c.id as string) || "",
            name: (c.name as string) || "",
            nameEn: (c.name_en as string) || "",
            emoji: (c.emoji as string) || "",
            availableDeliveryMethods: (c.available_delivery_methods as string[]) ?? (c.availableDeliveryMethods as string[]) ?? ["pickup"],
            defaultShippingFee: (c.default_shipping_fee as number) ?? (c.defaultShippingFee as number) ?? 0,
          }))
        );
      })
      .catch(() => {});
  }, []);

  // 수령 방식: 장바구니 상품 카테고리들의 교집합
  const availableMethods = useMemo(() => {
    if (categories.length === 0 || items.length === 0) return ["pickup"];
    const itemCategories = Array.from(new Set(items.map((i) => i.category)));
    const methodSets = itemCategories.map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      return new Set(cat?.availableDeliveryMethods ?? ["pickup"]);
    });
    const intersection = methodSets.reduce((acc, set) => {
      return new Set(Array.from(acc).filter((m) => set.has(m)));
    });
    return intersection.size > 0 ? Array.from(intersection) : ["pickup"];
  }, [categories, items]);

  // 수령 방식이 교집합에 포함되지 않으면 첫 번째 방식으로 자동 전환
  useEffect(() => {
    if (!availableMethods.includes(deliveryMethod)) {
      setDeliveryMethod(availableMethods[0] as "pickup" | "shipping");
    }
  }, [availableMethods, deliveryMethod]);

  // 배송비 계산
  const shippingFee = (() => {
    if (deliveryMethod !== "shipping") return 0;
    const itemCategories = Array.from(new Set(items.map((i) => i.category)));
    const fees = itemCategories.map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      return cat?.defaultShippingFee ?? 0;
    });
    return Math.max(...fees, 0);
  })();

  const grandTotal = totalPrice + shippingFee;
  const finalAmount = Math.max(0, grandTotal - discount.couponDiscount - discount.pointUsed);

  // 장바구니 비어있으면 리다이렉트
  if (items.length === 0 && step === "form") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal-200 mb-4">장바구니가 비어있습니다</p>
          <Link href="/" className="text-sage-400 font-medium hover:underline">
            메뉴 보기
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    // 판매 중단 상품 가드
    if (hasUnavailable) {
      setError("판매 중단된 상품을 장바구니에서 제거해주세요.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("이름과 전화번호를 입력해주세요.");
      return;
    }
    if (deliveryMethod === "pickup" && !pickupDate) {
      setError("픽업 날짜와 시간을 선택해주세요.");
      return;
    }
    if (deliveryMethod === "shipping" && !deliveryAddress.trim()) {
      setError("배송 주소를 입력해주세요.");
      return;
    }
    if (!privacyConsent || !thirdPartyConsent) {
      setError("개인정보 수집·이용 및 제3자 제공에 동의해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: i.price,
            selectedOptions: i.selectedOptions,
          })),
          customerName: customerName.trim(),
          customerPhone: customerPhone.replace(/-/g, ""),
          customerEmail: customerEmail.trim() || undefined,
          deliveryMethod,
          pickupDate: deliveryMethod === "pickup" ? pickupDate : undefined,
          deliveryAddress: deliveryMethod === "shipping" ? deliveryAddress.trim() : undefined,
          customerMemo: customerMemo.trim() || undefined,
          shippingFee,
          couponId: discount.couponId,
          couponCode: discount.couponCode,
          couponDiscount: discount.couponDiscount,
          pointUsed: discount.pointUsed,
          referralCode: discount.referralCode,
          privacyConsent,
          thirdPartyConsent,
          marketingConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "주문 생성 실패");

      const order = data.order;
      const orderName =
        items.length === 1
          ? items[0].name
          : `${items[0].name} 외 ${items.length - 1}건`;

      setCreatedOrder({
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        finalAmount: order.finalAmount ?? finalAmount,
        orderName,
      });
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 생성에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "payment" && createdOrder) {
    return (
      <div className="min-h-screen bg-cream-100 py-12">
        <div className="max-w-lg mx-auto px-5">
          <h1 className="text-2xl font-bold text-charcoal-400 mb-6">결제</h1>
          <PaymentWidget
            amount={createdOrder.finalAmount}
            orderNumber={createdOrder.orderNumber}
            orderName={createdOrder.orderName}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone.replace(/-/g, "")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 py-12">
      <div className="max-w-2xl mx-auto px-5">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-charcoal-200 hover:text-charcoal-400">
            ← 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-charcoal-400">주문서</h1>
        </div>

        {/* 주문 상품 요약 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-charcoal-400 mb-4">주문 상품</h2>
          {items.map((item) => {
            const isUnavailable = unavailableIds.has(item.menuItemId);
            return (
              <div
                key={item.menuItemId}
                className={`flex justify-between py-2 border-b border-gray-50 last:border-0 ${
                  isUnavailable ? "opacity-40" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-charcoal-400">{item.name}</span>
                    <span className="text-xs text-charcoal-100">x {item.quantity}</span>
                    {isUnavailable && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                        판매 중단
                      </span>
                    )}
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedOptions.map((opt) => (
                        <span key={opt.itemId} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                          {opt.itemName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-sm font-medium ${isUnavailable ? "text-gray-400 line-through" : "text-charcoal-400"}`}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
            <span className="font-bold text-charcoal-400">상품 합계</span>
            <span className="font-bold text-sage-400">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {hasUnavailable && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-medium">
              ⚠️ 판매 중단된 상품이 장바구니에 있습니다.
            </p>
            <p className="text-xs text-red-500 mt-1">
              장바구니로 돌아가 해당 상품을 제거한 후 결제를 진행해주세요.
            </p>
          </div>
        )}

        {/* 고객 정보 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-bold text-charcoal-400 mb-2">고객 정보</h2>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              전화번호 <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(formatKoreanPhone(e.target.value));
                setConsentPrefilled(false);
              }}
              onBlur={async () => {
                const normalized = customerPhone.replace(/\D/g, "");
                if (normalized.length < 10 || consentPrefilled) return;
                try {
                  const res = await fetch(
                    `/api/customers/lookup?phone=${encodeURIComponent(normalized)}`
                  );
                  if (!res.ok) return;
                  const data = await res.json();
                  const prior = data?.customer?.marketingConsent;
                  if (prior !== undefined && prior !== null) {
                    setPrivacyConsent(true);
                    setThirdPartyConsent(true);
                    setMarketingConsent(Boolean(prior));
                    setReturningCustomer(true);
                  }
                  setConsentPrefilled(true);
                } catch {}
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              placeholder="010-1234-5678"
              inputMode="numeric"
              maxLength={13}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
              placeholder="example@email.com"
            />
          </div>
        </div>

        {/* 수령 방식 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-bold text-charcoal-400 mb-2">수령 방식</h2>

          {availableMethods.includes("pickup") && availableMethods.includes("shipping") ? (
            <div className="flex gap-4">
              <label className="flex-1">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                  className="sr-only"
                />
                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                    deliveryMethod === "pickup"
                      ? "border-sage-400 bg-sage-400/5"
                      : "border-gray-200 hover:border-warm-300"
                  }`}
                >
                  <p className="font-medium text-charcoal-400">픽업</p>
                  <p className="text-xs text-charcoal-200 mt-0.5">직접 방문 수령</p>
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="delivery"
                  value="shipping"
                  checked={deliveryMethod === "shipping"}
                  onChange={() => setDeliveryMethod("shipping")}
                  className="sr-only"
                />
                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                    deliveryMethod === "shipping"
                      ? "border-sage-400 bg-sage-400/5"
                      : "border-gray-200 hover:border-warm-300"
                  }`}
                >
                  <p className="font-medium text-charcoal-400">택배 배송</p>
                  <p className="text-xs text-charcoal-200 mt-0.5">
                    배송비 {formatPrice(shippingFee)} 추가
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="py-2">
              <div className="border-2 border-sage-400 bg-sage-400/5 rounded-xl p-4">
                <p className="font-medium text-charcoal-400">
                  {availableMethods.includes("pickup") ? "픽업" : "택배 배송"}
                </p>
                <p className="text-xs text-charcoal-200 mt-0.5">
                  {availableMethods.includes("pickup")
                    ? "이 상품은 픽업으로만 수령 가능합니다"
                    : `배송비 ${formatPrice(shippingFee)} 추가`}
                </p>
              </div>
            </div>
          )}

          {deliveryMethod === "pickup" && (
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                픽업 날짜 · 시간 <span className="text-red-400">*</span>
              </label>
              <PickupDateTimePicker
                value={pickupDate}
                onChange={setPickupDate}
                startHour={operating.openHour}
                endHour={operating.closeHour}
                stepMinutes={operating.slotMinutes}
                closedWeekdays={operating.closedWeekdays}
                closedDates={operating.closedDates}
                closures={operating.closures}
              />
              <p className="text-xs text-charcoal-100 mt-1">
                최소 2일 전 주문 부탁드립니다. 픽업 가능: {pad2Hour(operating.openHour)}:00~{pad2Hour(operating.closeHour)}:00.
                {operating.closedWeekdays.length > 0 && (
                  <> 정기 휴무: {formatWeekdays(operating.closedWeekdays)}.</>
                )}
              </p>
            </div>
          )}

          {deliveryMethod === "shipping" && (
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                배송 주소 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50 min-h-[80px] resize-y"
                placeholder="도로명 주소 및 상세 주소를 입력해 주세요"
              />
              <p className="text-xs text-charcoal-100 mt-1">
                배송비: {formatPrice(shippingFee)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              요청사항
            </label>
            <textarea
              value={customerMemo}
              onChange={(e) => setCustomerMemo(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50 resize-none"
              placeholder="요청사항을 입력해주세요"
            />
          </div>
        </div>

        {/* 쿠폰 / 포인트 */}
        {COUPON_POINT_ENABLED && (
          <div className="mb-6">
            <CouponPointSection
              totalAmount={totalPrice}
              shippingFee={shippingFee}
              customerPhone={customerPhone}
              onDiscountChange={setDiscount}
            />
          </div>
        )}

        {/* 결제 요약 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-charcoal-200">상품 합계</span>
            <span className="text-sm text-charcoal-400">{formatPrice(totalPrice)}</span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-sm text-charcoal-200">배송비</span>
              <span className="text-sm text-charcoal-400">{formatPrice(shippingFee)}</span>
            </div>
          )}
          {discount.couponDiscount > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-sm text-charcoal-200">쿠폰 할인</span>
              <span className="text-sm text-red-400">-{formatPrice(discount.couponDiscount)}</span>
            </div>
          )}
          {discount.pointUsed > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-sm text-charcoal-200">포인트 사용</span>
              <span className="text-sm text-red-400">-{formatPrice(discount.pointUsed)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-bold text-lg text-charcoal-400">최종 결제금액</span>
            <span className="font-bold text-lg text-sage-400">{formatPrice(finalAmount)}</span>
          </div>
        </div>

        {/* 개인정보 동의 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-charcoal-400 mb-3">개인정보 처리 동의</h2>
          {returningCustomer && (
            <div className="mb-3 px-3 py-2 bg-sage-400/10 border border-sage-400/20 rounded-lg">
              <p className="text-xs text-sage-500">
                반갑습니다! 이전 동의 내역을 기반으로 체크해 두었습니다.
              </p>
            </div>
          )}
          <div className="space-y-2.5">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-sage-400"
              />
              <span className="text-sm text-charcoal-300">
                <span className="text-red-400">[필수]</span> 개인정보 수집·이용 동의
                <span className="block text-xs text-charcoal-100 mt-0.5">
                  주문 처리·배송·고객 상담을 위해 이름, 연락처, 주소를 수집합니다. 주문 완료 후 5년간 보관됩니다.
                </span>
                <Link href="/privacy" target="_blank" className="text-xs text-sage-400 hover:underline mt-0.5 inline-block">
                  전문 보기 →
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={thirdPartyConsent}
                onChange={(e) => setThirdPartyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-sage-400"
              />
              <span className="text-sm text-charcoal-300">
                <span className="text-red-400">[필수]</span> 개인정보 제3자 제공 동의
                <span className="block text-xs text-charcoal-100 mt-0.5">
                  결제(토스페이먼츠), 배송(택배사), 알림(카카오 알림톡) 처리를 위해 관련 정보를 위탁합니다.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-sage-400"
              />
              <span className="text-sm text-charcoal-300">
                <span className="text-charcoal-200">[선택]</span> 마케팅 정보 수신 동의
                <span className="block text-xs text-charcoal-100 mt-0.5">
                  신메뉴·이벤트·쿠폰 등의 소식을 문자로 받아보실 수 있습니다. (선택 사항)
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* 환불 규정 고지 */}
        <div className="bg-warm-200/30 border border-warm-200 rounded-xl px-4 py-3 mb-4 text-xs text-charcoal-300 leading-relaxed">
          <p className="font-medium text-charcoal-400 mb-1">
            청약철회·환불 안내 (수제 식품 특성)
          </p>
          <p>
            주문 후 제조되는 수제 디저트 특성상 <span className="font-semibold">픽업·배송 3일 전까지</span> 전액 환불이
            가능하며, 제조 착수(2일 전) 이후에는 재료비·제조비가 차감될 수 있습니다.
            하자·오배송은 수령 후 3일 이내 통지 시 전액 보상됩니다.{" "}
            <Link href="/refund-policy" target="_blank" className="text-sage-500 underline hover:text-sage-600">
              자세한 규정 보기 →
            </Link>
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || hasUnavailable}
          className={`w-full py-4 bg-sage-400 text-white rounded-xl font-bold text-base hover:bg-sage-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasUnavailable ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? "처리 중..." : hasUnavailable ? "판매 중단 상품 제거 필요" : `${formatPrice(finalAmount)} 결제하기`}
        </button>
      </div>
    </div>
  );
}
