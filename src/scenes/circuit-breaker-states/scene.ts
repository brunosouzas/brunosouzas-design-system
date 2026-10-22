// Scene data of the circuit-breaker state machine: id, formats, languages, the
// timeline in frames, the text table and the source article per language. No
// React, so the CLI scripts and the tests read it without the bundler (design §6).
//
// The timeline is the approved pilot's, frame by frame (design §8); the strings
// come from the article "Circuit Breaker in MuleSoft", its states diagram labels
// and its three state bullets (ADR 0004). Changing a frame changes the approved
// timing: test/scenes/circuit-breaker.test.ts compares it with the pilot.
import type { CallKind, Phase, Timeline } from "../../brand/motion";
import type { SceneData } from "../catalogue";

export type StateId = "closed" | "open" | "half";
export type TransitionId = "toOpen" | "toHalf" | "halfToOpen" | "halfToClosed";

/** Call results every `step` frames from `start`, one per kind. */
const every = (start: number, step: number, kinds: CallKind[]) => kinds.map((kind, i) => ({ at: start + i * step, kind }));

// One full loop through every transition:
// CLOSED -> OPEN -> HALF_OPEN -(failure)-> OPEN -> HALF_OPEN -(success)-> CLOSED.
const phases: Phase<StateId>[] = [
  { state: "closed", from: 40, to: 200, events: every(56, 17, ["ok", "ok", "fail", "ok", "fail", "fail", "fail", "fail"]) },
  { state: "open", from: 245, to: 365, events: every(262, 26, ["blocked", "blocked", "blocked", "blocked"]) },
  { state: "half", from: 410, to: 500, events: every(424, 34, ["ok", "fail"]) },
  { state: "open", from: 545, to: 620, events: every(560, 26, ["blocked", "blocked"]) },
  { state: "half", from: 665, to: 775, events: every(680, 30, ["ok", "ok", "ok"]) },
  { state: "closed", from: 820, to: 990, events: every(834, 9, ["ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok"]) },
];

export const timeline: Timeline<StateId, TransitionId> = {
  duration: 1000,
  introEnd: 40,
  outro: 910,
  startMarkerFade: [4, 14],
  ringsFade: [0, 20],
  popIn: { closed: 6, open: 14, half: 22 },
  phases,
  transitions: {
    toOpen: { from: "closed", to: "open" },
    toHalf: { from: "open", to: "half" },
    halfToOpen: { from: "half", to: "open" },
    halfToClosed: { from: "half", to: "closed" },
  },
  fires: {
    toOpen: [215],
    toHalf: [380, 630],
    halfToOpen: [515],
    halfToClosed: [790],
  },
  arrowLead: 18,
  pillDelay: 8,
  slots: { closed: 8, open: 4, half: 3 },
};

export type CircuitBreakerText = {
  states: Record<StateId, string>;
  toOpen: { lines: string[]; small: string };
  toHalf: { lines: string[] };
  halfToOpen: { lines: string[] };
  halfToClosed: { lines: string[] };
  captions: Record<StateId, string>;
};

export const text: Record<"pt" | "en", CircuitBreakerText> = {
  pt: {
    states: { closed: "CLOSED", open: "OPEN", half: "HALF_OPEN" },
    toOpen: { lines: ["taxa de falha na janela", "> limite"], small: "(com mínimo de chamadas)" },
    toHalf: { lines: ["tempo de espera", "(resetTimeout)", "expira"] },
    halfToOpen: { lines: ["qualquer falha", "durante o teste"] },
    halfToClosed: { lines: ["chamadas de", "teste com sucesso", "suficiente"] },
    captions: {
      closed: "Chamadas passam normalmente; o circuito observa os resultados.",
      open: "Chamadas são bloqueadas na hora, sem tocar o backend.",
      half: "Chamadas de teste decidem se o circuito fecha de novo ou volta a abrir.",
    },
  },
  en: {
    states: { closed: "CLOSED", open: "OPEN", half: "HALF_OPEN" },
    toOpen: { lines: ["failure rate in the window", "> threshold"], small: "(with a minimum call count)" },
    toHalf: { lines: ["wait period", "(resetTimeout)", "elapses"] },
    halfToOpen: { lines: ["any failure", "during the test"] },
    halfToClosed: { lines: ["enough successful", "test calls"] },
    captions: {
      closed: "Calls pass through normally; the circuit watches the outcomes.",
      open: "Calls are blocked immediately, without touching the backend.",
      half: "Test calls decide whether the circuit closes again or reopens.",
    },
  },
};

export const circuitBreakerStates = {
  id: "circuit-breaker-states",
  formats: ["16x9", "4x5"],
  languages: ["pt", "en"],
  timeline,
  text,
  sources: {
    pt: "https://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft",
    en: "https://brunosouzas.com/blog/circuit-breaker-in-mulesoft",
  },
} satisfies SceneData;
