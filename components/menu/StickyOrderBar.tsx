"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import type { SelectedOption } from "@/lib/option-utils";
import { getOptionKey } from "@/lib/option-utils";

interface StickyOrderBarProps {
  menuItem: {
    id: string;
    name: string;
    price: number;
    image?: string;
    category: string;
  };
  selectedOptions: SelectedOption[];
  totalPrice: number;
  isValid: boolean;
  missingGroups: string[];
  inline?: boolean;
}

export default function StickyOrderBar({
  menuItem,
  selectedOptions,
  totalPrice,
  isValid,
  missingGroups,
  inline,
}: StickyOrderBarProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!isValid) return;

    addItem({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: totalPrice,
      quantity,
      image: menuItem.image,
      category: menuItem.category,
      selectedOptions,
      optionKey: getOptionKey(selectedOptions),
    } as Parameters<typeof addItem>[0]);

    openCart();
  };

  const handleDirectOrder = () => {
    if (!isValid) return;

    try {
      sessionStorage.setItem(
        "direct-order-options",
        JSON.stringify({
          menuItemId: menuItem.id,
          options: selectedOptions,
        })
      );
    } catch {
      // sessionStorage unavailable
    }

    router.push(`/order/${menuItem.id}`);
  };

  return (
    <div className={inline
      ? "bg-white rounded-2xl shadow-sm p-5"
      : "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    }>
      <div className={inline ? "" : "max-w-lg mx-auto px-4 py-3"}>
        {/* Validation message */}
        {!isValid && (
          <p className="text-xs text-blush-400 mb-2 text-center">
            필수 옵션을 선택해주세요: {missingGroups.join(", ")}
          </p>
        )}

        <div className="flex items-center gap-3">
          {/* Quantity stepper */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-semibold text-charcoal-400">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="w-9 h-9 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              +
            </button>
          </div>

          {/* Total price */}
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-charcoal-400">
              {(totalPrice * quantity).toLocaleString("ko-KR")}원
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={!isValid}
              className={`px-4 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                isValid
                  ? "border-sage-400 text-sage-400 hover:bg-sage-50"
                  : "border-gray-200 text-gray-300 cursor-not-allowed"
              }`}
            >
              담기
            </button>
            <button
              onClick={handleDirectOrder}
              disabled={!isValid}
              className={`px-4 h-10 rounded-lg text-sm font-semibold text-white transition-colors ${
                isValid
                  ? "bg-sage-400 hover:bg-sage-500"
                  : "bg-gray-200 cursor-not-allowed"
              }`}
            >
              바로구매
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
