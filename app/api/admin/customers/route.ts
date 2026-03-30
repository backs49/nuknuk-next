import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomers } from "@/lib/customer-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const result = await getCustomers({ search, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("고객 목록 조회 에러:", error);
    return NextResponse.json({ error: "고객 목록 조회 실패" }, { status: 500 });
  }
}
