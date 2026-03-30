"use client";

import Image from "next/image";
import type { DetailBlock } from "@/lib/option-utils";

interface DetailBlocksProps {
  blocks: DetailBlock[];
}

export default function DetailBlocks({ blocks }: DetailBlocksProps) {
  if (blocks.length === 0) return null;

  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      {sorted.map((block) => {
        if (block.type === "text") {
          return (
            <div
              key={block.id}
              className="whitespace-pre-line text-sm text-charcoal-300 leading-relaxed"
            >
              {block.content}
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
