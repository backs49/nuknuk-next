import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import CartProvider from "@/components/CartProvider";
import CartSlidePanel from "@/components/CartSlidePanel";
import { getSiteUrl } from "@/lib/site-url";

// Playfair Display — 영문 디스플레이 폰트
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Pretendard — 한국어 본문 폰트 (로컬 또는 CDN)
// CDN 방식: link 태그로 불러오는 방법도 있으나 next/font/local 권장
// 현재는 시스템 산세리프 폴백 사용, Pretendard 웹폰트 CDN으로 로드
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-pretendard",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "넉넉 디저트 | Nuknuk Dessert — 재료도, 정성도, 마음도 넉넉하게",
  description:
    "경북 영천 수제 디저트 전문점. 떡, 케이크, 쿠키, 음료를 정성껏 만듭니다. 100% 예약제 운영.",
  keywords: [
    "넉넉 디저트",
    "영천 디저트",
    "수제 떡",
    "영천 카페",
    "예약제 디저트",
    "한국 전통 디저트",
    "떡 케이크",
    "nuknuk dessert",
  ],
  openGraph: {
    title: "넉넉 디저트 | Nuknuk Dessert",
    description:
      "재료도, 정성도, 마음도 넉넉(裕)하게 담았습니다. 경북 영천 수제 디저트 전문점.",
    url: getSiteUrl(),
    siteName: "넉넉 디저트",
    locale: "ko_KR",
    type: "website",
    // TODO: 실제 대표 이미지 URL로 교체하세요
    images: [
      {
        url: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "넉넉 디저트",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scroll-smooth">
      <head>
        {/* Pretendard 웹폰트 CDN */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body
        className={`${playfair.variable} ${geistSans.variable} antialiased`}
        style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif" }}
      >
        <CartProvider>
          {children}
          <CartSlidePanel />
        </CartProvider>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2ezmFnkrysYIcMuWHo/Y6v1Hs9X2BfsDdnJo3fynkmLyA"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
