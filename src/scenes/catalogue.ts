// The scene catalogue's rules, as data and checks with no React (design §6):
// formats and their sizes, composition ids, and the checks every registered
// scene must pass (text table per language, valid timeline). The Studio root,
// the CLI scripts and the tests all read scenes through this module.
import { tokens } from "../../tokens/generated/tokens";
import { arrowDrawAt, pillAt, type Timeline } from "../brand/motion";
import { checkFlow } from "./publish-subscribe/flow";
import type { FlowTimeline } from "./publish-subscribe/timeline";

export const FORMATS = {
  "16x9": { width: 1920, height: 1080 },
  "4x5": { width: 1080, height: 1350 },
} as const;
export type Format = keyof typeof FORMATS;
export type Lang = "pt" | "en";

/** On-screen strings of one language; a list of strings counts as one key. */
export type TextTable = { readonly [key: string]: string | readonly string[] | TextTable };

export type PhaseRange = { from: number; to: number; events: readonly { at: number }[] };
export type CommonTimeline = { duration: number; outro: number; phases: readonly PhaseRange[] };
export type SceneContract<TTimeline extends CommonTimeline> = {
  /** Scene id, also the Studio folder name and the composition id prefix. */
  id: string;
  formats: readonly Format[];
  languages: readonly Lang[];
  timeline: TTimeline;
  text: Readonly<Record<Lang, TextTable>>;
  /** URL of the source article per language. */
  sources: Readonly<Record<Lang, string>>;
};

/** Preserve legacy annotations and absent kind. */
export type SceneData = SceneContract<Timeline> & { kind?: "state-machine" };
export type FlowSceneData = SceneContract<FlowTimeline> & { kind: "flow" };
export type CatalogueScene = SceneData | FlowSceneData;

export type CompositionEntry = {
  id: string;
  folder: string;
  format: Format;
  lang: Lang;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};

export const compositionId = (sceneId: string, format: Format, lang: Lang): string => `${sceneId}-${format}-${lang}`;

/** One composition per format and language, formats first (16x9-pt, 16x9-en, 4x5-pt, 4x5-en). */
export const compositionsOf = (scene: CatalogueScene): CompositionEntry[] =>
  scene.formats.flatMap((format) =>
    scene.languages.map((lang) => ({
      id: compositionId(scene.id, format, lang),
      folder: scene.id,
      format,
      lang,
      width: FORMATS[format].width,
      height: FORMATS[format].height,
      fps: tokens.motion.fps,
      durationInFrames: scene.timeline.duration,
    })),
  );

// ---------------------------------------------------------------- text table

const isList = (value: unknown): value is readonly string[] => Array.isArray(value);

/** Same keys at every level in every language, no empty string or list, an https source per language. */
export const checkText = (scene: CatalogueScene): string[] => {
  const problems: string[] = [];
  const tables = scene.languages.map((lang) => ({ lang, table: scene.text[lang] }));

  for (const { lang, table } of tables) {
    if (table === undefined) problems.push(`${scene.id}: ${lang} has no text table`);
  }

  const compare = (path: string, entries: { lang: Lang; value: unknown }[]) => {
    const present = entries.filter((entry) => entry.value !== undefined);
    for (const entry of entries) if (entry.value === undefined) problems.push(`${scene.id}: ${entry.lang} lacks key ${path}`);
    const kinds = new Set(present.map(({ value }) => (isList(value) ? "list" : typeof value)));
    if (kinds.size > 1) {
      problems.push(`${scene.id}: ${path} has different kinds across languages (${present.map(({ lang, value }) => `${lang} ${isList(value) ? "list" : typeof value}`).join(", ")})`);
      return;
    }
    for (const { lang, value } of present) {
      if (typeof value === "string") {
        if (value.trim() === "") problems.push(`${scene.id}: ${lang} ${path} is an empty string`);
      } else if (isList(value)) {
        if (value.length === 0) problems.push(`${scene.id}: ${lang} ${path} is an empty list`);
        value.forEach((line, i) => {
          if (typeof line !== "string" || line.trim() === "") problems.push(`${scene.id}: ${lang} ${path}[${i}] is an empty string`);
        });
      } else if (typeof value !== "object" || value === null) {
        problems.push(`${scene.id}: ${lang} ${path} is not a string, a list of strings or a table`);
      }
    }
    if (present.length > 0 && present.every(({ value }) => typeof value === "object" && value !== null && !isList(value))) {
      const keys = new Set(present.flatMap(({ value }) => Object.keys(value as object)));
      for (const key of [...keys].sort()) {
        compare(
          path === "" ? key : `${path}.${key}`,
          entries.map(({ lang, value }) => ({ lang, value: value === undefined ? undefined : (value as Record<string, unknown>)[key] })),
        );
      }
    }
  };
  if (tables.length > 0 && tables.every(({ table }) => table !== undefined)) {
    const keys = new Set(tables.flatMap(({ table }) => Object.keys(table)));
    for (const key of [...keys].sort()) compare(key, tables.map(({ lang, table }) => ({ lang, value: table[key] })));
  }

  for (const lang of scene.languages) {
    const source = scene.sources[lang];
    if (typeof source !== "string" || !source.startsWith("https://")) {
      problems.push(`${scene.id}: ${lang} source article URL must start with https:// (found ${JSON.stringify(source)})`);
    }
  }
  return problems;
};

// ---------------------------------------------------------------- timeline

