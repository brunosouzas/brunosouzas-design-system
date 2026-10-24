// Unit tests of the cast on the dark surface (spec illustration-pieces, change
// cast-dark-surface, AB#187). Each test title is the spec scenario it proves.
// Expected hex values come from the generated tokens.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { EMOTE_KINDS, MASCOT_ACTIONS, MASCOTS, emote, mascot, type EmoteParams, type MascotParams } from "../../src/pieces/cast";
import { g, type SvgNode } from "../../src/pieces/node";
import { toSvg } from "../../src/pieces/render";

const D = tokens.surface.dark;
const INK = tokens.color.ink;
const M = (p: Record<string, unknown>) => mascot(p as MascotParams).body[0] as SvgNode;
const E = (p: Record<string, unknown>) => emote(p as EmoteParams).body[0] as SvgNode;
const kids = (n: SvgNode) => n.children.filter((c): c is SvgNode => typeof c !== "string");
const part = (n: SvgNode) => n.attrs["data-part"];
/** data-part values in document order, skipping the subtree of `rim`. */
const parts = (n: SvgNode | string, out: string[] = []): string[] => {
  if (typeof n === "string") return out;
  const p = n.attrs["data-part"];
  if (typeof p === "string") out.push(p);
  if (p === "rim") return out;
  for (const c of n.children) parts(c, out);
  return out;
};
const find = (n: SvgNode | string, p: string): SvgNode | undefined => {
  if (typeof n === "string") return undefined;
  if (n.attrs["data-part"] === p) return n;
  for (const c of n.children) { const hit = find(c, p); if (hit) return hit; }
  return undefined;
};
const shapes = (n: SvgNode | string, out: SvgNode[] = []): SvgNode[] => {
  if (typeof n === "string") return out;
  if (n.tag !== "g") out.push(n);
  for (const c of n.children) shapes(c, out);
  return out;
};
const rimOf = (n: SvgNode) => kids(n).find((c) => part(c) === "rim") as SvgNode;
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

describe("Mascot parameters", () => {
  test("Unknown surface", () => {
    expect(() => M({ who: "dev", x: 0, y: 0, surface: "navy" })).toThrow(RangeError);
    expect(() => M({ who: "dev", x: 0, y: 0, surface: "navy" })).toThrow(/surface.*light.*dark/);
  });
});

describe("Emote parameters", () => {
  test("Unknown surface", () => {
    expect(() => E({ kind: "idea", x: 0, y: 0, surface: "navy" })).toThrow(/surface/);
  });
});

describe("Mascot parts", () => {
  test("Parts at rest on dark", () => {
    for (const who of MASCOTS) {
      const light = parts(M({ who, x: 0, y: 0, action: "rest" }));
      const dark = parts(M({ who, x: 0, y: 0, action: "rest", surface: "dark" }));
      expect(dark).toEqual([light[0], "rim", ...light.slice(1)]);
    }
  });
});

describe("Expression without limbs", () => {
  test("Face only on dark", () => {
    const rim = rimOf(M({ who: "devops", x: 0, y: 0, surface: "dark" }));
    for (const p of ["arm-left", "arm-right", "legs"]) expect(find(rim, p)).toBeUndefined();
  });
});

describe("Emote", () => {
  test("Idea without its burst", () => {
    expect(E({ kind: "idea", x: 0, y: 0, burst: false }).children).toHaveLength(6);
    expect(E({ kind: "idea", x: 0, y: 0 }).children).toHaveLength(14);
    const dark = E({ kind: "idea", x: 0, y: 0, surface: "dark" });
    expect(E({ kind: "idea", x: 0, y: 0, burst: false, surface: "dark" }).children).toHaveLength(7);
    expect(dark.children).toHaveLength(15);
    expect(part(kids(dark)[0])).toBe("rim");
  });
});

describe("Cast on the light surface unchanged", () => {
  test("Explicit light", () => {
    const frozen = JSON.parse(readFileSync(new URL("../fixtures/cast-0.5.0.json", import.meta.url), "utf8")) as { pieces: { piece: string; params: Record<string, unknown>; sha256: string }[] };
    const changed = frozen.pieces.filter((c) => {
      const d = c.piece === "mascot" ? mascot({ ...c.params, surface: "light" } as MascotParams) : emote({ ...c.params, surface: "light" } as EmoteParams);
      return sha(toSvg(g({}, ...d.body, ...d.text))) !== c.sha256;
    });
    expect(frozen.pieces).toHaveLength(130);
    expect(changed).toEqual([]);
  });
});

