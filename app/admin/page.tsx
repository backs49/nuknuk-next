"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalMenuItems: number;
  categories: Record<string, number>;
  withImages: number;
  withoutImages: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    // 카테고리 라벨과 메뉴 데이터를 병렬로 조회
    Promise.all([
      fetch("/api/admin/categories")
        .then((res) => res.json())
        .then((cats: Array<{ id: string; name: string }>) => {
          const labels: Record<string, string> = {};
          cats.forEach((c) => {
            labels[c.id] = c.name;
          });
          setCategoryLabels(labels);
        })
        .catch(() => {}),
      fetch("/api/admin/menu")
        .then((res) => res.json())
        .then((items: Array<{ category: string; image?: string }>) => {
          const categories: Record<string, number> = {};
          let withImages = 0;
          let withoutImages = 0;

          items.forEach((item) => {
            categories[item.category] =
              (categories[item.category] || 0) + 1;
            if (item.image) withImages++;
            else withoutImages++;
          });

          setStats({
            totalMenuItems: items.length,
            categories,
            withImages,
            withoutImages,
          });
        })
        .catch(() => {
          setStats({
            totalMenuItems: 0,
            categories: {},
            withImages: 0,
            withoutImages: 0,
          });
        }),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-400 mb-8">대시보드</h1>

      {loading ? (
        <p className="text-charcoal-200">데이터 로딩 중...</p>
      ) : stats ? (
        <div className="space-y-8">
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="전체 메뉴"
              value={stats.totalMenuItems}
              unit="개"
              color="bg-sage-400"
            />
            <StatCard
              label="사진 등록됨"
              value={stats.withImages}
              unit="개"
              color="bg-blue-500"
            />
            <StatCard
              label="사진 미등록"
              value={stats.withoutImages}
              unit="개"
              color="bg-warm-400"
            />
          </div>

          {/* 카테고리별 현황 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-charcoal-400 mb-4">
              카테고리별 메뉴 수
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.categories).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-charcoal-300">
                    {categoryLabels[cat] || cat}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage-400 rounded-full"
                        style={{
                          width: `${(count / stats.totalMenuItems) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-charcoal-400 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 빠른 작업 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-charcoal-400 mb-4">
              빠른 작업
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/menu/new"
                className="px-4 py-2 bg-sage-400 text-white text-sm rounded-lg hover:bg-sage-500 transition"
              >
                + 새 메뉴 추가
              </Link>
              <Link
                href="/admin/categories"
                className="px-4 py-2 bg-sage-400 text-white text-sm rounded-lg hover:bg-sage-500 transition"
              >
                + 새 카테고리 추가
              </Link>
              <Link
                href="/admin/menu"
                className="px-4 py-2 bg-charcoal-400 text-white text-sm rounded-lg hover:bg-charcoal-300 transition"
              >
                메뉴 목록 관리
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <p className="text-sm text-charcoal-200 mb-1">{label}</p>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-charcoal-400">{value}</span>
        <span className="text-sm text-charcoal-200 mb-1">{unit}</span>
      </div>
      <div className={`mt-3 h-1 w-12 rounded-full ${color}`} />
    </div>
  );
}
