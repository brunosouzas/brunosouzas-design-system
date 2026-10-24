// Public entry point of the package (`@brunosouzas/design-system`): the
// illustration pieces, the node contract, the SVG renderer, pose and the cover
// spec helpers. No React here: the React renderer is the separate entry
// `@brunosouzas/design-system/react`, so a consumer without React can import
// this one.
export { SVG_TAGS, drawn, el, g, shadowed, type AttrValue, type Attrs, type Drawn, type SvgNode, type SvgTag } from "./node.ts";
export { toSvg } from "./render.ts";
export { pose, type Pose } from "./pose.ts";
export { COLOUR_TOKENS, DATA_COLOUR, MAX_ITEMS, paint, MAX_SIZE, checkParams, colour, isColourLiteral, type ParamSpec, type Problem, type Schema } from "./params.ts";
export { definePiece, type Piece } from "./piece.ts";
export * from "./library.ts";
export { EIP_ICONS, EIP_ICON_NAMES, EIP_ICON_HEIGHT, EIP_ICON_WIDTH, type EipIcon } from "./eip-icons.ts";
export { FORMATS, LANGUAGE, SAFE_ID, backgroundNames, bannerRingCount, comparePaths, coverTree, diagramRings, validateCoverSpec, type CoverFormat, type CoverOptions, type CoverPiece, type CoverRings, type CoverSpec, type CustomNode } from "./cover.ts";
export { tokens, type Tokens } from "../../tokens/generated/tokens.ts";
export { EMOTE_KINDS, MASCOTS, MASCOT_ACTIONS, MASCOT_FACES, type EmoteKind, type EmoteParams, type MascotAction, type MascotFace, type MascotName, type MascotParams } from "./cast.ts";
