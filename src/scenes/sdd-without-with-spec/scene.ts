// React-free catalogue entry of the SDD scene 1, "without and with a spec"
// (card 144; change sdd-without-with-spec-scene). The first neutral scene: one
// 16:9 composition for both pages, its five words in one English table (ADR
// 0005 as amended 2026-11-09, SCN-1), both pages as sources.
import type { TakesSceneData } from "../catalogue";
import { timeline } from "./timeline";

/** Every word the scene draws (SCN-1); the pieces' own `?` glyph equals `question`. */
export const text = {
  en: { file: "proposal.md", approval: "GO", question: "?", takes: ["1", "2"] },
} as const;

export const sddWithoutWithSpec = {
  id: "sdd-without-with-spec",
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
