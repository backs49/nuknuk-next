"use client";

import { useState, useCallback, useRef } from "react";

// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

interface ShareButtonsProps {
  productName: string;
  description: string;
  imageUrl: string;
  price: number | null;
  productUrl: string;
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

function initKakaoSdk(): boolean {
  if (!KAKAO_JS_KEY || !window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY);
  }
  return window.Kakao.isInitialized();
}

export default function ShareButtons({
  productName,
  description,
  imageUrl,
  price,
  productUrl,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<NodeJS.Timeout | null>(null);

  const handleKakaoShare = useCallback(() => {
    if (!initKakaoSdk()) {
      alert("카카오톡 공유를 사용할 수 없습니다.");
      return;
    }

    const truncatedDesc =
      description.length > 50
        ? description.slice(0, 47) + "..."
        : description;

    const link = {
      mobileWebUrl: productUrl,
      webUrl: productUrl,
    };

    if (price !== null) {
      window.Kakao!.Share.sendDefault({
        objectType: "commerce",
        content: {
          title: productName,
          description: truncatedDesc,
          imageUrl,
          link,
        },
        commerce: {
          regularPrice: price,
        },
        buttons: [{ title: "상품 보기", link }],
      });
    } else {
      window.Kakao!.Share.sendDefault({
        objectType: "feed",
        content: {
          title: productName,
          description: truncatedDesc,
          imageUrl,
          link,
        },
        buttons: [{ title: "상품 보기", link }],
      });
    }
  }, [productName, description, imageUrl, price, productUrl]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(productUrl).then(() => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [productUrl]);

  return (
    <div className="flex gap-2 mt-3 mb-1">
      {/* 카카오톡 공유 버튼 — 환경변수 미설정 시 숨김 */}
      {KAKAO_JS_KEY && (
        <button
          onClick={handleKakaoShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FEE500] text-[#3C1E1E] rounded-lg text-sm font-semibold hover:brightness-95 transition-all cursor-pointer"
        >
          {/* 카카오 말풍선 아이콘 */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.96 3.4-.99 3.63 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
          </svg>
          카카오톡 공유
        </button>
      )}

      {/* URL 복사 버튼 */}
      <button
        onClick={handleCopyUrl}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-charcoal-100 text-charcoal-200 rounded-lg text-sm font-semibold hover:bg-charcoal-400/5 transition-all cursor-pointer"
      >
        {/* 링크 아이콘 */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {copied ? "복사됨!" : "링크 복사"}
      </button>
    </div>
  );
}
