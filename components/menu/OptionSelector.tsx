"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  OptionGroup,
  SelectedOption,
} from "@/lib/option-utils";
import { calculateOptionPrice } from "@/lib/option-utils";

interface OptionSelectorProps {
  groups: OptionGroup[];
  basePrice: number;
  onSelectionChange: (options: SelectedOption[]) => void;
}

export default function OptionSelector({
  groups,
  basePrice,
  onSelectionChange,
}: OptionSelectorProps) {
  // Map groupId -> selected itemIds
  const [selections, setSelections] = useState<
    Record<string, string[]>
  >({});

  const buildSelectedOptions = useCallback(
    (sel: Record<string, string[]>): SelectedOption[] => {
      const result: SelectedOption[] = [];
      for (const group of groups) {
        const selectedIds = sel[group.id] ?? [];
        for (const itemId of selectedIds) {
          const item = group.items.find((i) => i.id === itemId);
          if (item) {
            result.push({
              groupId: group.id,
              itemId: item.id,
              groupName: group.name,
              itemName: item.name,
              price: item.price,
              priceMode: group.priceMode,
            });
          }
        }
      }
      return result;
    },
    [groups]
  );

  useEffect(() => {
    onSelectionChange(buildSelectedOptions(selections));
  }, [selections, buildSelectedOptions, onSelectionChange]);

  const handleSelect = (
    group: OptionGroup,
    itemId: string
  ) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];

      if (group.type === "single") {
        // Radio: replace
        return { ...prev, [group.id]: [itemId] };
      } else {
        // Multi: toggle
        if (current.includes(itemId)) {
          return {
            ...prev,
            [group.id]: current.filter((id) => id !== itemId),
          };
        }
        return { ...prev, [group.id]: [...current, itemId] };
      }
    });
  };

  const selectedOptions = buildSelectedOptions(selections);
  const totalPrice = calculateOptionPrice(basePrice, selectedOptions);

  // Build price summary text
  const summaryParts: string[] = [];
  for (const opt of selectedOptions) {
    if (opt.priceMode === "fixed") {
      summaryParts.push(
        `${opt.itemName}(${opt.price.toLocaleString("ko-KR")})`
      );
    } else {
      summaryParts.push(
        `${opt.itemName}(+${opt.price.toLocaleString("ko-KR")})`
      );
    }
  }

  return (
    <div className="space-y-4">
      {groups
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((group) => {
          const selectedIds = selections[group.id] ?? [];

          return (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold text-charcoal-400">
                  {group.name}
                </h4>
                {group.required && (
                  <span className="px-2 py-0.5 bg-blush-400/10 text-blush-400 text-[10px] font-bold rounded-full">
                    필수
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {group.items
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isSingle = group.type === "single";

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(group, item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors text-left ${
                          isSelected
                            ? "border-sage-400 bg-sage-400/5"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio / Checkbox indicator */}
                          <div
                            className={`flex-shrink-0 flex items-center justify-center ${
                              isSingle
                                ? "w-5 h-5 rounded-full border-2"
                                : "w-5 h-5 rounded border-2"
                            } ${
                              isSelected
                                ? "border-sage-400"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              isSingle ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-sage-400" />
                              ) : (
                                <svg
                                  className="w-3 h-3 text-sage-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isSelected
                                ? "text-charcoal-400 font-medium"
                                : "text-charcoal-300"
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>

                        {/* Price */}
                        <span
                          className={`text-sm font-medium flex-shrink-0 ${
                            isSelected ? "text-sage-400" : "text-charcoal-200"
                          }`}
                        >
                          {group.priceMode === "fixed"
                            ? `${item.price.toLocaleString("ko-KR")}원`
                            : item.price === 0
                              ? "+0원"
                              : `+${item.price.toLocaleString("ko-KR")}원`}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}

      {/* Price summary */}
      {selectedOptions.length > 0 && (
        <div className="bg-cream-100 rounded-xl p-4">
          <p className="text-xs text-charcoal-200 mb-1">
            {summaryParts.join(" + ")}
          </p>
          <p className="text-lg font-bold text-charcoal-400">
            합계 {totalPrice.toLocaleString("ko-KR")}원
          </p>
        </div>
      )}
    </div>
  );
}
