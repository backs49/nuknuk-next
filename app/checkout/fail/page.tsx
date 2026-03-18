"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "알 수 없는 오류가 발생했습니다.";
  const code = searchParams.get("code") || "UNKNOWN_ERROR";

  return (
    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-auto text-center shadow-lg border border-red-100">
      <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-3xl mx-auto mb-6">
        <span className="sr-only">경고</span>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h2 className="text-2xl font-display font-bold text-charcoal-400 mb-3">결제 실패</h2>
      <p className="text-charcoal-200 mb-2">{message}</p>
      <div className="bg-warm-100 rounded-lg p-3 mb-8">
        <p className="text-xs text-charcoal-100 font-mono break-all">에러 코드: {code}</p>
      </div>
      <Link href="/checkout" className="btn-primary w-full inline-block text-center text-lg">
        다시 결제 시도하기
      </Link>
    </div>
  );
}

export default function FailPage() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-charcoal-300">Loading...</div>}>
        <FailContent />
      </Suspense>
    </div>
  );
}
