// lib/option-utils.ts

// === 옵션 관련 타입 ===

export interface OptionGroup {
  id: string;
  menuItemId: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  priceMode: "additional" | "fixed";
  sortOrder: number;
  items: OptionItem[];
}

export interface OptionItem {
  id: string;
  groupId: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface SelectedOption {
  groupId: string;
  itemId: string;
  groupName: string;
  itemName: string;
  price: number;
  priceMode: "additional" | "fixed";
}

// === 이미지/블록 타입 ===

export interface MenuImage {
  id: string;
  menuItemId: string;
  imageUrl: string;
  sortOrder: number;
}

export interface DetailBlock {
  id: string;
  menuItemId: string;
  type: "text" | "image";
  content: string;
  sortOrder: number;
}

// === 가격 계산 ===

/**
 * 옵션 포함 최종 가격 계산
 * - 고정가 옵션이 있으면: 고정가 + 추가금 합계
 * - 고정가 옵션이 없으면: 기본가 + 추가금 합계
 */
export function calculateOptionPrice(
  basePrice: number,
  selectedOptions: SelectedOption[]
): number {
  if (selectedOptions.length === 0) return basePrice;

  const fixedOption = selectedOptions.find((o) => o.priceMode === "fixed");
  const additionalSum = selectedOptions
    .filter((o) => o.priceMode === "additional")
    .reduce((sum, o) => sum + o.price, 0);

  if (fixedOption) {
    return fixedOption.price + additionalSum;
  }
  return basePrice + additionalSum;
}

/**
 * 옵션 선택을 문자열로 포맷 (장바구니/알림용)
 * 예: "2호 / 쑥설기 / 과일 토핑"
 */
export function formatSelectedOptions(options: SelectedOption[]): string {
  return options.map((o) => o.itemName).join(" / ");
}

/**
 * 옵션 선택의 고유 키 생성 (장바구니 동일 항목 판별용)
 */
export function getOptionKey(options: SelectedOption[]): string {
  if (options.length === 0) return "";
  const sorted = [...options].sort((a, b) => a.groupId.localeCompare(b.groupId));
  return sorted.map((o) => `${o.groupId}:${o.itemId}`).join("|");
}

/**
 * 필수 옵션이 모두 선택되었는지 검증
 */
export function validateRequiredOptions(
  groups: OptionGroup[],
  selectedOptions: SelectedOption[]
): { valid: boolean; missingGroups: string[] } {
  const requiredGroups = groups.filter((g) => g.required);
  const selectedGroupIds = new Set(selectedOptions.map((o) => o.groupId));
  const missingGroups = requiredGroups
    .filter((g) => !selectedGroupIds.has(g.id))
    .map((g) => g.name);

  return { valid: missingGroups.length === 0, missingGroups };
}
