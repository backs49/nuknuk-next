"use client";

import { useState, useEffect } from "react";
import PaymentLinkModal from "./PaymentLinkModal";

interface DbMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface OrderItem {
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CreatedOrder {
  orderNumber: string;
  totalAmount: number;
}

export default function OrderCreateForm() {
  const [menuItems, setMenuItems] = useState<DbMenuItem[]>([]);
  const [menuSelectOpen, setMenuSelectOpen] = useState(false);

  // 고객 정보
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // 상품 목록
  const [items, setItems] = useState<OrderItem[]>([]);

  // 수령 정보
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingFee, setShippingFee] = useState<number>(0);

  // 메모
  const [customerMemo, setCustomerMemo] = useState("");
  const [adminMemo, setAdminMemo] = useState("");

  // 상태
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    fetch("/api/admin/menu")
      .then((res) => res.json())
      .then((data: DbMenuItem[]) => {
        setMenuItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setMenuItems([]);
      });
  }, []);

  function addMenuItemRow(item: DbMenuItem) {
    setItems((prev) => [
      ...prev,
      {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.price,
      },
    ]);
    setMenuSelectOpen(false);
  }

  function addCustomItemRow() {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalAmount =
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) +
    (deliveryMethod === "shipping" ? shippingFee : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) {
      setError("고객명을 입력하세요.");
      return;
    }
    if (!customerPhone.trim()) {
      setError("연락처를 입력하세요.");
      return;
    }
    if (items.length === 0) {
      setError("상품을 하나 이상 추가하세요.");
      return;
    }
    for (const item of items) {
      if (!item.name.trim()) {
        setError("상품명을 모두 입력하세요.");
        return;
      }
      if (item.unitPrice <= 0) {
        setError("단가를 올바르게 입력하세요.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        ...(customerEmail.trim() ? { customerEmail: customerEmail.trim() } : {}),
        ...(customerMemo.trim() ? { customerMemo: customerMemo.trim() } : {}),
        ...(adminMemo.trim() ? { adminMemo: adminMemo.trim() } : {}),
        deliveryMethod,
        ...(deliveryMethod === "pickup" && pickupDate ? { pickupDate } : {}),
        ...(deliveryMethod === "shipping" && deliveryAddress.trim()
          ? { deliveryAddress: deliveryAddress.trim() }
          : {}),
        ...(deliveryMethod === "shipping" ? { shippingFee } : {}),
        items: items.map((item) => ({
          ...(item.menuItemId ? { menuItemId: item.menuItemId } : {}),
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "주문 등록에 실패했습니다.");
      }

      const data = await res.json();
      setCreatedOrder({
        orderNumber: data.order.orderNumber,
        totalAmount: data.order.totalAmount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {/* 고객 정보 */}
        <Section title="고객 정보">
          <Field label="고객명" required>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input"
              placeholder="홍길동"
              required
            />
          </Field>
          <Field label="연락처" required>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input"
              placeholder="010-0000-0000"
              required
            />
          </Field>
          <Field label="이메일" description="선택사항">
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="input"
              placeholder="example@email.com"
            />
          </Field>
        </Section>

        {/* 상품 추가 */}
        <Section title="상품 추가">
          {/* 상품 목록 */}
          {items.length > 0 && (
            <div className="space-y-3 mb-4">
              {/* 헤더 */}
              <div className="grid grid-cols-[1fr_100px_88px_72px_32px] gap-2 text-xs font-medium text-charcoal-200 px-1">
                <span>상품명</span>
                <span>단가 (원)</span>
                <span>수량</span>
                <span>소계</span>
                <span />
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_100px_88px_72px_32px] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    className="input text-sm"
                    placeholder="상품명"
                    required
                  />
                  <input
                    type="number"
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      updateItem(index, "unitPrice", Number(e.target.value))
                    }
                    className="input text-sm"
                    min={0}
                    step={500}
                    placeholder="0"
                    required
                  />
                  {/* 수량 스테퍼 */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(
                          index,
                          "quantity",
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      className="px-2 py-1.5 text-charcoal-300 hover:bg-gray-100 transition text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm text-charcoal-400">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(index, "quantity", item.quantity + 1)
                      }
                      className="px-2 py-1.5 text-charcoal-300 hover:bg-gray-100 transition text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-charcoal-300 text-right">
                    {(item.unitPrice * item.quantity).toLocaleString()}원
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition"
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-3 flex-wrap">
            {/* 메뉴에서 선택 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuSelectOpen((o) => !o)}
                className="px-4 py-2 text-sm bg-sage-400 text-white rounded-lg hover:bg-sage-500 transition"
              >
                + 메뉴에서 선택
              </button>
              {menuSelectOpen && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[240px] max-h-64 overflow-y-auto">
                  {menuItems.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-charcoal-200">
                      메뉴 항목이 없습니다.
                    </p>
                  ) : (
                    menuItems.map((mi) => (
                      <button
                        key={mi.id}
                        type="button"
                        onClick={() => addMenuItemRow(mi)}
                        className="w-full text-left px-4 py-2.5 text-sm text-charcoal-300 hover:bg-cream-100 transition flex justify-between items-center gap-4"
                      >
                        <span>{mi.name}</span>
                        <span className="text-charcoal-200 shrink-0">
                          {mi.price.toLocaleString()}원
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={addCustomItemRow}
              className="px-4 py-2 text-sm bg-gray-100 text-charcoal-300 rounded-lg hover:bg-gray-200 transition"
            >
              + 커스텀 상품 추가
            </button>
          </div>
        </Section>

        {/* 수령 정보 */}
        <Section title="수령 정보">
          {/* 수령 방식 */}
          <Field label="수령 방식" required>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                  className="w-4 h-4 text-sage-400 border-gray-300 focus:ring-sage-400"
                />
                <span className="text-sm text-charcoal-300">픽업</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="shipping"
                  checked={deliveryMethod === "shipping"}
                  onChange={() => setDeliveryMethod("shipping")}
                  className="w-4 h-4 text-sage-400 border-gray-300 focus:ring-sage-400"
                />
                <span className="text-sm text-charcoal-300">택배</span>
              </label>
            </div>
          </Field>

          {deliveryMethod === "pickup" && (
            <Field label="픽업 날짜/시간">
              <input
                type="datetime-local"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="input"
              />
            </Field>
          )}

          {deliveryMethod === "shipping" && (
            <>
              <Field label="배송지">
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="input min-h-[80px] resize-y"
                  placeholder="경북 영천시 ..."
                />
              </Field>
              <Field label="배송비 (원)">
                <input
                  type="number"
                  value={shippingFee || ""}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                  className="input w-40"
                  min={0}
                  step={500}
                  placeholder="0"
                />
              </Field>
            </>
          )}
        </Section>

        {/* 메모 */}
        <Section title="메모">
          <Field label="고객 메모" description="고객에게 전달할 메모">
            <textarea
              value={customerMemo}
              onChange={(e) => setCustomerMemo(e.target.value)}
              className="input min-h-[72px] resize-y"
              placeholder="포장 요청 사항 등"
            />
          </Field>
          <Field label="사장님 메모" description="내부 메모 (고객에게 비공개)">
            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              className="input min-h-[72px] resize-y"
              placeholder="내부 메모"
            />
          </Field>
        </Section>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* 하단 총액 + 제출 */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-charcoal-200">총액</p>
            <p className="text-2xl font-bold text-charcoal-400">
              {totalAmount.toLocaleString()}원
            </p>
            {deliveryMethod === "shipping" && shippingFee > 0 && (
              <p className="text-xs text-charcoal-200 mt-0.5">
                배송비 {shippingFee.toLocaleString()}원 포함
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "주문 등록"}
          </button>
        </div>
      </form>

      {/* 결제 링크 모달 */}
      {createdOrder && (
        <PaymentLinkModal
          orderNumber={createdOrder.orderNumber}
          totalAmount={createdOrder.totalAmount}
          onClose={() => setCreatedOrder(null)}
        />
      )}
    </>
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
