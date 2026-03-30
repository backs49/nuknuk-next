"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Order,
  OrderStatus,
  ORDER_STATUS_MAP,
  CHANNEL_LABEL,
  formatOrderPrice,
} from "@/data/order";

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminMemo, setAdminMemo] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("주문을 찾을 수 없습니다");
        return res.json();
      })
      .then((data: { order: Order }) => {
        setOrder(data.order);
        setAdminMemo(data.order.adminMemo || "");
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleMemoSave() {
    if (!order) return;
    setMemoSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminMemo }),
      });
      if (!res.ok) throw new Error("저장 실패");
      const data = await res.json();
      setOrder(data.order);
      setMemoSaved(true);
      setTimeout(() => setMemoSaved(false), 2000);
    } catch {
      alert("메모 저장에 실패했습니다.");
    } finally {
      setMemoSaving(false);
    }
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return;
    const statusLabel = ORDER_STATUS_MAP[newStatus].label;
    const confirmed = window.confirm(
      `주문 상태를 "${statusLabel}"(으)로 변경하시겠습니까?`
    );
    if (!confirmed) return;

    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      const data = await res.json();
      setOrder(data.order);
    } catch {
      alert("상태 변경에 실패했습니다.");
    } finally {
      setStatusUpdating(false);
    }
  }

  function handleCopyLink() {
    if (!order?.paymentKey) return;
    navigator.clipboard.writeText(order.paymentKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return <p className="text-charcoal-200">로딩 중...</p>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "주문을 찾을 수 없습니다"}</p>
        <Link href="/admin/orders" className="text-sm text-sage-400 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status];
  const subtotal = order.totalAmount - order.shippingFee;

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-charcoal-200 hover:text-sage-400 transition-colors"
      >
        ← 주문 목록으로
      </Link>

      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-charcoal-400">
          주문 #{order.orderNumber}
        </h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-warm-100 text-charcoal-300">
          {CHANNEL_LABEL[order.channel]}
        </span>
      </div>

      {/* 고객 정보 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal-400 mb-4">고객 정보</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-charcoal-200 mb-0.5">고객명</dt>
            <dd className="text-charcoal-400 font-medium">{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-charcoal-200 mb-0.5">연락처</dt>
            <dd className="text-charcoal-400 font-medium">{order.customerPhone}</dd>
          </div>
          {order.customerEmail && (
            <div>
              <dt className="text-charcoal-200 mb-0.5">이메일</dt>
              <dd className="text-charcoal-400 font-medium">{order.customerEmail}</dd>
            </div>
          )}
          {order.customerMemo && (
            <div className="sm:col-span-2">
              <dt className="text-charcoal-200 mb-0.5">고객 메모</dt>
              <dd className="text-charcoal-400 bg-cream-50 rounded-lg p-3">
                {order.customerMemo}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 상품 내역 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal-400 mb-4">상품 내역</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100">
                <th className="text-left py-2 text-charcoal-200 font-medium">상품명</th>
                <th className="text-center py-2 text-charcoal-200 font-medium w-16">수량</th>
                <th className="text-right py-2 text-charcoal-200 font-medium w-28">단가</th>
                <th className="text-right py-2 text-charcoal-200 font-medium w-28">소계</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-warm-50">
                  <td className="py-3 text-charcoal-400">
                    {item.name}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedOptions.map((opt) => (
                            <span key={opt.itemId} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">
                              {opt.itemName}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.selectedOptions.map((o) =>
                            o.priceMode === "fixed"
                              ? `${o.groupName}: ${o.itemName} (${o.price.toLocaleString()}원)`
                              : `${o.groupName}: ${o.itemName} (+${o.price.toLocaleString()}원)`
                          ).join(" · ")}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="py-3 text-center text-charcoal-300">{item.quantity}</td>
                  <td className="py-3 text-right text-charcoal-300">
                    {formatOrderPrice(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right text-charcoal-400 font-medium">
                    {formatOrderPrice(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-warm-100">
                <td colSpan={3} className="pt-3 text-right text-charcoal-200 text-sm">
                  상품 합계
                </td>
                <td className="pt-3 text-right text-charcoal-400">
                  {formatOrderPrice(subtotal)}
                </td>
              </tr>
              {order.shippingFee > 0 && (
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-charcoal-200 text-sm">
                    배송비
                  </td>
                  <td className="pt-1 text-right text-charcoal-400">
                    {formatOrderPrice(order.shippingFee)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="pt-2 text-right font-semibold text-charcoal-400">
                  총액
                </td>
                <td className="pt-2 text-right font-bold text-sage-400 text-base">
                  {formatOrderPrice(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 결제 정보 */}
      {order.paidAt && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-charcoal-400 mb-4">결제 정보</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {order.paymentMethod && (
              <div>
                <dt className="text-charcoal-200 mb-0.5">결제수단</dt>
                <dd className="text-charcoal-400 font-medium">{order.paymentMethod}</dd>
              </div>
            )}
            <div>
              <dt className="text-charcoal-200 mb-0.5">결제일시</dt>
              <dd className="text-charcoal-400 font-medium">
                {new Date(order.paidAt).toLocaleString("ko-KR")}
              </dd>
            </div>
            {order.channel === "link" && order.paymentKey && (
              <div className="sm:col-span-2">
                <dt className="text-charcoal-200 mb-0.5">결제 링크 URL</dt>
                <dd className="flex items-center gap-2">
                  <span className="text-charcoal-300 text-xs bg-cream-50 rounded px-3 py-2 flex-1 truncate">
                    {order.paymentKey}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 text-xs bg-sage-400 text-white rounded-lg hover:bg-sage-500 transition-colors whitespace-nowrap"
                  >
                    {copied ? "복사됨!" : "복사"}
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* 수령 정보 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal-400 mb-4">수령 정보</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-charcoal-200 mb-0.5">수령 방식</dt>
            <dd className="text-charcoal-400 font-medium">
              {order.deliveryMethod === "pickup" ? "픽업" : "택배"}
            </dd>
          </div>
          {order.deliveryMethod === "pickup" && order.pickupDate && (
            <div>
              <dt className="text-charcoal-200 mb-0.5">픽업일시</dt>
              <dd className="text-charcoal-400 font-medium">
                {new Date(order.pickupDate).toLocaleString("ko-KR")}
              </dd>
            </div>
          )}
          {order.deliveryMethod === "shipping" && order.deliveryAddress && (
            <div className="sm:col-span-2">
              <dt className="text-charcoal-200 mb-0.5">배송지</dt>
              <dd className="text-charcoal-400 font-medium">{order.deliveryAddress}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 사장님 메모 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal-400 mb-4">사장님 메모</h2>
        <textarea
          value={adminMemo}
          onChange={(e) => setAdminMemo(e.target.value)}
          rows={4}
          placeholder="내부용 메모를 입력하세요..."
          className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm text-charcoal-400 placeholder-charcoal-100 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleMemoSave}
            disabled={memoSaving}
            className="px-4 py-2 bg-sage-400 text-white text-sm font-medium rounded-lg hover:bg-sage-500 disabled:opacity-50 transition-colors"
          >
            {memoSaving ? "저장 중..." : "저장"}
          </button>
          {memoSaved && (
            <span className="text-sm text-green-600">저장되었습니다.</span>
          )}
        </div>
      </div>

      {/* 상태 관리 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal-400 mb-4">상태 관리</h2>
        <div className="flex flex-wrap gap-3">
          {order.status === "paid" && (
            <button
              onClick={() => handleStatusChange("confirmed")}
              disabled={statusUpdating}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              주문 확정
            </button>
          )}
          {order.status === "confirmed" && (
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={statusUpdating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              완료 처리
            </button>
          )}
          {(order.status === "paid" || order.status === "confirmed") && (
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={statusUpdating}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              주문 취소
            </button>
          )}
          {order.status === "completed" && (
            <button
              onClick={() => handleStatusChange("refunded")}
              disabled={statusUpdating}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              환불 처리
            </button>
          )}
          {order.status === "pending" && (
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={statusUpdating}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              주문 취소
            </button>
          )}
          {(order.status === "cancelled" || order.status === "refunded") && (
            <p className="text-sm text-charcoal-200">
              이 주문은 더 이상 상태 변경이 불가합니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
