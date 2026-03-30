import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponTemplateById, updateCouponTemplate } from "@/lib/coupon-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const template = await getCouponTemplateById(params.id);
    if (!template) {
      return NextResponse.json({ error: "쿠폰 템플릿을 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch (error) {
    console.error("쿠폰 템플릿 조회 에러:", error);
    return NextResponse.json({ error: "쿠폰 조회 실패" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const template = await updateCouponTemplate(params.id, body);
    return NextResponse.json({ template });
  } catch (error) {
    console.error("쿠폰 템플릿 수정 에러:", error);
    const message = error instanceof Error ? error.message : "쿠폰 수정 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
