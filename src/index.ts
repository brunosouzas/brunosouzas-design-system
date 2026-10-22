// Remotion entry point: `npx remotion studio src/index.ts`, `remotion render` and
// `remotion still` load the compositions registered in Root.tsx from here.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
