// Unit tests of the EIP icons as data (spec illustration-pieces, "EIP icons
// as data"; tasks 3.2; and "EIP icons without offset shadows", change
// flat-eip-icons-and-empty-queue, task 2.1).
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { EIP_ICONS, EIP_ICON_NAMES } from "../../src/pieces/eip-icons";
import { eipIcon } from "../../src/pieces/library";
import type { SvgNode } from "../../src/pieces/node";
import { SHADOWS_0_14_1, shadowIndexes } from "./eip-shadows";

const PUBLISHED_NAMES = [
  "aggregator", "canonical-data-model", "channel-adapter", "claim-check", "competing-consumers", "content-based-router",
  "content-enricher", "content-filter", "correlation-identifier", "dead-letter-channel", "event-driven-consumer",
  "guaranteed-delivery", "idempotent-receiver", "invalid-message-channel", "message-expiration", "message-filter",
  "message-translator", "point-to-point-channel", "polling-consumer", "process-manager", "publish-subscribe-channel",
  "request-reply", "return-address", "scatter-gather", "splitter", "transactional-client",
];

describe("EIP icons as data", () => {
  test("The 26 names", () => {
    expect(EIP_ICON_NAMES).toEqual(PUBLISHED_NAMES);
    for (const icon of EIP_ICONS) {
      expect(icon.title.trim(), icon.name).not.toBe("");
      expect(icon.description, icon.name).toMatch(/Gregor Hohpe and Bobby Woolf/);
      expect(icon.description, icon.name).toMatch(/CC BY 4\.0/);
    }
  });

  test("Icon colours", () => {
    const allowed = new Set<string>([
      tokens.color.ink, tokens.color.white, tokens.color.state.healthy, tokens.color.state.transitional,
      tokens.color.state.caller, tokens.color.state.backend, tokens.illustration.iconLine,
    ]);
    const found = new Set<string>();
    const visit = (node: SvgNode) => {
      for (const [name, value] of Object.entries(node.attrs)) if (typeof value === "string" && value.startsWith("#")) found.add(`${name}=${value}`);
      for (const child of node.children) if (typeof child !== "string") visit(child);
    };
    EIP_ICONS.forEach((icon) => icon.nodes.forEach(visit));
    for (const entry of found) expect(allowed.has(entry.split("=")[1]), entry).toBe(true);
    expect(found.size).toBeGreaterThan(0);
  });

  test("Unknown icon", () => {
    expect(() => eipIcon({ name: "message-bus", x: 0, y: 0 })).toThrow(/^eipIcon: name: expected one of aggregator, /);
  });

  test("Placed without the outline", () => {
    expect(eipIcon({ name: "splitter", x: 10, y: 20, scale: 0.66 }).body[0].attrs).toEqual({ transform: "translate(10 20) scale(0.66)", stroke: "none" });
  });
});

// Written by scripts/freeze-eip-book-pieces.ts from d26f254, before any code (task 1.1).
type FrozenIcon = { name: string; title: string; description: string; nodes: SvgNode[] };
const frozenIcons = JSON.parse(readFileSync(new URL("../fixtures/eip-icons-0.14.1.json", import.meta.url), "utf8")) as FrozenIcon[];
const plain = (nodes: readonly SvgNode[]) => JSON.parse(JSON.stringify(nodes)) as SvgNode[];
const found = (icons: readonly { name: string; nodes: readonly SvgNode[] }[]) =>
  Object.fromEntries(icons.flatMap(({ name, nodes }) => (shadowIndexes(nodes).length ? [[name, shadowIndexes(nodes)]] : [])));

describe("EIP icons without offset shadows", () => {
  test("No offset shadow", () => {
    expect(EIP_ICONS).toHaveLength(26);
    expect(found(EIP_ICONS)).toEqual({});
  });

  test("Every face kept", () => {
    expect(EIP_ICONS.map(({ name }) => name)).toEqual(frozenIcons.map(({ name }) => name));
    EIP_ICONS.forEach((icon, index) => {
      const before = frozenIcons[index];
      expect({ title: icon.title, description: icon.description }, icon.name).toEqual({ title: before.title, description: before.description });
      expect(plain(icon.nodes), icon.name).toEqual(before.nodes.filter((_node, i) => !SHADOWS_0_14_1[icon.name].includes(i)));
    });
  });

  test("A shadow is caught", () => {
    expect(Object.values(SHADOWS_0_14_1).flat()).toHaveLength(46);
    expect(found(frozenIcons)).toEqual(SHADOWS_0_14_1);
    // The frozen splitter without its shadow (node 0), then a copy of its face rect, ink, unstroked, moved by (2.5, 2.5), before the face.
    const [, face, ...rest] = frozenIcons.find(({ name }) => name === "splitter")!.nodes;
    expect(face.tag).toBe("rect");
    const { stroke: _stroke, "stroke-width": _width, ...faceAttrs } = face.attrs;
    const copy: SvgNode = { tag: "rect", attrs: { ...faceAttrs, x: String(Number(face.attrs.x) + 2.5), y: String(Number(face.attrs.y) + 2.5), fill: "#121212" }, children: [] };
    expect(shadowIndexes([face, ...rest])).toEqual([]);
    expect(shadowIndexes([copy, face, ...rest])).toEqual([0]);
  });
});
