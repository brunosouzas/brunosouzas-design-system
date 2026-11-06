// Shared skin of the brand cast (Mira, Visor, Drone, Kiu, Sinal): porcelain
// white body, ink outline, near-black visor, amber eyes, one accent — ADR
// 0007, identity studio I2/I3, phase-3/4 approved scripts
// (`~/.hermes/cache/scratch/ab267/sheet7.py`, `final.py`, both `SK()`).
//
// Why code, not a token: the three-segment path limit (ADR 0006) rules out
// `cast.<name>.<theme>.*`, and every character shares one skin anyway — only
// shape and one signature part (the hood tip) differ between characters.
import { type SurfaceName } from "./ink.ts";
import { colour } from "./params.ts";

export type Skin = { readonly body: string; readonly outline: string; readonly visor: string; readonly eye: string; readonly accent: string };

const c = (path: string): string => colour(path);

/**
 * The cast's resolved colours for one surface. The visor is deliberately not
 * the mirror of the outline: the approved sheets keep the screen face
 * near-black in both themes (contrast against the white body), so dark-theme
 * visor reads `brand.dark.bg`, not the light cream `brand.dark.text`.
 */
export const skin = (surface: SurfaceName): Skin =>
  surface === "light"
    ? { body: c("color.white"), outline: c("brand.light.text"), visor: c("brand.light.text"), eye: c("cast.eyes"), accent: c("brand.light.accent") }
    : { body: c("color.white"), outline: c("brand.dark.textMuted"), visor: c("brand.dark.bg"), eye: c("cast.eyes"), accent: c("brand.dark.accent") };

/** `fill`/`stroke`/`stroke-width`/`stroke-linejoin` for an outlined body shape (the sheets' `ob()`). */
export const outlined = (s: Skin, width = 8) => ({ fill: s.body, stroke: s.outline, "stroke-width": width, "stroke-linejoin": "round" as const });
