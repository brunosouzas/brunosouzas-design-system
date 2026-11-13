// React-free catalogue entry of the SDD scene 1, the request relay (card 144;
// change sdd-scene-1-relay): one request played twice on one stage, Balão (the
// logistics team) → Chaves (the developer) → Visor (the AI agent) at a shared
// laptop. Take 1 without a spec, take 2 with `proposal.md`. A neutral scene
// (ADR 0005 as amended 2026-11-09, SCN-1): one 16:9 composition for both
// pages, its few words in one English table, both pages as sources. The
// stills and render commands import this file under tsx.
import type { TakesSceneData } from "../catalogue";
import { timeline } from "./timeline";

/**
 * Every word the scene draws (design §8.1). The `?` is the `questionToken`'s
 * and the sheet rows' own glyph; `GO` is the stamp's word; the take numbers
 * are the badge's.
 */
export const text = {
  en: { file: "proposal.md", approval: "GO", question: "?", takes: ["1", "2"] },
} as const;

export const sddRequestRelay = {
  id: "sdd-request-relay",
  kind: "takes",
  neutral: true,
  formats: ["16x9"],
  languages: ["en"],
  timeline,
  text,
  sources: {
    pt: "https://brunosouzas.com/pt/blog/spec-driven-development-in-practice",
    en: "https://brunosouzas.com/blog/spec-driven-development-in-practice",
  },
} satisfies TakesSceneData;
