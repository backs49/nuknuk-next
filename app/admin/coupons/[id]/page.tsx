"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { CouponTemplate } from "@/data/customer";
import { COUPON_TYPE_LABELS } from "@/data/customer";

export default function AdminCouponEditPage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<CouponTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/coupons/${id}`);
        const data = await res.json();
        setTemplate(data.template);
      } catch {
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleToggleActive = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplate(data.template);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-charcoal-200">로딩 중...</div>;
  if (!template) return <div className="text-charcoal-200">쿠폰을 찾을 수 없습니다</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/coupons" className="text-charcoal-200 hover:text-charcoal-400">
          &larr;
        </Link>
        <h1 className="text-2xl font-bold text-charcoal-400">{template.name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-charcoal-200">유형</p>
            <p className="font-medium text-charcoal-400">{COUPON_TYPE_LABELS[template.type]}</p>
          </div>
          <div>
            <p className="text-charcoal-200">할인</p>
            <p className="font-medium text-charcoal-400">
              {template.type === "fixed"
                ? `${template.value.toLocaleString()}원`
                : template.type === "percent"
                ? `${template.value}%${template.maxDiscount ? ` (최대 ${template.maxDiscount.toLocaleString()}원)` : ""}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-charcoal-200">배포 방식</p>
            <p className="font-medium text-charcoal-400">
              {template.distribution === "manual"
                ? "수동"
                : template.distribution === "code"
                ? `코드 (${template.code})`
                : `자동 (${template.autoTrigger})`}
            </p>
          </div>
          <div>
            <p className="text-charcoal-200">발급 수</p>
            <p className="font-medium text-charcoal-400">
              {template.issuedCount}{template.maxIssues ? `/${template.maxIssues}` : ""}
            </p>
          </div>
          <div>
            <p className="text-charcoal-200">최소 주문</p>
            <p className="font-medium text-charcoal-400">
              {template.minOrderAmount.toLocaleString()}원
            </p>
          </div>
          <div>
            <p className="text-charcoal-200">유효기간</p>
            <p className="font-medium text-charcoal-400">
              {template.validDays ? `${template.validDays}일` : "무제한"}
            </p>
          </div>
        </div>

        <div className="border-t pt-4 flex gap-3">
          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={`text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
              template.isActive
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {saving ? "처리 중..." : template.isActive ? "비활성화" : "활성화"}
          </button>
        </div>

      </div>
    </div>
  );
}
