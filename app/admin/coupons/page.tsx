"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { CouponTemplate } from "@/data/customer";
import { COUPON_TYPE_LABELS } from "@/data/customer";

export default function AdminCouponsPage() {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons?page=${page}&limit=20`);
      const data = await res.json();
      setTemplates(data.templates ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal-400">쿠폰 관리</h1>
        <Link href="/admin/coupons/new" className="btn-primary text-sm px-4 py-2">
          + 쿠폰 템플릿 생성
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">이름</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">유형</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">할인</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">배포</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">코드</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">발급</th>
              <th className="text-center px-4 py-3 font-medium text-charcoal-200">상태</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">생성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-charcoal-200">
                  로딩 중...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-charcoal-200">
                  등록된 쿠폰 템플릿이 없습니다
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/coupons/${t.id}`}
                      className="text-sage-400 hover:underline font-medium"
                    >
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-charcoal-300">
                    {COUPON_TYPE_LABELS[t.type]}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {t.type === "fixed"
                      ? `${t.value.toLocaleString()}원`
                      : t.type === "percent"
                      ? `${t.value}%`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-charcoal-200 text-xs">
                    {t.distribution === "manual" ? "수동" : t.distribution === "auto" ? "자동" : "코드"}
                  </td>
                  <td className="px-4 py-3 text-charcoal-200 text-xs font-mono">
                    {t.code || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-charcoal-300">
                    {t.issuedCount}{t.maxIssues ? `/${t.maxIssues}` : ""}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        t.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {t.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal-200 text-xs">
                    {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
