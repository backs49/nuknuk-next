import type { Metadata } from "next";
import { getMenuItem, getCategories } from "@/lib/menu-db";
import { getMenuDetail } from "@/lib/menu-option-db";
import { notFound } from "next/navigation";
import MenuDetailClient from "@/components/menu/MenuDetailClient";
import { COUPON_POINT_ENABLED } from "@/lib/feature-flags";
import { getSettingNumber } from "@/lib/settings-db";
import type { BenefitsData } from "@/components/menu/BenefitsPreview";
import { getServiceSupabase } from "@/lib/supabase";
import { REVIEW_ENABLED } from "@/lib/feature-flags";
import { getReviewsByMenuItem, getReviewSummary } from "@/lib/review-db";
import type { ReviewSummary, Review } from "@/lib/review-db";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const menuItem = await getMenuItem(params.id);
  if (!menuItem) return {};

  const imageUrl =
    menuItem.image ||
    "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=1200&h=630&fit=crop";

  return {
    title: `${menuItem.name} | 넉넉 디저트`,
    description: menuItem.description,
    openGraph: {
      title: `${menuItem.name} | 넉넉 디저트`,
      description: menuItem.description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: menuItem.name,
      }],
      url: `https://nuknuk.vercel.app/menu/${params.id}`,
    },
  };
}

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

async function fetchReviewData(menuItemId: string): Promise<{
  reviews: Review[];
  summary: ReviewSummary;
} | null> {
  if (!REVIEW_ENABLED) return null;

  try {
    const [reviews, summary] = await Promise.all([
      getReviewsByMenuItem(menuItemId, { limit: 5 }),
      getReviewSummary(menuItemId),
    ]);
    return { reviews, summary };
  } catch {
    return { reviews: [], summary: { averageRating: 0, totalCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } };
  }
}

export default async function MenuDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [menuItem, detail, categories, benefitsData, reviewData] = await Promise.all([
    getMenuItem(params.id),
    getMenuDetail(params.id),
    getCategories(),
    fetchBenefitsData(),
    fetchReviewData(params.id),
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
      reviewData={reviewData}
    />
  );
}
