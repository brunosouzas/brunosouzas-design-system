// Spec illustration-pieces, "Headline" (change headline-piece).
import { describe, expect, test } from "vitest";
import { headline } from "../../src/pieces/library";

describe("Headline", () => {
  test("Three lines at 96", () => {
    const { body, text } = headline({ x: 140, y: 190, lines: ["Code that runs", "for the problem", "you have."], size: 96 });
    expect(body).toEqual([]);
    expect(text).toHaveLength(1);
    const [group] = text;
    expect(group.tag).toBe("g");
    expect(group.attrs).toEqual({
      "data-piece": "headline",
      "font-family": "'Source Serif 4', Georgia, 'Times New Roman', serif",
      "font-size": 96,
      "font-weight": 700,
      "letter-spacing": -0.96,
      fill: "#121212",
      "text-anchor": "start",
    });
    expect(group.children).toEqual([
      { tag: "text", attrs: { x: 140, y: 190 }, children: ["Code that runs"] },
      { tag: "text", attrs: { x: 140, y: 295.6 }, children: ["for the problem"] },
      { tag: "text", attrs: { x: 140, y: 401.2 }, children: ["you have."] },
    ]);
  });

  test("Defaults and the dark surface", () => {
    const [group] = headline({ x: 600, y: 100, lines: ["Title"], anchor: "middle", surface: "dark" }).text;
    expect(group.attrs).toMatchObject({ "font-size": 64, "letter-spacing": -0.64, fill: "#F1EEE8", "text-anchor": "middle" });
  });

  test("Out-of-range parameters", () => {
    const base = { x: 0, y: 0, lines: ["a"] };
    expect(() => headline({ ...base, lines: [] })).toThrow(/^headline: lines:/);
    expect(() => headline({ ...base, lines: ["a", "b", "c", "d", "e"] })).toThrow(/^headline: lines:/);
    expect(() => headline({ ...base, lines: [""] })).toThrow(/^headline: lines\[0\]:/);
    expect(() => headline({ ...base, size: 200 })).toThrow(/^headline: size:/);
    expect(() => headline({ ...base, size: 24.5 })).toThrow(/^headline: size:/);
    expect(() => headline({ ...base, anchor: "left" as never })).toThrow(/^headline: anchor:/);
    expect(() => headline({ ...base, surface: "navy" as never })).toThrow(/^headline: surface:/);
    for (const bad of [{ ...base, lines: [] }, { ...base, size: 24.5 }]) expect(() => headline(bad)).toThrow(RangeError);
  });
});
