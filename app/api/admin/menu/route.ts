import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllMenuItems, createMenuItem } from "@/lib/menu-db";

// GET /api/admin/menu — 메뉴 전체 조회 (비활성 포함)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getAllMenuItems();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "메뉴 조회 실패" },
      { status: 500 }
    );
  }
}

// POST /api/admin/menu — 메뉴 추가
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const item = await createMenuItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "메뉴 추가 실패" },
      { status: 500 }
    );
  }
}
