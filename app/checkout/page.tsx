"use client";

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

export default function CheckoutPage() {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]> | null>(null);
  const price = 30000; // 기본 예약금 3만원
  const [isReady, setIsReady] = useState(false);
  const [customerKey, setCustomerKey] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Generate a secure random customerKey on client mount
    setCustomerKey(Math.random().toString(36).substring(2, 11));
  }, []);

  useEffect(() => {
    if (!customerKey) return;

    (async () => {
      // 결제 위젯 초기화
      const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

      // 결제 위젯 렌더링
      const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
        "#payment-widget",
        { value: price },
        { variantKey: "DEFAULT" }
      );

      // 이용약관 렌더링
      paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

      paymentWidgetRef.current = paymentWidget;
      paymentMethodsWidgetRef.current = paymentMethodsWidget;
      setIsReady(true);
    })();
  }, [customerKey, price]);

  useEffect(() => {
    const paymentMethodsWidget = paymentMethodsWidgetRef.current;
    if (paymentMethodsWidget == null) return;
    // 금액 변경 시 위젯 금액 업데이트
    paymentMethodsWidget.updateAmount(price);
  }, [price]);

  const requestPayment = async () => {
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget) return;

    setIsRequesting(true);
    setErrorMessage("");

    try {
      await paymentWidget.requestPayment({
        orderId: Math.random().toString(36).substring(2, 11),
        orderName: "넉넉 디저트 예약금",
        customerName: "홍길동",
        customerEmail: "customer@nuknuk-dessert.com",
        customerMobilePhone: "01012341234",
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
      // 성공/실패 시 토스 측에서 자동으로 successUrl / failUrl 로 리다이렉트합니다.
    } catch (error) {
      console.error(error);
      setIsRequesting(false);
      const tossError = error as { code?: string; message?: string };
      if (tossError.code === "USER_CANCEL") {
        setErrorMessage("결제를 취소하셨습니다.");
      } else {
        setErrorMessage(tossError.message || "결제 요청 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8 mt-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-charcoal-400">결제하기</h1>
          <p className="text-charcoal-200">안전한 결제 시스템으로 예약을 확정하세요</p>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="mb-6 pb-6 border-b border-warm-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-charcoal-400">넉넉 디저트 예약금</h2>
              <p className="text-sm text-charcoal-200 mt-1">예약 확정을 위한 선결제 (차액은 현장결제)</p>
            </div>
            <div className="text-2xl font-bold text-sage-500">
              {price.toLocaleString()}원
            </div>
          </div>

          <div id="payment-widget" />
          <div id="agreement" />

          {errorMessage && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-500 text-sm font-medium border border-red-100 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {errorMessage}
            </div>
          )}

          <button
            onClick={requestPayment}
            disabled={!isReady || isRequesting}
            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${
              isReady && !isRequesting
                ? "bg-sage-400 hover:bg-sage-500 text-white shadow-md hover:shadow-lg shadow-sage-200/50 hover:-translate-y-0.5" 
                : "bg-warm-100 text-charcoal-200 cursor-not-allowed"
            }`}
          >
            {isRequesting ? "결제창을 띄우는 중..." : isReady ? `${price.toLocaleString()}원 결제하기` : "결제 모듈 로딩 중..."}
          </button>
        </div>
      </div>
    </div>
  );
}
