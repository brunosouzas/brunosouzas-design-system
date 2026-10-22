// Token build: reads tokens/source.json, validates it, and generates
// tokens/generated/{tokens.css,tokens.ts,tokens.json} (ADR 0002, design §1-4).
//
// Why: one source for colour, type, outline, shadow, radius and motion values,
// so the site (CSS), the animations (TypeScript) and other scripts (JSON) read
// the same numbers instead of keeping copies that drift.
//
// Run:   npm run tokens          write the three files, one line per file
//        npm run tokens:check    compare them with what the build would write;
//                                writes nothing, exits 1 naming stale/missing files
//
// What can go wrong: an invalid source (missing or unknown token, bad type or
// value, invalid JSON) prints every problem, one line each, and exits 1 before
// any file is written. This script imports nothing from src/: it must run even
// when the generated files are missing or broken.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const GROUPS = ["color", "outline", "shadow", "radius", "font", "motion"] as const;
export const TYPES = ["color", "dimension", "frames", "number", "opacity", "fontFamily", "fontWeight"] as const;
export type TokenType = (typeof TYPES)[number];

// Every token the components rely on, with the type it must declare.
export const REQUIRED: Readonly<Record<string, TokenType>> = {
  "color.ink": "color",
  "color.white": "color",
  "color.panel": "color",
  "color.ring": "color",
  "color.healthy": "color",
  "color.blocked": "color",
  "color.transitional": "color",
  "color.caller": "color",
  "color.backend": "color",
  "color.failure": "color",
  "color.failFast": "color",
  "outline.block": "dimension",
  "outline.arrow": "dimension",
  "outline.small": "dimension",
  "shadow.block": "dimension",
  "shadow.pill": "dimension",
  "shadow.small": "dimension",
  "radius.block": "dimension",
  "radius.pill": "dimension",
  "radius.small": "dimension",
  "font.sans": "fontFamily",
  "font.mono": "fontFamily",
  "font.weightBold": "fontWeight",
  "font.weightHeavy": "fontWeight",
  "motion.fps": "frames",
  "motion.drawArrow": "frames",
  "motion.travel": "frames",
  "motion.fade": "frames",
  "motion.readingHold": "frames",
  "motion.dimOpacity": "opacity",
  "motion.focusScale": "number",
  "motion.pop.damping": "number",
  "motion.pop.stiffness": "number",
  "motion.pop.mass": "number",
  "motion.focus.damping": "number",
  "motion.focus.stiffness": "number",
  "motion.focus.mass": "number",
};

const NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
const TOKEN_KEYS = ["$value", "$type", "$description"];
const CSS_PREFIX = "--ds-";
const GENERATED_HEADER =
  "Generated from tokens/source.json by scripts/tokens.ts (npm run tokens). Do not edit by hand.";
export const OUTPUT_FILES = ["tokens.css", "tokens.ts", "tokens.json"] as const;

export type Problem = { path: string | null; message: string };
export type TokenValue = string | number;
export type FlatToken = { path: string; type: TokenType; value: TokenValue };
export type ValueTree = { [name: string]: TokenValue | ValueTree };

/** Orders strings by Unicode code point (JS `<` compares UTF-16 code units). */
export const compareCodePoints = (a: string, b: string): number => {
  const left = Array.from(a);
  const right = Array.from(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const diff = left[i].codePointAt(0)! - right[i].codePointAt(0)!;
    if (diff !== 0) return diff;
  }
  return left.length - right.length;
};

/** Sorts problems by path (no path first), then by message. */
export const sortProblems = (problems: Problem[]): Problem[] =>
  [...problems].sort((a, b) => {
    if (a.path === null && b.path !== null) return -1;
    if (a.path !== null && b.path === null) return 1;
    const byPath = a.path !== null && b.path !== null ? compareCodePoints(a.path, b.path) : 0;
    return byPath !== 0 ? byPath : compareCodePoints(a.message, b.message);
  });

export const formatProblem = (problem: Problem): string =>
  problem.path === null ? problem.message : `${problem.path}: ${problem.message}`;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// A token is recognised by its `$` keys; an object without them is a group.
