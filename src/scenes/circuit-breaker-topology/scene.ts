// React-free catalogue entry of the circuit-breaker topology scene (card 334;
// change circuit-breaker-topology-scene): one checkout and one payment
// service, played twice. Take 1, retry only; a rewind; take 2, the breaker
// wraps the call. A neutral scene (ADR 0005 as amended 2026-11-09, SCN-1): one
// 16:9 composition for both pages, its words in one English table, both pages
// as sources. The stills and render commands import this file under tsx.
import type { TakesSceneData } from "../catalogue";
import { timeline } from "./timeline";

/**
 * Every word the scene draws (design §8.1). Backticks mark code, drawn in the
 * monospace face; they are not drawn. The counter digits are computed and the
 * ✓ and ✕ glyphs are `CallSquare`'s own.
 */
export const text = {
  en: {
    checkout: "Checkout",
    payment: "Payment",
    retry: "retry ×3",
    breaker: ["`circuit-breaker:`", "`execute`"],
    states: { closed: "CLOSED", open: "OPEN", halfOpen: "HALF_OPEN" },
    timeout: "`HTTP:TIMEOUT`",
    open: "`CIRCUIT-BREAKER:OPEN`",
    message: ["payment temporarily", "unavailable"],
    ok: "`200`",
    business: "`400`",
    clock: "`resetTimeout 10s`",
    requests: "requests",
    calls: "backend calls",
    takes: ["1", "2"],
  },
} as const;

export const circuitBreakerTopology = {
  id: "circuit-breaker-topology",
  kind: "takes",
  neutral: true,
  formats: ["16x9"],
  languages: ["en"],
  timeline,
  text,
  sources: {
    pt: "https://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft",
    en: "https://brunosouzas.com/blog/circuit-breaker-in-mulesoft",
  },
} satisfies TakesSceneData;
