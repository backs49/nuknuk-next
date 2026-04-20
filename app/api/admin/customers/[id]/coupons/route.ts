import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueCoupon } from "@/lib/coupon-db";
import { apiError } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json({ error: "templateId는 필수입니다" }, { status: 400 });
    }

    const coupon = await issueCoupon(params.id, templateId);
    return NextResponse.json({ coupon });
  } catch (error) {
    return apiError(error, "쿠폰 발급에 실패했습니다", 500, "admin/customers/coupons");
  }
}
