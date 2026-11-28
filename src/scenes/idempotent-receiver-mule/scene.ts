// React-free catalogue entry of the Idempotent Receiver Mule scene (card
// SW-160; change idempotent-receiver-mule-scene): the trap of the page's
// caveat (L109, L122), played twice on one stage. Take 1: Balão asks for the
// charge of an order; the Idempotent Message Validator stores the `orderId`,
// the charge goes through (one statement row) and the answer is 200; Balão
// asks again and gets 409, still one charge. Take 2: the same request, but
// storing the charge fails: 500, and the `orderId` stays in the store; the
// retry gets the same 409, and the statement ends at 0. A neutral scene (ADR
// 0005 as amended 2026-11-09, SCN-1): one 16:9 composition for both pages, its
// few words in one English table, both pages as sources. The stills and render
// commands import this file under tsx.
import type { TakesSceneData } from "../catalogue";
import { timeline } from "./timeline";

/**
 * Every word the scene draws (design §5): the charge-flow diagram's component
 * names and its `orderId` and status codes (L42), the statement's count of
 * charges (L44, L122), the `?` of the `questionToken`, and the take numbers.
 */
export const text = {
  en: {
    listener: ["HTTP", "Listener"],
    validator: ["Idempotent", "Message", "Validator"],
    charge: ["Simulated", "charge"],
    id: "`orderId`",
    accepted: "200",
    duplicate: "409",
    failed: "500",
    counts: ["0", "1"],
    question: "?",
    takes: ["1", "2"],
  },
} as const;

export const idempotentReceiverMule = {
  id: "idempotent-receiver-mule",
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
