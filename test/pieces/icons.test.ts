// Unit tests of the UI and link icons and of the new pieces' own strokes (spec
// illustration-pieces, change stackledger-map-and-link-pieces; tasks 3.1 to
// 3.3; change bend-radius-and-current-colour, task 2.1). Each test title is the
// spec scenario it proves.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { LINK_ICONS, LINK_ICON_NAMES, linkIcon } from "../../src/pieces/link-icons";
import { DIAGRAM_PIECES, altFrame, edgeLabel, stateStart } from "../../src/pieces/diagram";
import { ledgerMark, licenceMark, renewalRing, suggestedHalo, zone } from "../../src/pieces/metro";

// Required parameters of the ten body diagram pieces (as catalogue.test.ts REQUIRED_ONLY).
const BODY_DIAGRAM: Record<keyof typeof DIAGRAM_PIECES, object> = {
  diagramBox: { x: 0, y: 0, width: 120, text: ["a"] },
  decisionNode: { x: 0, y: 0, width: 120, height: 60, text: ["a"] },
  storeNode: { x: 0, y: 0, width: 120, height: 60, text: ["a"] },
  queueNode: { x: 0, y: 0, width: 120, text: ["a"] },
  exchangeNode: { x: 0, y: 0, width: 120, text: ["a"] },
  taggedContainer: { x: 0, y: 0, width: 200, height: 100, tag: "a" },
  lifeline: { x: 0, y1: 0, y2: 100 },
  phaseBand: { x: 0, y: 0, width: 200, text: "a", fill: "color.healthy" },
  altFrame: { x: 0, y: 0, width: 200, height: 100, tag: "a" },
  edgeLabel: { x: 0, y: 0, lines: ["a"] },
};
import { SVG_TAGS, el, type Drawn, type SvgNode } from "../../src/pieces/node";
import { toReact } from "../../src/pieces/react";
import { toSvg } from "../../src/pieces/render";
import { renderToStaticMarkup } from "react-dom/server";
import { UI_ICONS, UI_ICON_NAMES, uiIcon } from "../../src/pieces/ui-icons";

const walk = (nodes: readonly (SvgNode | string)[], visit: (node: SvgNode | string, ancestors: SvgNode[]) => void, ancestors: SvgNode[] = []) => {
  for (const node of nodes) {
    visit(node, ancestors);
    if (typeof node !== "string") walk(node.children, visit, [...ancestors, node]);
  }
};
const surfaces = ["light", "dark"] as const;

