// React-free catalogue entry of the SDD scene 3, the archive (card 144;
// change sdd-scene-3-archive): on the stage scenes 1-2 left, the first
// change's folder is archived and the living `book` gains "exactly two
// fields"; days later a second request breaks that promise, which the
// `book`'s own jolt surfaces; a single minor finding is flagged and fixed on
// the second folder; Balão's `GO` lands; the implementation plays; the
// second folder is archived too, and only then does the `book`'s line read
// "exactly three fields". A neutral `sequence` scene (ADR 0005 as amended
// 2026-11-09, SCN-1): one 16:9 composition for both pages, its few words in
// one English table, both pages as sources. The stills and render commands
// import this file under tsx.
import type { SequenceSceneData } from "../catalogue";
import { timeline } from "./timeline";

/**
 * Every word the scene draws (design §8.1): the field-count phrase before and
 * after the second archive (L227, L232, L254, L215-216, L236), the owner's
 * `GO` (L124, L148) and the single finding's `?` (L221, reused at L236).
 */
export const text = {
  en: {
    fieldCount: { was: "exactly two fields", now: "exactly three fields" },
    verdict: "GO",
    question: "?",
  },
} as const;

export const sddScene3Archive = {
  id: "sdd-scene-3-archive",
  kind: "sequence",
  neutral: true,
  formats: ["16x9"],
  languages: ["en"],
  timeline,
  text,
  sources: {
    pt: "https://brunosouzas.com/pt/blog/spec-driven-development-in-practice",
    en: "https://brunosouzas.com/blog/spec-driven-development-in-practice",
  },
} satisfies SequenceSceneData;
