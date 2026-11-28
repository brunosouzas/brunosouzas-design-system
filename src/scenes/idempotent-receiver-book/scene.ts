// React-free catalogue entry of the Idempotent Receiver book scene (card
// SW-160; change idempotent-receiver-book-scene): the pattern as the book
// describes it, played twice on one stage. Take 1: the channel delivers order
// 42 once; the receiver looks it up, processes it and stores its ID. Take 2:
// the same order, sent once, is delivered twice; the second delivery is found
// and ignored, so take 2 ends with take 1's effect (L28). A neutral scene (ADR
// 0005 as amended 2026-11-09, SCN-1): one 16:9 composition for both pages, its
// few words in one English table, both pages as sources. The stills and render
// commands import this file under tsx.
import type { TakesSceneData } from "../catalogue";
import { timeline } from "./timeline";

/**
 * Every word the scene draws (design §5): the book diagram's `Sender` and
 * order `42` (L32), the `?` of the `questionToken`, and the take numbers.
 */
export const text = {
  en: { sender: "Sender", id: "42", question: "?", takes: ["1", "2"] },
} as const;

export const idempotentReceiverBook = {
  id: "idempotent-receiver-book",
  kind: "takes",
  neutral: true,
  formats: ["16x9"],
  languages: ["en"],
  timeline,
  text,
  sources: {
    pt: "https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/",
    en: "https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/",
  },
} satisfies TakesSceneData;
