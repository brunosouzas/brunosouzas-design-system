// Pure seekable ownership, captions and validation of the authored pub-sub table.
// Run `npm test`; invalid routes/ranges produce named diagnostics, not a partial
// simulation. Scene semantics stay here, not in reusable brand components.
import { tokens } from "../../../tokens/generated/tokens";
import { callAppearance, fadeIn } from "../../brand/motion";
import { timeline, type FlowTimeline } from "./timeline";

export const flowCaptionAt = (frame: number, data: FlowTimeline = timeline) => {
  const phase = [...data.phases].reverse().find(p => frame >= p.from);
  if (!phase) return null;
  const opacity = fadeIn(frame, [phase.from, phase.from + tokens.motion.fade]);
  return { key: phase.id, opacity, lift: 14 * (1 - opacity) };
};

const failureAt = (data: FlowTimeline) => data.marks.find(mark => mark.kind === "fail")?.at ?? data.duration;
/** The failed application turns `color.failure`, so its mark must not use that
 * hue (ADR 0003): a white square with an ink cross, like the ink-on-white checks. */
const markAppearance = (kind: "ok" | "fail") => kind === "fail"
  ? { ...callAppearance("fail"), fill: tokens.color.white, glyphColor: tokens.color.ink }
  : callAppearance(kind);

export const frameAt = (frame: number, data: FlowTimeline = timeline) => {
  const failed = frame >= failureAt(data);
  return {
    // Copies are filled with `color.caller` so they read inside white queues and
    // on the panel; the returning invoice copy keeps its failure outline.
    tokens: data.ownership.filter(item => frame >= item.from && frame < item.to).map(item => ({
      copy: item.copy, node: item.node, route: item.route,
      progress: item.route ? (frame - item.from) / (item.to - item.from) : null,
      fill: tokens.color.caller,
      stroke: item.copy === "invoice" && failed ? tokens.color.failure : tokens.color.ink,
    })),
    fills: { api: tokens.color.healthy, payment: tokens.color.healthy, inventory: tokens.color.healthy, invoice: failed ? tokens.color.failure : tokens.color.healthy } as Record<string, string>,
    marks: data.marks.filter(mark => frame >= mark.at).map(mark => ({ ...mark, appearance: markAppearance(mark.kind) })),
    caption: flowCaptionAt(frame, data),
  };
};

/** Flow-only checks; common catalogue checks run first. Half-open intervals
 * allow atomic handoff while still rejecting any simultaneous copy owners. */
