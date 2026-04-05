"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MenuForm, { type MenuFormData } from "@/components/admin/MenuForm";

export default function EditMenuPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<MenuFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/menu/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("메뉴를 찾을 수 없습니다");
        return res.json();
      })
      .then((item) => {
        setData({
          id: item.id,
          name: item.name,
          name_en: item.name_en || "",
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image || "",
          allergens: item.allergens || [],
          is_popular: item.is_popular || item.isPopular || false,
          is_new: item.is_new || item.isNew || false,
          is_consultation: item.is_consultation || false,
          hide_price: item.hide_price || false,
          is_active: item.is_active ?? true,
          sort_order: item.sort_order || 0,
        });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-charcoal-200">로딩 중...</p>;
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "메뉴를 찾을 수 없습니다"}</p>
        <button
          onClick={() => router.push("/admin/menu")}
          className="text-sm text-sage-400 hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-400 mb-8">
        메뉴 수정 — {data.name}
      </h1>
      <MenuForm mode="edit" initialData={data} />
    </div>
  );
}
