"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Customer } from "@/data/customer";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal-400">고객 관리</h1>
        <span className="text-sm text-charcoal-200">총 {total}명</span>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="이름 또는 전화번호로 검색"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-sage-400/20 focus:border-sage-400 outline-none"
        />
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">이름</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">전화번호</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">포인트</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">주문 수</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">총 결제</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">추천코드</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-charcoal-200">
                  로딩 중...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-charcoal-200">
                  {search ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="text-sage-400 hover:underline font-medium"
                    >
                      {c.name || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-charcoal-300">{c.phone}</td>
                  <td className="px-4 py-3 text-right font-medium text-sage-400">
                    {c.pointBalance.toLocaleString()}P
                  </td>
                  <td className="px-4 py-3 text-right text-charcoal-300">
                    {c.totalOrders}
                  </td>
                  <td className="px-4 py-3 text-right text-charcoal-300">
                    {c.totalSpent.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-charcoal-200 text-xs font-mono">
                    {c.referralCode || "-"}
                  </td>
                  <td className="px-4 py-3 text-charcoal-200 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${
                p === page
                  ? "bg-sage-400 text-white"
                  : "bg-white text-charcoal-300 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
