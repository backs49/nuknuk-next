"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

// 카테고리별 플레이스홀더 그래디언트
const categoryGradients: Record<string, string> = {
  "rice-cake": "from-warm-100 via-cream-200 to-warm-200",
  cake: "from-blush-100 via-cream-100 to-blush-200",
  cookie: "from-warm-200 via-cream-200 to-warm-100",
  beverage: "from-sage-100 via-cream-100 to-sage-100",
};

const categoryIcons: Record<string, string> = {
  "rice-cake": "\u{1F361}",
  cake: "\u{1F382}",
  cookie: "\u{1F36A}",
  beverage: "\u{1F375}",
};

interface ImageGalleryProps {
  images: { id: string; imageUrl: string; sortOrder: number }[];
  fallbackImage?: string;
  menuName: string;
  category?: string;
}

export default function ImageGallery({
  images,
  fallbackImage,
  menuName,
  category,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Build display images list
  const displayImages =
    images.length > 0
      ? images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.imageUrl)
      : fallbackImage
        ? [fallbackImage]
        : [];

  const total = displayImages.length;
  const showControls = total > 1;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      // Swipe left -> next
      setCurrentIndex((prev) => Math.min(prev + 1, total - 1));
    } else {
      // Swipe right -> prev
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [total]);

  // No images at all: show category gradient placeholder
  if (total === 0) {
    const gradient = categoryGradients[category ?? ""] ?? categoryGradients["rice-cake"];
    const icon = categoryIcons[category ?? ""] ?? "\u{1F361}";

    return (
      <div className="relative aspect-[4/3] lg:aspect-square w-full">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <span className="text-7xl opacity-40">{icon}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Image container */}
      <div
        className="relative aspect-[4/3] lg:aspect-square overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={displayImages[currentIndex]}
          alt={`${menuName} ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={currentIndex === 0}
        />

        {/* Counter */}
        {showControls && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
            {currentIndex + 1}/{total}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {showControls && (
        <div className="flex justify-center gap-1.5 py-3">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? "bg-sage-400" : "bg-gray-300"
              }`}
              aria-label={`${idx + 1}번째 이미지`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