export const checkFlow = (id: string, data: FlowTimeline): string[] => {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${id}: ${message}`);
  const validFrame = (value: number, name: string, terminal = false) => {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > data.duration - (terminal ? 0 : 1)) fail(`${name} has invalid frame ${value}`);
  };
  const unique = (values: readonly string[], kind: string) => {
    const seen = new Set<string>();
    for (const value of values) { if (seen.has(value)) fail(`duplicate ${kind} ${value}`); seen.add(value); }
  };
  unique(data.nodes, "node"); unique(data.routes.map(r => r.id), "route"); unique(data.copies, "copy");
  validFrame(data.outro, "outro");
  for (const phase of data.phases) {
    validFrame(phase.from, `phase ${phase.id}`); validFrame(phase.to, `phase ${phase.id}`);
    for (const event of phase.events) validFrame(event.at, `event ${event.id}`);
    if (phase.from + tokens.motion.fade >= data.outro) fail(`caption ${phase.id} fade ends at frame ${phase.from + tokens.motion.fade}, at or after outro ${data.outro}`);
  }
  const animation = (name: string, at: number, duration: number) => {
    validFrame(at, name);
    if (at + duration >= data.outro) fail(`${name} finishes at frame ${at + duration}, at or after outro ${data.outro}`);
  };
  for (const [node, at] of Object.entries(data.popIn)) animation(`pop-in ${node}`, at, 90);
  animation("rings fade", data.ringsFade[0], data.ringsFade[1] - data.ringsFade[0]);
  for (const route of data.routes) {
    for (const endpoint of [route.from, route.to]) if (!data.nodes.includes(endpoint)) fail(`route ${route.id} has unknown node ${endpoint}`);
    animation(`arrow draw ${route.id}`, route.drawAt, tokens.motion.drawArrow);
    if (route.labelAt !== undefined) animation(`pill pop-in ${route.id}`, route.labelAt, 90);
  }
  for (const item of data.ownership) {
    const name = `copy ${item.copy} ${item.route ? `route ${item.route}` : `node ${item.node}`}`;
    if (!data.copies.includes(item.copy)) fail(`${name} is unknown`);
    validFrame(item.from, name); validFrame(item.to, name, !item.route);
    if (item.from >= item.to) fail(`${name} has inverted or empty range [${item.from}, ${item.to})`);
    if (item.route) {
      const route = data.routes.find(r => r.id === item.route);
      if (!route) fail(`${name} is unknown`);
      if (item.to - item.from !== tokens.motion.travel) fail(`${name} duration must equal travel ${tokens.motion.travel}`);
      if (item.to >= data.outro) fail(`${name} arrives at frame ${item.to}, at or after outro ${data.outro}`);
    } else if (item.node === undefined || !data.nodes.includes(item.node)) fail(`${name} is unknown`);
  }
  // Each copy has one continuous, endpoint-matching life. Initial creation,
  // split, successful ACK and the terminal invoice dwell are explicit exceptions.
  for (const copy of data.copies) {
    const life = data.ownership.filter(item => item.copy === copy).sort((a,b) => a.from-b.from);
    for (let i = 1; i < life.length; i++) {
      const previous = life[i-1], current = life[i];
      if (previous.to > current.from) fail(`copy ${copy} overlapping ownership at frame ${current.from}`);
      else if (previous.to !== current.from) fail(`copy ${copy} loses ownership at frame ${previous.to}`);
      const end = previous.route ? data.routes.find(r => r.id === previous.route)?.to : previous.node;
      const start = current.route ? data.routes.find(r => r.id === current.route)?.from : current.node;
      if (end !== start) fail(`copy ${copy} handoff from ${end} to ${start} at frame ${current.from}`);
    }
    const first = life[0], last = life.at(-1);
    if (!first || !last) { fail(`copy ${copy} has no ownership`); continue; }
    const isOriginal = copy === data.split.original;
    const creation = isOriginal ? 100 : data.split.at;
    const firstRoute = data.routes.find(r => r.id === first.route);
    if (first.from !== creation || firstRoute?.from !== (isOriginal ? "api" : data.split.node)) fail(`copy ${copy} creation at frame ${first.from} is outside the publish/split table`);
    const ack = data.marks.find(mark => mark.copy === copy && mark.kind === "ok" && mark.node !== "api");
    const expectedEnd = isOriginal ? data.split.at : ack?.at ?? data.duration;
    if (last.to !== expectedEnd) fail(`copy ${copy} consumption at frame ${last.to} must be ${expectedEnd}`);
    if (isOriginal && last.node !== data.split.node) fail(`copy ${copy} split is not at ${data.split.node}`);
    if (ack && last.node !== ack.node) fail(`copy ${copy} ACK is not at ${ack.node}`);
    if (!isOriginal && !ack && last.node !== `${copy}-queue`) fail(`copy ${copy} return must end at its own queue`);
  }
  validFrame(data.split.at, "split");
  if (data.split.node !== "exchange" || data.split.original !== "original" || data.split.copies.length !== 3 || new Set(data.split.copies).size !== 3 || data.split.copies.some(copy => !["payment", "inventory", "invoice"].includes(copy)) || data.copies.length !== 4) fail("split must replace original with exactly payment, inventory, invoice at exchange");
  for (const mark of data.marks) {
    animation(`mark ${mark.node}`, mark.at, 90);
    if (!data.nodes.includes(mark.node) || !data.copies.includes(mark.copy)) fail(`mark ${mark.node} has unknown node/copy ${mark.copy}`);
    if (mark.kind === "fail" && (mark.node !== "invoice" || mark.copy !== "invoice")) fail(`failure mark ${mark.node} must stay local to invoice`);
  }
  return errors;
};
