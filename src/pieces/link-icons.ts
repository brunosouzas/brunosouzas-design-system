// Link icons as data (spec illustration-pieces, "Link icons as data"; design §6
// of stackledger-map-and-link-pieces): the social stickers of brunosouzas.com
// (public/images/home/social-*.svg at e29b3dd), with every colour replaced by
// its token, plus a `website` globe in the same style. `linkIcon` draws the
// site's frame (light, or dark with its rim) around the face and the glyph, at
// the site's measures (46 box, face 38 at 2, radius 9, outline 2.5).
//
// Credit: the GitHub mark is Font Awesome's (fontawesome.com), licensed
// CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); its description
// keeps the credit.
//
// What can go wrong: an unknown icon is rejected by the schema. No node holds
// a link, a style, a script or a URL, so the output can ship as a static file.
import { tokens } from "../../tokens/generated/tokens.ts";
import { drawn, el, g, r2, type SvgNode } from "./node.ts";
import { pos, size } from "./params.ts";
import { definePiece } from "./piece.ts";
import { SURFACES, type SurfaceName } from "./metro.ts";

const C = tokens.color;
const INK = C.ink;

export type LinkIcon = { readonly name: string; readonly title: string; readonly description: string; readonly face: string; readonly glyph: readonly SvgNode[] };

/** Every link icon draws in a 46x46 box. */
export const LINK_ICON_SIZE = 46;

export const LINK_ICONS: readonly LinkIcon[] = [
  {
    name: "github",
    title: "GitHub",
    description: "GitHub icon. The GitHub mark is from Font Awesome (fontawesome.com), CC BY 4.0.",
    face: C.white,
    glyph: [g({ transform: "translate(9.5 9) scale(0.0455)" }, el("path", { d: "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z", fill: INK, stroke: "none" }))],
  },
  {
    name: "linkedin",
    title: "LinkedIn",
    description: "LinkedIn icon.",
    face: C.caller,
    glyph: [
      el("rect", { x: 12, y: 18.5, width: 4, height: 11.5, rx: 1, fill: INK, stroke: "none" }),
      el("circle", { cx: 14, cy: 13.8, r: 2.4, fill: INK, stroke: "none" }),
      el("path", { d: "M19.5,30 V18.5 H23.5 V20.3 C24.5,19 26.2,18.1 28,18.1 C31.2,18.1 32.5,20.2 32.5,23.6 V30 H28.5 V24.3 C28.5,22.7 27.8,21.9 26.6,21.9 C25.2,21.9 23.5,22.8 23.5,24.7 V30 Z", fill: INK, stroke: "none" }),
    ],
  },
  {
    name: "email",
    title: "Email",
    description: "Email icon.",
    face: C.transitional,
    glyph: [
      el("rect", { x: 9, y: 13, width: 24, height: 17, rx: 3, fill: C.white, stroke: INK, "stroke-width": 2.5 }),
      el("path", { d: "M10,15 L21,23 L32,15", fill: "none", stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "website",
    title: "Website",
    description: "Website icon: a globe.",
    face: C.healthy,
    glyph: [
      el("circle", { cx: 21, cy: 21, r: 10.5, fill: C.white, stroke: INK, "stroke-width": 2.5 }),
      el("ellipse", { cx: 21, cy: 21, rx: 4.6, ry: 10.5, fill: "none", stroke: INK, "stroke-width": 2 }),
      el("path", { d: "M10.5 21H31.5M12.5 15.5H29.5M12.5 26.5H29.5", fill: "none", stroke: INK, "stroke-width": 2, "stroke-linecap": "round" }),
    ],
  },
];

export const LINK_ICON_NAMES = LINK_ICONS.map((icon) => icon.name);

/** The site's frame: the shadow (and on dark the rim) behind the face. */
const frame = (surface: SurfaceName): SvgNode[] => {
  const s = tokens.surface[surface];
  return s.rimWidth > 0
    ? [
        el("rect", { x: 4, y: 4, width: 41, height: 41, rx: 11, fill: s.shadow, stroke: "none" }),
        el("rect", { x: 0.5, y: 0.5, width: 41, height: 41, rx: 11, fill: s.rim, stroke: "none" }),
      ]
    : [el("rect", { x: 5, y: 5, width: 38, height: 38, rx: 9, fill: s.shadow, stroke: "none" })];
};

export type LinkIconParams = { icon: string; x: number; y: number; size?: number; surface?: SurfaceName };
/** One link sticker at (x, y), `size` wide (46 by default), on the light or the dark page. */
export const linkIcon = definePiece<LinkIconParams>(
  "linkIcon",
  { icon: { kind: "enum", required: true, values: LINK_ICON_NAMES }, x: pos(), y: pos(), size: size(), surface: { kind: "enum", values: SURFACES } },
  ({ icon, x, y, size: side = LINK_ICON_SIZE, surface = "light" }) => {
    const data = LINK_ICONS.find((candidate) => candidate.name === icon)!;
    const face = el("rect", { x: 2, y: 2, width: 38, height: 38, rx: 9, fill: data.face, stroke: INK, "stroke-width": 2.5 });
    return drawn([g({ transform: `translate(${r2(x)} ${r2(y)}) scale(${side / LINK_ICON_SIZE})`, stroke: "none" }, ...frame(surface), face, ...data.glyph)]);
  },
);
