import { getMenuItem, getCategories } from "@/lib/menu-db";
import { getMenuDetail } from "@/lib/menu-option-db";
import { notFound } from "next/navigation";
import MenuDetailClient from "@/components/menu/MenuDetailClient";
import { COUPON_POINT_ENABLED } from "@/lib/feature-flags";
import { getSettingNumber } from "@/lib/settings-db";
import type { BenefitsData } from "@/components/menu/BenefitsPreview";
import { getServiceSupabase } from "@/lib/supabase";

export const revalidate = 60;

async function fetchBenefitsData(): Promise<BenefitsData | null> {
  if (!COUPON_POINT_ENABLED) return null;

  const [pointEarnRate, referralRewardPoints] = await Promise.all([
    getSettingNumber("point_earn_rate"),
    getSettingNumber("referral_reward_points"),
  ]);

  // 첫주문 쿠폰 템플릿 조회
  let firstOrderCoupon: BenefitsData["firstOrderCoupon"] = null;
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("coupon_templates")
      .select("type, value, max_discount")
      .eq("auto_trigger", "first_order")
      .eq("is_active", true)
      .order("value", { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      // 가장 혜택이 큰 1개 선택 (fixed는 value 기준, percent는 비교 불가하므로 value 큰 것)
      const best = data[0] as {
        type: "fixed" | "percent" | "free_shipping" | "free_item";
        value: number;
        max_discount: number | null;
      };
      firstOrderCoupon = {
        type: best.type,
        value: best.value,
        maxDiscount: best.max_discount,
      };
    }
  }

  return { pointEarnRate, referralRewardPoints, firstOrderCoupon };
}

export default async function MenuDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [menuItem, detail, categories, benefitsData] = await Promise.all([
    getMenuItem(params.id),
    getMenuDetail(params.id),
    getCategories(),
    fetchBenefitsData(),
  ]);

  if (!menuItem) notFound();

  const category = categories.find((c) => c.id === menuItem.category) ?? null;

  return (
    <MenuDetailClient
      menuItem={menuItem}
      category={category}
      images={detail.images}
      blocks={detail.blocks}
      options={detail.options}
      benefitsData={benefitsData}
    />
  );
}
