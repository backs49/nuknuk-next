import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseOrThrow } from "@/lib/db-utils";
import { checkPointIntegrity } from "@/lib/point-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseOrThrow();

    // 포인트 통계
    const { data: pointStats } = await supabase
      .from("point_transactions")
      .select("type, amount");

    let totalEarned = 0;
    let totalUsed = 0;
    if (pointStats) {
      for (const tx of pointStats) {
        if (tx.amount > 0) totalEarned += tx.amount;
        else totalUsed += Math.abs(tx.amount);
      }
    }

    // 쿠폰 통계
    const { count: totalIssued } = await supabase
      .from("customer_coupons")
      .select("*", { count: "exact", head: true });

    const { count: totalUsedCoupons } = await supabase
      .from("customer_coupons")
      .select("*", { count: "exact", head: true })
      .eq("status", "used");

    // 고객 수
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    // 추천 건수
    const { count: referralCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .not("referred_by", "is", null);

    // 정합성 체크
    const integrityIssues = await checkPointIntegrity().catch(() => []);

    return NextResponse.json({
      points: {
        totalEarned,
        totalUsed,
        balance: totalEarned - totalUsed,
      },
      coupons: {
        totalIssued: totalIssued ?? 0,
        totalUsed: totalUsedCoupons ?? 0,
        usageRate: totalIssued
          ? Math.round(((totalUsedCoupons ?? 0) / totalIssued) * 100)
          : 0,
      },
      customers: {
        total: totalCustomers ?? 0,
        referrals: referralCount ?? 0,
      },
      integrityIssues,
    });
  } catch (error) {
    console.error("대시보드 통계 에러:", error);
    return NextResponse.json({ error: "통계 조회 실패" }, { status: 500 });
  }
}
