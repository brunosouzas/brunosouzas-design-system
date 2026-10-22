// Synthetic token sources for the token build tests: a minimal valid source
// built from the list of required tokens, plus helpers to break it one way at a
// time. Independent of tokens/source.json, so the tests hold whatever its values.
import { REQUIRED, type TokenType } from "../../scripts/tokens";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type Source = { [key: string]: Json };

const SAMPLE: Record<TokenType, string | number> = {
  color: "#0A1033",
  dimension: 4,
  frames: 30,
  number: 13,
  opacity: 0.42,
  fontFamily: "Lato, 'Helvetica Neue', sans-serif",
  fontWeight: 700,
};

/** Sets `value` at a dotted path, creating groups on the way. */
export const setPath = (root: Source, path: string, value: Json): Source => {
  const names = path.split(".");
  let node = root as { [key: string]: Json };
  for (const name of names.slice(0, -1)) {
    if (typeof node[name] !== "object" || node[name] === null || Array.isArray(node[name])) node[name] = {};
    node = node[name] as { [key: string]: Json };
  }
  node[names[names.length - 1]] = value;
  return root;
};

export const deletePath = (root: Source, path: string): Source => {
  const names = path.split(".");
  let node = root as { [key: string]: Json };
  for (const name of names.slice(0, -1)) node = node[name] as { [key: string]: Json };
  delete node[names[names.length - 1]];
  return root;
};

export const token = (value: Json, type: Json): Json => ({ $value: value, $type: type });

export const validSource = (): Source => {
  const root: Source = {};
  for (const [path, type] of Object.entries(REQUIRED)) setPath(root, path, token(SAMPLE[type], type));
  return root;
};

/** A valid source with one change applied. */
export const sourceWith = (...changes: ((root: Source) => Source)[]): Source =>
  changes.reduce((root, change) => change(root), validSource());

export const set = (path: string, value: Json) => (root: Source) => setPath(root, path, value);
export const remove = (path: string) => (root: Source) => deletePath(root, path);

/** Same content, keys in reverse order at every level. */
export const reverseKeys = (value: Json): Json => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .reverse()
      .map((key) => [key, reverseKeys(value[key])]),
  );
};

export const TRAILING_COMMA_SOURCE = `{
  "color": {
    "ink": { "$value": "#0A1033", "$type": "color" },
  }
}
`;
