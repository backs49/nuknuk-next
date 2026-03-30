"use client";

import { useState } from "react";
import { MenuItem, CategoryInfo, formatPrice } from "@/data/menu";
import CouponPointSection, { type DiscountData } from "./CouponPointSection";
import { COUPON_POINT_ENABLED } from "@/lib/feature-flags";
import { calculateOptionPrice, type SelectedOption } from "@/lib/option-utils";

export interface OrderFormData {
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: "pickup" | "shipping";
  pickupDate: string;
  deliveryAddress: string;
  customerMemo: string;
  // 쿠폰/포인트 할인 정보
  couponDiscount: number;
  pointUsed: number;
  couponId?: string;
  couponCode?: string;
  customerId?: string;
  referralCode?: string;
  finalAmount: number;
}

interface OrderFormProps {
  menuItem: MenuItem;
  category: CategoryInfo;
  selectedOptions?: SelectedOption[];
  onSubmit: (data: OrderFormData) => void;
}

function Field({
  label,
  description,
  required,
  children,
}: {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal-300 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-charcoal-100 mb-1">{description}</p>
      )}
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-charcoal-400 mb-2">{title}</h2>
      {children}
    </div>
  );
}

export default function OrderForm({ menuItem, category, selectedOptions, onSubmit }: OrderFormProps) {
  const deliveryMethods = category.availableDeliveryMethods ?? ["pickup", "shipping"];
  const supportsPickup = deliveryMethods.includes("pickup");
  const supportsShipping = deliveryMethods.includes("shipping");
  const defaultMethod = supportsPickup ? "pickup" : "shipping";

  const [form, setForm] = useState({
    quantity: 1,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryMethod: defaultMethod as "pickup" | "shipping",
    pickupDate: "",
    deliveryAddress: "",
    customerMemo: "",
  });

  const [discount, setDiscount] = useState<DiscountData>({
    couponDiscount: 0,
    pointUsed: 0,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const unitPrice = selectedOptions && selectedOptions.length > 0
    ? calculateOptionPrice(menuItem.price, selectedOptions)
    : menuItem.price;
  const itemsTotal = unitPrice * form.quantity;
  const currentShippingFee = form.deliveryMethod === "shipping" ? category.defaultShippingFee : 0;
  const totalAmount = itemsTotal + currentShippingFee;
  const finalAmount = Math.max(0, totalAmount - discount.couponDiscount - discount.pointUsed);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.customerName.trim()) {
      setError("고객명을 입력해 주세요.");
      return;
    }
    if (!form.customerPhone.trim()) {
      setError("연락처를 입력해 주세요.");
      return;
    }
    if (form.deliveryMethod === "pickup" && !form.pickupDate) {
      setError("픽업 날짜와 시간을 선택해 주세요.");
      return;
    }
    if (form.deliveryMethod === "shipping" && !form.deliveryAddress.trim()) {
      setError("배송지 주소를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    onSubmit({
      ...form,
      couponDiscount: discount.couponDiscount,
      pointUsed: discount.pointUsed,
      couponId: discount.couponId,
      couponCode: discount.couponCode,
      customerId: discount.customerId,
      referralCode: discount.referralCode,
      finalAmount,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 주문 상품 요약 */}
      <Section title="주문 상품">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1">
            <p className="font-semibold text-charcoal-400">{menuItem.name}</p>
            {menuItem.nameEn && (
              <p className="text-xs text-charcoal-100 mt-0.5">{menuItem.nameEn}</p>
            )}
            <p className="text-sm text-charcoal-200 mt-1">{menuItem.description}</p>
            {selectedOptions && selectedOptions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedOptions.map((opt) => (
                  <span key={opt.itemId} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">
                    {opt.itemName}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sage-400 text-lg">
              {formatPrice(unitPrice)}
            </p>
            <p className="text-xs text-charcoal-100">/ 1개</p>
          </div>
        </div>

        <Field label="수량" required>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update("quantity", Math.max(1, form.quantity - 1))}
              className="w-9 h-9 rounded-lg border border-gray-200 text-charcoal-300 hover:bg-cream-100 transition flex items-center justify-center text-lg font-medium"
            >
              −
            </button>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) =>
                update("quantity", Math.min(99, Math.max(1, Number(e.target.value))))
              }
              className="input w-20 text-center"
              min={1}
              max={99}
            />
            <button
              type="button"
              onClick={() => update("quantity", Math.min(99, form.quantity + 1))}
              className="w-9 h-9 rounded-lg border border-gray-200 text-charcoal-300 hover:bg-cream-100 transition flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
          </div>
        </Field>
      </Section>

      {/* 고객 정보 */}
      <Section title="고객 정보">
        <Field label="고객명" required>
          <input
            type="text"
            value={form.customerName}
            onChange={(e) => update("customerName", e.target.value)}
            className="input"
            placeholder="홍길동"
            required
          />
        </Field>

        <Field label="연락처" required>
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => update("customerPhone", e.target.value)}
            className="input"
            placeholder="010-0000-0000"
            required
          />
        </Field>

        <Field label="이메일" description="주문 확인 이메일을 보내드립니다 (선택사항)">
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) => update("customerEmail", e.target.value)}
            className="input"
            placeholder="example@email.com"
          />
        </Field>
      </Section>

      {/* 수령 방식 */}
      <Section title="수령 방식">
        {supportsPickup && supportsShipping ? (
          <div className="flex gap-4">
            <label className="flex-1">
              <input
                type="radio"
                name="deliveryMethod"
                value="pickup"
                checked={form.deliveryMethod === "pickup"}
                onChange={() => update("deliveryMethod", "pickup")}
                className="sr-only"
              />
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                  form.deliveryMethod === "pickup"
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
                name="deliveryMethod"
                value="shipping"
                checked={form.deliveryMethod === "shipping"}
                onChange={() => update("deliveryMethod", "shipping")}
                className="sr-only"
              />
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                  form.deliveryMethod === "shipping"
                    ? "border-sage-400 bg-sage-400/5"
                    : "border-gray-200 hover:border-warm-300"
                }`}
              >
                <p className="font-medium text-charcoal-400">택배 배송</p>
                <p className="text-xs text-charcoal-200 mt-0.5">
                  배송비 {formatPrice(category.defaultShippingFee)} 추가
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="py-2">
            <div className="border-2 border-sage-400 bg-sage-400/5 rounded-xl p-4">
              <p className="font-medium text-charcoal-400">
                {supportsPickup ? "픽업" : "택배 배송"}
              </p>
              <p className="text-xs text-charcoal-200 mt-0.5">
                {supportsPickup
                  ? "이 상품은 픽업으로만 수령 가능합니다"
                  : `배송비 ${formatPrice(category.defaultShippingFee)} 추가`}
              </p>
            </div>
          </div>
        )}

        {form.deliveryMethod === "pickup" && (
          <Field label="픽업 날짜 · 시간" required>
            <input
              type="datetime-local"
              value={form.pickupDate}
              onChange={(e) => update("pickupDate", e.target.value)}
              className="input"
              required
            />
          </Field>
        )}

        {form.deliveryMethod === "shipping" && (
          <Field label="배송지 주소" required>
            <textarea
              value={form.deliveryAddress}
              onChange={(e) => update("deliveryAddress", e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="도로명 주소 및 상세 주소를 입력해 주세요"
              required
            />
          </Field>
        )}
      </Section>

      {/* 쿠폰 / 포인트 */}
      {COUPON_POINT_ENABLED && (
        <CouponPointSection
          totalAmount={itemsTotal}
          shippingFee={currentShippingFee}
          customerPhone={form.customerPhone}
          onDiscountChange={setDiscount}
        />
      )}

      {/* 메모 */}
      <Section title="요청사항">
        <Field label="메모" description="특별 요청이 있으시면 남겨주세요 (선택사항)">
          <textarea
            value={form.customerMemo}
            onChange={(e) => update("customerMemo", e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="예: 포장 선물용으로 부탁드려요"
          />
        </Field>
      </Section>

      {/* 결제 금액 요약 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal-400 mb-4">결제 금액</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-charcoal-300">
            <span>
              {menuItem.name} × {form.quantity}
            </span>
            <span>{formatPrice(unitPrice * form.quantity)}</span>
          </div>
          {form.deliveryMethod === "shipping" && (
            <div className="flex justify-between text-charcoal-300">
              <span>배송비</span>
              <span>{formatPrice(category.defaultShippingFee)}</span>
            </div>
          )}
          {discount.couponDiscount > 0 && (
            <div className="flex justify-between text-red-400">
              <span>쿠폰 할인</span>
              <span>-{formatPrice(discount.couponDiscount)}</span>
            </div>
          )}
          {discount.pointUsed > 0 && (
            <div className="flex justify-between text-red-400">
              <span>포인트 사용</span>
              <span>-{formatPrice(discount.pointUsed)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-warm-100 flex justify-between font-bold text-charcoal-400">
            <span>최종 결제 금액</span>
            <span className="text-sage-400 text-lg">{formatPrice(finalAmount)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "주문 처리 중..." : "주문하기"}
      </button>
    </form>
  );
}
