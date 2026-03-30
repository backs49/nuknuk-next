import { getMenuItem, getCategories } from "@/lib/menu-db";
import { getMenuDetail } from "@/lib/menu-option-db";
import { notFound } from "next/navigation";
import MenuDetailClient from "@/components/menu/MenuDetailClient";

export const revalidate = 60;

export default async function MenuDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [menuItem, detail, categories] = await Promise.all([
    getMenuItem(params.id),
    getMenuDetail(params.id),
    getCategories(),
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
    />
  );
}
