"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CouponType, CouponDistribution, AutoTrigger } from "@/data/customer";

export default function AdminCouponNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "fixed" as CouponType,
    value: "",
    minOrderAmount: "0",
    maxDiscount: "",
    validDays: "",
    distribution: "manual" as CouponDistribution,
    code: "",
    autoTrigger: "" as AutoTrigger | "",
    autoTriggerValue: "",
    maxIssues: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.value) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          value: Number(form.value),
          minOrderAmount: Number(form.minOrderAmount) || 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          validDays: form.validDays ? Number(form.validDays) : undefined,
          distribution: form.distribution,
          code: form.distribution === "code" ? form.code : undefined,
          autoTrigger: form.distribution === "auto" ? form.autoTrigger || undefined : undefined,
          autoTriggerValue: form.autoTriggerValue ? Number(form.autoTriggerValue) : undefined,
          maxIssues: form.maxIssues ? Number(form.maxIssues) : undefined,
        }),
      });

      if (res.ok) {
        router.push("/admin/coupons");
      } else {
        const data = await res.json();
        setError(data.error || "쿠폰 생성 실패");
      }
    } catch {
      setError("쿠폰 생성 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/coupons" className="text-charcoal-200 hover:text-charcoal-400">
          &larr;
        </Link>
        <h1 className="text-2xl font-bold text-charcoal-400">쿠폰 템플릿 생성</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-charcoal-300 mb-1">
            쿠폰 이름 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400/20 focus:border-sage-400 outline-none"
            placeholder="예: 첫 주문 10% 할인"
            required
          />
        </div>

        {/* 유형 + 값 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              할인 유형 *
            </label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="fixed">정액 할인 (원)</option>
              <option value="percent">정률 할인 (%)</option>
              <option value="free_shipping">배송비 무료</option>
              <option value="free_item">무료 상품</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              {form.type === "percent" ? "할인율 (%) *" : "할인 금액 (원) *"}
            </label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => update("value", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              min={0}
              required
            />
          </div>
        </div>

        {/* 최소 주문 금액 / 최대 할인 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              최소 주문 금액
            </label>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => update("minOrderAmount", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              min={0}
            />
          </div>
          {form.type === "percent" && (
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                최대 할인 금액
              </label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => update("maxDiscount", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                min={0}
              />
            </div>
          )}
        </div>

        {/* 유효기간 / 발급 한도 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              유효기간 (일)
            </label>
            <input
              type="number"
              value={form.validDays}
              onChange={(e) => update("validDays", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="미입력 시 무제한"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              최대 발급 수
            </label>
            <input
              type="number"
              value={form.maxIssues}
              onChange={(e) => update("maxIssues", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="미입력 시 무제한"
              min={1}
            />
          </div>
        </div>

        {/* 배포 방식 */}
        <div>
          <label className="block text-sm font-medium text-charcoal-300 mb-1">
            배포 방식
          </label>
          <select
            value={form.distribution}
            onChange={(e) => update("distribution", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="manual">수동 발급</option>
            <option value="code">코드 입력</option>
            <option value="auto">자동 발급</option>
          </select>
        </div>

        {form.distribution === "code" && (
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              쿠폰 코드
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="예: WELCOME2026"
            />
          </div>
        )}

        {form.distribution === "auto" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                자동 트리거
              </label>
              <select
                value={form.autoTrigger}
                onChange={(e) => update("autoTrigger", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">선택</option>
                <option value="first_order">첫 주문 완료</option>
                <option value="nth_order">N번째 주문</option>
                <option value="referral">추천</option>
              </select>
            </div>
            {form.autoTrigger === "nth_order" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  N번째
                </label>
                <input
                  type="number"
                  value={form.autoTriggerValue}
                  onChange={(e) => update("autoTriggerValue", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  min={2}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm px-6 py-2 disabled:opacity-50"
          >
            {saving ? "생성 중..." : "쿠폰 생성"}
          </button>
          <Link
            href="/admin/coupons"
            className="px-6 py-2 text-sm text-charcoal-300 hover:text-charcoal-400"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
