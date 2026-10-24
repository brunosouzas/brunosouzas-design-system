// Unit tests of the cast pieces (spec illustration-pieces, change
// cast-and-emotes, tasks 2.1 and 2.2). Each test title is the spec scenario it
// proves. Expected hex values come from the generated tokens.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { EMOTE_KINDS, MASCOT_ACTIONS, MASCOTS, emote, mascot, type EmoteParams, type MascotParams } from "../../src/pieces/cast";
import { g, type SvgNode } from "../../src/pieces/node";
import { COLOUR_TOKENS } from "../../src/pieces/params";
import { toSvg } from "../../src/pieces/render";

const root = (node: SvgNode | undefined): SvgNode => node as SvgNode;
const parts = (node: SvgNode | string, out: string[] = []): string[] => {
  if (typeof node === "string") return out;
  const part = node.attrs["data-part"];
  if (typeof part === "string") out.push(part);
  for (const child of node.children) parts(child, out);
  return out;
};
const find = (node: SvgNode | string, part: string): SvgNode | undefined => {
  if (typeof node === "string") return undefined;
  if (node.attrs["data-part"] === part) return node;
  for (const child of node.children) {
    const hit = find(child, part);
    if (hit) return hit;
  }
  return undefined;
};
const paints = (node: SvgNode | string, out = new Set<string>()): Set<string> => {
  if (typeof node === "string") return out;
  for (const name of ["fill", "stroke"]) {
    const value = node.attrs[name];
    if (typeof value === "string" && value !== "none") out.add(value);
  }
  for (const child of node.children) paints(child, out);
  return out;
};
const partsOf = (params: MascotParams) => parts(root(mascot(params).body[0])).join(" ");

describe("Mascot", () => {
  test("Default dev", () => {
    const drawn = mascot({ who: "dev", x: 0, y: 0 });
    expect(drawn.body).toHaveLength(1);
    expect(drawn.body[0].tag).toBe("g");
    expect(drawn.body[0].attrs).toEqual({ "data-mascot": "dev", transform: "translate(0 0) scale(1) translate(-110 -230)", stroke: "none" });
    expect(drawn.text).toEqual([]);
  });

  test("Message at twice the size", () => {
    expect(mascot({ who: "message", x: 300, y: 500, scale: 2 }).body[0].attrs.transform).toBe("translate(300 500) scale(1.4) translate(-105 -216)");
  });
});

describe("Mascot parameters", () => {
  test("Unknown character and face", () => {
    expect(() => mascot({ who: "writer" as never, x: 0, y: 0 })).toThrow(/^mascot: who: expected one of dev, agent, architect, devops, data, request, message/);
    expect(() => mascot({ who: "dev", x: 0, y: 0, face: "proud" as never })).toThrow(/^mascot: face: expected one of normal, blink, happy, wink, surprised, worried, thinking, focused/);
  });

  test("Out of range", () => {
    for (const [name, value] of [["scale", 0], ["scale", 10.5], ["look", 1.5], ["headTilt", 31]] as const) {
      expect(() => mascot({ who: "agent", x: 0, y: 0, [name]: value }), `${name} ${value}`).toThrow(new RegExp(`^mascot: ${name}: `));
    }
  });

  test("Head tilt on the dev", () => {
    expect(() => mascot({ who: "dev", x: 0, y: 0, headTilt: 5 })).toThrow(new RangeError("mascot: headTilt: applies only to the agent"));
    expect(mascot({ who: "agent", x: 0, y: 0, headTilt: 5 }).body).toHaveLength(1);
    expect(mascot.relations?.({ who: "dev", x: 0, y: 0, headTilt: 5 })).toEqual([{ path: "headTilt", message: "applies only to the agent" }]);
  });
});

