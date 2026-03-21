"use client";

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import Link from "next/link";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  orderNumber: string;
  totalAmount: number;
  items: OrderItem[];
  customerName: string;
  status: string;
  channel?: string;
  shippingFee?: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  confirmed: "주문 확정",
  cancelled: "취소됨",
  refunded: "환불됨",
};

type PageState =
  | { type: "loading" }
  | { type: "not_found" }
  | { type: "expired" }
  | { type: "already_processed"; order: Order }
  | { type: "ready"; order: Order };

export default function PayOrderPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const { orderNumber } = params;
  const [pageState, setPageState] = useState<PageState>({ type: "loading" });

  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerKey] = useState(() => Math.random().toString(36).substring(2, 11));

  // Fetch order
  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (res.status === 404) {
          setPageState({ type: "not_found" });
          return;
        }
        if (res.status === 410) {
          setPageState({ type: "expired" });
          return;
        }
        if (!res.ok) {
          setPageState({ type: "not_found" });
          return;
        }
        const data = await res.json();
        const order: Order = data.order;
        if (order.status !== "pending") {
          setPageState({ type: "already_processed", order });
        } else {
          setPageState({ type: "ready", order });
        }
      } catch {
        setPageState({ type: "not_found" });
      }
    }
    fetchOrder();
  }, [orderNumber]);

  // Initialize Toss payment widget when order is ready
  useEffect(() => {
    if (pageState.type !== "ready") return;
    const order = pageState.order;

    (async () => {
      const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

      const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
        "#payment-widget",
        { value: order.totalAmount },
        { variantKey: "DEFAULT" }
      );

      paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

      paymentWidgetRef.current = paymentWidget;
      paymentMethodsWidgetRef.current = paymentMethodsWidget;
      setIsReady(true);
    })();
  }, [pageState, customerKey]);

  const requestPayment = async () => {
    if (pageState.type !== "ready") return;
    const order = pageState.order;
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget) return;

    setIsRequesting(true);
    setErrorMessage("");

    const firstItemName = order.items?.[0]?.name ?? "넉넉 디저트 주문";

    try {
      await paymentWidget.requestPayment({
        orderId: order.orderNumber,
        orderName: firstItemName,
        customerName: order.customerName,
        successUrl: `${window.location.origin}/pay/success`,
        failUrl: `${window.location.origin}/pay/fail`,
      });
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

  // Loading state
  if (pageState.type === "loading") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-charcoal-300">
          <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-400 rounded-full animate-spin" />
          <p>주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (pageState.type === "not_found") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-warm-100">
          <div className="w-16 h-16 rounded-full bg-warm-100 text-charcoal-200 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-charcoal-400 mb-3">주문을 찾을 수 없습니다</h2>
          <p className="text-charcoal-200 mb-8">입력하신 주문 번호를 다시 확인해 주세요.</p>
          <Link href="/" className="btn-primary w-full inline-block text-center text-lg">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Expired state
  if (pageState.type === "expired") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-warm-100">
          <div className="w-16 h-16 rounded-full bg-warm-100 text-charcoal-200 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-charcoal-400 mb-3">결제 링크가 만료되었습니다</h2>
          <p className="text-charcoal-200 mb-8">이 결제 링크는 더 이상 유효하지 않습니다. 새로운 주문을 진행해 주세요.</p>
          <Link href="/" className="btn-primary w-full inline-block text-center text-lg">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Already processed state
  if (pageState.type === "already_processed") {
    const { order } = pageState;
    const statusLabel = STATUS_LABELS[order.status] ?? order.status;
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-warm-100">
          <div className="w-16 h-16 rounded-full bg-sage-50 text-sage-400 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-charcoal-400 mb-3">이미 처리된 주문입니다</h2>
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-sage-50 text-sage-500 border border-sage-100">
              {statusLabel}
            </span>
          </div>
          <p className="text-charcoal-200 mb-2 text-sm">주문 번호: {order.orderNumber}</p>
          <p className="text-charcoal-200 mb-8 text-sm">고객명: {order.customerName}</p>
          <Link href="/" className="btn-primary w-full inline-block text-center text-lg">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Ready state — show order summary + payment widget
  const { order } = pageState;
  const shippingFee = order.shippingFee ?? 0;
  const itemsTotal = order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? order.totalAmount;

  return (
    <div className="min-h-screen bg-cream-100 py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8 mt-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-charcoal-400">결제하기</h1>
          <p className="text-charcoal-200">안전한 결제 시스템으로 주문을 확정하세요</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-charcoal-400 mb-4">주문 정보</h2>
          <div className="space-y-3 pb-4 border-b border-warm-100">
            <div className="flex justify-between text-sm text-charcoal-300">
              <span className="font-semibold">고객명</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between text-sm text-charcoal-300">
              <span className="font-semibold">주문 번호</span>
              <span className="font-mono text-xs">{order.orderNumber}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-charcoal-400 mb-2">주문 상품</p>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm text-charcoal-300">
                <span>
                  {item.name}
                  <span className="text-charcoal-200 ml-1">× {item.quantity}</span>
                </span>
                <span>{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-warm-100 space-y-2">
            <div className="flex justify-between text-sm text-charcoal-300">
              <span>상품 합계</span>
              <span>{itemsTotal.toLocaleString()}원</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between text-sm text-charcoal-300">
                <span>배송비</span>
                <span>{shippingFee.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-charcoal-400 text-lg pt-2 border-t border-warm-100">
              <span>총 결제금액</span>
              <span className="text-sage-500">{order.totalAmount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* Payment Widget */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
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
            {isRequesting
              ? "결제창을 띄우는 중..."
              : isReady
              ? `${order.totalAmount.toLocaleString()}원 결제하기`
              : "결제 모듈 로딩 중..."}
          </button>
        </div>
      </div>
    </div>
  );
}