const phaseLabel = (timeline: CommonTimeline, index: number): string => {
  const phase = timeline.phases[index];
  return `phase ${index + 1} (${"state" in phase ? phase.state : "id" in phase ? phase.id : index + 1} [${phase.from}, ${phase.to}])`;
};

/** Phases in range and in order, events inside their phase, fires in their window, a reading hold at the end. */
export const checkTimeline = (scene: CatalogueScene, readingHold: number = tokens.motion.readingHold): string[] => {
  const problems: string[] = [];
  const { timeline, id } = scene;
  const { phases, duration, outro } = timeline;

  phases.forEach((phase, index) => {
    const label = phaseLabel(timeline, index);
    if (phase.from < 0 || phase.to > duration - 1) {
      problems.push(`${id}: ${label} is outside the composition [0, ${duration - 1}]`);
    }
    if (phase.to < phase.from) problems.push(`${id}: ${label} ends before it starts`);
    if (index > 0 && phase.from <= phases[index - 1].to) {
      problems.push(`${id}: ${label} overlaps ${phaseLabel(timeline, index - 1)}`);
    }
    for (const event of phase.events) {
      if (event.at < phase.from || event.at > phase.to) {
        problems.push(`${id}: event at frame ${event.at} is outside ${label}`);
      }
    }
  });

  if (scene.kind === "flow") {
    if (outro > duration - readingHold) problems.push(`${id}: outro at frame ${outro} is inside the reading hold (must be at most ${duration - readingHold})`);
    phases.forEach((phase, i) => {
      const movements = [{ what: `start of ${phaseLabel(timeline, i)}`, frame: phase.from }, ...phase.events.map(event => ({ what: `event of ${phaseLabel(timeline, i)}`, frame: event.at }))];
      for (const {what, frame} of movements) if (frame >= outro) problems.push(`${id}: ${what} at frame ${frame} is at or after the outro (frame ${outro})`);
    });
    return [...problems, ...checkFlow(id, scene.timeline)];
  }
  const legacy = scene.timeline;
  for (const [name, transition] of Object.entries(legacy.transitions)) {
    const fires = legacy.fires[name] ?? [];
    if (fires.length === 0) problems.push(`${id}: transition ${name} never fires`);
    for (const fire of fires) {
      // The phase the fire leaves is the latest one started before it; the next one must be the target.
      let index = -1;
      phases.forEach((phase, i) => {
        if (phase.from < fire) index = i;
      });
      const source = legacy.phases[index];
      const next = legacy.phases[index + 1];
      const inWindow =
        source !== undefined && source.state === transition.from && next !== undefined && fire < next.from && next.state === transition.to;
      if (!inWindow) {
        problems.push(
          `${id}: transition ${name} (${transition.from} to ${transition.to}) fires at frame ${fire}, outside its window (after a ${transition.from} phase starts, before the next phase, which must be ${transition.to})`,
        );
      }
    }
  }
  for (const name of Object.keys(legacy.fires)) {
    if (!(name in legacy.transitions)) problems.push(`${id}: fires listed for unknown transition ${name}`);
  }

  if (outro > duration - readingHold) {
    problems.push(`${id}: outro at frame ${outro} is inside the reading hold (must be at most ${duration - readingHold})`);
  }

  const movements: { what: string; frame: number }[] = [
    ...phases.map((phase, i) => ({ what: `start of ${phaseLabel(timeline, i)}`, frame: phase.from })),
    ...phases.flatMap((phase, i) => phase.events.map((event) => ({ what: `event of ${phaseLabel(timeline, i)}`, frame: event.at }))),
    ...Object.entries(legacy.fires).flatMap(([name, fires]) => fires.map((frame) => ({ what: `fire of ${name}`, frame }))),
    ...Object.keys(legacy.transitions)
      .filter((name) => (legacy.fires[name] ?? []).length > 0)
      .flatMap((name) => [
        { what: `arrow draw of ${name}`, frame: arrowDrawAt(legacy, name) },
        { what: `pill pop-in of ${name}`, frame: pillAt(legacy, name) },
      ]),
  ];
  for (const { what, frame } of movements) {
    if (frame >= outro) problems.push(`${id}: ${what} at frame ${frame} is at or after the outro (frame ${outro})`);
  }
  return problems;
};

export const checkScene = (scene: CatalogueScene, readingHold?: number): string[] => [
  ...checkText(scene),
  ...checkTimeline(scene, readingHold),
];

/** Every scene's checks plus composition ids unique across the catalogue. */
export const checkCatalogue = (scenes: readonly CatalogueScene[]): string[] => {
  const problems: string[] = [];
  const owners = new Map<string, string[]>();
  for (const scene of scenes) {
    for (const composition of compositionsOf(scene)) {
      owners.set(composition.id, [...(owners.get(composition.id) ?? []), scene.id]);
    }
  }
  for (const [compositionIdValue, sceneIds] of owners) {
    if (sceneIds.length > 1) problems.push(`duplicate composition id ${compositionIdValue} (scenes ${sceneIds.join(", ")})`);
  }
  // Ids become folder names under out/ (and one folder is emptied before stills).
  for (const scene of scenes) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scene.id)) {
      problems.push(`invalid scene id ${JSON.stringify(scene.id)}: lowercase letters, digits and single hyphens only`);
    }
  }
  for (const scene of scenes) problems.push(...checkScene(scene));
  return problems;
};
