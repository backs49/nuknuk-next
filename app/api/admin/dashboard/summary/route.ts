import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "DB 미설정" }, { status: 500 });

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Calculate week starts (Monday-based)
    const dayOfWeek = now.getDay() || 7;
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(thisWeekStart.getDate() - dayOfWeek + 1);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Helper to get sales sum and count for a period
    const getSales = async (from: Date, to: Date) => {
      const { data } = await supabase!
        .from("orders")
        .select("total_amount")
        .in("status", ["paid", "confirmed", "completed"])
        .gte("paid_at", from.toISOString())
        .lt("paid_at", to.toISOString());

      const total = (data || []).reduce(
        (sum: number, r: { total_amount: number }) => sum + r.total_amount,
        0
      );
      return { total, count: (data || []).length };
    };

    const [
      todaySales,
      yesterdaySales,
      thisWeekSales,
      lastWeekSales,
      thisMonthSales,
      lastMonthSales,
    ] = await Promise.all([
      getSales(todayStart, new Date(todayStart.getTime() + 86400000)),
      getSales(yesterdayStart, todayStart),
      getSales(thisWeekStart, now),
      getSales(lastWeekStart, thisWeekStart),
      getSales(thisMonthStart, now),
      getSales(lastMonthStart, thisMonthStart),
    ]);

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return NextResponse.json({
      today: {
        ...todaySales,
        change: calcChange(todaySales.total, yesterdaySales.total),
      },
      thisWeek: {
        ...thisWeekSales,
        change: calcChange(thisWeekSales.total, lastWeekSales.total),
      },
      thisMonth: {
        ...thisMonthSales,
        change: calcChange(thisMonthSales.total, lastMonthSales.total),
      },
      orders: {
        count: thisMonthSales.count,
        change: calcChange(thisMonthSales.count, lastMonthSales.count),
      },
    });
  } catch (error) {
    console.error("대시보드 요약 에러:", error);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
