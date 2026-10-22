// The circuit-breaker state machine composition (ported from the approved
// pilot's StateMachine.tsx). It only arranges components: the timing comes from
// scene.ts, the positions from layout.ts, the values from the tokens and what
// is visible at a frame from src/brand/motion.ts.
//
// Layer order: arrows, blocks, travelling tokens, pills, caption, so a token is
// never hidden under a block and never covers a label.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Arrow, ArrowHead, CallSquare, Countdown, InkBlock, Pill, Rings, Tokens } from "../../brand/components";
import { sans } from "../../brand/fonts";
import { arrowDrawAt, blockAppearance, blockContents, captionAt, fadeIn, pillAt } from "../../brand/motion";
import { tokens } from "../../../tokens/generated/tokens";
import type { Format, Lang } from "../catalogue";
import { layouts, type Layout } from "./layout";
import { text, timeline, type StateId, type TransitionId } from "./scene";

export type SceneProps = { lang: Lang; format: Format };

const { color, font, outline, radius, shadow } = tokens;

// Semantic colour of each state (ADR 0003): green healthy, orange blocked, yellow transitional.
const fillOf: Record<StateId, string> = {
  closed: color.healthy,
  open: color.blocked,
  half: color.transitional,
};

/** The state block that carries the countdown (the reset timeout runs while OPEN). */
const COUNTDOWN_STATE: StateId = "open";
const START_DOT_RADIUS = 14;
const STATE_LETTER_SPACING = 1;
const CAPTION_GAP = 20;

const StateBlock: React.FC<{ id: StateId; layout: Layout; lang: Lang }> = ({ id, layout, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box = layout.boxes[id];
  const contents = blockContents(frame, id, timeline);
  const sq = layout.size.square;
  return (
    <InkBlock {...box} fill={fillOf[id]} appearance={blockAppearance(frame, id, timeline, fps)}>
      <div style={{ fontSize: layout.size.state, fontWeight: font.weightHeavy, letterSpacing: STATE_LETTER_SPACING }}>
        {text[lang].states[id]}
      </div>
      <div style={{ display: "flex", gap: sq * 0.28, alignItems: "center" }}>
        {id === COUNTDOWN_STATE ? (
          <div style={{ marginRight: sq * 0.3 }}>
            <Countdown left={contents.countdown} size={sq * 1.35} />
          </div>
        ) : null}
        {contents.slots.map((slot, i) =>
          slot.at !== null ? (
            <CallSquare key={`${contents.phaseFrom}-${i}`} kind={slot.kind} size={sq} appearAt={slot.at} />
          ) : (
            <CallSquare key={`empty-${i}`} kind="empty" size={sq} appearAt={0} />
          ),
        )}
      </div>
    </InkBlock>
  );
};

const Caption: React.FC<{ layout: Layout; lang: Lang }> = ({ layout, lang }) => {
  const frame = useCurrentFrame();
  const caption = captionAt(frame, timeline.phases);
  if (!caption) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (layout.width - layout.caption.width) / 2,
        width: layout.caption.width,
        top: layout.caption.y,
        transform: `translate(0, calc(-50% + ${caption.lift}px))`,
        opacity: caption.opacity,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: CAPTION_GAP,
        fontFamily: sans,
        color: color.ink,
        textAlign: "center",
      }}
    >
      <span
        style={{
          background: fillOf[caption.state],
          border: `${outline.small}px solid ${color.ink}`,
          borderRadius: radius.pill,
          boxShadow: `${shadow.small}px ${shadow.small}px 0 ${color.ink}`,
          padding: "4px 18px",
          fontSize: layout.size.caption * 0.8,
          fontWeight: font.weightHeavy,
        }}
      >
        {text[lang].states[caption.state]}
      </span>
      <span style={{ fontSize: layout.size.caption, fontWeight: font.weightBold }}>{text[lang].captions[caption.state]}</span>
    </div>
  );
};

/** Arrow and token stroke per transition: the failure path is red (ADR 0003). */
const strokeOf: Record<TransitionId, string> = {
  toOpen: color.ink,
  toHalf: color.ink,
  halfToOpen: color.failure,
  halfToClosed: color.ink,
};
const TRANSITIONS: TransitionId[] = ["toOpen", "toHalf", "halfToOpen", "halfToClosed"];
const STATES: StateId[] = ["closed", "open", "half"];

export const CircuitBreakerStatesScene: React.FC<SceneProps> = ({ lang, format }) => {
  const frame = useCurrentFrame();
  const layout = layouts[format];
  const t = text[lang];
  const { width, height } = layout;
  return (
    <AbsoluteFill style={{ background: color.panel }}>
      <Rings width={width} height={height} cx={layout.rings.cx} cy={layout.rings.cy} fade={timeline.ringsFade} />

      {/* Initial-state marker */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: fadeIn(frame, timeline.startMarkerFade) }}>
        <circle cx={layout.start.dot[0]} cy={layout.start.dot[1]} r={START_DOT_RADIUS} fill={color.ink} />
        <defs>
          <ArrowHead id="m-start" fill={color.ink} />
        </defs>
        <path d={layout.start.d} stroke={color.ink} strokeWidth={outline.arrow} fill="none" markerEnd="url(#m-start)" />
      </svg>

      {TRANSITIONS.map((id) => (
        <Arrow key={id} d={layout.arrows[id]} drawAt={arrowDrawAt(timeline, id)} stroke={strokeOf[id]} width={width} height={height} />
      ))}

      {STATES.map((id) => (
        <StateBlock key={id} id={id} layout={layout} lang={lang} />
      ))}

      {TRANSITIONS.map((id) => (
        <Tokens key={id} d={layout.arrows[id]} fires={timeline.fires[id]} stroke={strokeOf[id]} width={width} height={height} />
      ))}

      <Pill
        cx={layout.pills.toOpen[0]}
        cy={layout.pills.toOpen[1]}
        lines={t.toOpen.lines}
        small={t.toOpen.small}
        size={layout.size.pill}
        appearAt={pillAt(timeline, "toOpen")}
      />
      <Pill cx={layout.pills.toHalf[0]} cy={layout.pills.toHalf[1]} lines={t.toHalf.lines} size={layout.size.pill} appearAt={pillAt(timeline, "toHalf")} />
      <Pill
        cx={layout.pills.halfToOpen[0]}
        cy={layout.pills.halfToOpen[1]}
        lines={t.halfToOpen.lines}
        size={layout.size.pill}
        appearAt={pillAt(timeline, "halfToOpen")}
        accent={color.failure}
      />
      <Pill
        cx={layout.pills.halfToClosed[0]}
        cy={layout.pills.halfToClosed[1]}
        lines={t.halfToClosed.lines}
        size={layout.size.pill}
        appearAt={pillAt(timeline, "halfToClosed")}
      />

      <Caption layout={layout} lang={lang} />
    </AbsoluteFill>
  );
};
