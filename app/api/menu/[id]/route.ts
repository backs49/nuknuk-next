// GET /api/menu/[id] — 공개 메뉴 단일 조회 (인증 불필요)
import { NextRequest, NextResponse } from "next/server";
import { getMenuItem } from "@/lib/menu-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await getMenuItem(params.id);
  if (!item) {
    return NextResponse.json({ error: "메뉴를 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json(item);
}
