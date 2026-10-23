// Unit tests of the EIP icons as data (spec illustration-pieces, "EIP icons
// as data"; tasks 3.2).
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { EIP_ICONS, EIP_ICON_NAMES } from "../../src/pieces/eip-icons";
import { eipIcon } from "../../src/pieces/library";
import type { SvgNode } from "../../src/pieces/node";

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
      tokens.color.ink, tokens.color.white, tokens.color.healthy, tokens.color.transitional,
      tokens.color.caller, tokens.color.backend, tokens.illustration.iconLine,
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
