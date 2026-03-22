"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    async function confirmPayment() {
      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setErrorMessage("결제 정보가 누락되었습니다.");
        return;
      }

      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (response.ok) {
          setStatus("success");
          clearCart();

          // 3초 후 메인 페이지로 자동 이동
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          const data = await response.json();
          setStatus("error");
          setErrorMessage(data?.message || "결제 승인 처리 중 오류가 발생했습니다.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMessage("서버와 통신 중 문제가 발생했습니다.");
      }
    }

    confirmPayment();
  }, [paymentKey, orderId, amount, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-charcoal-300">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-400 rounded-full animate-spin mb-4" />
        <p className="text-lg">안전하게 결제를 승인하고 있습니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-auto text-center shadow-lg border border-red-100">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-3xl mx-auto mb-6">
          <span className="sr-only">에러</span>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </div>
        <h2 className="text-2xl font-display font-bold text-charcoal-400 mb-3">결제 승인 실패</h2>
        <p className="text-charcoal-200 mb-8">{errorMessage}</p>
        <Link href="/" className="btn-primary w-full inline-block text-center text-lg">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-auto text-center shadow-lg border border-sage-100">
      <div className="w-16 h-16 rounded-full bg-sage-50 text-sage-400 flex items-center justify-center text-3xl mx-auto mb-6">
        <span className="sr-only">성공</span>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      </div>
      <h2 className="text-2xl font-display font-bold text-charcoal-400 mb-3">결제 완료</h2>
      <div className="bg-cream-100 rounded-xl p-4 mb-8 text-left text-sm text-charcoal-300">
        <p className="mb-1">
          <span className="font-semibold w-20 inline-block">결제 금액:</span>{" "}
          {Number(amount).toLocaleString()}원
        </p>
        <p className="truncate">
          <span className="font-semibold w-20 inline-block">주문 번호:</span> {orderId}
        </p>
        <p className="mt-3 text-sage-500 font-semibold text-center border-t border-warm-100 pt-3">
          결제가 완료되었습니다! 3초 후 메인으로 돌아갑니다.
        </p>
      </div>
      <Link href="/" className="btn-primary w-full inline-block text-center text-lg">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default function PaySuccessPage() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-charcoal-300">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