const isToken = (value: Record<string, unknown>): boolean => Object.keys(value).some((key) => key.startsWith("$"));

const describe = (value: unknown): string => (value === undefined ? "nothing" : JSON.stringify(value));

/** `failFast` -> `fail-fast`: a `-` before each capital, which is lowercased; digits stay. */
export const kebab = (name: string): string => name.replace(/[A-Z]/g, (capital) => `-${capital.toLowerCase()}`);

export const cssName = (path: string): string => CSS_PREFIX + path.split(".").map(kebab).join("-");

const isPositiveInteger = (value: unknown): boolean =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

/** Returns the reason a value does not fit its type, or null when it fits. */
export const valueProblem = (type: TokenType, value: unknown): string | null => {
  switch (type) {
    case "color":
      return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
        ? null
        : `expected #RRGGBB, found ${describe(value)}`;
    case "dimension":
      return isPositiveInteger(value) ? null : `expected a positive integer of pixels, found ${describe(value)}`;
    case "frames":
      return isPositiveInteger(value) ? null : `expected a positive integer frame count, found ${describe(value)}`;
    case "number":
      return typeof value === "number" && Number.isFinite(value) && value > 0
        ? null
        : `expected a finite number greater than zero, found ${describe(value)}`;
    case "opacity":
      return typeof value === "number" && value > 0 && value <= 1
        ? null
        : `expected a number greater than 0 and at most 1, found ${describe(value)}`;
    case "fontFamily":
      // These characters could close the CSS declaration or rule they are written into.
      return typeof value === "string" && value.trim() !== "" && !/[;{}<>\r\n]/.test(value)
        ? null
        : `expected a non-empty font family without ; { } < > or a line break, found ${describe(value)}`;
    case "fontWeight":
      return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 900 && value % 100 === 0
        ? null
        : `expected an integer from 100 to 900 in steps of 100, found ${describe(value)}`;
  }
};

export type Validation = { problems: Problem[]; tokens: FlatToken[] };

