"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "./FadeIn";
import MenuCard from "./MenuCard";
import {
  categories as staticCategories,
  menuItems as staticMenuItems,
  type MenuItem,
  type CategoryInfo,
} from "@/data/menu";

interface MenuSectionProps {
  items?: MenuItem[];
  categories?: CategoryInfo[];
}

export default function MenuSection({ items, categories: categoriesProp }: MenuSectionProps) {
  const menuItems = items && items.length > 0 ? items : staticMenuItems;
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : staticCategories;
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  return (
    <section id="menu" className="section-padding">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 헤더 */}
        <FadeIn className="text-center mb-12">
          <p className="text-sm tracking-[0.2em] text-sage-400 font-medium mb-3">
            MENU
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-charcoal-400 mb-4">
            넉넉한 한 상
          </h2>
          <p className="text-charcoal-200 max-w-md mx-auto">
            정성을 담아 하나하나 수제로 만듭니다.
            <br />
            모든 메뉴는 <span className="font-semibold text-sage-400">100% 예약제</span>로 운영됩니다.
          </p>
        </FadeIn>

        {/* 카테고리 필터 탭 */}
        <FadeIn className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === "all"
                ? "bg-sage-400 text-white shadow-lg shadow-sage-400/20"
                : "bg-white text-charcoal-200 hover:bg-cream-200 shadow-sm"
            }`}
            onClick={() => setActiveCategory("all")}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-sage-400 text-white shadow-lg shadow-sage-400/20"
                  : "bg-white text-charcoal-200 hover:bg-cream-200 shadow-sm"
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </FadeIn>

        {/* 메뉴 카드 그리드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filteredItems.map((item, index) => (
              <MenuCard key={item.id} item={item} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* 안내 문구 */}
        <FadeIn delay={0.3} className="text-center mt-12">
          <p className="text-sm text-charcoal-100">
            ※ 가격은 사전 공지 없이 변동될 수 있습니다.
            <br />
            ※ 주문 제작으로 최소 <span className="font-semibold">2일 전</span>{" "}
            예약 부탁드립니다.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
