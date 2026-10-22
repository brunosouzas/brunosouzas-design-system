// Arrowheads stop outside bodies while token paths continue to blank docks.
// Independent composition-pixel geometry, not a scaled landscape. Token docks
// and labels have separate allocations; the stills gate checks actual font fit.
import type { Format, Lang } from "../catalogue";
import type { Bounds } from "../../brand/flow-shapes";
import type { Point } from "../../brand/motion";
export const consumers = ["payment", "inventory", "invoice"] as const;
export type Layout = {
  width:number; height:number; mq:Bounds; boxes:Record<string,Bounds>;
  docks:Record<string,Point>; routes:Record<string,string>; arrows:Record<string,string>; labels:Record<string,Point>;
  caption:Bounds; size:{name:number; label:number; caption:number; square:number};
};
const landscape: Layout = {
  width:1920,height:1080,mq:{x:40,y:245,w:1830,h:455},
  boxes:{api:{x:620,y:20,w:680,h:145},exchange:{x:580,y:285,w:760,h:145}},
  docks:{api:{x:660,y:125},exchange:{x:655,y:385}},routes:{},arrows:{},labels:{},
  caption:{x:60,y:965,w:1800,h:105},size:{name:54,label:30,caption:38,square:36},
};
for (const [i,id] of consumers.entries()) {
  const x=80+i*600;
  landscape.boxes[`${id}-queue`]={x,y:540,w:520,h:130};
  landscape.boxes[id]={x:x-10,y:790,w:550,h:165};
  landscape.docks[`${id}-queue`]={x:x+60,y:650};
  landscape.docks[id]={x:x+24,y:925};
  landscape.routes[`${id}-binding`]=`M655,385 L655,475 L${x+60},475 L${x+60},650`;
  landscape.routes[`${id}-subscriber`]=`M${x+60},650 L${x+60},745 L${x+24},745 L${x+24},925`;
  landscape.arrows[`${id}-binding`]=`M655,385 L655,475 L${x+60},475 L${x+60},528`;
  landscape.arrows[`${id}-subscriber`]=`M${x+60},650 L${x+60},745 L${x+24},745 L${x+24},778`;
  landscape.labels[`${id}-binding`]={x:x+300,y:490};
  landscape.labels[`${id}-subscriber`]={x:x+260,y:742};
}
landscape.routes.publish="M660,125 L550,125 L550,385 L655,385";
landscape.arrows.publish="M660,125 L550,125 L550,385 L578,385";
landscape.arrows["invoice-return"]="M1304,925 L1250,925 L1250,774 L1840,774 L1840,650 L1812,650";
landscape.labels.publish={x:420,y:200};
landscape.routes["invoice-return"]="M1304,925 L1250,925 L1250,774 L1840,774 L1840,650 L1340,650";

const portrait: Layout = {
  width:1080,height:1350,mq:{x:25,y:220,w:600,h:840},
  boxes:{api:{x:235,y:20,w:610,h:145},exchange:{x:80,y:250,w:520,h:145}},
  docks:{api:{x:270,y:125},exchange:{x:140,y:345}},routes:{},arrows:{},labels:{},
  caption:{x:40,y:1125,w:1000,h:210},size:{name:54,label:30,caption:38,square:32},
};
for (const [i,id] of consumers.entries()) {
  const y=445+i*235;
  portrait.boxes[`${id}-queue`]={x:95,y,w:500,h:130};
  portrait.boxes[id]={x:710,y:y-55,w:340,h:220};
  portrait.docks[`${id}-queue`]={x:140,y:y+110};
  portrait.docks[id]={x:737,y:y+138};
  const lane=45+i*14;
  portrait.routes[`${id}-binding`]=`M140,345 L${lane},345 L${lane},${y+110} L140,${y+110}`;
  portrait.routes[`${id}-subscriber`]=`M140,${y+110} L650,${y+110} L650,${y+138} L737,${y+138}`;
  portrait.arrows[`${id}-binding`]=`M140,345 L${lane},345 L${lane},${y+110} L83,${y+110}`;
  portrait.arrows[`${id}-subscriber`]=`M140,${y+110} L650,${y+110} L650,${y+138} L698,${y+138}`;
  portrait.labels[`${id}-binding`]={x:220,y:y-24};
  portrait.labels[`${id}-subscriber`]={x:500,y:y-24};
}
portrait.routes.publish="M270,125 L180,125 L180,240 L140,240 L140,345";
portrait.arrows.publish="M270,125 L180,125 L180,240 L140,240";
portrait.arrows["invoice-return"]="M737,1053 L680,1053 L680,1098 L80,1098 L80,1025 L83,1025";
portrait.labels.publish={x:420,y:195};
portrait.routes["invoice-return"]="M737,1053 L680,1053 L680,1098 L80,1098 L80,1025 L140,1025";
export const layouts:Record<Format,Layout>={"16x9":landscape,"4x5":portrait};
/** Word wrapping is view data, preserving spaces and complete identifiers. */
export const consumerLines = (lang:Lang, format:Format, index:number): string[] => {
  if (lang === "en") return [["Payment","consumer"],["Inventory","consumer"],["Invoice","consumer"]][index];
  return format === "4x5" ? [["Consumidor","de","pagamento"],["Consumidor","de estoque"],["Consumidor","de nota","fiscal"]][index] : [["Consumidor de","pagamento"],["Consumidor de","estoque"],["Consumidor de","nota fiscal"]][index];
};