/** Validates a parsed source root. Reports every problem; never throws. */
export const validateSource = (root: unknown, sourceLabel = "tokens/source.json"): Validation => {
  if (!isPlainObject(root)) {
    const found = root === null ? "null" : Array.isArray(root) ? "an array" : typeof root;
    return { problems: [{ path: null, message: `the root of ${sourceLabel} must be a JSON object, found ${found}` }], tokens: [] };
  }
  const problems: Problem[] = [];
  const tokens: FlatToken[] = [];
  const seenTokenPaths = new Set<string>();
  const invalidGroups: string[] = [];
  const report = (path: string | null, message: string) => problems.push({ path, message });

  const reportTooDeep = (path: string, value: Record<string, unknown>) => {
    const leaves: string[] = [];
    const collect = (prefix: string, node: Record<string, unknown>) => {
      for (const [name, child] of Object.entries(node)) {
        const childPath = `${prefix}.${name}`;
        if (isPlainObject(child) && !isToken(child)) collect(childPath, child);
        else leaves.push(childPath);
      }
    };
    collect(path, value);
    const message = "nested too deep: a token sits two or three levels deep";
    if (leaves.length === 0) report(path, message);
    for (const leaf of leaves) report(leaf, message);
  };

  const validateToken = (path: string, token: Record<string, unknown>) => {
    seenTokenPaths.add(path);
    for (const key of Object.keys(token)) {
      if (!TOKEN_KEYS.includes(key)) report(path, `unknown key "${key}" in a token (allowed: ${TOKEN_KEYS.join(", ")})`);
    }
    if ("$description" in token && typeof token.$description !== "string") {
      report(path, "$description must be a string");
    }
    const hasValue = "$value" in token;
    if (!hasValue) report(path, "token without a $value");
    if (!("$type" in token)) {
      report(path, `token without a type (supported: ${TYPES.join(", ")})`);
      return;
    }
    const type = token.$type;
    if (typeof type !== "string" || !(TYPES as readonly string[]).includes(type)) {
      report(path, `unsupported type ${describe(type)} (supported: ${TYPES.join(", ")})`);
      return;
    }
    const required = REQUIRED[path];
    if (required !== undefined && required !== type) {
      // One problem per token: a wrong declared type hides the value check.
      report(path, `expected type ${required}, found ${type}`);
      return;
    }
    if (!hasValue) return;
    const reason = valueProblem(type as TokenType, token.$value);
    if (reason !== null) report(path, reason);
    else tokens.push({ path, type: type as TokenType, value: token.$value as TokenValue });
  };

  const validateGroup = (path: string, group: unknown, level: 1 | 2) => {
    if (!isPlainObject(group)) {
      invalidGroups.push(path);
      report(path, `group must be an object, found ${Array.isArray(group) ? "an array" : describe(group)}`);
      return;
    }
    if (Object.keys(group).length === 0) report(path, "empty group");
    for (const [name, child] of Object.entries(group)) {
      const childPath = `${path}.${name}`;
      if (!NAME_PATTERN.test(name)) {
        report(childPath, `invalid name "${name}": expected camelCase (${NAME_PATTERN.source})`);
        continue;
      }
      if (!isPlainObject(child)) {
        report(childPath, `expected a token object with $value and $type, found ${describe(child)}`);
        continue;
      }
      if (isToken(child)) validateToken(childPath, child);
      else if (level === 1) validateGroup(childPath, child, 2);
      else reportTooDeep(childPath, child);
    }
  };

  for (const [name, group] of Object.entries(root)) {
    if (!(GROUPS as readonly string[]).includes(name)) {
      // Validation does not look inside an unknown group.
      report(name, `unknown group (expected one of ${GROUPS.join(", ")})`);
      continue;
    }
    validateGroup(name, group, 1);
  }

  for (const [path, type] of Object.entries(REQUIRED)) {
    // A group that is not an object is already reported; its tokens are not repeated as missing.
    const underInvalidGroup = invalidGroups.some((group) => path.startsWith(`${group}.`));
    if (!seenTokenPaths.has(path) && !underInvalidGroup) report(path, `missing required token (type ${type})`);
  }

  const pathsByCssName = new Map<string, string[]>();
  for (const path of seenTokenPaths) {
    const name = cssName(path);
    pathsByCssName.set(name, [...(pathsByCssName.get(name) ?? []), path]);
  }
  for (const [name, paths] of pathsByCssName) {
    if (paths.length < 2) continue;
    const [first, ...others] = [...paths].sort(compareCodePoints);
    report(first, `same CSS name ${name} as ${others.join(", ")}`);
  }

  tokens.sort((a, b) => compareCodePoints(a.path, b.path));
  return { problems: sortProblems(problems), tokens };
};

