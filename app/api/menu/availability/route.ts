// POST /api/menu/availability — 장바구니 상품이 현재 판매 중인지 확인
// 공개 엔드포인트 (인증 불필요 — 비로그인 장바구니용)
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: unknown = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ unavailableIds: [] });
    }

    // 문자열 id만 필터 (xss/injection 방어)
    const safeIds = ids.filter((id): id is string => typeof id === "string");
    if (safeIds.length === 0) {
      return NextResponse.json({ unavailableIds: [] });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      // DB 미설정 시 — 안전하게 "모두 사용 가능"으로 처리 (정적 fallback 환경)
      return NextResponse.json({ unavailableIds: [] });
    }

    // 활성 메뉴만 조회
    const { data, error } = await supabase
      .from("menu_items")
      .select("id")
      .in("id", safeIds)
      .eq("is_active", true);

    if (error) throw error;

    const activeIds = new Set((data ?? []).map((r) => r.id));
    const unavailableIds = safeIds.filter((id) => !activeIds.has(id));

    return NextResponse.json({ unavailableIds });
  } catch {
    // 에러 시 빈 배열 반환 — 서버 안전망(주문 API)이 최종 방어
    return NextResponse.json({ unavailableIds: [] });
  }
}
