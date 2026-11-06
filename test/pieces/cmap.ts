// Test helper: the Unicode code points a TrueType font maps to a glyph, read
// from its `cmap` table (formats 4 and 12, the ones HarfBuzz writes in a
// subset). Lets the font tests check which characters an embedded subset holds
// without a second font library.
const tag = (name: string): number => [...name].reduce((value, character) => ((value << 8) | character.charCodeAt(0)) >>> 0, 0);

export const codePoints = (font: Uint8Array): number[] => {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  let cmap = -1;
  for (let i = 0; i < view.getUint16(4); i++) {
    const record = 12 + i * 16;
    if (view.getUint32(record) === tag("cmap")) cmap = view.getUint32(record + 8);
  }
  if (cmap < 0) throw new Error("no cmap table");
  const found = new Set<number>();
  for (let i = 0; i < view.getUint16(cmap + 2); i++) {
    const subtable = cmap + view.getUint32(cmap + 4 + i * 8 + 4);
    const format = view.getUint16(subtable);
    if (format === 4) {
      const segments = view.getUint16(subtable + 6) / 2;
      const ends = subtable + 14;
      const starts = ends + segments * 2 + 2;
      const deltas = starts + segments * 2;
      const offsets = deltas + segments * 2;
      for (let s = 0; s < segments; s++) {
        const end = view.getUint16(ends + s * 2);
        const start = view.getUint16(starts + s * 2);
        const delta = view.getUint16(deltas + s * 2);
        const rangeOffset = view.getUint16(offsets + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          const glyph = rangeOffset === 0 ? (c + delta) & 0xffff : view.getUint16(offsets + s * 2 + rangeOffset + (c - start) * 2);
          if (glyph !== 0) found.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < view.getUint32(subtable + 12); g++) {
        const group = subtable + 16 + g * 12;
        for (let c = view.getUint32(group); c <= view.getUint32(group + 4); c++) found.add(c);
      }
    }
  }
  return [...found].sort((a, b) => a - b);
};
