"use client";

import Image from "next/image";
import type { DetailBlock } from "@/lib/option-utils";

interface DetailBlocksProps {
  blocks: DetailBlock[];
}

// << >> 로 감싼 텍스트를 강조 박스로, **텍스트**를 볼드로 변환
function renderStyledText(text: string) {
  const lines = text.split("\n");

  return lines.map((line, i) => {
    const trimmed = line.trim();

    // << >> 로 감싼 라인 → 강조 박스
    const bracketMatch = trimmed.match(/^<<\s*(.+?)\s*>>$/);
    if (bracketMatch) {
      return (
        <div
          key={i}
          className="my-3 px-4 py-2.5 bg-sage-400/10 border-l-4 border-sage-400 rounded-r-lg text-base font-semibold text-charcoal-400"
        >
          {bracketMatch[1]}
        </div>
      );
    }

    // 빈 줄 → 간격
    if (trimmed === "") {
      return <div key={i} className="h-2" />;
    }

    // **볼드** 처리가 있는 일반 텍스트
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const hasBold = parts.some((p) => p.startsWith("**"));

    return (
      <p key={i} className="text-base text-charcoal-300 leading-relaxed">
        {hasBold
          ? parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold text-charcoal-400">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )
          : line}
      </p>
    );
  });
}

export default function DetailBlocks({ blocks }: DetailBlocksProps) {
  if (blocks.length === 0) return null;

  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      {sorted.map((block) => {
        if (block.type === "text") {
          return (
            <div key={block.id}>
              {renderStyledText(block.content)}
            </div>
          );
        }

        if (block.type === "image") {
          return (
            <div
              key={block.id}
              className="rounded-xl overflow-hidden"
            >
              <Image
                src={block.content}
                alt=""
                width={800}
                height={600}
                className="w-full h-auto"
                sizes="100vw"
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
