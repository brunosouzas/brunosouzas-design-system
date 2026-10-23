// Unit tests of the UI and link icons and of the new pieces' own strokes (spec
// illustration-pieces, change stackledger-map-and-link-pieces; tasks 3.1 to
// 3.3). Each test title is the spec scenario it proves.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { LINK_ICONS, LINK_ICON_NAMES, linkIcon } from "../../src/pieces/link-icons";
import { ledgerMark, licenceMark, renewalRing, suggestedHalo, zone } from "../../src/pieces/metro";
import { SVG_TAGS, el, type Drawn, type SvgNode } from "../../src/pieces/node";
import { toSvg } from "../../src/pieces/render";
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
