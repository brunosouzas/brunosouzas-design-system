// Authored pub-sub choreography (design §3), evaluated by absolute frame, never
// simulated. CLI/tests can import it without React/fonts. Retiming needs review.
import { tokens } from "../../../tokens/generated/tokens";

export type FlowPhaseId = "publish" | "fanOut" | "consume" | "failure" | "final";
export type FlowPhase = { id: FlowPhaseId; from: number; to: number; events: readonly { id: string; at: number }[] };
export type FlowRoute = { id: string; from: string; to: string; drawAt: number; labelAt?: number };
export type Ownership = { copy: string; from: number; to: number } & ({ node: string; route?: never } | { route: string; node?: never });
export type FlowTimeline = {
  duration: number; outro: number; ringsFade: readonly [number, number];
  phases: readonly FlowPhase[]; nodes: readonly string[]; copies: readonly string[];
  routes: readonly FlowRoute[]; ownership: readonly Ownership[];
  popIn: Readonly<Record<string, number>>;
  split: { at: number; node: string; original: string; copies: readonly string[] };
  marks: readonly { node: string; at: number; kind: "ok" | "fail"; copy: string }[];
};
const subscribers = ["payment", "inventory", "invoice"] as const;
const trip = (copy: string, route: string, from: number): Ownership => ({ copy, route, from, to: from + tokens.motion.travel });
const dwell = (copy: string, node: string, from: number, to: number): Ownership => ({ copy, node, from, to });

export const timeline: FlowTimeline = {
  duration: 1000, outro: 910, ringsFade: [0, 20],
  phases: [
    { id: "publish", from: 40, to: 239, events: [{ id: "publish", at: 100 }, { id: "accepted", at: 122 }] },
    { id: "fanOut", from: 240, to: 469, events: [{ id: "split", at: 280 }, { id: "queued", at: 302 }] },
    { id: "consume", from: 470, to: 609, events: [{ id: "depart", at: 470 }, { id: "consume", at: 492 }, { id: "payment-ack", at: 550 }, { id: "inventory-ack", at: 580 }] },
    { id: "failure", from: 610, to: 789, events: [{ id: "invoice-failure", at: 610 }, { id: "return", at: 640 }, { id: "returned", at: 662 }] },
    { id: "final", from: 790, to: 909, events: [] },
  ],
  nodes: ["api", "exchange", ...subscribers.flatMap(id => [`${id}-queue`, id])],
  copies: ["original", ...subscribers],
  popIn: { api: 6, mq: 14, exchange: 22, "payment-queue": 26, "inventory-queue": 26, "invoice-queue": 26, payment: 30, inventory: 32, invoice: 34 },
  routes: [
    { id: "publish", from: "api", to: "exchange", drawAt: 18, labelAt: 26 },
    ...subscribers.map(id => ({ id: `${id}-binding`, from: "exchange", to: `${id}-queue`, drawAt: 20, labelAt: 28 })),
    ...subscribers.map(id => ({ id: `${id}-subscriber`, from: `${id}-queue`, to: id, drawAt: 22, labelAt: 30 })),
    { id: "invoice-return", from: "invoice", to: "invoice-queue", drawAt: 610 },
  ],
  ownership: [
    trip("original", "publish", 100), dwell("original", "exchange", 122, 280),
    ...subscribers.flatMap(id => [trip(id, `${id}-binding`, 280), dwell(id, `${id}-queue`, 302, 470), trip(id, `${id}-subscriber`, 470), dwell(id, id, 492, id === "payment" ? 550 : id === "inventory" ? 580 : 640)]),
    trip("invoice", "invoice-return", 640), dwell("invoice", "invoice-queue", 662, 1000),
  ],
  split: { at: 280, node: "exchange", original: "original", copies: subscribers },
  marks: [
    { node: "api", at: 122, kind: "ok", copy: "original" },
    { node: "payment", at: 550, kind: "ok", copy: "payment" },
    { node: "inventory", at: 580, kind: "ok", copy: "inventory" },
    { node: "invoice", at: 610, kind: "fail", copy: "invoice" },
  ],
};
