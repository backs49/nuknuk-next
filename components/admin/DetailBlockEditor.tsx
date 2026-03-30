"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface DetailBlock {
  type: "text" | "image";
  content: string;
  sortOrder: number;
}

interface DetailBlockEditorProps {
  menuItemId: string;
  onBlocksChange: (blocks: DetailBlock[]) => void;
}

export default function DetailBlockEditor({
  menuItemId,
  onBlocksChange,
}: DetailBlockEditorProps) {
  const [blocks, setBlocks] = useState<DetailBlock[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load initial blocks for edit mode
  useEffect(() => {
    if (!menuItemId) return;
    fetch(`/api/admin/menu/${menuItemId}/detail-blocks`)
      .then((res) => (res.ok ? res.json() : { blocks: [] }))
      .then((resp: { blocks: DetailBlock[] }) => {
        const data = resp.blocks ?? [];
        if (data.length > 0) {
          const sorted = data
            .map((b, i) => ({ ...b, sortOrder: i }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setBlocks(sorted);
          onBlocksChange(sorted);
        }
      })
      .catch(() => {
        // silently ignore — blocks just start empty
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItemId]);

  function notifyChange(updated: DetailBlock[]) {
    const recalculated = updated.map((b, i) => ({ ...b, sortOrder: i }));
    setBlocks(recalculated);
    onBlocksChange(recalculated);
  }

  function addTextBlock() {
    notifyChange([...blocks, { type: "text", content: "", sortOrder: blocks.length }]);
  }

  function addImageBlock() {
    notifyChange([...blocks, { type: "image", content: "", sortOrder: blocks.length }]);
  }

  function deleteBlock(index: number) {
    const updated = blocks.filter((_, i) => i !== index);
    notifyChange(updated);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...blocks];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    notifyChange(updated);
  }

  function moveDown(index: number) {
    if (index === blocks.length - 1) return;
    const updated = [...blocks];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    notifyChange(updated);
  }

  function updateTextContent(index: number, value: string) {
    const updated = blocks.map((b, i) =>
      i === index ? { ...b, content: value } : b
    );
    notifyChange(updated);
  }

  async function handleImageUpload(index: number, file: File) {
    setUploading(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();
      const updated = blocks.map((b, i) =>
        i === index ? { ...b, content: data.url } : b
      );
      notifyChange(updated);
    } catch {
      // silently ignore upload errors
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-4">
      {blocks.length === 0 && (
        <p className="text-sm text-charcoal-100 italic py-2">
          상세 설명이 없으면 고객 상세 페이지에서 이 섹션이 표시되지 않습니다
        </p>
      )}

      {blocks.map((block, index) => (
        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Block Header */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              backgroundColor: block.type === "text" ? "#EFF6FF" : "#F0FDF4",
              borderBottom: `2px solid ${block.type === "text" ? "#3B82F6" : "#6B8E23"}`,
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: block.type === "text" ? "#2563EB" : "#6B8E23" }}
            >
              {block.type === "text" ? "텍스트" : "이미지"}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
                title="위로 이동"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === blocks.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
                title="아래로 이동"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => deleteBlock(index)}
                className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 transition text-xs font-bold"
                title="삭제"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Block Content */}
          <div className="p-4 bg-white">
            {block.type === "text" ? (
              <textarea
                value={block.content}
                onChange={(e) => {
                  updateTextContent(index, e.target.value);
                  // auto-height
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                className="w-full text-sm text-charcoal-300 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[80px]"
                placeholder="텍스트를 입력하세요..."
                rows={3}
                onFocus={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            ) : (
              <div className="space-y-3">
                {block.content ? (
                  <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-gray-100">
                    <Image
                      src={block.content}
                      alt="블록 이미지"
                      width={400}
                      height={300}
                      className="object-cover w-full"
                      style={{ maxHeight: "200px", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-sm h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-charcoal-100">이미지 없음</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileInputRefs.current[index] = el;
                  }}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(index, file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  disabled={uploading === index}
                  className="px-4 py-2 text-sm border border-sage-400 text-sage-400 rounded-lg hover:bg-sage-50 transition disabled:opacity-50"
                >
                  {uploading === index ? "업로드 중..." : block.content ? "이미지 변경" : "이미지 선택"}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add Block Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={addTextBlock}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
          <span className="text-base leading-none">+</span>
          텍스트
        </button>
        <button
          type="button"
          onClick={addImageBlock}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-sage-400 border border-sage-300 bg-green-50 rounded-lg hover:bg-green-100 transition"
          style={{ borderColor: "#6B8E23", color: "#6B8E23" }}
        >
          <span className="text-base leading-none">+</span>
          이미지
        </button>
      </div>
    </div>
  );
}
