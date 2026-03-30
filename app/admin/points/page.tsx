"use client";

import { useState, useEffect } from "react";

interface DashboardData {
  points: { totalEarned: number; totalUsed: number; balance: number };
  coupons: { totalIssued: number; totalUsed: number; usageRate: number };
  customers: { total: number; referrals: number };
  integrityIssues: Array<{
    customerId: string;
    phone: string;
    cached: number;
    calculated: number;
  }>;
}

export default function AdminPointsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard/points");
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-charcoal-200">로딩 중...</div>;
  if (!data) return <div className="text-charcoal-200">데이터 로드 실패</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-400 mb-6">포인트 현황</h1>

      {/* 포인트 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="총 적립 포인트"
          value={`${data.points.totalEarned.toLocaleString()}P`}
          color="text-sage-400"
        />
        <StatCard
          label="총 사용 포인트"
          value={`${data.points.totalUsed.toLocaleString()}P`}
          color="text-red-400"
        />
        <StatCard
          label="미사용 잔액 합계"
          value={`${data.points.balance.toLocaleString()}P`}
          color="text-charcoal-400"
        />
      </div>

      {/* 쿠폰 통계 */}
      <h2 className="text-lg font-semibold text-charcoal-400 mb-3">쿠폰 통계</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="총 발급 쿠폰"
          value={`${data.coupons.totalIssued}장`}
          color="text-charcoal-400"
        />
        <StatCard
          label="사용 완료"
          value={`${data.coupons.totalUsed}장`}
          color="text-sage-400"
        />
        <StatCard
          label="사용률"
          value={`${data.coupons.usageRate}%`}
          color="text-charcoal-400"
        />
      </div>

      {/* 고객 통계 */}
      <h2 className="text-lg font-semibold text-charcoal-400 mb-3">고객 통계</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="전체 고객 수"
          value={`${data.customers.total}명`}
          color="text-charcoal-400"
        />
        <StatCard
          label="추천 가입"
          value={`${data.customers.referrals}명`}
          color="text-sage-400"
        />
      </div>

      {/* 정합성 이슈 */}
      {data.integrityIssues.length > 0 && (
        <div className="bg-red-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-3">
            포인트 정합성 경고 ({data.integrityIssues.length}건)
          </h2>
          <div className="space-y-2">
            {data.integrityIssues.map((issue) => (
              <div
                key={issue.customerId}
                className="flex justify-between items-center text-sm bg-white rounded-lg px-4 py-2"
              >
                <span className="text-charcoal-300">{issue.phone}</span>
                <div className="text-xs">
                  <span className="text-charcoal-200">캐시: {issue.cached.toLocaleString()}P</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-red-400">실제: {issue.calculated.toLocaleString()}P</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-xs text-charcoal-200 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
