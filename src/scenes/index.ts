// The scene catalogue: every registered scene's data, in Studio order. Adding a
// scene means adding its data here and its component in src/Root.tsx; the
// catalogue tests then check its text table, timeline and composition ids.
// No React here: the CLI scripts import this file under tsx.
import type { CatalogueScene } from "./catalogue";
import { circuitBreakerStates } from "./circuit-breaker-states/scene";

import { publishSubscribe } from "./publish-subscribe/scene.ts";

export const scenes: readonly CatalogueScene[] = [circuitBreakerStates, publishSubscribe];

export const findScene = (id: string): CatalogueScene | undefined => scenes.find((scene) => scene.id === id);
