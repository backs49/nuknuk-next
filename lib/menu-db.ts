import { getServiceSupabase, isSupabaseConfigured } from "./supabase";
import {
  menuItems as staticMenuItems,
  categories as staticCategories,
  type MenuItem,
  type CategoryInfo,
} from "@/data/menu";

// ========== 카테고리 관련 ==========

export interface DbCategory {
  id: string;
  name: string;
  name_en: string | null;
  emoji: string;
  sort_order: number;
  available_delivery_methods: string[];
  default_shipping_fee: number;
  created_at: string;
  updated_at: string;
}

function toCategory(dbCat: DbCategory): CategoryInfo {
  return {
    id: dbCat.id as CategoryInfo["id"],
    name: dbCat.name,
    nameEn: dbCat.name_en ?? "",
    emoji: dbCat.emoji ?? "",
    availableDeliveryMethods: dbCat.available_delivery_methods || ["pickup"],
    defaultShippingFee: dbCat.default_shipping_fee || 0,
  };
}

// 카테고리 전체 목록 조회
export async function getCategories(): Promise<CategoryInfo[]> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return staticCategories;

    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return staticCategories;

    return data.map(toCategory);
  } catch {
    console.warn("카테고리 조회 실패, 정적 데이터 사용");
    return staticCategories;
  }
}

// 카테고리 전체 목록 조회 (DB 원본)
export async function getCategoriesRaw(): Promise<DbCategory[]> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// 단일 카테고리 조회
export async function getCategory(id: string): Promise<DbCategory | null> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// 카테고리 추가
export async function createCategory(
  item: Omit<DbCategory, "created_at" | "updated_at">
): Promise<DbCategory> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { data, error } = await supabase
    .from("menu_categories")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 카테고리 수정
export async function updateCategory(
  id: string,
  updates: Partial<Omit<DbCategory, "id" | "created_at" | "updated_at">>
): Promise<DbCategory> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { data, error } = await supabase
    .from("menu_categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 카테고리 삭제
export async function deleteCategory(id: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  // 해당 카테고리를 사용하는 메뉴 아이템이 있는지 확인
  const { count, error: countError } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("category", id);

  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(`이 카테고리에 ${count}개의 메뉴가 있어 삭제할 수 없습니다. 먼저 메뉴를 이동하거나 삭제해주세요.`);
  }

  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) throw error;
}

// ========== 메뉴 관련 ==========

export interface DbMenuItem {
  id: string;
  name: string;
  name_en: string | null;
  description: string;
  price: number;
  category: string;
  image: string | null;
  allergens: string[];
  is_popular: boolean;
  is_new: boolean;
  is_consultation: boolean;
  hide_price: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// DB 데이터를 프론트엔드 MenuItem 형식으로 변환
export function toMenuItem(
  db: DbMenuItem,
  images?: { id: string; image_url: string; sort_order: number }[],
  hasOptions?: boolean
): MenuItem {
  return {
    id: db.id,
    name: db.name,
    nameEn: db.name_en ?? undefined,
    description: db.description,
    price: db.price,
    category: db.category as MenuItem["category"],
    image: db.image ?? undefined,
    allergens: db.allergens as MenuItem["allergens"],
    isPopular: db.is_popular,
    isNew: db.is_new,
    isConsultation: db.is_consultation,
    hidePrice: db.hide_price,
    images: images?.map((img) => ({
      id: img.id,
      imageUrl: img.image_url,
      sortOrder: img.sort_order,
    })),
    hasOptions,
  };
}

// 프론트엔드 MenuItem을 DbMenuItem 형식으로 변환 (정적 데이터 fallback용)
function toDbMenuItem(item: MenuItem, index: number): DbMenuItem {
  return {
    id: item.id,
    name: item.name,
    name_en: item.nameEn ?? null,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image ?? null,
    allergens: item.allergens,
    is_popular: item.isPopular ?? false,
    is_new: item.isNew ?? false,
    is_consultation: item.isConsultation ?? false,
    hide_price: item.hidePrice ?? false,
    sort_order: index,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Supabase 연결 여부 확인
export function isDbConnected(): boolean {
  return isSupabaseConfigured();
}

// 메뉴 전체 목록 조회 (DB 실패 시 정적 데이터 fallback)
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return staticMenuItems;

    const { data, error } = await supabase
      .from("menu_items")
      .select("*, menu_item_images(*), menu_option_groups(id)")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return staticMenuItems;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) =>
      toMenuItem(
        item as DbMenuItem,
        item.menu_item_images,
        Array.isArray(item.menu_option_groups) && item.menu_option_groups.length > 0
      )
    );
  } catch {
    console.warn("Supabase 연결 실패, 정적 데이터 사용");
    return staticMenuItems;
  }
}

// 단일 메뉴 조회 (DB 실패 시 정적 데이터 fallback)
export async function getMenuItem(id: string): Promise<DbMenuItem | null> {
  const supabase = getServiceSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) return data;
  }

  // 정적 데이터에서 fallback 조회
  const index = staticMenuItems.findIndex((item) => item.id === id);
  if (index === -1) return null;
  return toDbMenuItem(staticMenuItems[index], index);
}

// 메뉴 추가
export async function createMenuItem(
  item: Omit<DbMenuItem, "created_at" | "updated_at">
): Promise<DbMenuItem> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { data, error } = await supabase
    .from("menu_items")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 메뉴 수정
export async function updateMenuItem(
  id: string,
  updates: Partial<Omit<DbMenuItem, "id" | "created_at" | "updated_at">>
): Promise<DbMenuItem> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { data, error } = await supabase
    .from("menu_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 메뉴 삭제
export async function deleteMenuItem(id: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

// 이미지 업로드
export async function uploadMenuImage(
  file: Buffer,
  fileName: string
): Promise<string> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase 미설정");

  const filePath = `menu/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("menu-images")
    .upload(filePath, file, {
      contentType: `image/${fileName.split(".").pop()}`,
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(filePath);

  return publicUrl;
}

// 이미지 삭제
export async function deleteMenuImage(imageUrl: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;

  const path = imageUrl.split("/menu-images/")[1];
  if (!path) return;

  await supabase.storage.from("menu-images").remove([path]);
}
