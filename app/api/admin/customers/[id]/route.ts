import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerById } from "@/lib/customer-db";
import { getPointTransactions } from "@/lib/point-db";
import { getCustomerCoupons } from "@/lib/coupon-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customer = await getCustomerById(params.id);
    if (!customer) {
      return NextResponse.json({ error: "고객을 찾을 수 없습니다" }, { status: 404 });
    }

    const [pointData, coupons] = await Promise.all([
      getPointTransactions(params.id, { limit: 50 }),
      getCustomerCoupons(params.id, true),
    ]);

    return NextResponse.json({
      customer,
      pointTransactions: pointData.transactions,
      coupons,
    });
  } catch (error) {
    console.error("고객 상세 조회 에러:", error);
    return NextResponse.json({ error: "고객 상세 조회 실패" }, { status: 500 });
  }
}
