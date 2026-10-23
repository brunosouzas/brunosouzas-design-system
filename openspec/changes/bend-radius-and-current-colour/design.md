# Design: bend-radius-and-current-colour

## 1. The token

`map.bendRadius`: `{ "$value": 32, "$type": "dimension", "$description": "Radius of a bundle's centre line at a 45° or 90° bend, in map units (stackledger round-bends, AB#166)." }`, after `zonePadding` in `tokens/source.json`. The generated files follow from the token build; they are never edited by hand. 32 is half of stackledger's 64-unit grid cell, so a 90° arc takes at most half a cell; the owner approved it on `~/.hermes/spikes/design-system/round-bends/contact-sheet.png`. No spike here: no piece draws differently.

## 2. `currentColor`

- The `color` parameter kind gains an option `currentColor?: boolean`. Only `uiIcon.colour` sets it. With it, the exact string `currentColor` passes the check; every other value is checked as before (token path, no literal). The CSS keyword is case-insensitive, but the piece takes one spelling so the output is predictable; `currentcolor` is rejected like any unknown path.
- `uiIcon` writes `currentColor` as the group's `fill` and `stroke` instead of resolving a token. The children do not change.
- The cover command checks each entry with the piece's own schema, then reports `currentColor` at `pieces[<i>].<param>` for any parameter whose spec has the option. Today that is only `uiIcon.colour`.
- Why a keyword and not a parameter such as `inherit: true`: stackledger asked for the value first, and one parameter keeps "one colour for the whole icon" in one place.

## 3. Use (for the README)

```ts
import { el, toSvg, uiIcon } from "@brunosouzas/design-system";
const zoom = toSvg(el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": "true" }, ...uiIcon({ name: "zoomIn", x: 0, y: 0, colour: "currentColor" }).body));
```

The SVG must be inline in the button. As an `<img>` or a CSS background it is a separate document and does not inherit the button's colour.
