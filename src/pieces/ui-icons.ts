// UI icons as data (spec illustration-pieces, "UI icons as data"; design §5 of
// stackledger-map-and-link-pieces): the glyphs of the sites' chrome (theme
// switch, map zoom, reports), drawn for this package in a 24x24 box. The data
// holds no colour: `uiIcon` sets `fill` and `stroke` on its group from one
// token, so an icon draws in any token colour and inside any outlined group.
//
// What can go wrong: an unknown name or a colour that is not a token path is
// rejected by the schema before drawing.
import type { SvgNode } from "./node.ts";
import { el, g, drawn, r2 } from "./node.ts";
import { col, pos, size } from "./params.ts";
import { definePiece } from "./piece.ts";
import { colour } from "./params.ts";

export type UiIcon = { readonly name: string; readonly title: string; readonly description: string; readonly nodes: readonly SvgNode[] };

/** Every UI icon draws in a 24x24 box. */
export const UI_ICON_SIZE = 24;

const stroked = (d: string): SvgNode => el("path", { d, fill: "none", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
const filled = (d: string): SvgNode => el("path", { d, stroke: "none" });

export const UI_ICONS: readonly UiIcon[] = [
  {
    name: "sun",
    title: "Sun",
    description: "Light theme: a disc with eight rays.",
    nodes: [el("circle", { cx: 12, cy: 12, r: 4.5, stroke: "none" }), stroked("M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8")],
  },
  { name: "moon", title: "Moon", description: "Dark theme: a crescent moon.", nodes: [filled("M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z")] },
  { name: "zoomIn", title: "Zoom in", description: "A magnifier with a plus.", nodes: [stroked("M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13ZM15.3 15.3l5.2 5.2M7.5 10.5h6M10.5 7.5v6")] },
  { name: "zoomOut", title: "Zoom out", description: "A magnifier with a minus.", nodes: [stroked("M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13ZM15.3 15.3l5.2 5.2M7.5 10.5h6")] },
  { name: "reset", title: "Reset", description: "A circular arrow: back to the start.", nodes: [stroked("M4.5 12A7.5 7.5 0 1 0 6.7 6.7M4 3.5v4.5h4.5")] },
  {
    name: "calendar",
    title: "Calendar",
    description: "A calendar page with one day marked.",
    nodes: [stroked("M5.5 5h13a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3.5 10h17M8 3v4M16 3v4"), el("rect", { x: 7, y: 13, width: 3, height: 3, rx: 0.5, stroke: "none" })],
  },
  { name: "download", title: "Download", description: "An arrow down into a tray.", nodes: [stroked("M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 16.5v3h15v-3")] },
];

export const UI_ICON_NAMES = UI_ICONS.map((icon) => icon.name);

export type UiIconParams = { name: string; x: number; y: number; size?: number; colour?: string };
/** One UI icon at (x, y), `size` wide (24 by default), in one token colour (`color.ink` by default). */
export const uiIcon = definePiece<UiIconParams>(
  "uiIcon",
  { name: { kind: "enum", required: true, values: UI_ICON_NAMES }, x: pos(), y: pos(), size: size(), colour: col() },
  ({ name, x, y, size: side = UI_ICON_SIZE, colour: path = "color.ink" }) => {
    const icon = UI_ICONS.find((candidate) => candidate.name === name)!;
    const paint = colour(path, "colour");
    return drawn([g({ transform: `translate(${r2(x)} ${r2(y)}) scale(${side / UI_ICON_SIZE})`, fill: paint, stroke: paint }, ...icon.nodes)]);
  },
);
