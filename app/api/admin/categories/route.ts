import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategoriesRaw, createCategory, getCategories } from "@/lib/menu-db";

// GET /api/admin/categories — 카테고리 전체 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await getCategoriesRaw();
    return NextResponse.json(categories);
  } catch {
    // Supabase 미설정 시 정적 데이터 fallback
    const fallback = await getCategories();
    return NextResponse.json(
      fallback.map((c) => ({
        id: c.id,
        name: c.name,
        name_en: c.nameEn || null,
        emoji: c.emoji,
        sort_order: 0,
      }))
    );
  }
}

// POST /api/admin/categories — 카테고리 추가
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const category = await createCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "카테고리 추가 실패" },
      { status: 500 }
    );
  }
}
