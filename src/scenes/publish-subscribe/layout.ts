// Arrowheads stop outside bodies while token paths continue to blank docks.
// Independent composition-pixel geometry, not a scaled landscape. Token docks
// and labels have separate allocations; the stills gate checks actual font fit.
import type { Format, Lang } from "../catalogue";
import type { Bounds } from "../../brand/flow-shapes";
import { pointAlong, type Point } from "../../brand/motion";
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
  landscape.labels[`${id}-binding`]={x:x+300,y:515};
  landscape.labels[`${id}-subscriber`]={x:x+260,y:730};
}
landscape.routes.publish="M660,125 L550,125 L550,385 L655,385";
landscape.arrows.publish="M660,125 L550,125 L550,385 L578,385";
landscape.arrows["invoice-return"]="M1304,925 L1250,925 L1250,774 L1840,774 L1840,650 L1812,650";
landscape.labels.publish={x:420,y:200};
landscape.routes["invoice-return"]="M1304,925 L1250,925 L1250,774 L1840,774 L1840,650 L1340,650";

const portrait: Layout = {
  width:1080,height:1350,mq:{x:25,y:220,w:600,h:915},
  boxes:{api:{x:235,y:20,w:610,h:145},exchange:{x:80,y:250,w:520,h:145}},
  docks:{api:{x:810,y:125},exchange:{x:535,y:380}},routes:{},arrows:{},labels:{},
  caption:{x:40,y:1210,w:1000,h:135},size:{name:54,label:30,caption:38,square:32},
};
// One binding trunk (x 45) drops from the exchange with a short branch into
// each queue row, as the landscape's single drop line; rows spread to y 1150.
const trunk=45;
for (const [i,id] of consumers.entries()) {
  const y=445+i*265;
  portrait.boxes[`${id}-queue`]={x:95,y,w:500,h:130};
  portrait.boxes[id]={x:700,y:y-55,w:355,h:220};
  portrait.docks[`${id}-queue`]={x:140,y:y+110};
  portrait.docks[id]={x:727,y:y+138};
  portrait.routes[`${id}-binding`]=`M535,380 L${trunk},380 L${trunk},${y+110} L140,${y+110}`;
  portrait.routes[`${id}-subscriber`]=`M140,${y+110} L650,${y+110} L650,${y+138} L727,${y+138}`;
  portrait.arrows[`${id}-binding`]=`M535,380 L${trunk},380 L${trunk},${y+110} L83,${y+110}`;
  portrait.arrows[`${id}-subscriber`]=`M140,${y+110} L650,${y+110} L650,${y+138} L688,${y+138}`;
  portrait.labels[`${id}-binding`]={x:220,y:y-24};
  portrait.labels[`${id}-subscriber`]={x:500,y:y-24};
}
portrait.routes.publish="M810,125 L810,195 L650,195 L650,380 L535,380";
portrait.arrows.publish="M810,125 L810,195 L650,195 L650,380 L590,380";
// Return leaves the invoice block's bottom, below the MQ body, and enters the
// invoice queue from below: separate from its Subscriber path and the trunk.
portrait.arrows["invoice-return"]="M727,1113 L727,1180 L330,1180 L330,1119";
portrait.labels.publish={x:420,y:195};
portrait.routes["invoice-return"]="M727,1113 L727,1180 L330,1180 L330,1085 L140,1085";
export const layouts:Record<Format,Layout>={"16x9":landscape,"4x5":portrait};

/** Where a copy is drawn: along its route, at its node's dock, or nowhere (null) when the path yields no point. */
export const tokenPoint = (
  item: { route?: string; progress?: number | null; node?: string },
  l: Layout,
  evaluate: (path: string, t: number) => Point | null = pointAlong,
): Point | null =>
  item.route ? evaluate((l.routes as Record<string, string>)[item.route], item.progress ?? 0) : item.node ? (l.docks as Record<string, Point>)[item.node] ?? null : null;
/** Word wrapping is view data, preserving spaces and complete identifiers. */
export const consumerLines = (lang:Lang, format:Format, index:number): string[] => {
  if (lang === "en") return [["Payment","consumer"],["Inventory","consumer"],["Invoice","consumer"]][index];
  return format === "4x5" ? [["Consumidor","de","pagamento"],["Consumidor","de estoque"],["Consumidor","de nota","fiscal"]][index] : [["Consumidor de","pagamento"],["Consumidor de","estoque"],["Consumidor de","nota fiscal"]][index];
};
