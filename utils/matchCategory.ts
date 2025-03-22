import { COIN_CATEGORIES } from "./coinCategories";

export function matchCategoryFromQuery(query: string) {
  const normalized = query
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .trim();

  // Best: exact match on name or id
  const exact = COIN_CATEGORIES.find(
    (cat) =>
      cat.name.toLowerCase() === normalized ||
      cat.category_id.replace(/-/g, " ") === normalized
  );
  if (exact) return exact;

  // Fallback: includes
  return COIN_CATEGORIES.find(
    (cat) =>
      normalized.includes(cat.name.toLowerCase()) ||
      normalized.includes(cat.category_id.replace(/-/g, " "))
  );
}

