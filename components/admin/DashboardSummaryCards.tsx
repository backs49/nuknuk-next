"use client";

import { formatOrderPrice } from "@/data/order";

interface PeriodData {
  total: number;
  count: number;
  change: number;
}

interface SummaryData {
  today: PeriodData;
  thisWeek: PeriodData;
  thisMonth: PeriodData;
  orders: { count: number; change: number };
}

interface DashboardSummaryCardsProps {
  data: SummaryData;
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-sm font-medium text-green-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        {change.toFixed(1)}%
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-sm font-medium text-red-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="text-sm font-medium text-gray-400">0%</span>
  );
}

interface CardProps {
  label: string;
  value: string;
  subLabel: string;
  change: number;
  icon: React.ReactNode;
}

function SummaryCard({ label, value, subLabel, change, icon }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-charcoal-300">{label}</span>
        <span className="text-sage-400">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-charcoal-400">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>
      </div>
      <div className="flex items-center gap-1">
        <ChangeIndicator change={change} />
        <span className="text-xs text-gray-400">전 기간 대비</span>
      </div>
    </div>
  );
}

export default function DashboardSummaryCards({ data }: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        label="오늘 매출"
        value={formatOrderPrice(data.today.total)}
        subLabel={`${data.today.count}건`}
        change={data.today.change}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <SummaryCard
        label="이번 주 매출"
        value={formatOrderPrice(data.thisWeek.total)}
        subLabel={`${data.thisWeek.count}건`}
        change={data.thisWeek.change}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
      <SummaryCard
        label="이번 달 매출"
        value={formatOrderPrice(data.thisMonth.total)}
        subLabel={`${data.thisMonth.count}건`}
        change={data.thisMonth.change}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      <SummaryCard
        label="총 주문 건수"
        value={`${data.orders.count}건`}
        subLabel="누적 주문"
        change={data.orders.change}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        }
      />
    </div>
  );
}
