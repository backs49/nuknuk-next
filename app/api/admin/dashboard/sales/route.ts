import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "DB 미설정" }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const granularity = searchParams.get("granularity") || "daily";

    // Default: last 30 days
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    defaultFrom.setHours(0, 0, 0, 0);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // T00:00:00 붙여야 로컬 타임존으로 파싱됨 (date-only는 UTC로 파싱)
    const from = fromParam ? new Date(fromParam + "T00:00:00") : defaultFrom;
    const to = toParam ? new Date(toParam + "T23:59:59.999") : now;

    const { data, error } = await supabase
      .from("orders")
      .select("paid_at, total_amount")
      .in("status", ["paid", "confirmed", "completed"])
      .gte("paid_at", from.toISOString())
      .lte("paid_at", to.toISOString())
      .order("paid_at", { ascending: true });

    if (error) throw new Error(`주문 조회 실패: ${error.message}`);

    const orders = data || [];

    // Group in JS by date or month (Asia/Seoul timezone)
    const groupMap = new Map<string, { total: number; count: number }>();

    for (const order of orders) {
      if (!order.paid_at) continue;

      const seoulDate = new Date(order.paid_at).toLocaleString("sv-SE", {
        timeZone: "Asia/Seoul",
      });
      // sv-SE locale gives "YYYY-MM-DD HH:MM:SS" format
      const datePart = seoulDate.split(" ")[0]; // "YYYY-MM-DD"

      let key: string;
      if (granularity === "monthly") {
        key = datePart.slice(0, 7); // "YYYY-MM"
      } else {
        key = datePart; // "YYYY-MM-DD"
      }

      const existing = groupMap.get(key) || { total: 0, count: 0 };
      groupMap.set(key, {
        total: existing.total + order.total_amount,
        count: existing.count + 1,
      });
    }

    if (granularity === "monthly") {
      const result = Array.from(groupMap.entries()).map(([month, stats]) => ({
        month,
        total: stats.total,
        count: stats.count,
      }));
      return NextResponse.json(result);
    } else {
      const result = Array.from(groupMap.entries()).map(([date, stats]) => ({
        date,
        total: stats.total,
        count: stats.count,
      }));
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("매출 데이터 에러:", error);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
