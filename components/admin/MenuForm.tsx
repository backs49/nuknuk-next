"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ALLERGENS = [
  { value: "gluten", label: "밀" },
  { value: "dairy", label: "유제품" },
  { value: "egg", label: "달걀" },
  { value: "nut", label: "견과류" },
  { value: "soy", label: "대두" },
  { value: "sesame", label: "참깨" },
];

export interface MenuFormData {
  id: string;
  name: string;
  name_en: string;
  description: string;
  price: number;
  category: string;
  image: string;
  allergens: string[];
  is_popular: boolean;
  is_new: boolean;
  is_consultation: boolean;
  hide_price: boolean;
  sort_order: number;
}

interface MenuFormProps {
  initialData?: Partial<MenuFormData>;
  mode: "create" | "edit";
}

export default function MenuForm({ initialData, mode }: MenuFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data: Array<{ id: string; name: string }>) => {
        setCategories(data.map((c) => ({ value: c.id, label: c.name })));
      })
      .catch(() => {
        // fallback
        setCategories([
          { value: "rice-cake", label: "떡" },
          { value: "cake", label: "케이크" },
          { value: "cookie", label: "쿠키·구움과자" },
          { value: "beverage", label: "음료" },
        ]);
      });
  }, []);

  const [form, setForm] = useState<MenuFormData>({
    id: initialData?.id || "",
    name: initialData?.name || "",
    name_en: initialData?.name_en || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || "rice-cake",
    image: initialData?.image || "",
    allergens: initialData?.allergens || [],
    is_popular: initialData?.is_popular || false,
    is_new: initialData?.is_new || false,
    is_consultation: initialData?.is_consultation || false,
    hide_price: initialData?.hide_price || false,
    sort_order: initialData?.sort_order || 0,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof MenuFormData>(
    key: K,
    value: MenuFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAllergen(allergen: string) {
    setForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "업로드 실패");
      }

      const { url } = await res.json();
      updateField("image", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    // 기본 검증
    if (!form.name.trim()) {
      setError("메뉴 이름을 입력하세요.");
      setSaving(false);
      return;
    }
    if (form.price <= 0) {
      setError("가격을 입력하세요.");
      setSaving(false);
      return;
    }
    if (mode === "create" && !form.id.trim()) {
      setError("메뉴 ID를 입력하세요.");
      setSaving(false);
      return;
    }

    try {
      const url =
        mode === "create"
          ? "/api/admin/menu"
          : `/api/admin/menu/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }

      router.push("/admin/menu");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {/* 기본 정보 */}
      <Section title="기본 정보">
        {mode === "create" && (
          <Field label="메뉴 ID" description="영문 소문자, 하이픈 사용 (예: mugwort-songpyeon)">
            <input
              type="text"
              value={form.id}
              onChange={(e) => updateField("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="input"
              placeholder="menu-id"
              required
            />
          </Field>
        )}

        <Field label="메뉴 이름 (한글)" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="input"
            placeholder="쑥 송편"
            required
          />
        </Field>

        <Field label="메뉴 이름 (영문)" description="선택사항">
          <input
            type="text"
            value={form.name_en}
            onChange={(e) => updateField("name_en", e.target.value)}
            className="input"
            placeholder="Mugwort Songpyeon"
          />
        </Field>

        <Field label="설명" required>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="국내산 햅쑥으로 빚은 정성 가득 송편."
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="가격 (원)" required>
            <input
              type="number"
              value={form.price || ""}
              onChange={(e) => updateField("price", Number(e.target.value))}
              className="input"
              min={0}
              step={500}
              placeholder="15000"
              required
            />
          </Field>

          <Field label="카테고리" required>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="정렬 순서" description="숫자가 작을수록 먼저 표시">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", Number(e.target.value))}
            className="input w-24"
            min={0}
          />
        </Field>
      </Section>

      {/* 제품 사진 */}
      <Section title="제품 사진">
        <div className="flex items-start gap-6">
          {/* 프리뷰 */}
          <div
            className="w-40 h-32 rounded-xl overflow-hidden bg-cream-200 flex items-center justify-center cursor-pointer border-2 border-dashed border-warm-300 hover:border-sage-400 transition shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {form.image ? (
              <Image
                src={form.image}
                alt="메뉴 사진"
                width={160}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-charcoal-200">
                <p className="text-2xl mb-1">📷</p>
                <p className="text-xs">클릭하여 업로드</p>
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm bg-gray-100 text-charcoal-300 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "파일 선택"}
            </button>
            <p className="text-xs text-charcoal-100 mt-2">
              JPG, PNG, WebP / 최대 10MB
            </p>
            {form.image && (
              <button
                type="button"
                onClick={() => updateField("image", "")}
                className="text-xs text-red-500 mt-1 hover:underline"
              >
                사진 제거
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* 알레르기 정보 */}
      <Section title="알레르기 정보">
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((allergen) => (
            <button
              key={allergen.value}
              type="button"
              onClick={() => toggleAllergen(allergen.value)}
              className={`px-4 py-2 text-sm rounded-lg border transition ${form.allergens.includes(allergen.value)
                  ? "bg-sage-400 text-white border-sage-400"
                  : "bg-white text-charcoal-300 border-gray-200 hover:border-sage-300"
                }`}
            >
              {allergen.label}
            </button>
          ))}
        </div>
      </Section>

      {/* 배지 설정 */}
      <Section title="배지 설정">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => updateField("is_popular", e.target.checked)}
              className="w-4 h-4 text-sage-400 rounded border-gray-300 focus:ring-sage-400"
            />
            <span className="text-sm text-charcoal-300">인기 메뉴</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_new}
              onChange={(e) => updateField("is_new", e.target.checked)}
              className="w-4 h-4 text-sage-400 rounded border-gray-300 focus:ring-sage-400"
            />
            <span className="text-sm text-charcoal-300">신메뉴</span>
          </label>
        </div>
      </Section>

      {/* 상담 상품 설정 */}
      <Section title="상담 상품 설정">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_consultation}
              onChange={(e) => setForm({ ...form, is_consultation: e.target.checked, hide_price: e.target.checked ? form.hide_price : false })}
              className="w-4 h-4 rounded border-gray-300 text-sage-400 focus:ring-sage-400"
            />
            <span className="text-sm text-charcoal-300">상담 후 결정 상품</span>
          </label>
          <p className="text-xs text-charcoal-100 ml-6">체크 시 장바구니/바로구매 대신 &quot;상담하기&quot; 버튼이 표시됩니다.</p>

          {form.is_consultation && (
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={form.hide_price}
                onChange={(e) => setForm({ ...form, hide_price: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sage-400 focus:ring-sage-400"
              />
              <span className="text-sm text-charcoal-300">가격 숨기기</span>
            </label>
          )}
        </div>
      </Section>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-sage-400 text-white font-medium rounded-xl hover:bg-sage-500 transition disabled:opacity-50"
        >
          {saving
            ? "저장 중..."
            : mode === "create"
              ? "메뉴 추가"
              : "변경사항 저장"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/menu")}
          className="px-6 py-3 text-charcoal-200 hover:text-charcoal-400 transition"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-charcoal-400 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  description,
  required,
  children,
}: {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal-300 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-charcoal-100 mb-1">{description}</p>
      )}
      {children}
    </div>
  );
}
