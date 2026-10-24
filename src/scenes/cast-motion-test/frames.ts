// The approved cast motion test (spec scene-catalogue, "Cast motion test";
// change cast-and-emotes, design §8): the agent has an idea, the requester does
// not understand, the dev sees a problem. 12 s, 16:9, no words. A proof of the
// cast, not an article scene: it is registered in the Studio's `cast` folder,
// never in src/scenes/index.ts (ADR 0004, ADR 0005).
//
// Pure: frame -> SvgNode, ported from the spike's motion-test.mts. The frozen
// fixture (test/fixtures/cast-0.5.0.json, `frames`) pins every frame's SVG.
import { interpolate } from "remotion";
import { tokens } from "../../../tokens/generated/tokens";
import { blinking, breathe, emotePop, hop, leave, squashAfter } from "../../brand/cast-motion";
import { emote, mascot, type EmoteKind, type MascotFace } from "../../pieces/cast";
import { el, g, type SvgNode } from "../../pieces/node";
import { pose } from "../../pieces/pose";

export const CAST_MOTION_TEST = { id: "cast-motion-test", folder: "cast", width: 1920, height: 1080, durationInFrames: 360 } as const;
const { width: W, height: H } = CAST_MOTION_TEST;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const between = (frame: number, a: number, b: number) => frame >= a && frame < b;

const AGENT = { x: 450, base: 960, s: 1.9 };
const REQ = { x: 960, base: 960, s: 1.9 };
const DEV = { x: 1450, base: 960, s: 1.9 };
/** Emote size beside a mascot of scale 1.9. */
const EMOTE = 2.2;

type Acting = { hop?: number; squash?: number; tilt?: number; shake?: number; enter: number };
/** An actor entering with its pop (scale and opacity), left out while the pop is still 0. */
const actor = (node: SvgNode, x: number, y: number, o: Acting) =>
  o.enter <= 0.001 ? null : pose(node, { x, y, hop: o.hop ?? 0, squash: o.squash ?? 1, tilt: o.tilt ?? 0, shake: o.shake ?? 0, scale: o.enter, opacity: Math.min(1, o.enter * 1.4) });
const placeEmote = (kind: EmoteKind, x: number, y: number, scale: number, wobble = 0, glow = 1) =>
  scale <= 0.001 ? null : pose(emote({ kind, x, y }).body[0], { x, y, tilt: wobble, scale: scale * glow * EMOTE });

/** `ideaPopAt` exists for the test that proves a moved beat is caught (scenario "A changed beat is caught"). */
export const castMotionTestFrame = (frame: number, { ideaPopAt = 62 }: { ideaPopAt?: number } = {}): SvgNode => {
  const enter = (at: number) => emotePop(frame, at);

  // Beat A: the agent has an idea (30..130)
  const aThinking = between(frame, 30, 62);
  const aIdea = frame >= 62 && frame < 118;
  let aFace: MascotFace = blinking(frame, [18, 150, 262, 340]) ? "blink" : "normal";
  if (aThinking) aFace = "thinking";
  if (aIdea) aFace = "happy";
  const aTilt = interpolate(frame, [30, 44, 62, 72, 118, 132], [0, 12, 12, -8, -8, 0], clamp) + (aThinking ? 2 * Math.sin(frame / 4) : 0);
  const aEmote = frame < 62 ? 0 : frame < 112 ? emotePop(frame, ideaPopAt) : leave(frame, 112);
  const aGlow = 1 + (aIdea ? 0.05 * Math.sin((frame - 62) / 3) : 0);

  // Beat B: the requester does not understand (130..230)
  const bQ = frame >= 142 && frame < 214;
  let bFace: MascotFace = blinking(frame, [44, 96, 240, 318]) ? "blink" : "normal";
  if (bQ) bFace = "thinking";
  const bLean = interpolate(frame, [138, 150, 206, 220], [0, -7, -7, 0], clamp);
  const bEmote = frame < 142 ? 0 : frame < 206 ? emotePop(frame, 142) : leave(frame, 206);
  const bWobble = bQ ? 9 * Math.sin((frame - 142) / 6) : 0;

  // Beat C: the dev sees the problem (230..330)
  const cAt = 246;
  let cFace: MascotFace = blinking(frame, [70, 120, 200, 350]) ? "blink" : "normal";
  if (frame >= cAt && frame < 272) cFace = "surprised";
  if (frame >= 272 && frame < 316) cFace = "worried";
  const cEmote = frame < cAt ? 0 : frame < 310 ? emotePop(frame, cAt) : leave(frame, 310);
  const cShake = between(frame, cAt + 14, cAt + 28) ? 7 * Math.sin((frame - cAt) * 2.4) : 0;

  return el(
    "svg",
    { xmlns: "http://www.w3.org/2000/svg", width: W, height: H, viewBox: `0 0 ${W} ${H}` },
    el("rect", { width: W, height: H, fill: tokens.color.panel }),
    g({ fill: "none", stroke: tokens.color.ring, "stroke-width": 2 }, ...Array.from({ length: 22 }, (_, k) => el("circle", { cx: W / 2, cy: 640, r: 120 + k * 56 }))),
    actor(mascot({ who: "agent", x: AGENT.x, y: AGENT.base, face: aFace, scale: AGENT.s, headTilt: aTilt, look: aThinking ? 1 : 0 }).body[0], AGENT.x, AGENT.base, {
      enter: enter(0),
      squash: squashAfter(frame, 62, 0.1) * breathe(frame, 0),
      hop: hop(frame, 62, 28, 12),
    }),
    actor(mascot({ who: "request", x: REQ.x, y: REQ.base, face: bFace, action: "rest", scale: REQ.s, prop: false, look: bQ ? 1 : 0 }).body[0], REQ.x, REQ.base, {
      enter: enter(6),
      tilt: bLean,
      squash: squashAfter(frame, 142, 0.08) * breathe(frame, 20),
    }),
    actor(mascot({ who: "dev", x: DEV.x, y: DEV.base, face: cFace, scale: DEV.s }).body[0], DEV.x, DEV.base, {
      enter: enter(12),
      hop: hop(frame, cAt, 60, 14),
      squash: squashAfter(frame, cAt + 14, 0.12) * breathe(frame, 40),
      shake: cShake,
    }),
    placeEmote("idea", AGENT.x + 270, AGENT.base - 560, aEmote, 0, aGlow),
    placeEmote("doubt", REQ.x + 240, REQ.base - 420, bEmote, bWobble),
    placeEmote("problem", DEV.x + 290, DEV.base - 450, cEmote),
  );
};
