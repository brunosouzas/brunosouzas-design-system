// Lato for the animations, loaded through @remotion/google-fonts (weights 700
// and 900: Google's Lato has no 800), followed by the font.sans token's stack.
//
// What can go wrong: the loader fetches from fonts.googleapis.com and
// fonts.gstatic.com and holds each frame (delayRender) until Lato loads, so an
// offline render fails with a timeout instead of falling back. Never import this
// file from tests or scripts: they must not need the network.
import { loadFont } from "@remotion/google-fonts/Lato";
import { tokens } from "../../tokens/generated/tokens";

const loaded = loadFont("normal", {
  weights: ["700", "900"],
  subsets: ["latin", "latin-ext"],
});

export const sans = `${loaded.fontFamily}, ${tokens.font.sans}`;
