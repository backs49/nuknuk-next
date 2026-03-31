"use client";

import { useState, useCallback, useRef } from "react";
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
import BenefitsPreview from "./BenefitsPreview";
import type { BenefitsData } from "./BenefitsPreview";

interface MenuDetailClientProps {
  menuItem: DbMenuItem;
  category: CategoryInfo | null;
  images: MenuImage[];
  blocks: DetailBlock[];
  options: OptionGroup[];
  benefitsData?: BenefitsData | null;
}

export default function MenuDetailClient({
  menuItem: dbMenuItem,
  category,
  images,
  blocks,
  options,
  benefitsData,
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

  const [showCopyToast, setShowCopyToast] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSelectionChange = useCallback(
    (opts: SelectedOption[]) => {
      setSelectedOptions(opts);
    },
    []
  );

  const handleConsultClick = useCallback(() => {
    const lines: string[] = [];
    lines.push(`[${item.name}] 상담 문의`);
    if (!item.hidePrice) {
      lines.push(`기본가: ${formatPrice(item.price)}`);
    }
    if (selectedOptions.length > 0) {
      lines.push("");
      lines.push("선택 옵션:");
      selectedOptions.forEach((opt) => {
        const priceText =
          opt.price > 0
            ? ` (+${formatPrice(opt.price)})`
            : "";
        lines.push(`- ${opt.groupName}: ${opt.itemName}${priceText}`);
      });
    }
    lines.push("");
    lines.push("위 상품에 대해 상담 부탁드립니다.");

    const message = lines.join("\n");
    navigator.clipboard.writeText(message).then(() => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setShowCopyToast(true);
      toastTimer.current = setTimeout(() => setShowCopyToast(false), 3000);

      setTimeout(() => {
        window.open("http://pf.kakao.com/_paCxdn/chat", "_blank");
      }, 300);
    });
  }, [item.name, item.price, item.hidePrice, selectedOptions]);

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
            <div className="relative lg:rounded-2xl lg:overflow-hidden lg:shadow-sm">
              <ImageGallery
                images={galleryImages}
                fallbackImage={item.image}
                menuName={item.name}
                category={item.category}
              />
              {/* Badges on image */}
              {(item.isPopular || item.isNew || item.isConsultation) && (
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  {item.isPopular && (
                    <span className="px-3 py-1 bg-sage-400 text-white text-xs font-bold rounded-full shadow-lg">
                      인기
                    </span>
                  )}
                  {item.isNew && (
                    <span className="px-3 py-1 bg-blush-400 text-white text-xs font-bold rounded-full shadow-lg">
                      NEW
                    </span>
                  )}
                  {item.isConsultation && (
                    <span className="px-3 py-1 bg-blush-400 text-white text-xs font-bold rounded-full shadow-lg">
                      상담 후 결정
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Product info + Options + Order (PC: sticky) */}
          <div className="lg:relative">
            <div className="lg:sticky lg:top-20">
              {/* Basic info */}
              <div className="bg-white px-4 py-5 lg:rounded-2xl lg:shadow-sm lg:px-6">
                <div className="max-w-lg mx-auto lg:max-w-none">
                  {/* Category */}
                  {category && (
                    <p className="text-xs text-charcoal-200 mb-2">
                      {category.emoji} {category.name}
                    </p>
                  )}

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

                  {benefitsData && (
                    <BenefitsPreview
                      benefitsData={benefitsData}
                      basePrice={item.price}
                      totalPrice={totalPrice}
                    />
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

              {/* PC consultation CTA */}
              {item.isConsultation && (
                <div className="mt-4">
                  <button
                    onClick={handleConsultClick}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FEE500] text-charcoal-400 rounded-2xl text-base font-semibold hover:brightness-95 transition-colors shadow-sm cursor-pointer"
                  >
                    💬 상담하기 (카카오톡 채널)
                  </button>
                  <p className="text-xs text-charcoal-200 text-center mt-2">
                    옵션 선택 후 클릭하면 주문 정보가 자동 복사됩니다
                  </p>
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

      {/* Copy toast */}
      {showCopyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-charcoal-400 text-white text-sm rounded-xl shadow-lg animate-fade-in">
          주문 정보가 복사되었습니다. 카카오톡에서 붙여넣기 해주세요!
        </div>
      )}

      {/* Mobile sticky bottom bar */}
      {item.isConsultation ? (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-4 py-3">
          <button
            onClick={handleConsultClick}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#FEE500] text-charcoal-400 rounded-xl text-sm font-semibold hover:brightness-95 transition-colors cursor-pointer"
          >
            💬 상담하기 (카카오톡 채널)
          </button>
        </div>
      ) : (
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
