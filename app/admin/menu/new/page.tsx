"use client";

import MenuForm from "@/components/admin/MenuForm";

export default function NewMenuPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-400 mb-8">
        새 메뉴 추가
      </h1>
      <MenuForm mode="create" />
    </div>
  );
}