describe("Mascot parts", () => {
  test("Parts at rest", () => {
    const expected: Record<string, string> = {
      dev: "ground arm-left arm-right legs stand body screen-code mark face eyes mouth",
      agent: "ground arm-left arm-right legs neck body mark head face eyes mouth",
      architect: "ground arm-left arm-right legs pencil body mark face eyes mouth prop",
      devops: "ground arm-left arm-right legs body mark face eyes mouth prop",
      data: "ground arm-left arm-right legs body mark lid face eyes mouth prop",
      request: "ground arm-left arm-right legs body mark face eyes mouth",
      message: "ground arm-left arm-right legs body mark face eyes mouth",
    };
    for (const who of MASCOTS) expect(partsOf({ who, x: 0, y: 0, action: "rest" }), who).toBe(expected[who]);
  });

  test("Head tilt", () => {
    expect(find(root(mascot({ who: "agent", x: 0, y: 0, headTilt: 10 }).body[0]), "head")?.attrs.transform).toBe("rotate(10 124 110)");
  });
});

describe("Expression without limbs", () => {
  test("Face only", () => {
    expect(partsOf({ who: "devops", x: 0, y: 0 })).toBe("ground body mark face eyes mouth");
  });

  test("Hold puts the arms in front", () => {
    expect(partsOf({ who: "devops", x: 0, y: 0, action: "hold" })).toBe("ground legs body mark face eyes mouth prop arm-left arm-right");
  });

  test("Prop switched off or not held", () => {
    expect(partsOf({ who: "data", x: 0, y: 0, action: "rest", prop: false })).not.toContain("prop");
    expect(partsOf({ who: "data", x: 0, y: 0, action: "wave" })).not.toContain("prop");
  });
});

describe("Faces", () => {
  test("Agent's glowing face", () => {
    const face = (who: "agent" | "dev") => paints(find(root(mascot({ who, x: 0, y: 0, face: "surprised" }).body[0]), "face")!);
    expect([...face("agent")].sort()).toEqual([tokens.cast.glow, tokens.color.white].sort());
    expect([...face("dev")].every((value) => [tokens.color.ink, tokens.color.white, tokens.cast.mouth].includes(value))).toBe(true);
    expect(face("dev").has(tokens.cast.mouth)).toBe(true);
  });

  test("No brows on a normal face", () => {
    for (const who of MASCOTS) for (const face of ["normal", "happy"] as const) {
      expect(parts(root(mascot({ who, x: 0, y: 0, face }).body[0])), `${who} ${face}`).not.toContain("brows");
    }
  });

  test("Gaze", () => {
    expect(find(root(mascot({ who: "request", x: 0, y: 0, look: -1 }).body[0]), "face")?.attrs.transform).toBe("translate(-6 0)");
    expect(find(root(mascot({ who: "request", x: 0, y: 0, look: 0 }).body[0]), "face")?.attrs.transform).toBeUndefined();
  });
});

describe("Emote", () => {
  test("Scaled check", () => {
    const drawn = emote({ kind: "worked", x: 10, y: 20, scale: 2 });
    expect(drawn.body).toHaveLength(1);
    expect(drawn.body[0].attrs).toEqual({ "data-emote": "worked", stroke: "none", transform: "translate(10 20) scale(2) translate(-10 -20)" });
    expect(drawn.text).toEqual([]);
    expect(emote({ kind: "worked", x: 10, y: 20 }).body[0].attrs).toEqual({ "data-emote": "worked", stroke: "none" });
  });

  test("Idea without its burst", () => {
    expect(emote({ kind: "idea", x: 0, y: 0, burst: false }).body[0].children).toHaveLength(6);
    expect(emote({ kind: "idea", x: 0, y: 0 }).body[0].children).toHaveLength(14);
  });

  test("Problem in failure red", () => {
    const fills = (kind: EmoteParams["kind"]) => new Set(root(emote({ kind, x: 0, y: 0 }).body[0]).children.map((child) => (child as SvgNode).attrs.fill));
    expect(fills("problem").has(tokens.color.failure)).toBe(true);
    expect(fills("refused").has(tokens.color.failure)).toBe(true);
    expect(fills("problem").has(tokens.color.backend)).toBe(false);
    expect(fills("worked").has(tokens.color.healthy)).toBe(true);
  });
});

