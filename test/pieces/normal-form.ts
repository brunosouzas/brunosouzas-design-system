// Parses SVG markup into one normal form (tag, attributes, text, order) so the
// SVG string and React's static markup can be compared: self-closing versus
// explicit end tags, whitespace between elements and entity spelling (React
// writes ' as &#x27;) do not count.
export type NormalNode = { tag: string; attrs: [string, string][]; children: (NormalNode | string)[] };

const decode = (text: string): string =>
  text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

export const normalForm = (markup: string): NormalNode => {
  const root: NormalNode = { tag: "#root", attrs: [], children: [] };
  const stack = [root];
  const token = /<\/([a-zA-Z]+)\s*>|<([a-zA-Z]+)((?:\s+[^\s=]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  for (const match of markup.matchAll(token)) {
    const [, close, open, attrText, selfClose, text] = match;
    const top = stack[stack.length - 1];
    if (close) {
      stack.pop();
    } else if (open) {
      const attrs = [...(attrText ?? "").matchAll(/([^\s=]+)="([^"]*)"/g)].map(([, name, value]) => [name, decode(value)] as [string, string]);
      const node: NormalNode = { tag: open, attrs, children: [] };
      top.children.push(node);
      if (!selfClose) stack.push(node);
    } else if (text !== undefined && text.trim() !== "") {
      top.children.push(decode(text));
    }
  }
  return root.children[0] as NormalNode;
};
