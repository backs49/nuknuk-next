"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { resizeImage } from "@/lib/image-resize";

const MAX_IMAGES = 8;

interface ImageItem {
  id?: string;
  imageUrl: string;
  sortOrder: number;
}

interface MenuImageManagerProps {
  menuItemId: string;
  initialImages: { id: string; imageUrl: string; sortOrder: number }[];
  onImagesChange: (images: { imageUrl: string; sortOrder: number }[]) => void;
}

export default function MenuImageManager({
  menuItemId,
  initialImages,
  onImagesChange,
}: MenuImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>(
    initialImages.map((img, idx) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      sortOrder: idx,
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 편집 모드: API에서 기존 이미지 로드
  useEffect(() => {
    if (!menuItemId) return;
    fetch(`/api/admin/menu/${menuItemId}/images`)
      .then((res) => (res.ok ? res.json() : { images: [] }))
      .then((resp: { images: { id: string; imageUrl: string; sortOrder: number }[] }) => {
        const data = resp.images ?? [];
        if (data.length > 0) {
          const loaded = data.map((img, idx) => ({ id: img.id, imageUrl: img.imageUrl, sortOrder: idx }));
          setImages(loaded);
          onImagesChange(loaded.map((img, idx) => ({ imageUrl: img.imageUrl, sortOrder: idx })));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItemId]);

  function notifyChange(updated: ImageItem[]) {
    onImagesChange(
      updated.map((img, idx) => ({ imageUrl: img.imageUrl, sortOrder: idx }))
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      setError(`최대 ${MAX_IMAGES}장까지만 등록할 수 있습니다.`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 업로드 전 리사이즈 (Vercel 4.5MB body 제한 대응)
      const resized = await resizeImage(file, 1920, 0.85);

      let uploadUrl = "/api/admin/upload";
      let uploadMethod = "POST";
      const formData = new FormData();
      formData.append("file", resized);

      // Use the menu-specific endpoint if we have a real menuItemId
      if (menuItemId && menuItemId.trim() !== "") {
        uploadUrl = `/api/admin/menu/${menuItemId}/images`;
        uploadMethod = "POST";
      }

      const res = await fetch(uploadUrl, {
        method: uploadMethod,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "업로드 실패");
      }

      const data = await res.json();
      // Support both { url } and { imageUrl } response shapes
      const imageUrl = data.url || data.imageUrl;

      const updated = [
        ...images,
        { id: data.id, imageUrl, sortOrder: images.length },
      ];
      setImages(updated);
      notifyChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드 실패");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDelete(index: number) {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    notifyChange(updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...images];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setImages(updated);
    notifyChange(updated);
  }

  function handleMoveDown(index: number) {
    if (index === images.length - 1) return;
    const updated = [...images];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setImages(updated);
    notifyChange(updated);
  }

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-charcoal-100">
          첫 번째 이미지가 대표 이미지로 사용됩니다.
        </p>
        <span className="text-xs font-medium text-charcoal-200">
          {images.length} / {MAX_IMAGES}장
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, index) => (
          <div key={img.imageUrl + index} className="relative group">
            {/* Thumbnail */}
            <div
              className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition ${
                index === 0
                  ? "border-sage-400"
                  : "border-gray-200 group-hover:border-warm-300"
              }`}
            >
              <Image
                src={img.imageUrl}
                alt={`상품 이미지 ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 120px"
              />

              {/* Primary badge */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-sage-400 text-white text-[10px] font-semibold rounded-md leading-none">
                  대표
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                {/* Move Up */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="앞으로"
                  className="w-7 h-7 bg-white/90 text-charcoal-400 rounded-full flex items-center justify-center text-xs hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ←
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  title="삭제"
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition"
                >
                  ×
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === images.length - 1}
                  title="뒤로"
                  className="w-7 h-7 bg-white/90 text-charcoal-400 rounded-full flex items-center justify-center text-xs hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>

            {/* Index label */}
            <p className="text-center text-[10px] text-charcoal-100 mt-1">
              {index + 1}번
            </p>
          </div>
        ))}

        {/* Add image button */}
        {canAddMore && (
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-warm-300 hover:border-sage-400 bg-cream-100 hover:bg-cream-200 transition flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-charcoal-200">업로드 중</span>
                </>
              ) : (
                <>
                  <span className="text-xl text-charcoal-200 leading-none">+</span>
                  <span className="text-[10px] text-charcoal-200">이미지 추가</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-transparent mt-1 select-none">
              &nbsp;
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <p className="text-xs text-charcoal-100">
        JPG, PNG, WebP · 최대 10MB · 최대 {MAX_IMAGES}장
      </p>
    </div>
  );
}
