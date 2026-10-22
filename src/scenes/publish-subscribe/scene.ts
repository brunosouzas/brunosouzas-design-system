// React-free pub-sub catalogue entry. Four compositions share one choreography;
// the approved article and diagram are the only source of visible words.
import type { FlowSceneData } from "../catalogue";
import { text } from "./text";
import { timeline } from "./timeline";
export const publishSubscribe = {
  id: "publish-subscribe", kind: "flow", formats: ["16x9", "4x5"], languages: ["pt", "en"],
  timeline, text,
  sources: { pt: "https://brunosouzas.com/pt/wiki/publish-subscribe-in-mulesoft/", en: "https://brunosouzas.com/wiki/publish-subscribe-in-mulesoft/" },
} satisfies FlowSceneData;