describe("UI icons as data", () => {
  test("Default sun", () => {
    const { body, text } = uiIcon({ name: "sun", x: 0, y: 0 });
    expect(body).toHaveLength(1);
    expect(body[0].tag).toBe("g");
    expect(body[0].attrs).toEqual({ transform: "translate(0 0) scale(1)", fill: "#0A1033", stroke: "#0A1033" });
    expect(body[0].children.map((child) => (child as SvgNode).tag)).toEqual(["circle", "path"]);
    expect(text).toEqual([]);
  });

  test("Every glyph as designed", () => {
    // design §5 of stackledger-map-and-link-pieces, written out independently of the data.
    const path = (d: string) => ({ tag: "path", attrs: { d, fill: "none", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, children: [] });
    const fill = (d: string) => ({ tag: "path", attrs: { d, stroke: "none" }, children: [] });
    const expected: Record<string, unknown[]> = {
      sun: [{ tag: "circle", attrs: { cx: 12, cy: 12, r: 4.5, stroke: "none" }, children: [] }, path("M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8")],
      moon: [fill("M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z")],
      zoomIn: [path("M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13ZM15.3 15.3l5.2 5.2M7.5 10.5h6M10.5 7.5v6")],
      zoomOut: [path("M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13ZM15.3 15.3l5.2 5.2M7.5 10.5h6")],
      reset: [path("M4.5 12A7.5 7.5 0 1 0 6.7 6.7M4 3.5v4.5h4.5")],
      calendar: [path("M5.5 5h13a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3.5 10h17M8 3v4M16 3v4"), { tag: "rect", attrs: { x: 7, y: 13, width: 3, height: 3, rx: 0.5, stroke: "none" }, children: [] }],
      download: [path("M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 16.5v3h15v-3")],
    };
    for (const name of UI_ICON_NAMES) expect(uiIcon({ name, x: 0, y: 0 }).body[0].children, name).toEqual(expected[name]);
    expect(UI_ICONS.map((icon) => icon.title)).toEqual(["Sun", "Moon", "Zoom in", "Zoom out", "Reset", "Calendar", "Download"]);
  });

  test("The seven names", () => {
    expect(UI_ICON_NAMES).toEqual(["sun", "moon", "zoomIn", "zoomOut", "reset", "calendar", "download"]);
    for (const icon of UI_ICONS) {
      expect(icon.title.length, icon.name).toBeGreaterThan(0);
      expect(icon.description.length, icon.name).toBeGreaterThan(0);
      walk(icon.nodes, (node) => {
        if (typeof node === "string") return;
        for (const attr of ["fill", "stroke"]) {
          const value = node.attrs[attr];
          expect(value === undefined || value === "none", `${icon.name}: ${attr}=${value}`).toBe(true);
        }
      });
    }
  });

  test("Unknown icon or a hex colour", () => {
    expect(() => uiIcon({ name: "menu", x: 0, y: 0 })).toThrow(/^uiIcon: name: expected one of sun, moon/);
    expect(() => uiIcon({ name: "sun", x: 0, y: 0, colour: "#FFFFFF" })).toThrow(/^uiIcon: colour: colour literals are not allowed/);
    for (const colour of ["currentcolor", "inherit", " currentColor"]) {
      expect(() => uiIcon({ name: "sun", x: 0, y: 0, colour }), colour).toThrow(/^uiIcon: colour: /);
    }
  });
});

describe("Current colour on UI icons", () => {
  test("Current colour", () => {
    const current = uiIcon({ name: "zoomIn", x: 4, y: 8, size: 16, colour: "currentColor" });
    const inked = uiIcon({ name: "zoomIn", x: 4, y: 8, size: 16 });
    expect(current.body).toHaveLength(1);
    expect(current.body[0].tag).toBe("g");
    expect(current.body[0].attrs).toEqual({ transform: "translate(4 8) scale(0.6666666666666666)", fill: "currentColor", stroke: "currentColor" });
    expect(current.body[0].children).toEqual(inked.body[0].children);
  });

  test("Current colour on every icon", () => {
    for (const name of UI_ICON_NAMES) {
      const tree = uiIcon({ name, x: 0, y: 0, colour: "currentColor" });
      walk([...tree.body, ...tree.text], (node) => {
        if (typeof node === "string") return void expect(node).not.toMatch(/url\(|:\/\//);
        expect(SVG_TAGS).toContain(node.tag);
        for (const [attr, value] of Object.entries(node.attrs)) {
          expect(attr).not.toMatch(/^(href|xlink:href|style|on.*)$/i);
          expect(String(value), `${name}: ${attr}`).not.toMatch(/#[0-9A-Fa-f]{3,8}|url\(|:\/\//);
          if (attr === "fill" || attr === "stroke") expect(["currentColor", "none"], `${name}: ${attr}=${value}`).toContain(value);
        }
      });
      const root = el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" }, ...tree.body);
      for (const markup of [toSvg(root), renderToStaticMarkup(toReact(root))]) {
        expect(markup, name).toContain('fill="currentColor" stroke="currentColor"');
        expect(markup, name).not.toMatch(/#[0-9A-Fa-f]{3,8}|style=|href=/);
      }
    }
  });
});

describe("Link icons as data", () => {
  test("GitHub on light", () => {
    const group = linkIcon({ icon: "github", x: 0, y: 0 }).body[0];
    expect(group.attrs).toEqual({ transform: "translate(0 0) scale(1)", stroke: "none" });
    const [shadow, face, mark] = group.children as SvgNode[];
    expect(shadow.attrs).toEqual({ x: 5, y: 5, width: 38, height: 38, rx: 9, fill: "#0A1033", stroke: "none" });
    expect(face.attrs).toEqual({ x: 2, y: 2, width: 38, height: 38, rx: 9, fill: "#FFFFFF", stroke: "#0A1033", "stroke-width": 2.5 });
    expect(mark.attrs.transform).toBe("translate(9.5 9) scale(0.0455)");
    const site = readFileSync(new URL("../fixtures/link-icons/social-github.svg", import.meta.url), "utf8");
    const path = /<path d="([^"]+)"/.exec(site)![1];
    expect((mark.children[0] as SvgNode).attrs.d).toBe(path);
    expect(LINK_ICONS.find((icon) => icon.name === "github")!.description).toMatch(/Font Awesome.*CC BY 4\.0/);
  });

  test("Faces and glyphs as designed", () => {
    // design §6: faces as token paths; glyphs of brunosouzas.com e29b3dd, and the website globe.
    expect(LINK_ICONS.map((icon) => [icon.name, icon.title, icon.face])).toEqual([
      ["github", "GitHub", "color.white"],
      ["linkedin", "LinkedIn", "color.caller"],
      ["email", "Email", "color.transitional"],
      ["website", "Website", "color.healthy"],
    ]);
    const glyph = (icon: string) => (linkIcon({ icon, x: 0, y: 0 }).body[0].children as SvgNode[]).slice(2);
    const faceFill = (icon: string) => ((linkIcon({ icon, x: 0, y: 0 }).body[0].children as SvgNode[])[1]).attrs.fill;
    expect(["github", "linkedin", "email", "website"].map(faceFill)).toEqual(["#FFFFFF", "#8FB2FF", "#FFD25A", "#3DDC84"]);
    const ink = "#0A1033";
    expect(glyph("linkedin")).toEqual([
      { tag: "rect", attrs: { x: 12, y: 18.5, width: 4, height: 11.5, rx: 1, fill: ink, stroke: "none" }, children: [] },
      { tag: "circle", attrs: { cx: 14, cy: 13.8, r: 2.4, fill: ink, stroke: "none" }, children: [] },
      { tag: "path", attrs: { d: "M19.5,30 V18.5 H23.5 V20.3 C24.5,19 26.2,18.1 28,18.1 C31.2,18.1 32.5,20.2 32.5,23.6 V30 H28.5 V24.3 C28.5,22.7 27.8,21.9 26.6,21.9 C25.2,21.9 23.5,22.8 23.5,24.7 V30 Z", fill: ink, stroke: "none" }, children: [] },
    ]);
    expect(glyph("email")).toEqual([
      { tag: "rect", attrs: { x: 9, y: 13, width: 24, height: 17, rx: 3, fill: "#FFFFFF", stroke: ink, "stroke-width": 2.5 }, children: [] },
      { tag: "path", attrs: { d: "M10,15 L21,23 L32,15", fill: "none", stroke: ink, "stroke-width": 2.5, "stroke-linejoin": "round" }, children: [] },
    ]);
    expect(glyph("website")).toEqual([
      { tag: "circle", attrs: { cx: 21, cy: 21, r: 10.5, fill: "#FFFFFF", stroke: ink, "stroke-width": 2.5 }, children: [] },
      { tag: "ellipse", attrs: { cx: 21, cy: 21, rx: 4.6, ry: 10.5, fill: "none", stroke: ink, "stroke-width": 2 }, children: [] },
      { tag: "path", attrs: { d: "M10.5 21H31.5M12.5 15.5H29.5M12.5 26.5H29.5", fill: "none", stroke: ink, "stroke-width": 2, "stroke-linecap": "round" }, children: [] },
    ]);
    expect(glyph("github")).toHaveLength(1);
  });

  test("Dark frame", () => {
    const [shadow, rim, face] = linkIcon({ icon: "email", x: 0, y: 0, surface: "dark" }).body[0].children as SvgNode[];
    expect(shadow.attrs).toMatchObject({ x: 4, y: 4, width: 41, height: 41, rx: 11, fill: "#4C5CB8" });
    expect(rim.attrs).toMatchObject({ x: 0.5, y: 0.5, width: 41, height: 41, rx: 11, fill: "#EEF2FF" });
    expect(face.attrs).toMatchObject({ x: 2, y: 2, width: 38, height: 38, rx: 9, fill: "#FFD25A" });
  });

  test("Unknown icon", () => {
    expect(() => linkIcon({ icon: "x", x: 0, y: 0 })).toThrow(/^linkIcon: icon: expected one of github, linkedin, email, website/);
    expect(() => linkIcon({ x: 0, y: 0 } as never)).toThrow(/^linkIcon: icon: missing required parameter/);
  });
});

describe("Icons hold no link, style or script", () => {
  test("Every icon as a standalone file", () => {
    const trees: Drawn[] = [];
    for (const surface of surfaces) {
      for (const name of UI_ICON_NAMES) trees.push(uiIcon({ name, x: 0, y: 0, colour: surface === "light" ? "color.ink" : "surface.dark.text" }));
      for (const icon of LINK_ICON_NAMES) trees.push(linkIcon({ icon, x: 0, y: 0, surface }));
    }
    expect(trees).toHaveLength(22);
    for (const tree of trees) {
      walk([...tree.body, ...tree.text], (node) => {
        if (typeof node === "string") {
          expect(node).not.toMatch(/url\(|:\/\//);
          return;
        }
        expect(SVG_TAGS).toContain(node.tag);
        for (const [name, value] of Object.entries(node.attrs)) {
          expect(name).not.toMatch(/^(href|xlink:href|style|on.*)$/i);
          expect(String(value)).not.toMatch(/url\(|:\/\//);
        }
      });
      const file = toSvg(el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 46 46" }, ...tree.body));
      expect(file.split("://")).toHaveLength(2);
      expect(file).toContain('xmlns="http://www.w3.org/2000/svg"');
    }
  });
});

describe("New pieces carry their own stroke", () => {
  test("Inside the outlined group", () => {
    const drawings: [string, Drawn][] = [];
    for (const surface of surfaces) {
      drawings.push(
        ["renewalRing", renewalRing({ cx: 0, cy: 0, r: 18, surface })],
        ["suggestedHalo", suggestedHalo({ cx: 0, cy: 0, r: 21, surface })],
        ["licenceMark", licenceMark({ cx: 0, cy: 0, surface })],
        ["zone 1", zone({ points: [[0, 0]], fill: "color.caller", surface })],
        ["zone 2", zone({ points: [[0, 0], [10, 0]], fill: "color.caller", surface })],
        ["zone 3", zone({ points: [[0, 0], [10, 0], [5, 8]], fill: "color.caller", surface })],
        ...UI_ICON_NAMES.map((name) => [`uiIcon ${name}`, uiIcon({ name, x: 0, y: 0 })] as [string, Drawn]),
        ...LINK_ICON_NAMES.map((icon) => [`linkIcon ${icon}`, linkIcon({ icon, x: 0, y: 0, surface })] as [string, Drawn]),
      );
    }
    drawings.push(["ledgerMark dark", ledgerMark({ x: 0, y: 0, surface: "dark" })]);
    // The ten body diagram pieces (change body-diagram-pieces, task 3.3).
    for (const surface of surfaces) {
      for (const [name, params] of Object.entries(BODY_DIAGRAM)) drawings.push([`${name} ${surface}`, (DIAGRAM_PIECES[name as keyof typeof DIAGRAM_PIECES] as unknown as (p: object) => Drawn)({ ...params, surface })]);
      drawings.push(
        ["altFrame sections", altFrame({ x: 0, y: 0, width: 200, height: 100, tag: "alt", condition: "[x]", sections: [{ y: 50, tag: "else", condition: "[y]" }], surface })],
        ["edgeLabel backdrop", edgeLabel({ x: 0, y: 0, lines: ["a"], backdrop: true, surface })],
        // Change designer-formats (AB#173): the start dot.
        [`stateStart ${surface}`, stateStart({ cx: 0, cy: 0, surface })],
      );
    }
    const shapes = new Set(["circle", "ellipse", "rect", "line", "polyline", "polygon", "path"]);
    for (const [label, drawn] of drawings) {
      walk(drawn.body, (node, ancestors) => {
        if (typeof node === "string" || !shapes.has(node.tag)) return;
        const stroked = node.attrs.stroke !== undefined || ancestors.some((a) => a.tag === "g" && a.attrs.stroke !== undefined);
        expect(stroked, `${label}: ${node.tag}`).toBe(true);
      });
    }
  });
});
