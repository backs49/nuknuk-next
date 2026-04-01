"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { COUPON_POINT_ENABLED, REVIEW_ENABLED, FAQ_ENABLED } from "@/lib/feature-flags";

// 인증이 필요 없는 경로
const PUBLIC_PATHS = ["/admin/login"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  return (
    <SessionProvider>
      {isPublicPath ? (
        children
      ) : (
        <AdminLayoutInner>{children}</AdminLayoutInner>
      )}
    </SessionProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  // 페이지 이동 시 모바일 사이드바 닫기
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-charcoal-200">로딩 중...</p>
      </div>
    );
  }

  if (!session) return null;

  const navItems = [
    { href: "/admin", label: "대시보드", icon: "📊" },
    { href: "/admin/orders", label: "주문 관리", icon: "🧾" },
    { href: "/admin/menu", label: "메뉴 관리", icon: "🍡" },
    { href: "/admin/categories", label: "카테고리 관리", icon: "📂" },
    ...(REVIEW_ENABLED
      ? [{ href: "/admin/reviews", label: "리뷰 관리", icon: "⭐" }]
      : []),
    { href: "/admin/banner", label: "공지 배너", icon: "📢" },
    ...(FAQ_ENABLED
      ? [{ href: "/admin/faq", label: "FAQ 관리", icon: "❓" }]
      : []),
    ...(COUPON_POINT_ENABLED
      ? [
          { href: "/admin/customers", label: "고객 관리", icon: "👥" },
          { href: "/admin/coupons", label: "쿠폰 관리", icon: "🎟️" },
          { href: "/admin/points", label: "포인트 현황", icon: "💰" },
          { href: "/admin/settings", label: "운영 설정", icon: "⚙️" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-0 z-40 bg-charcoal-400 text-white flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="font-bold">넉넉 관리자</Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
        >
          {sidebarOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-charcoal-400 text-white flex flex-col shrink-0
          transition-transform duration-200 ease-in-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-6 border-b border-charcoal-300">
          <Link href="/admin" className="block">
            <h1 className="text-lg font-bold">넉넉 디저트</h1>
            <p className="text-xs text-gray-400 mt-0.5">관리자 패널</p>
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-charcoal-300">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <p className="text-gray-300">{session.user?.name}</p>
              <p className="text-gray-500">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-xs text-gray-500 hover:text-white transition"
            >
              로그아웃
            </button>
          </div>
          <Link
            href="/"
            className="block mt-3 text-xs text-gray-500 hover:text-sage-300 transition"
          >
            ← 사이트 보기
          </Link>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
