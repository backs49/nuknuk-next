"use client";

import { useState, useCallback } from "react";
import type { CustomerCoupon, CouponTemplate } from "@/data/customer";
import { COUPON_TYPE_LABELS } from "@/data/customer";
import { formatPrice } from "@/data/menu";

export interface DiscountData {
  couponDiscount: number;
  pointUsed: number;
  couponId?: string;
  couponCode?: string;
  referralCode?: string;
}

interface CouponPointSectionProps {
  totalAmount: number;
  shippingFee: number;
  customerPhone: string;
  onDiscountChange: (data: DiscountData) => void;
}

interface LookupResult {
  customer: {
    pointBalance: number;
    referralCode: string | null;
    canUseReferralCode: boolean;
  } | null;
  coupons: CustomerCoupon[];
  pointBalance: number;
}

export default function CouponPointSection({
  totalAmount,
  shippingFee,
  customerPhone,
  onDiscountChange,
}: CouponPointSectionProps) {
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  // 쿠폰 선택
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [selectedCouponDiscount, setSelectedCouponDiscount] = useState(0);

  // 코드 쿠폰
  const [couponCode, setCouponCode] = useState("");
  const [codeTemplate, setCodeTemplate] = useState<CouponTemplate | null>(null);
  const [codeDiscount, setCodeDiscount] = useState(0);
  const [codeError, setCodeError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // 포인트
  const [pointInput, setPointInput] = useState("");

  // 추천 코드
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  const pointUsed = Math.max(0, Number(pointInput) || 0);
  const couponDiscount = codeTemplate ? codeDiscount : selectedCouponDiscount;

  const emitChange = useCallback(
    (overrides?: Partial<DiscountData>) => {
      const pUsed = overrides?.pointUsed ?? pointUsed;
      const cDiscount = overrides?.couponDiscount ?? couponDiscount;
      onDiscountChange({
        couponDiscount: cDiscount,
        pointUsed: pUsed,
        couponId: overrides?.couponId ?? (codeTemplate ? undefined : selectedCouponId ?? undefined),
        couponCode: overrides?.couponCode ?? (codeTemplate ? couponCode : undefined),
        referralCode: referralCode || undefined,
      });
    },
    [pointUsed, couponDiscount, selectedCouponId, couponCode, codeTemplate, referralCode, onDiscountChange]
  );

  // 혜택 조회
  const handleLookup = async () => {
    if (!customerPhone || customerPhone.replace(/\D/g, "").length < 10) return;
    setIsLooking(true);
    try {
      const res = await fetch(
        `/api/customers/lookup?phone=${encodeURIComponent(customerPhone)}`
      );
      const data = await res.json();
      setLookupResult(data);
      setLookupDone(true);
    } catch {
      setLookupResult(null);
    } finally {
      setIsLooking(false);
    }
  };

  // 보유 쿠폰 선택
  const handleSelectCoupon = (coupon: CustomerCoupon) => {
    if (!coupon.template) return;
    const disc = calcDiscount(coupon.template);
    setSelectedCouponId(coupon.id);
    setSelectedCouponDiscount(disc);
    // 코드 쿠폰 해제
    setCodeTemplate(null);
    setCouponCode("");
    setCodeDiscount(0);
    setCodeError("");

    onDiscountChange({
      couponDiscount: disc,
      pointUsed,
      couponId: coupon.id,
      referralCode: referralCode || undefined,
    });
  };

  const handleDeselectCoupon = () => {
    setSelectedCouponId(null);
    setSelectedCouponDiscount(0);
    onDiscountChange({
      couponDiscount: 0,
      pointUsed,
      referralCode: referralCode || undefined,
    });
  };

  // 코드 쿠폰 적용
  const handleValidateCode = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    setCodeError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, totalAmount, shippingFee }),
      });
      const data = await res.json();
      if (data.valid) {
        setCodeTemplate(data.template);
        setCodeDiscount(data.discount);
        // 보유 쿠폰 해제
        setSelectedCouponId(null);
        setSelectedCouponDiscount(0);
        onDiscountChange({
          couponDiscount: data.discount,
          pointUsed,
          couponCode,
            referralCode: referralCode || undefined,
        });
      } else {
        setCodeError(data.reason || "유효하지 않은 쿠폰입니다");
        setCodeTemplate(null);
        setCodeDiscount(0);
      }
    } catch {
      setCodeError("쿠폰 검증에 실패했습니다");
    } finally {
      setIsValidating(false);
    }
  };

  // 포인트 입력 변경
  const handlePointChange = (value: string) => {
    setPointInput(value);
    const p = Math.max(0, Number(value) || 0);
    const maxPoint = Math.min(
      lookupResult?.pointBalance ?? 0,
      totalAmount + shippingFee - couponDiscount
    );
    const clamped = Math.min(p, maxPoint);
    if (clamped !== p) setPointInput(String(clamped));
    onDiscountChange({
      couponDiscount,
      pointUsed: clamped,
      couponId: codeTemplate ? undefined : selectedCouponId ?? undefined,
      couponCode: codeTemplate ? couponCode : undefined,
      referralCode: referralCode || undefined,
    });
  };

  const handleUseAllPoints = () => {
    const max = Math.min(
      lookupResult?.pointBalance ?? 0,
      totalAmount + shippingFee - couponDiscount
    );
    setPointInput(String(max));
    onDiscountChange({
      couponDiscount,
      pointUsed: max,
      couponId: codeTemplate ? undefined : selectedCouponId ?? undefined,
      couponCode: codeTemplate ? couponCode : undefined,
      referralCode: referralCode || undefined,
    });
  };

  function calcDiscount(template: CouponTemplate): number {
    switch (template.type) {
      case "fixed":
        return Math.min(template.value, totalAmount);
      case "percent": {
        const d = Math.floor((totalAmount * template.value) / 100);
        return template.maxDiscount ? Math.min(d, template.maxDiscount) : d;
      }
      case "free_shipping":
        return shippingFee;
      default:
        return 0;
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-5">
      <h2 className="text-lg font-semibold text-charcoal-400">할인 혜택</h2>

      {/* 혜택 조회 */}
      {!lookupDone && (
        <div className="space-y-2">
          <p className="text-sm text-charcoal-200">
            전화번호를 입력하시면 보유 쿠폰과 포인트를 확인할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={handleLookup}
            disabled={isLooking || !customerPhone}
            className="text-sm font-medium text-sage-400 hover:text-sage-500 disabled:text-charcoal-100 transition"
          >
            {isLooking ? "조회 중..." : "혜택 조회"}
          </button>
        </div>
      )}

      {/* 조회 결과 */}
      {lookupDone && lookupResult?.customer && (
        <div className="space-y-4">
          {/* 포인트 잔액 */}
          <div className="flex items-center justify-between bg-sage-400/5 rounded-lg px-4 py-3">
            <span className="text-sm text-charcoal-300">보유 포인트</span>
            <span className="font-bold text-sage-400">
              {lookupResult.pointBalance.toLocaleString()}P
            </span>
          </div>

          {/* 내 추천 코드 */}
          {lookupResult.customer.referralCode && (
            <div className="flex items-center justify-between bg-warm-200/20 rounded-lg px-4 py-3">
              <span className="text-sm text-charcoal-300">내 추천 코드</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-charcoal-400 font-mono">
                  {lookupResult.customer.referralCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lookupResult.customer!.referralCode!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs text-sage-400 hover:text-sage-500 transition"
                >
                  {copied ? "복사됨!" : "복사"}
                </button>
              </div>
            </div>
          )}

          {/* 보유 쿠폰 */}
          {lookupResult.coupons.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-charcoal-300">보유 쿠폰</p>
              {lookupResult.coupons.map((coupon) => (
                <label
                  key={coupon.id}
                  className={`block border-2 rounded-lg p-3 cursor-pointer transition ${
                    selectedCouponId === coupon.id
                      ? "border-sage-400 bg-sage-400/5"
                      : "border-gray-100 hover:border-warm-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="coupon"
                    className="sr-only"
                    checked={selectedCouponId === coupon.id}
                    onChange={() =>
                      selectedCouponId === coupon.id
                        ? handleDeselectCoupon()
                        : handleSelectCoupon(coupon)
                    }
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-charcoal-400">
                        {coupon.template?.name}
                      </p>
                      <p className="text-xs text-charcoal-200">
                        {coupon.template
                          ? COUPON_TYPE_LABELS[coupon.template.type]
                          : ""}
                        {coupon.template?.type === "fixed" &&
                          ` ${coupon.template.value.toLocaleString()}원`}
                        {coupon.template?.type === "percent" &&
                          ` ${coupon.template.value}%`}
                        {coupon.expiresAt &&
                          ` · ~${new Date(coupon.expiresAt).toLocaleDateString("ko-KR")}`}
                      </p>
                    </div>
                    {selectedCouponId === coupon.id && (
                      <span className="text-sm font-bold text-sage-400">
                        -{formatPrice(selectedCouponDiscount)}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* 포인트 사용 */}
          {lookupResult.pointBalance > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-charcoal-300">포인트 사용</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={pointInput}
                  onChange={(e) => handlePointChange(e.target.value)}
                  className="input flex-1"
                  placeholder="사용할 포인트"
                  min={0}
                  max={lookupResult.pointBalance}
                />
                <button
                  type="button"
                  onClick={handleUseAllPoints}
                  className="px-3 py-2 text-xs font-medium text-sage-400 border border-sage-400 rounded-lg hover:bg-sage-400/5 transition shrink-0"
                >
                  전액 사용
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {lookupDone && !lookupResult?.customer && (
        <div className="space-y-3">
          <p className="text-sm text-charcoal-200">
            등록된 혜택이 없습니다. 첫 주문 시 자동으로 적립됩니다.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-charcoal-300">추천 코드 (선택)</p>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
              }}
              onBlur={() => emitChange()}
              className="input"
              placeholder="추천 코드 입력 (예: NUK-A1B2)"
            />
            <p className="text-xs text-charcoal-200">
              지인에게 받은 추천 코드가 있다면 입력해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 쿠폰 코드 입력 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-charcoal-300">쿠폰 코드</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="input flex-1"
            placeholder="쿠폰 코드 입력"
            disabled={!!codeTemplate}
          />
          {codeTemplate ? (
            <button
              type="button"
              onClick={() => {
                setCodeTemplate(null);
                setCouponCode("");
                setCodeDiscount(0);
                emitChange({ couponDiscount: selectedCouponDiscount, couponCode: undefined });
              }}
              className="px-3 py-2 text-xs font-medium text-red-400 border border-red-300 rounded-lg hover:bg-red-50 transition shrink-0"
            >
              취소
            </button>
          ) : (
            <button
              type="button"
              onClick={handleValidateCode}
              disabled={isValidating || !couponCode.trim()}
              className="px-3 py-2 text-xs font-medium text-sage-400 border border-sage-400 rounded-lg hover:bg-sage-400/5 transition shrink-0 disabled:opacity-50"
            >
              {isValidating ? "확인 중..." : "적용"}
            </button>
          )}
        </div>
        {codeError && (
          <p className="text-xs text-red-400">{codeError}</p>
        )}
        {codeTemplate && (
          <p className="text-xs text-sage-400">
            {codeTemplate.name} 적용 (-{formatPrice(codeDiscount)})
          </p>
        )}
      </div>

      {/* 추천 코드 — 추천인 미등록 + 첫 주문인 고객에게만 표시 */}
      {lookupDone &&
        lookupResult?.customer &&
        lookupResult.customer.canUseReferralCode && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal-300">추천 코드 (선택)</p>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value.toUpperCase());
            }}
            onBlur={() => emitChange()}
            className="input"
            placeholder="추천 코드 입력 (예: NUK-A1B2)"
          />
          <p className="text-xs text-charcoal-200">
            지인에게 받은 추천 코드가 있다면 입력해주세요. 첫 주문 시에만 사용 가능합니다.
          </p>
        </div>
      )}

      {/* 할인 요약 */}
      {(couponDiscount > 0 || pointUsed > 0) && (
        <div className="border-t border-warm-100 pt-3 space-y-1">
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-charcoal-200">쿠폰 할인</span>
              <span className="text-red-400 font-medium">
                -{formatPrice(couponDiscount)}
              </span>
            </div>
          )}
          {pointUsed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-charcoal-200">포인트 사용</span>
              <span className="text-red-400 font-medium">
                -{formatPrice(pointUsed)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
