import { getSupabaseOrThrow } from "./db-utils";
import { getServiceSupabase } from "./supabase";
import type { OptionGroup, OptionItem, MenuImage, DetailBlock } from "./option-utils";

// ========== 내부 DB 타입 ==========

interface DbOptionGroup {
  id: string;
  menu_item_id: string;
  name: string;
  type: string;
  required: boolean;
  price_mode: string;
  sort_order: number;
  created_at: string;
}

interface DbOptionItem {
  id: string;
  group_id: string;
  name: string;
  price: number;
  sort_order: number;
  created_at: string;
}

interface DbMenuImage {
  id: string;
  menu_item_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

interface DbDetailBlock {
  id: string;
  menu_item_id: string;
  type: string;
  content: string;
  sort_order: number;
  created_at: string;
}

// ========== 변환 함수 ==========

function toOptionGroup(db: DbOptionGroup, items: DbOptionItem[]): OptionGroup {
  const groupItems: OptionItem[] = items
    .filter((item) => item.group_id === db.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      id: item.id,
      groupId: item.group_id,
      name: item.name,
      price: item.price,
      sortOrder: item.sort_order,
    }));

  return {
    id: db.id,
    menuItemId: db.menu_item_id,
    name: db.name,
    type: db.type as OptionGroup["type"],
    required: db.required,
    priceMode: db.price_mode as OptionGroup["priceMode"],
    sortOrder: db.sort_order,
    items: groupItems,
  };
}

function toMenuImage(db: DbMenuImage): MenuImage {
  return {
    id: db.id,
    menuItemId: db.menu_item_id,
    imageUrl: db.image_url,
    sortOrder: db.sort_order,
  };
}

function toDetailBlock(db: DbDetailBlock): DetailBlock {
  return {
    id: db.id,
    menuItemId: db.menu_item_id,
    type: db.type as DetailBlock["type"],
    content: db.content,
    sortOrder: db.sort_order,
  };
}

// ========== 이미지 함수 ==========

export async function getMenuImages(menuItemId: string): Promise<MenuImage[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_item_images")
    .select("*")
    .eq("menu_item_id", menuItemId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toMenuImage);
}

export async function saveMenuImages(
  menuItemId: string,
  images: { imageUrl: string; sortOrder: number }[]
): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error: deleteError } = await supabase
    .from("menu_item_images")
    .delete()
    .eq("menu_item_id", menuItemId);

  if (deleteError) throw deleteError;

  if (images.length === 0) return;

  const rows = images.map((img) => ({
    menu_item_id: menuItemId,
    image_url: img.imageUrl,
    sort_order: img.sortOrder,
  }));

  const { error: insertError } = await supabase
    .from("menu_item_images")
    .insert(rows);

  if (insertError) throw insertError;
}

export async function deleteMenuImageRecord(imageId: string): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error } = await supabase
    .from("menu_item_images")
    .delete()
    .eq("id", imageId);

  if (error) throw error;
}

// ========== 상세 블록 함수 ==========

export async function getDetailBlocks(menuItemId: string): Promise<DetailBlock[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_detail_blocks")
    .select("*")
    .eq("menu_item_id", menuItemId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toDetailBlock);
}

export async function saveDetailBlocks(
  menuItemId: string,
  blocks: { type: "text" | "image"; content: string; sortOrder: number }[]
): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error: deleteError } = await supabase
    .from("menu_detail_blocks")
    .delete()
    .eq("menu_item_id", menuItemId);

  if (deleteError) throw deleteError;

  if (blocks.length === 0) return;

  const rows = blocks.map((block) => ({
    menu_item_id: menuItemId,
    type: block.type,
    content: block.content,
    sort_order: block.sortOrder,
  }));

  const { error: insertError } = await supabase
    .from("menu_detail_blocks")
    .insert(rows);

  if (insertError) throw insertError;
}

// ========== 옵션 함수 ==========

export async function getMenuOptions(menuItemId: string): Promise<OptionGroup[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data: groups, error: groupError } = await supabase
    .from("menu_option_groups")
    .select("*")
    .eq("menu_item_id", menuItemId)
    .order("sort_order", { ascending: true });

  if (groupError) throw groupError;
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g: DbOptionGroup) => g.id);

  const { data: items, error: itemError } = await supabase
    .from("menu_option_items")
    .select("*")
    .in("group_id", groupIds)
    .order("sort_order", { ascending: true });

  if (itemError) throw itemError;

  return groups.map((group: DbOptionGroup) =>
    toOptionGroup(group, items ?? [])
  );
}

export async function saveMenuOptions(
  menuItemId: string,
  groups: {
    name: string;
    type: "single" | "multi";
    required: boolean;
    priceMode: "additional" | "fixed";
    sortOrder: number;
    items: { name: string; price: number; sortOrder: number }[];
  }[]
): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error: deleteError } = await supabase
    .from("menu_option_groups")
    .delete()
    .eq("menu_item_id", menuItemId);

  if (deleteError) throw deleteError;

  for (const group of groups) {
    const { data: insertedGroup, error: groupError } = await supabase
      .from("menu_option_groups")
      .insert({
        menu_item_id: menuItemId,
        name: group.name,
        type: group.type,
        required: group.required,
        price_mode: group.priceMode,
        sort_order: group.sortOrder,
      })
      .select("id")
      .single();

    if (groupError) throw groupError;

    if (group.items.length > 0) {
      const itemRows = group.items.map((item) => ({
        group_id: insertedGroup.id,
        name: item.name,
        price: item.price,
        sort_order: item.sortOrder,
      }));

      const { error: itemError } = await supabase
        .from("menu_option_items")
        .insert(itemRows);

      if (itemError) throw itemError;
    }
  }
}

export async function copyOptionsFromMenu(
  sourceMenuId: string,
  targetMenuId: string
): Promise<void> {
  const sourceOptions = await getMenuOptions(sourceMenuId);

  const saveFormat = sourceOptions.map((group) => ({
    name: group.name,
    type: group.type,
    required: group.required,
    priceMode: group.priceMode,
    sortOrder: group.sortOrder,
    items: group.items.map((item) => ({
      name: item.name,
      price: item.price,
      sortOrder: item.sortOrder,
    })),
  }));

  await saveMenuOptions(targetMenuId, saveFormat);
}

// ========== 배치 조회 ==========

export async function getMenuDetail(menuItemId: string): Promise<{
  images: MenuImage[];
  blocks: DetailBlock[];
  options: OptionGroup[];
}> {
  const [images, blocks, options] = await Promise.all([
    getMenuImages(menuItemId),
    getDetailBlocks(menuItemId),
    getMenuOptions(menuItemId),
  ]);

  return { images, blocks, options };
}
