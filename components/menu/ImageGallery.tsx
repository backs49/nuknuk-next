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
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
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

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

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
      setCurrentIndex((prev) => Math.min(prev + 1, total - 1));
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [total]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

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
      {/* Main image container */}
      <div
        ref={imageContainerRef}
        className="relative aspect-[4/3] lg:aspect-square overflow-hidden cursor-crosshair group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={displayImages[currentIndex]}
          alt={`${menuName} ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={currentIndex === 0}
        />

{/* 렌즈는 확대 오버레이가 전체를 덮으므로 불필요 */}

        {/* Counter (모바일) */}
        {showControls && (
          <div className="lg:hidden absolute top-3 right-3 px-2.5 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
            {currentIndex + 1}/{total}
          </div>
        )}

        {/* PC: 좌우 화살표 (hover 시 표시) */}
        {showControls && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="hidden lg:flex absolute left-0 top-0 bottom-0 w-12 items-center justify-center
                bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="이전 이미지"
            >
              <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="hidden lg:flex absolute right-0 top-0 bottom-0 w-12 items-center justify-center
                bg-gradient-to-l from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="다음 이미지"
            >
              <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* PC: 확대 오버레이 (이미지 위에 줌 표시) */}
      {isHovering && (
        <div
          className="hidden lg:block absolute inset-0 aspect-[4/3] lg:aspect-square overflow-hidden rounded-none lg:rounded-2xl z-30 pointer-events-none"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${displayImages[currentIndex]})`,
              backgroundSize: "250%",
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      )}

      {/* 모바일: 점 인디케이터 */}
      {showControls && (
        <div className="flex lg:hidden justify-center gap-1.5 py-3">
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

      {/* PC: 썸네일 스트립 */}
      {showControls && (
        <div className="hidden lg:flex gap-2 mt-3">
          {displayImages.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                idx === currentIndex
                  ? "border-sage-400 shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt={`${menuName} 썸네일 ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
