"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentLinkModalProps {
  orderNumber: string;
  totalAmount: number;
  accessToken: string;
  onClose: () => void;
}

export default function PaymentLinkModal({
  orderNumber,
  totalAmount,
  accessToken,
  onClose,
}: PaymentLinkModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const tokenQuery = `?token=${encodeURIComponent(accessToken)}`;
  const paymentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${orderNumber}${tokenQuery}`
      : `/pay/${orderNumber}${tokenQuery}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select input text
    }
  }

  function handleGoToOrders() {
    router.push("/admin/orders");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-charcoal-400">
            주문이 등록되었습니다
          </h2>
        </div>

        {/* 주문 정보 */}
        <div className="bg-cream-100 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-charcoal-200">주문번호</span>
            <span className="font-medium text-charcoal-400 font-mono">
              {orderNumber}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-charcoal-200">결제금액</span>
            <span className="font-bold text-charcoal-400 text-base">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 결제 링크 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal-300">결제 링크</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={paymentUrl}
              readOnly
              className="input flex-1 text-sm font-mono bg-gray-50 text-charcoal-300 select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-sage-400 text-white hover:bg-sage-500"
              }`}
            >
              {copied ? "복사됨!" : "링크 복사"}
            </button>
          </div>
          <p className="text-xs text-charcoal-200">
            이 링크를 고객에게 전달하면 결제 페이지로 이동합니다.
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoToOrders}
            className="flex-1 px-4 py-3 bg-sage-400 text-white font-medium rounded-xl hover:bg-sage-500 transition text-sm"
          >
            주문 목록으로
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-charcoal-300 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm"
          >
            계속 등록
          </button>
        </div>
      </div>
    </div>
  );
}
