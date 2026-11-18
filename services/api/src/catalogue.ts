/** API-side contract. Native client may share values but not security rules. */
export const DRINK_CATEGORIES = [
  "Beer", "Wine", "Cocktails", "Muratina", "Whiskey", "Vodka", "Gin",
  "Rum", "Tequila", "Brandy", "Spirits", "Coffee", "Soft drinks", "Tea",
] as const;
export const NEIGHBOURHOODS = [
  "Westlands", "Kilimani", "Kileleshwa", "Lavington", "Karen",
  "CBD", "Parklands", "Upper Hill", "Ngara", "South B", "South C", "Runda",
] as const;
export type DrinkCategory = typeof DRINK_CATEGORIES[number];
