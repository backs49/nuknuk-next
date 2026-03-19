"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

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
    { href: "/admin/menu", label: "메뉴 관리", icon: "🍡" },
    { href: "/admin/categories", label: "카테고리 관리", icon: "📂" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <aside className="w-64 bg-charcoal-400 text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-charcoal-300">
          <Link href="/admin" className="block">
            <h1 className="text-lg font-bold">넉넉 디저트</h1>
            <p className="text-xs text-gray-400 mt-0.5">관리자 패널</p>
          </Link>
        </div>

        <nav className="flex-1 py-4">
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
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
