// Source Sans 3 and Source Code Pro for the animations (ADR 0008), loaded
// through @remotion/google-fonts and composed with the font.sans and font.mono
// token stacks, so a scene frame and a written SVG set the same type. Sans takes
// 400, 700 and 900, mono 400 and 700: the faces the pieces draw.
//
// What can go wrong: the loader fetches from fonts.googleapis.com and
// fonts.gstatic.com and holds each frame (delayRender) until the families load,
// so an offline render fails with a timeout instead of falling back. Never
// import this file from tests or scripts: they must not need the network
// (test/brand/fonts.test.ts reads it as text).
import { loadFont as loadSans } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadMono } from "@remotion/google-fonts/SourceCodePro";
import { tokens } from "../../tokens/generated/tokens";

const subsets: ("latin" | "latin-ext")[] = ["latin", "latin-ext"];
const loadedSans = loadSans("normal", { weights: ["400", "700", "900"], subsets });
const loadedMono = loadMono("normal", { weights: ["400", "700"], subsets });

export const sans = `${loadedSans.fontFamily}, ${tokens.font.sans}`;
export const mono = `${loadedMono.fontFamily}, ${tokens.font.mono}`;
