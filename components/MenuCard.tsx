"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  type MenuItem,
  type MenuCategory,
  allergenInfo,
  formatPrice,
} from "@/data/menu";

// 카테고리별 플레이스홀더 스타일
const categoryStyles: Record<
  MenuCategory,
  { gradient: string; icon: string; accent: string }
> = {
  "rice-cake": {
    gradient: "from-warm-100 via-cream-200 to-warm-200",
    icon: "🍡",
    accent: "bg-warm-300/20",
  },
  cake: {
    gradient: "from-blush-100 via-cream-100 to-blush-200",
    icon: "🎂",
    accent: "bg-blush-300/20",
  },
  cookie: {
    gradient: "from-warm-200 via-cream-200 to-warm-100",
    icon: "🍪",
    accent: "bg-warm-400/15",
  },
  beverage: {
    gradient: "from-sage-100 via-cream-100 to-sage-100",
    icon: "🍵",
    accent: "bg-sage-200/20",
  },
};

// SVG 패턴 — 한국 전통 꽃살문에서 영감받은 미니멀 도트 패턴
function PlaceholderPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="dot-pattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    </svg>
  );
}

interface MenuCardProps {
  item: MenuItem;
  index: number;
}

export default function MenuCard({ item, index }: MenuCardProps) {
  const style = categoryStyles[item.category];

  return (
    <motion.div
      className="group bg-white rounded-2xl overflow-hidden card-hover shadow-md"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {/* 이미지 또는 플레이스홀더 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${style.gradient} flex items-center justify-center`}
          >
            <PlaceholderPattern />
            {/* 장식 원 */}
            <div
              className={`absolute top-4 right-4 w-16 h-16 rounded-full ${style.accent} blur-xl`}
            />
            <div
              className={`absolute bottom-6 left-6 w-24 h-24 rounded-full ${style.accent} blur-2xl`}
            />
            {/* 카테고리 아이콘 */}
            <span className="relative text-6xl opacity-50 group-hover:scale-125 group-hover:opacity-70 transition-all duration-700 drop-shadow-sm">
              {style.icon}
            </span>
          </div>
        )}
        {/* 배지 */}
        <div className="absolute top-3 left-3 flex gap-2">
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
        </div>
      </div>

      {/* 정보 */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-lg font-bold text-charcoal-400">
              {item.name}
            </h3>
            {item.nameEn && (
              <p className="text-xs text-charcoal-100 mt-0.5">
                {item.nameEn}
              </p>
            )}
          </div>
          <span className="text-lg font-bold text-sage-400 whitespace-nowrap">
            {formatPrice(item.price)}
          </span>
        </div>

        <p className="text-sm text-charcoal-200 leading-relaxed mb-3">
          {item.description}
        </p>

        {/* 알레르기 정보 */}
        {item.allergens.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-charcoal-100 mr-1">알레르기:</span>
            {item.allergens.map((allergen) => (
              <span
                key={allergen}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-cream-200 rounded-full text-xs text-charcoal-200"
                title={allergenInfo[allergen].label}
              >
                {allergenInfo[allergen].icon} {allergenInfo[allergen].label}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
