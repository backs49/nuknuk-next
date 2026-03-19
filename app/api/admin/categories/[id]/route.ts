import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategory, updateCategory, deleteCategory } from "@/lib/menu-db";

// GET /api/admin/categories/[id] — 단일 카테고리 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const category = await getCategory(params.id);
    if (!category) {
      return NextResponse.json(
        { error: "카테고리를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: "카테고리 조회 실패" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] — 카테고리 수정
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
    const category = await updateCategory(params.id, body);
    return NextResponse.json(category);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "카테고리 수정 실패" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] — 카테고리 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteCategory(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "카테고리 삭제 실패" },
      { status: 500 }
    );
  }
}
