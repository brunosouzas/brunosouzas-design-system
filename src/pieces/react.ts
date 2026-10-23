// React renderer of the node tree (spec illustration-pieces, "React
// renderer"): the same drawing as toSvg, as React elements for Remotion scenes.
// Hyphenated SVG attributes take React's camelCase names; aria-* and data-*
// stay as they are, because React expects them hyphenated.
import { createElement, type ReactElement, type ReactNode } from "react";
import type { SvgNode } from "./node.ts";

export const reactName = (name: string): string =>
  name.startsWith("aria-") || name.startsWith("data-") ? name : name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

export const toReact = (node: SvgNode, key: number = 0): ReactElement => {
  const props: Record<string, unknown> = { key };
  for (const [name, value] of Object.entries(node.attrs)) props[reactName(name)] = value;
  const children: ReactNode[] = node.children.map((child, index) => (typeof child === "string" ? child : toReact(child, index)));
  return createElement(node.tag, props, ...children);
};
