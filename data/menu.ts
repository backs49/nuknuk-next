/**
 * 넉넉 디저트 메뉴 데이터
 *
 * 메뉴 수정 방법:
 * 1. 아래 배열에서 해당 메뉴를 찾아 수정하세요
 * 2. 새 메뉴 추가 시 같은 형식으로 객체를 추가하세요
 * 3. 이미지는 /public/images/menu/ 폴더에 넣고 경로를 업데이트하세요
 * 4. 알레르기 정보는 allergens 배열에 해당 항목을 추가/제거하세요
 */

export type Allergen =
  | "gluten"
  | "dairy"
  | "egg"
  | "nut"
  | "soy"
  | "sesame";

export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number; // 원 단위
  category: MenuCategory;
  // 실제 메뉴 사진 경로 (없으면 카테고리 기반 CSS 플레이스홀더 표시)
  image?: string;
  allergens: Allergen[];
  isPopular?: boolean; // 인기 메뉴 배지 표시
  isNew?: boolean; // 신메뉴 배지 표시
  isConsultation?: boolean; // 상담 상품 (장바구니 대신 Instagram DM 연결)
  hidePrice?: boolean; // 가격 숨김 (상담 상품에서 사용)
}

export type MenuCategory = "rice-cake" | "cake" | "cookie" | "beverage";

export interface CategoryInfo {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  availableDeliveryMethods: string[];
  defaultShippingFee: number;
}

// 카테고리 정보
export const categories: CategoryInfo[] = [
  { id: "rice-cake", name: "떡", nameEn: "Rice Cake", emoji: "🍡", availableDeliveryMethods: ["pickup"], defaultShippingFee: 0 },
  { id: "cake", name: "케이크", nameEn: "Cake", emoji: "🎂", availableDeliveryMethods: ["pickup"], defaultShippingFee: 0 },
  { id: "cookie", name: "쿠키·구움과자", nameEn: "Cookies", emoji: "🍪", availableDeliveryMethods: ["pickup", "shipping"], defaultShippingFee: 4000 },
  { id: "beverage", name: "음료", nameEn: "Beverage", emoji: "🍵", availableDeliveryMethods: ["pickup", "shipping"], defaultShippingFee: 4000 },
];

// 알레르기 아이콘 매핑
export const allergenInfo: Record<
  Allergen,
  { label: string; icon: string }
> = {
  gluten: { label: "밀", icon: "🌾" },
  dairy: { label: "유제품", icon: "🥛" },
  egg: { label: "달걀", icon: "🥚" },
  nut: { label: "견과류", icon: "🥜" },
  soy: { label: "대두", icon: "🫘" },
  sesame: { label: "참깨", icon: "🌰" },
};

// 메뉴 데이터
// 실제 사진이 준비되면 image 필드에 경로를 추가하세요 (예: "/images/menu/songpyeon.jpg")
export const menuItems: MenuItem[] = [
  // === 떡 카테고리 ===
  {
    id: "mugwort-songpyeon",
    name: "쑥 송편",
    description: "국내산 햅쑥으로 빚은 정성 가득 송편. 통깨와 꿀이 넉넉하게.",
    price: 15000,
    category: "rice-cake",
    allergens: ["sesame"],
    isPopular: true,
  },
  {
    id: "injeolmi",
    name: "인절미",
    nameEn: "Injeolmi",
    description: "고소한 국내산 콩고물을 아낌없이 묻힌 쫀득한 인절미.",
    price: 12000,
    category: "rice-cake",
    allergens: ["soy"],
    isPopular: true,
  },
  {
    id: "gyeongdan",
    name: "꿀 경단",
    description: "한 입 크기의 쫀득한 경단에 달콤한 꿀과 콩고물을 듬뿍.",
    price: 10000,
    category: "rice-cake",
    allergens: ["soy", "sesame"],
  },
  {
    id: "baekseolgi",
    name: "백설기",
    nameEn: "Baekseolgi",
    description: "순백의 설기. 쌀 본연의 담백한 맛과 부드러운 식감.",
    price: 18000,
    category: "rice-cake",
    allergens: [],
    isNew: true,
  },

  // === 케이크 카테고리 ===
  {
    id: "rice-cake-roll",
    name: "떡 롤케이크",
    description: "쫀득한 떡 시트에 생크림과 제철 과일을 넉넉하게 말았습니다.",
    price: 32000,
    category: "cake",
    allergens: ["dairy", "egg", "gluten"],
    isPopular: true,
  },
  {
    id: "castella",
    name: "쌀 카스테라",
    description: "쌀가루로 만든 촉촉한 카스테라. 글루텐프리 옵션 가능.",
    price: 28000,
    category: "cake",
    allergens: ["egg", "dairy"],
  },
  {
    id: "tiramisu-tteok",
    name: "티라미수 떡케이크",
    description: "마스카포네 크림과 쫀득한 떡의 이색적인 만남.",
    price: 35000,
    category: "cake",
    allergens: ["dairy", "egg", "gluten"],
    isNew: true,
  },

  // === 쿠키·구움과자 카테고리 ===
  {
    id: "rice-cookie",
    name: "쌀 버터쿠키",
    description: "바삭하면서도 입에서 사르르 녹는 쌀 버터쿠키 12개입.",
    price: 15000,
    category: "cookie",
    allergens: ["dairy", "egg"],
    isPopular: true,
  },
  {
    id: "mugwort-financier",
    name: "쑥 휘낭시에",
    description: "국내산 쑥과 버터의 고소한 조화. 6개입.",
    price: 18000,
    category: "cookie",
    allergens: ["dairy", "egg", "nut", "gluten"],
  },
  {
    id: "yakgwa",
    name: "미니 약과",
    nameEn: "Mini Yakgwa",
    description: "참기름과 꿀로 정성껏 만든 전통 약과. 8개입.",
    price: 16000,
    category: "cookie",
    allergens: ["gluten", "sesame"],
    isNew: true,
  },

  // === 음료 카테고리 ===
  {
    id: "sikhye",
    name: "수제 식혜",
    description: "직접 만든 전통 식혜. 달콤하고 시원한 맛.",
    price: 5000,
    category: "beverage",
    allergens: [],
  },
  {
    id: "omija-ade",
    name: "오미자 에이드",
    description: "새콤달콤한 오미자청에 탄산을 더한 시그니처 음료.",
    price: 6000,
    category: "beverage",
    allergens: [],
    isPopular: true,
  },
  {
    id: "misugaru-latte",
    name: "미숫가루 라떼",
    description: "고소한 미숫가루와 우유의 부드러운 조화.",
    price: 5500,
    category: "beverage",
    allergens: ["dairy", "soy"],
  },
];

// 가격 포맷 헬퍼
export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// 카테고리별 메뉴 필터
export function getMenuByCategory(category: MenuCategory): MenuItem[] {
  return menuItems.filter((item) => item.category === category);
}
