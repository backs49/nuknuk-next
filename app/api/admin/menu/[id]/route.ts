import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getMenuItemRaw,
  updateMenuItem,
  deleteMenuItem,
  deleteMenuImage,
} from "@/lib/menu-db";

// GET /api/admin/menu/[id] — 단일 메뉴 조회 (비활성 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await getMenuItemRaw(params.id);
  if (!item) {
    return NextResponse.json({ error: "메뉴를 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json(item);
}

// PUT /api/admin/menu/[id] — 메뉴 수정
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
    const item = await updateMenuItem(params.id, body);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "메뉴 수정 실패" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/menu/[id] — 메뉴 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await getMenuItemRaw(params.id);
    if (existing?.image) {
      await deleteMenuImage(existing.image);
    }
    await deleteMenuItem(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "메뉴 삭제 실패" },
      { status: 500 }
    );
  }
}
