// GET /api/categories — 공개 카테고리 조회 (인증 불필요)
import { NextResponse } from "next/server";
import { getCategoriesRaw, getCategories } from "@/lib/menu-db";

export async function GET() {
  try {
    const categories = await getCategoriesRaw();
    return NextResponse.json(categories);
  } catch {
    const fallback = await getCategories();
    return NextResponse.json(
      fallback.map((c) => ({
        id: c.id,
        name: c.name,
        name_en: c.nameEn || null,
        emoji: c.emoji,
      }))
    );
  }
}
