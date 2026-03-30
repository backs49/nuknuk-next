"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { DbMenuItem } from "@/lib/menu-db";
import { toMenuItem } from "@/lib/menu-db";
import type { CategoryInfo, Allergen } from "@/data/menu";
import { allergenInfo, formatPrice } from "@/data/menu";
import type {
  OptionGroup,
  MenuImage,
  DetailBlock,
  SelectedOption,
} from "@/lib/option-utils";
import {
  calculateOptionPrice,
  validateRequiredOptions,
} from "@/lib/option-utils";
import ImageGallery from "./ImageGallery";
import OptionSelector from "./OptionSelector";
import DetailBlocks from "./DetailBlocks";
import StickyOrderBar from "./StickyOrderBar";

interface MenuDetailClientProps {
  menuItem: DbMenuItem;
  category: CategoryInfo | null;
  images: MenuImage[];
  blocks: DetailBlock[];
  options: OptionGroup[];
}

export default function MenuDetailClient({
  menuItem: dbMenuItem,
  category,
  images,
  blocks,
  options,
}: MenuDetailClientProps) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);

  const item = toMenuItem(
    dbMenuItem,
    undefined,
    options.length > 0
  );

  const totalPrice = calculateOptionPrice(item.price, selectedOptions);
  const { valid: isValid, missingGroups } = validateRequiredOptions(
    options,
    selectedOptions
  );

  // If no required options, it's always valid
  const effectiveIsValid =
    options.filter((g) => g.required).length === 0 ? true : isValid;

  const handleSelectionChange = useCallback(
    (opts: SelectedOption[]) => {
      setSelectedOptions(opts);
    },
    []
  );

  const galleryImages = images.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    sortOrder: img.sortOrder,
  }));

  return (
    <div className="min-h-screen bg-cream-100 pb-24 lg:pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link
            href="/#menu"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-300 hover:text-charcoal-400 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            메뉴로 돌아가기
          </Link>
        </div>
      </div>

      {/* PC: 2-column layout / Mobile: single column */}
      <div className="max-w-6xl mx-auto lg:px-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          {/* Left column: Image gallery */}
          <div>
            <div className="lg:rounded-2xl lg:overflow-hidden lg:shadow-sm">
              <ImageGallery
                images={galleryImages}
                fallbackImage={item.image}
                menuName={item.name}
                category={item.category}
              />
            </div>
          </div>

          {/* Right column: Product info + Options + Order (PC: sticky) */}
          <div className="lg:relative">
            <div className="lg:sticky lg:top-20">
              {/* Basic info */}
              <div className="bg-white px-4 py-5 lg:rounded-2xl lg:shadow-sm lg:px-6">
                <div className="max-w-lg mx-auto lg:max-w-none">
                  {/* Category + badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {category && (
                      <span className="text-xs text-charcoal-200">
                        {category.emoji} {category.name}
                      </span>
                    )}
                    {item.isNew && (
                      <span className="px-2 py-0.5 bg-blush-400 text-white text-[10px] font-bold rounded-full">
                        NEW
                      </span>
                    )}
                    {item.isPopular && (
                      <span className="px-2 py-0.5 bg-sage-400 text-white text-[10px] font-bold rounded-full">
                        인기
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h1 className="text-xl lg:text-2xl font-bold text-charcoal-400 mb-1">
                    {item.name}
                  </h1>
                  {item.nameEn && (
                    <p className="text-xs text-charcoal-100 mb-3">{item.nameEn}</p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-charcoal-300 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Price */}
                  {!item.hidePrice && (
                    <p className="text-xl lg:text-2xl font-bold text-sage-400">
                      {options.length > 0 && (
                        <span className="text-sm font-normal text-charcoal-200 mr-1">
                          ~
                        </span>
                      )}
                      {formatPrice(item.price)}
                    </p>
                  )}
                  {item.isConsultation && item.hidePrice && (
                    <p className="text-lg font-semibold text-blush-400">
                      상담 후 결정
                    </p>
                  )}
                </div>
              </div>

              {/* Option selector */}
              {options.length > 0 && (
                <div className="mt-2 bg-white px-4 py-5 lg:mt-4 lg:rounded-2xl lg:shadow-sm lg:px-6">
                  <div className="max-w-lg mx-auto lg:max-w-none">
                    <h2 className="text-base font-semibold text-charcoal-400 mb-3">
                      옵션 선택
                    </h2>
                    <OptionSelector
                      groups={options}
                      basePrice={item.price}
                      onSelectionChange={handleSelectionChange}
                    />
                  </div>
                </div>
              )}

              {/* Allergen info */}
              {item.allergens.length > 0 && (
                <div className="mt-2 bg-white px-4 py-5 lg:mt-4 lg:rounded-2xl lg:shadow-sm lg:px-6">
                  <div className="max-w-lg mx-auto lg:max-w-none">
                    <h2 className="text-base font-semibold text-charcoal-400 mb-3">
                      알레르기 정보
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {item.allergens.map((allergen) => {
                        const info = allergenInfo[allergen as Allergen];
                        if (!info) return null;
                        return (
                          <span
                            key={allergen}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-cream-100 rounded-full text-sm text-charcoal-300"
                          >
                            {info.icon} {info.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PC inline order bar (replaces sticky bottom bar) */}
              {!item.isConsultation && (
                <div className="hidden lg:block mt-4">
                  <StickyOrderBar
                    menuItem={{
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      category: item.category,
                    }}
                    selectedOptions={selectedOptions}
                    totalPrice={totalPrice}
                    isValid={effectiveIsValid}
                    missingGroups={missingGroups}
                    inline
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail blocks — 2단 레이아웃 아래에 전체 폭 */}
        {blocks.length > 0 && (
          <div className="mt-2 bg-white px-4 py-5 lg:mt-8 lg:rounded-2xl lg:shadow-sm">
            <div className="max-w-lg mx-auto lg:max-w-3xl">
              <h2 className="text-base font-semibold text-charcoal-400 mb-3">
                상세 설명
              </h2>
              <DetailBlocks blocks={blocks} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky order bar */}
      {!item.isConsultation && (
        <div className="lg:hidden">
          <StickyOrderBar
            menuItem={{
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              category: item.category,
            }}
            selectedOptions={selectedOptions}
            totalPrice={totalPrice}
            isValid={effectiveIsValid}
            missingGroups={missingGroups}
          />
        </div>
      )}
    </div>
  );
}
