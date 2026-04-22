/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js 및 외부 SDK 동작을 위한 인라인/eval 허용 (Kakao, Toss SDK 포함)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://*.tosspayments.com https://toss.im https://*.toss.im https://developers.kakao.com https://sharer.kakao.com https://www.instagram.com https://*.cdninstagram.com",
  // Tailwind/Next inline styles + Pretendard CDN + Google Fonts (next/font)
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // Supabase(PostgREST/Storage/Realtime) + Toss API + Kakao + 내부 API
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tosspayments.com https://toss.im https://*.toss.im https://developers.kakao.com https://sharer.kakao.com https://www.instagram.com https://*.cdninstagram.com",
  // Toss 결제위젯 iframe, Google Maps 임베드, Kakao 공유 팝업, Instagram 임베드
  "frame-src 'self' https://*.tosspayments.com https://toss.im https://*.toss.im https://www.google.com https://sharer.kakao.com https://www.instagram.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.tosspayments.com https://toss.im https://*.toss.im",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://*.tosspayments.com\")",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig = {
  images: {
    // Unsplash placeholder 이미지 허용 (실제 사진으로 교체 시 이 설정 업데이트)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    // HSTS는 프로덕션에서만 적용 (로컬 HTTPS 강제 방지)
    const headers = isProd
      ? securityHeaders
      : securityHeaders.filter((h) => h.key !== "Strict-Transport-Security");
    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
