// The offset-shadow rule of the EIP icons (change flat-eip-icons-and-empty-queue,
// design §1; spec illustration-pieces, "EIP icons without offset shadows"), shared by
// test/pieces/eip-icons.test.ts and "Every cover piece is flat" in test/pieces/node.test.ts.
//
// A node is an offset shadow when it is a node or group with a `translate(…)` transform,
// or when it is filled ink, has no stroke and repeats the shape of a later node (the same
// rect size, circle radius or polygon points) moved right and down by the same amount,
// more than 0 and at most 3. Offsets and coordinates are compared at 2 decimals.
import { tokens } from "../../tokens/generated/tokens";
import type { SvgNode } from "../../src/pieces/node";

const r2 = (value: number) => Math.round(value * 100) / 100;
const points = (value: unknown) => String(value).trim().split(/\s+/).map((point) => point.split(",").map(Number));

/** The amount `a` is moved right and down from `b` when it repeats `b`'s shape, or undefined. */
const offsetOf = (a: SvgNode, b: SvgNode): number | undefined => {
  if (a.tag !== b.tag) return undefined;
  const at = (node: SvgNode, name: string) => Number(node.attrs[name]);
  let moves: [number, number][];
  if (a.tag === "rect") {
    if (r2(at(a, "width")) !== r2(at(b, "width")) || r2(at(a, "height")) !== r2(at(b, "height"))) return undefined;
    moves = [[at(a, "x") - at(b, "x"), at(a, "y") - at(b, "y")]];
  } else if (a.tag === "circle") {
    if (r2(at(a, "r")) !== r2(at(b, "r"))) return undefined;
    moves = [[at(a, "cx") - at(b, "cx"), at(a, "cy") - at(b, "cy")]];
  } else if (a.tag === "polygon") {
    const [p, q] = [points(a.attrs.points), points(b.attrs.points)];
    if (p.length !== q.length) return undefined;
    moves = p.map(([x, y], i) => [x - q[i][0], y - q[i][1]]);
  } else return undefined;
  const [dx, dy] = moves[0].map(r2);
  if (dx !== dy || dx <= 0 || dx > 3) return undefined;
  return moves.every(([x, y]) => r2(x) === dx && r2(y) === dy) ? dx : undefined;
};

/** The indexes of the offset shadows among an icon's top-level nodes. */
export const shadowIndexes = (nodes: readonly SvgNode[]): number[] =>
  nodes.flatMap((node, i) => {
    if (/^translate\(/.test(String(node.attrs.transform ?? ""))) return [i];
    if (node.attrs.fill !== tokens.color.ink || node.attrs.stroke !== undefined) return [];
    return nodes.slice(i + 1).some((later) => offsetOf(node, later) !== undefined) ? [i] : [];
  });

/** The 46 shadows of the 0.14.1 icons, by icon then node index (design §1). */
export const SHADOWS_0_14_1: Readonly<Record<string, readonly number[]>> = {
  aggregator: [0],
  "canonical-data-model": [0, 4, 12],
  "channel-adapter": [0, 2, 6],
  "claim-check": [0],
  "competing-consumers": [0, 2],
  "content-based-router": [0],
  "content-enricher": [0],
  "content-filter": [0],
  "correlation-identifier": [0, 2, 8, 9],
  "dead-letter-channel": [0, 3],
  "event-driven-consumer": [0, 2],
  "guaranteed-delivery": [0, 3],
  "idempotent-receiver": [0, 2, 6],
  "invalid-message-channel": [0, 3],
  "message-expiration": [0],
  "message-filter": [0, 2],
  "message-translator": [0],
  "point-to-point-channel": [0],
  "polling-consumer": [0, 2],
  "process-manager": [0],
  "publish-subscribe-channel": [0],
  "request-reply": [0, 2, 5, 8],
  "return-address": [0],
  "scatter-gather": [0],
  splitter: [0],
  "transactional-client": [0, 4],
};
