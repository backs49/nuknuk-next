"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/data/menu";
import Link from "next/link";

function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
      <button
        onClick={() => onChange(quantity - 1)}
        className="w-7 h-7 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-semibold text-charcoal-400">
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        className="w-7 h-7 flex items-center justify-center bg-gray-50 text-charcoal-200 text-sm font-bold hover:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}

export default function CartSlidePanel() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isCartOpen, closeCart } = useCart();

  // ESC key to close
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isCartOpen, closeCart]);

  // Body scroll lock when open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="장바구니"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-charcoal-400">
                장바구니{" "}
                {totalItems > 0 && (
                  <span className="text-sage-400 text-sm">{totalItems}</span>
                )}
              </h2>
              <button
                onClick={closeCart}
                className="text-gray-400 hover:text-charcoal-300 text-xl leading-none"
                aria-label="장바구니 닫기"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-charcoal-200 mb-4">장바구니가 비어있습니다</p>
                  <a
                    href="#menu"
                    onClick={closeCart}
                    className="text-sage-400 font-medium text-sm hover:underline"
                  >
                    메뉴 보기
                  </a>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.menuItemId}-${item.optionKey || ""}`} className="py-3 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-charcoal-400">{item.name}</p>
                        <p className="text-xs text-charcoal-100 mt-0.5">
                          {formatPrice(item.price)} / 개
                        </p>
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedOptions.map((opt) => (
                              <span key={opt.itemId} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                                {opt.itemName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.menuItemId, item.optionKey)}
                        className="text-gray-300 hover:text-red-400 text-sm"
                        aria-label={`${item.name} 삭제`}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(q) => {
                          if (q < 1) {
                            removeItem(item.menuItemId, item.optionKey);
                          } else {
                            updateQuantity(item.menuItemId, q, item.optionKey);
                          }
                        }}
                      />
                      <span className="font-bold text-sm text-charcoal-400">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer - checkout */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-5 py-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-charcoal-200">
                    상품 합계 ({totalItems}개)
                  </span>
                  <span className="text-sm text-charcoal-400">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-charcoal-400">총 결제금액</span>
                  <span className="font-bold text-sage-400 text-lg">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <Link
                  href="/cart/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3 bg-sage-400 text-white rounded-xl font-bold text-base hover:bg-sage-500 transition-colors"
                >
                  결제하기
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
