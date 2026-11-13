// React-free catalogue entry of the SDD scene 2, the files (card 144; change
// sdd-scene-2-files): on scene 1's stage, `openspec init` makes the
// `openspec/` folder, `/opsx:propose` brings out the change's four files,
// `proposal.md` lists six questions and Balão answers them, two independent
// reviews say NO-GO with their findings marked on the rows, the fourth
// version gets Balão's GO, and Visor implements. A neutral `sequence` scene
// (ADR 0005 as amended 2026-11-09, SCN-1): one 16:9 composition for both
// pages, its few words in one English table, both pages as sources. The stills
// and render commands import this file under tsx.
import type { SequenceSceneData } from "../catalogue";
import { timeline } from "./timeline";

/**
 * Every word the scene draws (design §8.1): the folder's and the files' names
 * (L50, L89–L101), the verdicts (L124), and the `?` of the sheet's question
 * rows (L106–L113), drawn by the `sheet` piece itself.
 */
export const text = {
  en: {
    folder: "openspec/",
    files: { proposal: "proposal.md", design: "design.md", tasks: "tasks.md", spec: "spec.md" },
    verdicts: { rejected: "NO-GO", approved: "GO" },
    question: "?",
  },
} as const;

export const sddScene2Files = {
  id: "sdd-scene-2-files",
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
