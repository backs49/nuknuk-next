import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
    // 메뉴 수정 후 캐시 무효화 (is_active 포함)
    revalidatePath("/");
    revalidatePath(`/menu/${params.id}`);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "메뉴 수정 실패" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/menu/[id] — 부분 업데이트 (is_active 토글용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // 허용된 필드만 전달 (현재는 is_active만)
    const updates: { is_active?: boolean } = {};
    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "변경할 필드가 없습니다" },
        { status: 400 }
      );
    }

    const item = await updateMenuItem(params.id, updates);

    // 공개 페이지 캐시 즉시 무효화
    revalidatePath("/");
    revalidatePath(`/menu/${params.id}`);

    return NextResponse.json({
      success: true,
      is_active: item.is_active,
    });
  } catch {
    return NextResponse.json(
      { error: "메뉴 상태 변경 실패" },
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
    // 삭제 후 캐시 무효화
    revalidatePath("/");
    revalidatePath(`/menu/${params.id}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "메뉴 삭제 실패" },
      { status: 500 }
    );
  }
}
