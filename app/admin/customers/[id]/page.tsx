"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Customer, PointTransaction, CustomerCoupon } from "@/data/customer";
import { POINT_TYPE_LABELS, COUPON_TYPE_LABELS, COUPON_STATUS_LABELS } from "@/data/customer";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [coupons, setCoupons] = useState<CustomerCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  // 포인트 조정 폼
  const [pointType, setPointType] = useState<"admin_add" | "admin_deduct">("admin_add");
  const [pointAmount, setPointAmount] = useState("");
  const [pointDesc, setPointDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // 쿠폰 발급
  const [templateId, setTemplateId] = useState("");
  const [issuing, setIssuing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const data = await res.json();
      setCustomer(data.customer);
      setTransactions(data.pointTransactions ?? []);
      setCoupons(data.coupons ?? []);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePointAdjust = async () => {
    if (!pointAmount || !pointDesc) return;
    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: pointType,
          amount: Number(pointAmount),
          description: pointDesc,
        }),
      });
      if (res.ok) {
        setPointAmount("");
        setPointDesc("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "포인트 조정 실패");
      }
    } finally {
      setAdjusting(false);
    }
  };

  const handleIssueCoupon = async () => {
    if (!templateId) return;
    setIssuing(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        setTemplateId("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "쿠폰 발급 실패");
      }
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return <div className="text-charcoal-200">로딩 중...</div>;
  }

  if (!customer) {
    return <div className="text-charcoal-200">고객을 찾을 수 없습니다</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/customers" className="text-charcoal-200 hover:text-charcoal-400">
          &larr;
        </Link>
        <h1 className="text-2xl font-bold text-charcoal-400">
          {customer.name || customer.phone}
        </h1>
      </div>

      {/* 고객 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <InfoCard label="전화번호" value={customer.phone} />
        <InfoCard label="포인트 잔액" value={`${customer.pointBalance.toLocaleString()}P`} highlight />
        <InfoCard label="총 주문" value={`${customer.totalOrders}건`} />
        <InfoCard label="총 결제" value={`${customer.totalSpent.toLocaleString()}원`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 포인트 조정 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-charcoal-400 mb-4">포인트 조정</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={pointType}
                onChange={(e) => setPointType(e.target.value as "admin_add" | "admin_deduct")}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="admin_add">지급</option>
                <option value="admin_deduct">차감</option>
              </select>
              <input
                type="number"
                placeholder="포인트"
                value={pointAmount}
                onChange={(e) => setPointAmount(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                min={1}
              />
            </div>
            <input
              type="text"
              placeholder="사유"
              value={pointDesc}
              onChange={(e) => setPointDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handlePointAdjust}
              disabled={adjusting || !pointAmount || !pointDesc}
              className="btn-primary text-sm px-4 py-2 w-full disabled:opacity-50"
            >
              {adjusting ? "처리 중..." : "포인트 조정"}
            </button>
          </div>
        </div>

        {/* 쿠폰 발급 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-charcoal-400 mb-4">쿠폰 발급</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="쿠폰 템플릿 ID"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleIssueCoupon}
              disabled={issuing || !templateId}
              className="btn-primary text-sm px-4 py-2 w-full disabled:opacity-50"
            >
              {issuing ? "발급 중..." : "쿠폰 발급"}
            </button>
          </div>

          {/* 보유 쿠폰 */}
          {coupons.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-charcoal-300">보유 쿠폰</h3>
              {coupons.map((c) => {
                const status = COUPON_STATUS_LABELS[c.status];
                return (
                  <div key={c.id} className="flex justify-between items-center text-xs border border-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-charcoal-400">
                        {c.template?.name ?? c.templateId}
                      </span>
                      {c.template && (
                        <span className="text-charcoal-200 ml-1">
                          ({COUPON_TYPE_LABELS[c.template.type]})
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 포인트 거래 이력 */}
      <div className="bg-white rounded-xl shadow-sm mt-6 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-charcoal-400">포인트 거래 이력</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">일시</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">유형</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">금액</th>
              <th className="text-right px-4 py-3 font-medium text-charcoal-200">잔액</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal-200">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-charcoal-200">
                  거래 이력이 없습니다
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-charcoal-200 text-xs">
                    {new Date(tx.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{POINT_TYPE_LABELS[tx.type]}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    tx.amount > 0 ? "text-sage-400" : "text-red-400"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}P
                  </td>
                  <td className="px-4 py-3 text-right text-charcoal-300">
                    {tx.balanceAfter.toLocaleString()}P
                  </td>
                  <td className="px-4 py-3 text-charcoal-200 text-xs">{tx.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-xs text-charcoal-200 mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-sage-400" : "text-charcoal-400"}`}>
        {value}
      </p>
    </div>
  );
}