describe("Cast on the dark surface", () => {
  test("Dark dev waving", () => {
    const light = M({ who: "dev", x: 0, y: 0, action: "wave" });
    const dark = M({ who: "dev", x: 0, y: 0, action: "wave", surface: "dark" });
    const [first, second] = kids(dark);
    expect(part(first)).toBe("ground");
    expect(kids(first)[0].attrs.fill).toBe(D.grid);
    expect(part(second)).toBe("rim");
    expect(shapes(dark).filter((s) => /^translate\(/.test(String(s.attrs.transform ?? "")) && s.attrs.fill === INK)).toEqual([]);
    expect(toSvg(find(dark, "face")!)).toBe(toSvg(find(light, "face")!));
    expect(dark.attrs).toEqual(light.attrs);
  });

  test("Arms are rimmed", () => {
    const rim = rimOf(M({ who: "dev", x: 0, y: 0, action: "wave", surface: "dark" }));
    for (const p of ["arm-left", "arm-right", "legs"]) expect(find(rim, p)).toBeDefined();
    for (const p of ["arm-left", "arm-right"]) expect(kids(find(rim, p)!)[0].attrs["stroke-width"]).toBe(15 + 4 * D.rimWidth);
    for (const s of shapes(rim)) expect(s.attrs.stroke).toBe(D.rim);
  });

  test("Only shadows change colour", () => {
    const problems: string[] = [];
    const check = (n: SvgNode, where: string) => {
      for (const s of shapes(rimOf(n))) {
        if (s.attrs.transform === "translate(8 8)" || s.attrs.transform === "translate(6 6)" || s.attrs.fill === D.shadow) problems.push(`${where}: shadow copy in rim`);
      }
    };
    for (const who of MASCOTS) for (const action of MASCOT_ACTIONS) {
      const n = M({ who, x: 0, y: 0, action, surface: "dark" });
      check(n, `${who} ${action}`);
      const legs = find({ ...n, children: n.children.filter((c) => typeof c === "string" || part(c) !== "rim") }, "legs");
      if (legs) for (const s of shapes(legs).filter((s) => s.tag === "ellipse")) if (s.attrs.fill !== INK) problems.push(`${who} ${action}: foot ${s.attrs.fill}`);
      for (const side of ["arm-left", "arm-right"]) {
        const arm = kids(n).find((c) => part(c) === side);
        if (arm) for (const s of shapes(arm).filter((s) => s.tag === "ellipse")) if (s.attrs.fill !== INK) problems.push(`${who} ${action}: mitten ${s.attrs.fill}`);
      }
    }
    for (const kind of EMOTE_KINDS) check(E({ kind, x: 0, y: 0, surface: "dark" }), kind);
    expect(problems).toEqual([]);
  });

  test("Emote disc shadow", () => {
    const w = E({ kind: "worked", x: 0, y: 0, surface: "dark" });
    expect(part(kids(w)[0])).toBe("rim");
    const disc = kids(w).find((c) => c.tag === "circle" && c.attrs.cx === 6 && c.attrs.cy === 6);
    expect(disc?.attrs.fill).toBe(D.shadow);
    expect(find(w, "ground")).toBeUndefined();
  });

  test("Idea glow keeps no rim", () => {
    const i = E({ kind: "idea", x: 0, y: 0, surface: "dark" });
    expect(kids(i).some((c) => c.attrs.opacity === 0.35)).toBe(true);
    expect(shapes(rimOf(i)).some((s) => s.attrs.opacity !== undefined)).toBe(false);
  });
});

describe("Dark cast look frozen", () => {
  const FIXTURE = new URL("../fixtures/cast-dark-0.5.2.json", import.meta.url);
  test("Every dark call matches", () => {
    expect(sha(readFileSync(FIXTURE, "utf8"))).toBe("d671f0fccc850b96be826461835db47fb99b67f2acb3c9b31b127dc2c8057805");
    const { calls } = JSON.parse(readFileSync(FIXTURE, "utf8")) as { calls: { piece: string; params: Record<string, unknown>; sha256: string }[] };
    expect(calls).toHaveLength(73);
    const changed = calls.filter((c) => {
      const d = c.piece === "mascot" ? mascot(c.params as MascotParams) : emote(c.params as EmoteParams);
      return sha(toSvg(g({}, ...d.body, ...d.text))) !== c.sha256;
    }).map((c) => `${c.piece} ${JSON.stringify(c.params)}`);
    expect(changed).toEqual([]);
  });
});