describe("Emote parameters", () => {
  test("Unknown kind", () => {
    expect(() => emote({ kind: "zzz" as never, x: 0, y: 0 })).toThrow(/^emote: kind: expected one of idea, doubt, problem, worked, refused, pressure, liked, waiting/);
  });

  test("Scale out of range", () => {
    expect(() => emote({ kind: "idea", x: 0, y: 0, scale: 0 })).toThrow(/^emote: scale: /);
    expect(() => emote({ kind: "idea", x: 0, y: 0, scale: 11 })).toThrow(/^emote: scale: /);
  });
});

describe("Cast pieces carry their own stroke", () => {
  test("Inside the outlined group", () => {
    const SHAPES = new Set(["circle", "ellipse", "rect", "path", "line", "polyline", "polygon"]);
    const values = new Set(COLOUR_TOKENS.values());
    const problems: string[] = [];
    const walk = (node: SvgNode | string, stroked: boolean, where: string) => {
      if (typeof node === "string") return;
      const inherited = stroked || (node.tag === "g" && node.attrs.stroke !== undefined);
      if (SHAPES.has(node.tag) && node.attrs.stroke === undefined && !inherited) problems.push(`${where}: ${node.tag} without stroke`);
      for (const name of ["fill", "stroke"]) {
        const value = node.attrs[name];
        if (value !== undefined && value !== "none" && !values.has(String(value))) problems.push(`${where}: ${name} ${value}`);
      }
      if (node.tag === "text") problems.push(`${where}: text`);
      for (const child of node.children) walk(child, inherited, where);
    };
    for (const who of MASCOTS) for (const action of MASCOT_ACTIONS) walk(root(mascot({ who, x: 0, y: 0, action }).body[0]), false, `${who} ${action}`);
    for (const kind of EMOTE_KINDS) for (const burst of [true, false]) walk(root(emote({ kind, x: 0, y: 0, burst }).body[0]), false, `${kind} ${burst}`);
    expect(problems).toEqual([]);
  });
});

// Frozen look (requirement "Cast look frozen", design §9).
type Call = { piece: "mascot"; params: MascotParams; sha256: string } | { piece: "emote"; params: EmoteParams; sha256: string };
const FIXTURE = new URL("../fixtures/cast-0.5.0.json", import.meta.url);
const frozen = JSON.parse(readFileSync(FIXTURE, "utf8")) as { pieces: Call[]; frames: string[] };
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const hashOf = (call: Call): string => {
  const drawn = call.piece === "mascot" ? mascot(call.params) : emote(call.params);
  return sha(toSvg(g({}, ...drawn.body, ...drawn.text)));
};
/** The calls whose hash differs from the recorded one. */
export const changedCalls = (calls: readonly Call[]): string[] =>
  calls.filter((call) => hashOf(call) !== call.sha256).map((call) => `${call.piece} ${JSON.stringify(call.params)}`);

describe("Cast look frozen", () => {
  test("Every call matches", () => {
    expect(sha(readFileSync(FIXTURE, "utf8"))).toBe("2c8589c05b47d379f315769e8a7829fd9aac9833f0fee73923b7532b901ebe33");
    expect(frozen.pieces).toHaveLength(130);
    expect(changedCalls(frozen.pieces)).toEqual([]);
  });

  test("A changed drawing is caught", () => {
    const altered = frozen.pieces.map((call, i) => (i === 0 ? { ...call, sha256: "0".repeat(64) } : call));
    expect(changedCalls(altered)).toEqual([`mascot ${JSON.stringify(frozen.pieces[0].params)}`]);
  });
});
