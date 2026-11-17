import { describe, expect, it } from "vitest";
import {
  ALCOHOLIC_CATEGORIES,
  NON_ALCOHOLIC_CATEGORIES,
  CATEGORIES,
  makeSeed,
} from "@/lib/demo-store";
import { DRINK_VISUALS } from "@/components/tokea/bits";

describe("Tokea expanded drink catalogue", () => {
  it("offers both Kenyan Muratina and individual spirits", () => {
    expect(CATEGORIES).toEqual(expect.arrayContaining([
      "Beer", "Wine", "Cocktails", "Muratina", "Whiskey", "Vodka",
      "Gin", "Rum", "Tequila", "Brandy", "Spirits", "Coffee", "Soft drinks", "Tea",
    ]));
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
    expect(CATEGORIES).toHaveLength(14);
  });

  it("groups choices without duplicating or losing any category", () => {
    const alcohol = new Set<string>(ALCOHOLIC_CATEGORIES);
    const nonAlcohol = new Set<string>(NON_ALCOHOLIC_CATEGORIES);
    expect(nonAlcohol).toEqual(new Set(["Coffee", "Soft drinks", "Tea"]));
    expect(alcohol.has("Muratina")).toBe(true);
    expect(alcohol.has("Whiskey")).toBe(true);
    for (const option of alcohol) expect(nonAlcohol.has(option)).toBe(false);
    expect([...alcohol, ...nonAlcohol]).toEqual(CATEGORIES);
  });

  it("renders a matching, non-empty banner definition for every drink", () => {
    expect(Object.keys(DRINK_VISUALS).sort()).toEqual([...CATEGORIES].sort());
    for (const option of CATEGORIES) {
      expect(DRINK_VISUALS[option].label).toBe(option);
      expect(DRINK_VISUALS[option].detail.length).toBeGreaterThan(4);
      expect(DRINK_VISUALS[option].icon).toBeDefined();
    }
  });

  it("seeds Muratina and Whiskey meetups with valid categories", () => {
    const state = makeSeed();
    const seeded = state.sessions.map((session) => session.category);
    expect(seeded).toContain("Muratina");
    expect(seeded).toContain("Whiskey");
    expect(state.sessions.every((session) => CATEGORIES.includes(session.category))).toBe(true);
  });
});
