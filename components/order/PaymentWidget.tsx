"use client";

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

interface PaymentWidgetProps {
  amount: number;
  orderNumber: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export default function PaymentWidget({
  amount,
  orderNumber,
  orderName,
  customerName,
  customerEmail,
  customerPhone,
}: PaymentWidgetProps) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<
    PaymentWidgetInstance["renderPaymentMethods"]
  > | null>(null);

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
      const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

      const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
        "#payment-widget",
        { value: amount },
        { variantKey: "DEFAULT" }
      );

      paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

      paymentWidgetRef.current = paymentWidget;
      paymentMethodsWidgetRef.current = paymentMethodsWidget;
      setIsReady(true);
    })();
  }, [customerKey, amount]);

  useEffect(() => {
    const paymentMethodsWidget = paymentMethodsWidgetRef.current;
    if (paymentMethodsWidget == null) return;
    paymentMethodsWidget.updateAmount(amount);
  }, [amount]);

  const handlePayment = async () => {
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget) return;

    setIsRequesting(true);
    setErrorMessage("");

    try {
      await paymentWidget.requestPayment({
        orderId: orderNumber,
        orderName,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerMobilePhone: customerPhone || undefined,
        successUrl: `${window.location.origin}/pay/success?paymentKey={PAYMENT_KEY}&orderId={ORDER_ID}&amount={AMOUNT}`,
        failUrl: `${window.location.origin}/pay/fail?code={ERROR_CODE}&message={ERROR_MESSAGE}`,
      });
      // 토스 측에서 successUrl / failUrl 로 자동 리다이렉트
    } catch (error) {
      console.error(error);
      setIsRequesting(false);
      const tossError = error as { code?: string; message?: string };
      if (tossError.code === "USER_CANCEL") {
        setErrorMessage("결제를 취소하셨습니다.");
      } else {
        setErrorMessage(
          tossError.message || "결제 요청 중 알 수 없는 오류가 발생했습니다."
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
      {/* 주문 요약 헤더 */}
      <div className="mb-6 pb-6 border-b border-warm-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-charcoal-400">{orderName}</h2>
          <p className="text-sm text-charcoal-200 mt-1">
            주문번호: <span className="font-mono text-charcoal-300">{orderNumber}</span>
          </p>
        </div>
        <div className="text-2xl font-bold text-sage-500">
          {amount.toLocaleString()}원
        </div>
      </div>

      {/* 토스 결제 위젯 마운트 영역 */}
      <div id="payment-widget" />
      <div id="agreement" />

      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-500 text-sm font-medium border border-red-100 flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMessage}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={!isReady || isRequesting}
        className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${
          isReady && !isRequesting
            ? "bg-sage-400 hover:bg-sage-500 text-white shadow-md hover:shadow-lg shadow-sage-200/50 hover:-translate-y-0.5"
            : "bg-warm-100 text-charcoal-200 cursor-not-allowed"
        }`}
      >
        {isRequesting
          ? "결제창을 띄우는 중..."
          : isReady
          ? `${amount.toLocaleString()}원 결제하기`
          : "결제 모듈 로딩 중..."}
      </button>
    </div>
  );
}