/** Parses the source text; a syntax error becomes one problem with line and column. */
export const parseSource = (text: string, sourceLabel = "tokens/source.json"): { root: unknown } | { problem: Problem } => {
  try {
    return { root: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let line: number | undefined;
    let column: number | undefined;
    const lineColumn = /line (\d+) column (\d+)/.exec(message);
    const position = /position (\d+)/.exec(message);
    if (lineColumn) {
      line = Number(lineColumn[1]);
      column = Number(lineColumn[2]);
    } else if (position) {
      const before = text.slice(0, Number(position[1])).split("\n");
      line = before.length;
      column = before[before.length - 1].length + 1;
    }
    const where = line !== undefined ? ` at line ${line}, column ${column}` : "";
    return { problem: { path: null, message: `${sourceLabel}: invalid JSON${where} (${message})` } };
  }
};

/** Nested plain values, keys sorted by code point at every level. */
export const valueTree = (tokens: FlatToken[]): ValueTree => {
  const tree: ValueTree = {};
  for (const token of [...tokens].sort((a, b) => compareCodePoints(a.path, b.path))) {
    const names = token.path.split(".");
    let node = tree;
    for (const name of names.slice(0, -1)) node = (node[name] ??= {}) as ValueTree;
    node[names[names.length - 1]] = token.value;
  }
  const sortTree = (node: ValueTree): ValueTree =>
    Object.fromEntries(
      Object.keys(node)
        .sort(compareCodePoints)
        .map((key) => {
          const child = node[key];
          return [key, typeof child === "object" ? sortTree(child) : child];
        }),
    );
  return sortTree(tree);
};

const cssValue = (token: FlatToken): string =>
  token.type === "dimension" ? `${token.value}px` : String(token.value);

export const emitCss = (tokens: FlatToken[]): string => {
  const sorted = [...tokens].sort((a, b) => compareCodePoints(a.path, b.path));
  const lines = sorted.map((token) => `  ${cssName(token.path)}: ${cssValue(token)};`);
  return `/* ${GENERATED_HEADER} */\n:root {\n${lines.join("\n")}\n}\n`;
};

export const emitTs = (tokens: FlatToken[]): string =>
  `// ${GENERATED_HEADER}\n\nexport const tokens = ${JSON.stringify(valueTree(tokens), null, 2)} as const;\n\nexport type Tokens = typeof tokens;\n`;

export const emitJson = (tokens: FlatToken[]): string => `${JSON.stringify(valueTree(tokens), null, 2)}\n`;

export type BuildResult =
  | { ok: true; outputs: Record<(typeof OUTPUT_FILES)[number], string> }
  | { ok: false; problems: Problem[] };

/** Read, parse and validate; on success return the three output strings. */
export const buildFromText = (text: string, sourceLabel = "tokens/source.json"): BuildResult => {
  const parsed = parseSource(text, sourceLabel);
  if ("problem" in parsed) return { ok: false, problems: [parsed.problem] };
  const { problems, tokens } = validateSource(parsed.root, sourceLabel);
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, outputs: { "tokens.css": emitCss(tokens), "tokens.ts": emitTs(tokens), "tokens.json": emitJson(tokens) } };
};

export type RunOptions = {
  sourcePath: string;
  outDir: string;
  check: boolean;
  log?: (line: string) => void;
  error?: (line: string) => void;
};

const display = (path: string): string => {
  const rel = relative(process.cwd(), path);
  return rel.startsWith("..") || isAbsolute(rel) ? path : rel;
};

/** Runs the build (or the check). Returns the exit code. */
export const runTokens = ({ sourcePath, outDir, check, log = console.log, error = console.error }: RunOptions): number => {
  const sourceLabel = display(sourcePath);
  let result: BuildResult;
  if (!existsSync(sourcePath)) {
    result = { ok: false, problems: [{ path: null, message: `${sourceLabel} does not exist` }] };
  } else {
    let text: string;
    try {
      text = readFileSync(sourcePath, "utf8");
    } catch (readError) {
      error(`cannot read ${sourceLabel}: ${readError instanceof Error ? readError.message : String(readError)}`);
      return 1;
    }
    result = buildFromText(text, sourceLabel);
  }
  if (!result.ok) {
    for (const problem of result.problems) error(formatProblem(problem));
    error(`tokens: ${result.problems.length} problem(s) in ${sourceLabel}; no file written`);
    return 1;
  }

  if (check) {
    const outdated: string[] = [];
    for (const name of OUTPUT_FILES) {
      const target = join(outDir, name);
      if (!existsSync(target)) outdated.push(`missing: ${display(target)}`);
      else if (readFileSync(target, "utf8") !== result.outputs[name]) outdated.push(`stale: ${display(target)}`);
    }
    if (outdated.length > 0) {
      for (const line of outdated) error(line);
      error(`tokens:check failed: ${outdated.length} generated file(s) out of date; run npm run tokens`);
      return 1;
    }
    log(`${display(outDir)} is up to date`);
    return 0;
  }

  mkdirSync(outDir, { recursive: true });
  for (const name of OUTPUT_FILES) {
    const target = join(outDir, name);
    writeFileSync(target, result.outputs[name]);
    log(`wrote ${display(target)}`);
  }
  return 0;
};

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--check");
  if (unknown.length > 0) {
    console.error(`unknown argument(s): ${unknown.join(" ")}\nusage: tsx scripts/tokens.ts [--check]`);
    process.exit(1);
  }
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  process.exitCode = runTokens({
    sourcePath: join(repoRoot, "tokens", "source.json"),
    outDir: join(repoRoot, "tokens", "generated"),
    check: args.includes("--check"),
  });
}
