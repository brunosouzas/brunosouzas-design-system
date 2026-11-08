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
    const cases: [Record<string, unknown>, RegExp][] = [
      [{ lines: [] }, /^headline: lines:/],
      [{ lines: ["a", "b", "c", "d", "e"] }, /^headline: lines:/],
      [{ lines: [""] }, /^headline: lines\[0\]:/],
      [{ size: 200 }, /^headline: size:/],
      [{ size: 24.5 }, /^headline: size:/],
      [{ anchor: "left" }, /^headline: anchor:/],
      [{ surface: "navy" }, /^headline: surface:/],
    ];
    for (const [extra, message] of cases) {
      const call = () => headline({ ...base, ...extra } as never);
      expect(call, JSON.stringify(extra)).toThrow(RangeError);
      expect(call, JSON.stringify(extra)).toThrow(message);
    }
  });
});
