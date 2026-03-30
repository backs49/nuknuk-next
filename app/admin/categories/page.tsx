"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  name_en: string | null;
  emoji: string;
  sort_order: number;
  available_delivery_methods: string[];
  default_shipping_fee: number;
}

interface FormData {
  id: string;
  name: string;
  name_en: string;
  emoji: string;
  sort_order: number;
  pickup: boolean;
  shipping: boolean;
  default_shipping_fee: number;
}

const emptyForm: FormData = {
  id: "",
  name: "",
  name_en: "",
  emoji: "",
  sort_order: 0,
  pickup: true,
  shipping: false,
  default_shipping_fee: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    const maxOrder = categories.reduce(
      (max, c) => Math.max(max, c.sort_order),
      0
    );
    setForm({ ...emptyForm, sort_order: maxOrder + 1 });
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function startEdit(cat: Category) {
    const methods = cat.available_delivery_methods ?? ["pickup"];
    setForm({
      id: cat.id,
      name: cat.name,
      name_en: cat.name_en ?? "",
      emoji: cat.emoji,
      sort_order: cat.sort_order,
      pickup: methods.includes("pickup"),
      shipping: methods.includes("shipping"),
      default_shipping_fee: cat.default_shipping_fee ?? 0,
    });
    setEditingId(cat.id);
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("카테고리 이름을 입력하세요.");
      return;
    }
    if (!editingId && !form.id.trim()) {
      setError("카테고리 ID를 입력하세요.");
      return;
    }
    if (!form.pickup && !form.shipping) {
      setError("수령 방식을 최소 1개 이상 선택하세요.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = isEdit ? "PUT" : "POST";

      const deliveryMethods: string[] = [];
      if (form.pickup) deliveryMethods.push("pickup");
      if (form.shipping) deliveryMethods.push("shipping");

      const commonFields = {
        name: form.name,
        name_en: form.name_en || null,
        emoji: form.emoji,
        sort_order: form.sort_order,
        available_delivery_methods: deliveryMethods,
        default_shipping_fee: form.shipping ? form.default_shipping_fee : 0,
      };

      const body = isEdit
        ? commonFields
        : { id: form.id, ...commonFields };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }

      await fetchCategories();
      cancelForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) return;

    setDeleting(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제 실패");
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-400">
            카테고리 관리
          </h1>
          <p className="text-sm text-charcoal-200 mt-1">
            {categories.length}개의 카테고리
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-sage-400 text-white text-sm font-medium rounded-lg hover:bg-sage-500 transition whitespace-nowrap"
          >
            + 새 카테고리 추가
          </button>
        )}
      </div>

      {/* 추가/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-charcoal-400 mb-4">
            {editingId ? "카테고리 수정" : "새 카테고리 추가"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID (생성 시에만) */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-300 mb-1">
                    ID <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-charcoal-100 mb-1">
                    영문 소문자, 하이픈 (예: rice-cake)
                  </p>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        id: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                    className="input"
                    placeholder="category-id"
                    required
                  />
                </div>
              )}

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  이름 (한글) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input"
                  placeholder="떡"
                  required
                />
              </div>

              {/* 영문 이름 */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  이름 (영문)
                </label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name_en: e.target.value }))
                  }
                  className="input"
                  placeholder="Rice Cake"
                />
              </div>

              {/* 이모지 */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  이모지
                </label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, emoji: e.target.value }))
                  }
                  className="input w-24"
                  placeholder="🍡"
                />
              </div>

              {/* 정렬 순서 */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sort_order: Number(e.target.value),
                    }))
                  }
                  className="input w-24"
                  min={0}
                />
              </div>
            </div>

            {/* 수령 방식 */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              <label className="block text-sm font-medium text-charcoal-300 mb-2">
                수령 방식 <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pickup}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pickup: e.target.checked }))
                    }
                    className="w-4 h-4 text-sage-400 rounded focus:ring-sage-400"
                  />
                  <span className="text-sm text-charcoal-400">픽업 (매장 수령)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.shipping}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, shipping: e.target.checked }))
                    }
                    className="w-4 h-4 text-sage-400 rounded focus:ring-sage-400"
                  />
                  <span className="text-sm text-charcoal-400">택배 배송</span>
                </label>
              </div>

              {/* 택배비 (택배 배송 선택 시) */}
              {form.shipping && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-charcoal-300 mb-1">
                    택배비 (원)
                  </label>
                  <input
                    type="number"
                    value={form.default_shipping_fee}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        default_shipping_fee: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="input w-40"
                    min={0}
                    step={500}
                    placeholder="4000"
                  />
                  <p className="text-xs text-charcoal-100 mt-1">
                    이 카테고리 상품의 기본 택배비
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-sage-400 text-white text-sm font-medium rounded-lg hover:bg-sage-500 transition disabled:opacity-50"
              >
                {saving
                  ? "저장 중..."
                  : editingId
                  ? "변경사항 저장"
                  : "카테고리 추가"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2.5 text-sm text-charcoal-200 hover:text-charcoal-400 transition"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 카테고리 목록 */}
      {loading ? (
        <p className="text-charcoal-200">로딩 중...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    순서
                  </th>
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    카테고리
                  </th>
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    ID
                  </th>
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    영문명
                  </th>
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    수령 방식
                  </th>
                  <th className="text-right text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="text-sm text-charcoal-200">
                        {cat.sort_order}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="font-medium text-charcoal-400">
                        {cat.emoji} {cat.name}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <code className="text-xs text-charcoal-200 bg-gray-100 px-2 py-1 rounded">
                        {cat.id}
                      </code>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <span className="text-sm text-charcoal-200">
                        {cat.name_en || "-"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(cat.available_delivery_methods ?? ["pickup"]).map((m) => (
                          <span
                            key={m}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              m === "pickup"
                                ? "bg-sage-400/10 text-sage-400"
                                : "bg-blue-50 text-blue-500"
                            }`}
                          >
                            {m === "pickup" ? "픽업" : "택배"}
                          </span>
                        ))}
                        {(cat.available_delivery_methods ?? []).includes("shipping") &&
                          cat.default_shipping_fee > 0 && (
                            <span className="text-xs text-charcoal-100">
                              ({cat.default_shipping_fee.toLocaleString()}원)
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="px-3 py-1.5 text-xs text-charcoal-300 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deleting === cat.id}
                          className="px-3 py-1.5 text-xs text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {deleting === cat.id ? "..." : "삭제"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 text-charcoal-200">
              카테고리가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
