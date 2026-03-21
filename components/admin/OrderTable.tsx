"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Order,
  OrderStatus,
  OrderChannel,
  ORDER_STATUS_MAP,
  CHANNEL_LABEL,
  formatOrderPrice,
} from "@/data/order";

const CHANNEL_TABS: { value: "all" | OrderChannel; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "direct", label: CHANNEL_LABEL.direct },
  { value: "link", label: CHANNEL_LABEL.link },
];

const STATUS_OPTIONS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "paid", label: "결제완료" },
  { value: "confirmed", label: "확정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소·환불" },
];

const LIMIT = 20;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function summarizeItems(items: Order["items"]): string {
  if (!items || items.length === 0) return "-";
  if (items.length === 1) return `${items[0].name} × ${items[0].quantity}`;
  return `${items[0].name} 외 ${items.length - 1}건`;
}

export default function OrderTable() {
  const router = useRouter();

  const [channel, setChannel] = useState<"all" | OrderChannel>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [channel, status]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        channel,
        status,
        search: debouncedSearch,
        page: String(page),
        limit: String(LIMIT),
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data: { orders: Order[]; total: number } = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [channel, status, debouncedSearch, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      {/* 채널 탭 */}
      <div className="flex gap-2 mb-4">
        {CHANNEL_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setChannel(tab.value)}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              channel === tab.value
                ? "bg-charcoal-400 text-white"
                : "bg-white text-charcoal-200 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 필터 및 검색 */}
      <div className="flex gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | OrderStatus)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-charcoal-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="주문번호 / 고객명 / 연락처 검색"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-charcoal-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 placeholder:text-charcoal-100"
        />
      </div>

      {/* 테이블 */}
      {loading ? (
        <p className="text-charcoal-200">로딩 중...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  주문번호
                </th>
                <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  고객명
                </th>
                <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  상품요약
                </th>
                <th className="text-right text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  금액
                </th>
                <th className="text-center text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  상태
                </th>
                <th className="text-center text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  수령방식
                </th>
                <th className="text-right text-xs font-medium text-charcoal-200 uppercase tracking-wider px-6 py-4">
                  주문일
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = ORDER_STATUS_MAP[order.status];
                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-charcoal-400">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-charcoal-400">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-charcoal-100">
                        {order.customerPhone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-charcoal-300">
                        {summarizeItems(order.items)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-charcoal-400">
                        {formatOrderPrice(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-charcoal-300">
                        {order.deliveryMethod === "pickup" ? "픽업" : "택배"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-charcoal-200">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-charcoal-200">
              주문이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-charcoal-200">
            총 {total}건 · {page} / {totalPages} 페이지
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-charcoal-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-charcoal-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
