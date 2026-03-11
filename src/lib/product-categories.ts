import type { TranslationKey } from "@/lib/i18n";

export type ProductCategory = "beverages" | "food" | "cleaning" | "electronics" | "clothing" | "other";

const CATEGORY_TRANSLATION_KEYS: Record<ProductCategory, TranslationKey> = {
  beverages: "catBeverages",
  food: "catFood",
  cleaning: "catCleaning",
  electronics: "catElectronics",
  clothing: "catClothing",
  other: "catOther",
};

const CATEGORY_ALIASES: Record<string, ProductCategory> = {
  beverages: "beverages",
  "مشروبات": "beverages",

  food: "food",
  "مواد غذائية": "food",

  cleaning: "cleaning",
  "منظفات": "cleaning",

  electronics: "electronics",
  "إلكترونيات": "electronics",

  clothing: "clothing",
  "ملابس": "clothing",

  other: "other",
  "أخرى": "other",
};

export const PRODUCT_CATEGORY_OPTIONS: ProductCategory[] = [
  "beverages",
  "food",
  "cleaning",
  "electronics",
  "clothing",
  "other",
];

export function normalizeProductCategory(category?: string | null): ProductCategory {
  if (!category) return "other";

  const trimmed = category.trim();
  const lowered = trimmed.toLowerCase();

  return CATEGORY_ALIASES[trimmed] ?? CATEGORY_ALIASES[lowered] ?? "other";
}

export function getCategoryTranslationKey(category?: string | null): TranslationKey {
  const normalized = normalizeProductCategory(category);
  return CATEGORY_TRANSLATION_KEYS[normalized];
}

export function getLocalizedCategoryLabel(
  category: string | null | undefined,
  t: (key: TranslationKey) => string,
): string {
  return t(getCategoryTranslationKey(category));
}
