"use client";

import { formatPrice } from "@/data/menu";

export interface BenefitsData {
  pointEarnRate: number;
  referralRewardPoints: number;
  firstOrderCoupon: {
    type: "fixed" | "percent" | "free_shipping" | "free_item";
    value: number;
    maxDiscount: number | null;
  } | null;
}

interface BenefitsPreviewProps {
  benefitsData: BenefitsData;
  basePrice: number;
  totalPrice: number;
}

export default function BenefitsPreview({
  benefitsData,
  basePrice,
  totalPrice,
}: BenefitsPreviewProps) {
  const { pointEarnRate, referralRewardPoints, firstOrderCoupon } =
    benefitsData;

  const showPoints = pointEarnRate > 0;
  const showFirstOrder = firstOrderCoupon !== null;
  const showReferral = referralRewardPoints > 0;

  if (!showPoints && !showFirstOrder && !showReferral) return null;

  const earnedPoints = Math.floor(totalPrice * pointEarnRate);

  // 첫주문 쿠폰 할인액 계산
  let firstOrderDiscount = 0;
  let firstOrderLabel = "";
  if (firstOrderCoupon) {
    switch (firstOrderCoupon.type) {
      case "fixed":
        firstOrderDiscount = firstOrderCoupon.value;
        firstOrderLabel = `${formatPrice(firstOrderCoupon.value)} 할인`;
        break;
      case "percent": {
        const pctDiscount = Math.floor(
          basePrice * (firstOrderCoupon.value / 100)
        );
        firstOrderDiscount = firstOrderCoupon.maxDiscount
          ? Math.min(pctDiscount, firstOrderCoupon.maxDiscount)
          : pctDiscount;
        firstOrderLabel = `${firstOrderCoupon.value}% 할인`;
        if (firstOrderCoupon.maxDiscount) {
          firstOrderLabel += ` (최대 ${formatPrice(firstOrderCoupon.maxDiscount)})`;
        }
        break;
      }
      case "free_shipping":
        firstOrderLabel = "무료배송";
        break;
      case "free_item":
        firstOrderLabel = "무료 증정";
        break;
    }
  }

  // 최대 혜택가 (포인트는 현금 할인이 아니므로 제외)
  const maxBenefitPrice = totalPrice - firstOrderDiscount;
  const showMaxBenefit = firstOrderDiscount > 0;

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
      <div className="bg-[#F8FFF0] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-charcoal-400 mb-3">
          🎁 혜택 안내
        </h3>

        <div className="space-y-2 text-sm">
          {showPoints && (
            <div className="flex justify-between items-center">
              <span className="text-charcoal-200">구매 적립</span>
              <span className="font-semibold text-sage-400">
                {earnedPoints.toLocaleString()}P
              </span>
            </div>
          )}

          {showFirstOrder && (
            <div className="flex justify-between items-center">
              <span className="text-charcoal-200">첫 주문 쿠폰</span>
              <span className="font-semibold text-blush-400">
                {firstOrderLabel}
              </span>
            </div>
          )}

          {showReferral && (
            <div className="flex justify-between items-center">
              <span className="text-charcoal-200">친구 추천</span>
              <span className="font-semibold text-sage-400">
                {referralRewardPoints.toLocaleString()}P
              </span>
            </div>
          )}

          {showMaxBenefit && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
              <span className="font-semibold text-charcoal-400">
                최대 혜택가
              </span>
              <span className="font-bold text-blush-400 text-base">
                {formatPrice(Math.max(maxBenefitPrice, 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
