"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardSummaryCards from "@/components/admin/DashboardSummaryCards";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import SalesChart from "@/components/admin/SalesChart";
import SalesBreakdownTable from "@/components/admin/SalesBreakdownTable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalMenuItems: number;
  categories: Record<string, number>;
  withImages: number;
  withoutImages: number;
}

interface SummaryData {
  today: { total: number; count: number; change: number };
  thisWeek: { total: number; count: number; change: number };
  thisMonth: { total: number; count: number; change: number };
  orders: { total: number; count: number; change: number };
}

interface DailyDataPoint {
  date: string;
  total: number;
  count: number;
}

interface MonthlyDataPoint {
  month: string;
  total: number;
  count: number;
}

interface BreakdownDataPoint {
  name: string;
  total: number;
  count: number;
  percentage: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getLastYearStart(referenceDate: Date): string {
  const d = new Date(referenceDate);
  d.setFullYear(d.getFullYear() - 1);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1); // start from a year ago this month
  return toDateString(d);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  // ── Existing menu stats ──────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
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

  // ── Sales dashboard ───────────────────────────────────────────────────────
  const today = toDateString(new Date());
  const thirtyDaysAgo = toDateString(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  const [dateRange, setDateRange] = useState({ from: thirtyDaysAgo, to: today });

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<BreakdownDataPoint[]>([]);
  const [productBreakdown, setProductBreakdown] = useState<BreakdownDataPoint[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<BreakdownDataPoint[]>([]);

  // Fetch summary once on mount
  useEffect(() => {
    fetch("/api/admin/dashboard/summary")
      .then((res) => res.json())
      .then((data: SummaryData) => setSummaryData(data))
      .catch(() => {});
  }, []);

  // Fetch sales/breakdown data when date range changes
  useEffect(() => {
    const { from, to } = dateRange;
    const lastYearStart = getLastYearStart(new Date(to));
    const params = new URLSearchParams({ from, to });
    const monthlyParams = new URLSearchParams({
      from: lastYearStart,
      to,
      granularity: "monthly",
    });

    Promise.all([
      fetch(`/api/admin/dashboard/sales?${params}&granularity=daily`)
        .then((r) => r.json())
        .then((d: { data: DailyDataPoint[] }) => setDailyData(d.data ?? []))
        .catch(() => setDailyData([])),

      fetch(`/api/admin/dashboard/sales?${monthlyParams}`)
        .then((r) => r.json())
        .then((d: { data: MonthlyDataPoint[] }) => setMonthlyData(d.data ?? []))
        .catch(() => setMonthlyData([])),

      fetch(`/api/admin/dashboard/breakdown?type=category&${params}`)
        .then((r) => r.json())
        .then((d: { data: BreakdownDataPoint[] }) => setCategoryBreakdown(d.data ?? []))
        .catch(() => setCategoryBreakdown([])),

      fetch(`/api/admin/dashboard/breakdown?type=product&${params}`)
        .then((r) => r.json())
        .then((d: { data: BreakdownDataPoint[] }) => setProductBreakdown(d.data ?? []))
        .catch(() => setProductBreakdown([])),

      fetch(`/api/admin/dashboard/breakdown?type=channel&${params}`)
        .then((r) => r.json())
        .then((d: { data: BreakdownDataPoint[] }) => setChannelBreakdown(d.data ?? []))
        .catch(() => setChannelBreakdown([])),
    ]);
  }, [dateRange]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-400 mb-8">대시보드</h1>

      {/* ── 매출 대시보드 ── */}
      <section className="mb-10 space-y-6">
        <h2 className="text-xl font-semibold text-charcoal-400">매출 대시보드</h2>

        {/* 요약 카드 */}
        {summaryData && <DashboardSummaryCards data={summaryData} />}

        {/* 기간 필터 */}
        <DateRangeFilter
          from={dateRange.from}
          to={dateRange.to}
          onChange={(from, to) => setDateRange({ from, to })}
        />

        {/* 매출 차트 */}
        <SalesChart
          dailyData={dailyData}
          monthlyData={monthlyData}
          categoryData={categoryBreakdown}
        />

        {/* 매출 분석 테이블 */}
        <SalesBreakdownTable
          productData={productBreakdown}
          channelData={channelBreakdown}
        />
      </section>

      {/* ── 구분선 ── */}
      <hr className="border-gray-200 mb-10" />

      {/* ── 메뉴 통계 (기존) ── */}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
