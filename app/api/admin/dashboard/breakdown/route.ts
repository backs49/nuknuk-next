import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

type BreakdownItem = {
  name: string;
  total: number;
  count: number;
  percentage: number;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "DB 미설정" }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "channel";

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to = toParam ? new Date(toParam) : now;

    if (type === "channel") {
      // Group orders by channel
      const { data, error } = await supabase
        .from("orders")
        .select("channel, total_amount")
        .in("status", ["paid", "confirmed", "completed"])
        .gte("paid_at", from.toISOString())
        .lte("paid_at", to.toISOString());

      if (error) throw new Error(`채널별 조회 실패: ${error.message}`);

      const orders = data || [];
      const groupMap = new Map<string, { total: number; count: number }>();

      for (const order of orders) {
        const key = order.channel || "기타";
        const existing = groupMap.get(key) || { total: 0, count: 0 };
        groupMap.set(key, {
          total: existing.total + order.total_amount,
          count: existing.count + 1,
        });
      }

      const grandTotal = Array.from(groupMap.values()).reduce(
        (sum, s) => sum + s.total,
        0
      );

      const channelLabels: Record<string, string> = {
        online: "온라인",
        offline: "오프라인",
        instagram: "인스타그램",
        naver: "네이버",
        phone: "전화",
        direct: "직접 결제",
      };

      const result: BreakdownItem[] = Array.from(groupMap.entries())
        .map(([key, stats]) => ({
          name: channelLabels[key] || key,
          total: stats.total,
          count: stats.count,
          percentage:
            grandTotal > 0 ? Math.round((stats.total / grandTotal) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json(result);
    }

    if (type === "product") {
      // Fetch order_items for orders in date range
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["paid", "confirmed", "completed"])
        .gte("paid_at", from.toISOString())
        .lte("paid_at", to.toISOString());

      if (ordersError) throw new Error(`주문 조회 실패: ${ordersError.message}`);

      const orderIds = (ordersData || []).map((o: { id: string }) => o.id);

      if (orderIds.length === 0) return NextResponse.json([]);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("name, quantity, subtotal")
        .in("order_id", orderIds);

      if (itemsError) throw new Error(`상품별 조회 실패: ${itemsError.message}`);

      const items = itemsData || [];
      const groupMap = new Map<string, { total: number; count: number }>();

      for (const item of items) {
        const key = item.name || "기타";
        const existing = groupMap.get(key) || { total: 0, count: 0 };
        groupMap.set(key, {
          total: existing.total + item.subtotal,
          count: existing.count + item.quantity,
        });
      }

      const grandTotal = Array.from(groupMap.values()).reduce(
        (sum, s) => sum + s.total,
        0
      );

      const result: BreakdownItem[] = Array.from(groupMap.entries())
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          count: stats.count,
          percentage:
            grandTotal > 0 ? Math.round((stats.total / grandTotal) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json(result);
    }

    if (type === "category") {
      // Fetch order_items with menu_item_id for orders in date range
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["paid", "confirmed", "completed"])
        .gte("paid_at", from.toISOString())
        .lte("paid_at", to.toISOString());

      if (ordersError) throw new Error(`주문 조회 실패: ${ordersError.message}`);

      const orderIds = (ordersData || []).map((o: { id: string }) => o.id);

      if (orderIds.length === 0) return NextResponse.json([]);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("menu_item_id, quantity, subtotal")
        .in("order_id", orderIds);

      if (itemsError) throw new Error(`상품 항목 조회 실패: ${itemsError.message}`);

      const items = itemsData || [];

      // Get unique menu_item_ids (excluding null)
      const menuItemIds = [
        ...new Set(
          items
            .map((i: { menu_item_id: string | null }) => i.menu_item_id)
            .filter(Boolean) as string[]
        ),
      ];

      // Fetch menu items to get categories
      const menuItemCategoryMap = new Map<string, string>();
      if (menuItemIds.length > 0) {
        const { data: menuItems, error: menuError } = await supabase
          .from("menu_items")
          .select("id, category")
          .in("id", menuItemIds);

        if (menuError) throw new Error(`메뉴 조회 실패: ${menuError.message}`);

        for (const menuItem of menuItems || []) {
          menuItemCategoryMap.set(menuItem.id, menuItem.category);
        }
      }

      const categoryLabels: Record<string, string> = {
        "rice-cake": "떡",
        cake: "케이크",
        cookie: "쿠키",
        beverage: "음료",
      };

      const groupMap = new Map<string, { total: number; count: number }>();

      for (const item of items) {
        const category = item.menu_item_id
          ? menuItemCategoryMap.get(item.menu_item_id) || "기타"
          : "기타";
        const label = categoryLabels[category] || category;
        const existing = groupMap.get(label) || { total: 0, count: 0 };
        groupMap.set(label, {
          total: existing.total + item.subtotal,
          count: existing.count + item.quantity,
        });
      }

      const grandTotal = Array.from(groupMap.values()).reduce(
        (sum, s) => sum + s.total,
        0
      );

      const result: BreakdownItem[] = Array.from(groupMap.entries())
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          count: stats.count,
          percentage:
            grandTotal > 0 ? Math.round((stats.total / grandTotal) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "유효하지 않은 type 파라미터" }, { status: 400 });
  } catch (error) {
    console.error("매출 분석 에러:", error);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
