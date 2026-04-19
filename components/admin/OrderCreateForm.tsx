"use client";

import { useState, useEffect } from "react";
import PaymentLinkModal from "./PaymentLinkModal";
import type { OptionGroup, SelectedOption } from "@/lib/option-utils";
import { calculateOptionPrice } from "@/lib/option-utils";

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
  selectedOptions?: SelectedOption[];
  optionGroups?: OptionGroup[];
  optionsOpen?: boolean;
  priceOverridden?: boolean;
}

interface CreatedOrder {
  orderNumber: string;
  totalAmount: number;
  accessToken: string;
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

  async function addMenuItemRow(item: DbMenuItem) {
    setMenuSelectOpen(false);

    // 옵션 그룹 조회
    let optionGroups: OptionGroup[] = [];
    try {
      const res = await fetch(`/api/admin/menu/${item.id}/options`);
      const data = await res.json();
      optionGroups = data.options || [];
    } catch {
      // 옵션 조회 실패 시 옵션 없이 진행
    }

    setItems((prev) => [
      ...prev,
      {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.price,
        selectedOptions: [],
        optionGroups,
        optionsOpen: optionGroups.length > 0,
        priceOverridden: false,
      },
    ]);
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
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        // 사장님이 단가를 직접 수정하면 자동계산 해제
        if (field === "unitPrice") {
          updated.priceOverridden = true;
        }
        return updated;
      })
    );
  }

  function handleOptionSelect(itemIndex: number, group: OptionGroup, optionItemId: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const current = item.selectedOptions || [];
        let newSelected: SelectedOption[];

        if (group.type === "single") {
          // 단일: 이미 선택된 항목 클릭 시 선택 해제, 아니면 교체
          const alreadySelected = current.find(
            (s) => s.groupId === group.id && s.itemId === optionItemId
          );
          if (alreadySelected) {
            newSelected = current.filter((s) => s.groupId !== group.id);
          } else {
            const optItem = group.items.find((oi) => oi.id === optionItemId);
            if (!optItem) return item;
            newSelected = [
              ...current.filter((s) => s.groupId !== group.id),
              {
                groupId: group.id,
                itemId: optItem.id,
                groupName: group.name,
                itemName: optItem.name,
                price: optItem.price,
                priceMode: group.priceMode,
              },
            ];
          }
        } else {
          // 복수: 토글
          const existing = current.find(
            (s) => s.groupId === group.id && s.itemId === optionItemId
          );
          if (existing) {
            newSelected = current.filter(
              (s) => !(s.groupId === group.id && s.itemId === optionItemId)
            );
          } else {
            const optItem = group.items.find((oi) => oi.id === optionItemId);
            if (!optItem) return item;
            newSelected = [
              ...current,
              {
                groupId: group.id,
                itemId: optItem.id,
                groupName: group.name,
                itemName: optItem.name,
                price: optItem.price,
                priceMode: group.priceMode,
              },
            ];
          }
        }

        // 자동계산 (사장님이 수동 수정하지 않은 경우)
        const basePrice = menuItems.find((m) => m.id === item.menuItemId)?.price ?? item.unitPrice;
        const autoPrice = calculateOptionPrice(basePrice, newSelected);

        return {
          ...item,
          selectedOptions: newSelected,
          unitPrice: item.priceOverridden ? item.unitPrice : autoPrice,
        };
      })
    );
  }

  function toggleOptions(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, optionsOpen: !item.optionsOpen } : item
      )
    );
  }

  function resetPriceToAuto(index: number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const basePrice = menuItems.find((m) => m.id === item.menuItemId)?.price ?? 0;
        const autoPrice = calculateOptionPrice(basePrice, item.selectedOptions || []);
        return { ...item, unitPrice: autoPrice, priceOverridden: false };
      })
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
          ...(item.selectedOptions && item.selectedOptions.length > 0
            ? { selectedOptions: item.selectedOptions }
            : {}),
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
        accessToken: data.order.accessToken,
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
                <div key={index}>
                  {/* 메인 행 */}
                  <div className="grid grid-cols-[1fr_100px_88px_72px_32px] gap-2 items-center">
                    <div className="flex items-center gap-1">
                      {item.optionGroups && item.optionGroups.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleOptions(index)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-charcoal-200 hover:text-sage-400 transition"
                          title="옵션 선택"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${item.optionsOpen ? "rotate-90" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        className="input text-sm w-full"
                        placeholder="상품명"
                        required
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", Number(e.target.value))
                        }
                        className={`input text-sm ${item.priceOverridden ? "ring-1 ring-amber-300" : ""}`}
                        min={0}
                        step={500}
                        placeholder="0"
                        required
                      />
                      {item.priceOverridden && (
                        <button
                          type="button"
                          onClick={() => resetPriceToAuto(index)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white rounded-full text-[8px] flex items-center justify-center hover:bg-amber-500"
                          title="자동 계산으로 되돌리기"
                        >
                          ↺
                        </button>
                      )}
                    </div>
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

                  {/* 옵션 선택 영역 */}
                  {item.optionsOpen && item.optionGroups && item.optionGroups.length > 0 && (
                    <div className="ml-7 mt-2 mb-1 p-3 bg-cream-100 rounded-lg space-y-3">
                      {/* 선택된 옵션 요약 */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.selectedOptions.map((opt) => (
                            <span
                              key={`${opt.groupId}-${opt.itemId}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-sage-400/10 text-sage-400 text-xs rounded-full"
                            >
                              {opt.itemName}
                              {opt.priceMode === "fixed"
                                ? ` (${opt.price.toLocaleString()}원)`
                                : opt.price > 0
                                  ? ` (+${opt.price.toLocaleString()}원)`
                                  : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.optionGroups
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((group) => {
                          const selectedIds = (item.selectedOptions || [])
                            .filter((s) => s.groupId === group.id)
                            .map((s) => s.itemId);

                          return (
                            <div key={group.id}>
                              <p className="text-xs font-medium text-charcoal-300 mb-1.5">
                                {group.name}
                                {group.required && (
                                  <span className="ml-1 text-blush-400">*</span>
                                )}
                                <span className="ml-1 text-charcoal-100 font-normal">
                                  ({group.type === "single" ? "택1" : "복수"} ·{" "}
                                  {group.priceMode === "fixed" ? "고정가" : "추가금"})
                                </span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.items
                                  .sort((a, b) => a.sortOrder - b.sortOrder)
                                  .map((optItem) => {
                                    const isSelected = selectedIds.includes(optItem.id);
                                    return (
                                      <button
                                        key={optItem.id}
                                        type="button"
                                        onClick={() => handleOptionSelect(index, group, optItem.id)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                          isSelected
                                            ? "border-sage-400 bg-sage-400/10 text-sage-400 font-medium"
                                            : "border-gray-200 text-charcoal-300 hover:border-gray-300"
                                        }`}
                                      >
                                        {optItem.name}
                                        <span className="ml-1 text-charcoal-200">
                                          {group.priceMode === "fixed"
                                            ? `${optItem.price.toLocaleString()}원`
                                            : optItem.price === 0
                                              ? "+0원"
                                              : `+${optItem.price.toLocaleString()}원`}
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                      {item.priceOverridden && (
                        <p className="text-[10px] text-amber-500">
                          단가가 수동 수정됨 — 옵션 선택이 단가에 반영되지 않습니다
                        </p>
                      )}
                    </div>
                  )}
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
          accessToken={createdOrder.accessToken}
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
