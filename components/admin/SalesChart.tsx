"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyData {
  date: string;
  total: number;
  count: number;
}

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface CategoryData {
  name: string;
  total: number;
  percentage: number;
}

interface SalesChartProps {
  dailyData: DailyData[];
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
}

const SAGE = "#6B8E23";
const PIE_COLORS = ["#6B8E23", "#E6D2B5", "#E8998D", "#4A4A4A", "#A0C4A8"];

function formatManwon(value: number) {
  if (value === 0) return "0";
  const manwon = value / 10000;
  return `${manwon % 1 === 0 ? manwon : manwon.toFixed(1)}만`;
}

function formatDate(dateStr: string) {
  // dateStr: "YYYY-MM-DD"
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

function formatMonth(monthStr: string) {
  // monthStr: "YYYY-MM"
  const parts = monthStr.split("-");
  if (parts.length >= 2) {
    const yy = parts[0].slice(2);
    return `${yy}.${parts[1]}`;
  }
  return monthStr;
}

function formatWon(value: number) {
  return value.toLocaleString("ko-KR") + "원";
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: DailyData | MonthlyData;
}

function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md p-3 text-sm">
      <p className="font-medium text-charcoal-400 mb-1">{label}</p>
      <p className="text-sage-400 font-semibold">{formatWon(item.value)}</p>
      <p className="text-gray-400">{(item.payload as DailyData).count}건</p>
    </div>
  );
}

interface PieTooltipItem {
  name: string;
  value: number;
  payload: CategoryData;
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PieTooltipItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md p-3 text-sm">
      <p className="font-medium text-charcoal-400 mb-1">{item.name}</p>
      <p className="text-sage-400 font-semibold">{formatWon(item.value)}</p>
      <p className="text-gray-400">{item.payload.percentage.toFixed(1)}%</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (!percent || percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function SalesChart({ dailyData, monthlyData, categoryData }: SalesChartProps) {
  const formattedDaily = dailyData.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  const formattedMonthly = monthlyData.map((m) => ({
    ...m,
    monthLabel: formatMonth(m.month),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* 일별 매출 추이 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-base font-semibold text-charcoal-400 mb-4">일별 매출 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedDaily} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 12, fill: "#4A4A4A" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tickFormatter={formatManwon}
              tick={{ fontSize: 12, fill: "#4A4A4A" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<SalesTooltip />} />
            <Line
              type="monotone"
              dataKey="total"
              stroke={SAGE}
              strokeWidth={2.5}
              dot={{ fill: SAGE, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: SAGE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 월별 매출 추이 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-base font-semibold text-charcoal-400 mb-4">월별 매출 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedMonthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: "#4A4A4A" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tickFormatter={formatManwon}
              tick={{ fontSize: 12, fill: "#4A4A4A" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<SalesTooltip />} />
            <Bar dataKey="total" fill={SAGE} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 카테고리별 매출 비중 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-base font-semibold text-charcoal-400 mb-4">카테고리별 매출 비중</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              labelLine={false}
              label={renderCustomLabel}
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: "#4A4A4A" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
