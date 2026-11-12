// Text measurement for the scene layout tests (change
// circuit-breaker-topology-scene, task 4.4; design §6.3): the advance of a
// string on the package's own `fonts/` faces, shaped with harfbuzzjs (already
// the package's dependency; this is test-only use), and the box a drawn string
// covers. Test-only: no scene or script imports it.
//
// Box rule (design §6.3): advance width × effective size, placed by its anchor,
// from 0.8 × size above the baseline to 0.25 × size below it.
//
// What can go wrong: a face file that is missing or a module that does not
// load throws when the test file imports this module, naming the file. The ✓
// and ✕ glyphs are not in the Source faces (harfbuzz gives .notdef); callers
// check them for size only.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "harfbuzzjs";

const fontsDir = fileURLToPath(new URL("../../fonts/", import.meta.url));

export type FaceName = "sans" | "mono";
/** The faces the pieces draw their words in: `diagramBox`, `edgeLabel` and `countBadge` set weight 700. */
const FILES: Record<FaceName, string> = { sans: "SourceSans3-Bold.ttf", mono: "SourceCodePro-Bold.ttf" };

const fonts = Object.fromEntries(
  (Object.entries(FILES) as [FaceName, string][]).map(([name, file]) => {
    const path = join(fontsDir, file);
    let data: Uint8Array;
    try {
      data = readFileSync(path);
    } catch (error) {
      throw new Error(`text-measure: cannot read ${path}: ${(error as Error).message}`);
    }
    const face = new hb.Face(new hb.Blob(data));
    return [name, { font: new hb.Font(face), upem: face.upem }];
  }),
) as Record<FaceName, { font: hb.Font; upem: number }>;

const cache = new Map<string, number>();
/** Advance width of `text` in `face`, in units of the font size (em); cached, since the tests measure the same words at every frame. */
export const advanceEm = (text: string, face: FaceName): number => {
  const key = `${face}:${text}`;
  const known = cache.get(key);
  if (known !== undefined) return known;
  const { font, upem } = fonts[face];
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const width = buffer.getGlyphPositions().reduce((sum, p) => sum + p.xAdvance, 0);
  cache.set(key, width / upem);
  return width / upem;
};

export type Run = { text: string; face: FaceName };
export type Box = { x0: number; y0: number; x1: number; y1: number };

/** The box of runs drawn at (x, baseline) at `size`, by `anchor` (design §6.3). */
export const textBox = (runs: readonly Run[], x: number, baseline: number, size: number, anchor: "start" | "middle" | "end"): Box => {
  const width = runs.reduce((sum, run) => sum + advanceEm(run.text, run.face), 0) * size;
  const left = anchor === "start" ? x : anchor === "middle" ? x - width / 2 : x - width;
  return { x0: left, y0: baseline - 0.8 * size, x1: left + width, y1: baseline + 0.25 * size };
};
