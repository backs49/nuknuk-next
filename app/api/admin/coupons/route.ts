import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponTemplates, createCouponTemplate } from "@/lib/coupon-db";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const result = await getCouponTemplates({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("쿠폰 템플릿 목록 에러:", error);
    return NextResponse.json({ error: "쿠폰 목록 조회 실패" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const template = await createCouponTemplate(body);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return apiError(error, "쿠폰 생성에 실패했습니다", 500, "admin/coupons/create");
  }
}
