// Unit tests of the cast motion test (spec scene-catalogue, "Cast motion test",
// "One emote at a time in the motion test", "Motion test frames frozen"; change
// cast-and-emotes, task 5.1). Each title is a spec scenario.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Composition, Folder } from "remotion";
import { describe, expect, test } from "vitest";
import { RemotionRoot } from "../../src/Root";
import { scenes } from "../../src/scenes";
import { castMotionTestFrame } from "../../src/scenes/cast-motion-test/frames";
import type { SvgNode } from "../../src/pieces/node";
import { toReact } from "../../src/pieces/react";
import { toSvg } from "../../src/pieces/render";
import { normalForm } from "../pieces/normal-form";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const frozen = JSON.parse(readFileSync(new URL("../fixtures/cast-0.5.0.json", import.meta.url), "utf8")) as { frames: string[] };

/** Frames whose SVG differs from the recorded hash. */
const changedFrames = (draw: (frame: number) => SvgNode): number[] =>
  frozen.frames.flatMap((hash, frame) => (sha(toSvg(draw(frame))) === hash ? [] : [frame]));

const walk = (node: SvgNode | string, visit: (n: SvgNode, mascot: string | undefined) => void, mascot?: string) => {
  if (typeof node === "string") return;
  const who = typeof node.attrs["data-mascot"] === "string" ? (node.attrs["data-mascot"] as string) : mascot;
  visit(node, who);
  for (const child of node.children) walk(child, visit, who);
};
const emotesAt = (frame: number): string[] => {
  const found: string[] = [];
  walk(castMotionTestFrame(frame), (n) => {
    if (typeof n.attrs["data-emote"] === "string") found.push(n.attrs["data-emote"] as string);
  });
  return found;
};
/** The face drawing of one character, as SVG text, to compare faces between frames. */
const faceOf = (frame: number, who: string): string => {
  let face = "";
  walk(castMotionTestFrame(frame), (n, mascot) => {
    if (mascot === who && n.attrs["data-part"] === "face" && face === "") face = toSvg(n);
  });
  return face;
};

describe("Cast motion test", () => {
  test("Registered outside the catalogue", () => {
    const found: { folder: string | undefined; props: Record<string, unknown> }[] = [];
    const visit = (node: ReactNode, folder: string | undefined) => {
      if (Array.isArray(node)) return node.forEach((child) => visit(child, folder));
      if (!isValidElement(node)) return;
      const element = node as ReactElement<Record<string, unknown>>;
      if (element.type === Composition && element.props.id === "cast-motion-test") found.push({ folder, props: element.props });
      const inner = element.type === Folder ? (element.props.name as string) : folder;
      visit(element.props.children as ReactNode, inner);
    };
    visit(RemotionRoot({}) as ReactNode, undefined);
    expect(found).toHaveLength(1);
    expect(found[0].folder).toBe("cast");
    expect(found[0].props).toMatchObject({ width: 1920, height: 1080, fps: 30, durationInFrames: 360 });
    expect(scenes.some((scene) => scene.id === "cast-motion-test")).toBe(false);
  });

  test("Emote windows", () => {
    const runs: string[] = [];
    let current = "", start = 0;
    for (let frame = 0; frame <= 360; frame++) {
      const now = frame < 360 ? emotesAt(frame).join("+") : "end";
      if (now !== current || frame === 0) {
        if (frame > 0) runs.push(`${current || "none"} ${start}-${frame - 1}`);
        current = now;
        start = frame;
      }
    }
    expect(runs).toEqual(["none 0-62", "idea 63-121", "none 122-142", "doubt 143-215", "none 216-246", "problem 247-319", "none 320-359"]);
  });

  test("Onset with the face", () => {
    for (const [frame, who, kind] of [[62, "agent", "idea"], [142, "request", "doubt"], [246, "dev", "problem"]] as const) {
      expect(faceOf(frame, who), `${who} at ${frame}`).not.toBe(faceOf(frame - 1, who));
      expect(emotesAt(frame)).toEqual([]);
      expect(emotesAt(frame + 1)).toEqual([kind]);
    }
    expect(faceOf(62, "agent")).toContain('data-part="mouth"');
  });
});

describe("Motion test frames frozen", () => {
  test("Every frame matches", () => {
    expect(frozen.frames).toHaveLength(360);
    expect(changedFrames(castMotionTestFrame)).toEqual([]);
    for (let frame = 0; frame < 360; frame++) {
      walk(castMotionTestFrame(frame), (n) => expect(n.tag, `frame ${frame}`).not.toBe("text"));
    }
  });

  test("A changed beat is caught", () => {
    expect(changedFrames((frame) => castMotionTestFrame(frame, { ideaPopAt: 63 }))).toEqual(Array.from({ length: 49 }, (_, i) => 63 + i));
  });

  test("React path matches", () => {
    for (const frame of [0, 75, 160, 280]) {
      const tree = castMotionTestFrame(frame);
      expect(normalForm(renderToStaticMarkup(toReact(tree)))).toEqual(normalForm(toSvg(tree)));
    }
  });
});
