// SVG string renderer of the node tree (spec illustration-pieces, "SVG
// renderer"). Two-space indent per level, attributes in insertion order,
// numbers through String, text and attribute values escaped, LF line ends.
import type { SvgNode } from "./node.ts";

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const attributes = (node: SvgNode): string =>
  Object.entries(node.attrs)
    .map(([name, value]) => ` ${name}="${escape(String(value))}"`)
    .join("");

export const toSvg = (node: SvgNode | string, depth = 0): string => {
  if (typeof node === "string") return escape(node);
  const pad = "  ".repeat(depth);
  const open = `${pad}<${node.tag}${attributes(node)}`;
  if (node.children.length === 0) return `${open}/>`;
  // Text content, alone or mixed with elements, is written inline: added whitespace would change it.
  if (node.children.some((child) => typeof child === "string")) {
    return `${open}>${node.children.map((child) => toSvg(child)).join("")}</${node.tag}>`;
  }
  if (node.children.every((child) => typeof child === "string")) {
    return `${open}>${node.children.map((child) => toSvg(child)).join("")}</${node.tag}>`;
  }
  const inner = node.children.map((child) => (typeof child === "string" ? `${pad}  ${escape(child)}` : toSvg(child, depth + 1)));
  return `${open}>\n${inner.join("\n")}\n${pad}</${node.tag}>`;
};
