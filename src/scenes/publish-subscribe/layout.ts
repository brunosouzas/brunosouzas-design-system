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
  caption:{x:60,y:985,w:1800,h:90},size:{name:54,label:30,caption:38,square:36},
};
for (const [i,id] of consumers.entries()) {
  const x=80+i*600;
  landscape.boxes[`${id}-queue`]={x,y:540,w:520,h:125};
  landscape.boxes[id]={x:x-10,y:790,w:550,h:175};
  landscape.docks[`${id}-queue`]={x:x+60,y:635};
  landscape.docks[id]={x:x+30,y:930};
  landscape.routes[`${id}-binding`]=`M655,385 L655,475 L${x+60},475 L${x+60},635`;
  landscape.routes[`${id}-subscriber`]=`M${x+60},635 L${x+60},745 L${x+30},745 L${x+30},930`;
  landscape.arrows[`${id}-binding`]=`M655,385 L655,475 L${x+60},475 L${x+60},528`;
  landscape.arrows[`${id}-subscriber`]=`M${x+60},635 L${x+60},745 L${x+30},745 L${x+30},778`;
  landscape.labels[`${id}-binding`]={x:x+300,y:515};
  landscape.labels[`${id}-subscriber`]={x:x+260,y:740};
}
landscape.routes.publish="M660,125 L550,125 L550,385 L655,385";
landscape.arrows.publish="M660,125 L550,125 L550,385 L578,385";
landscape.arrows["invoice-return"]="M1304,930 L1250,930 L1250,774 L1840,774 L1840,635 L1812,635";
landscape.labels.publish={x:420,y:200};
landscape.routes["invoice-return"]="M1304,930 L1250,930 L1250,774 L1840,774 L1840,635 L1340,635";

const portrait: Layout = {
  width:1080,height:1350,mq:{x:20,y:220,w:595,h:920},
  boxes:{api:{x:235,y:20,w:610,h:145},exchange:{x:55,y:275,w:520,h:145}},
  docks:{api:{x:810,y:125},exchange:{x:510,y:388}},routes:{},arrows:{},labels:{},
  caption:{x:40,y:1210,w:1000,h:135},size:{name:54,label:30,caption:38,square:32},
};
// One binding trunk (x 40) drops from the exchange with a short branch into
// each queue row, as the landscape's single drop line; rows spread to y 1150.
// Spacing budgets the hard shadows (token shadow.block): the exchange's shadow
// stays above the first row's labels, queue and exchange shadows stay inside
// the MQ body, and each application block (tall enough for a three-line
// Portuguese name plus its subtitle) clears the next block's top. Application
// blocks sit on their own rhythm; a short jog at x 645, outside the MQ shadow,
// joins each queue row to its block.
const trunk=40, jog=645, appTops=[356,631,906], appHeight=244, appDock=204;
for (const [i,id] of consumers.entries()) {
  const y=490+i*245, queueDock=y+95, dock=appTops[i]+appDock;
  portrait.boxes[`${id}-queue`]={x:90,y,w:490,h:125};
  portrait.boxes[id]={x:690,y:appTops[i],w:368,h:appHeight};
  portrait.docks[`${id}-queue`]={x:145,y:queueDock};
  portrait.docks[id]={x:730,y:dock};
  portrait.routes[`${id}-binding`]=`M510,388 L${trunk},388 L${trunk},${queueDock} L145,${queueDock}`;
  portrait.routes[`${id}-subscriber`]=`M145,${queueDock} L${jog},${queueDock} L${jog},${dock} L730,${dock}`;
  portrait.arrows[`${id}-binding`]=`M510,388 L${trunk},388 L${trunk},${queueDock} L78,${queueDock}`;
  portrait.arrows[`${id}-subscriber`]=`M145,${queueDock} L${jog},${queueDock} L${jog},${dock} L678,${dock}`;
  portrait.labels[`${id}-binding`]={x:220,y:y-24};
  portrait.labels[`${id}-subscriber`]={x:500,y:y-24};
}
portrait.routes.publish=`M810,125 L810,195 L${jog},195 L${jog},388 L510,388`;
portrait.arrows.publish=`M810,125 L810,195 L${jog},195 L${jog},388 L567,388`;
// Return leaves the invoice block's bottom, below the MQ body, and enters the
// invoice queue from below (arrowhead tip on its outline): separate from its
// Subscriber path and the trunk.
portrait.arrows["invoice-return"]="M727,1120 L727,1180 L330,1180 L330,1116";
portrait.labels.publish={x:420,y:195};
portrait.routes["invoice-return"]="M727,1120 L727,1180 L330,1180 L330,1075 L145,1075";
export const layouts:Record<Format,Layout>={"16x9":landscape,"4x5":portrait};
/** Word wrapping is view data, preserving spaces and complete identifiers. */
export const consumerLines = (lang:Lang, format:Format, index:number): string[] => {
  if (lang === "en") return [["Payment","consumer"],["Inventory","consumer"],["Invoice","consumer"]][index];
  return format === "4x5" ? [["Consumidor","de","pagamento"],["Consumidor","de estoque"],["Consumidor","de nota","fiscal"]][index] : [["Consumidor de","pagamento"],["Consumidor de","estoque"],["Consumidor de","nota fiscal"]][index];
};
