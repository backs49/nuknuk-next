import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueCoupon } from "@/lib/coupon-db";

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
    console.error("쿠폰 발급 에러:", error);
    const message = error instanceof Error ? error.message : "쿠폰 발급 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
