// The 26 EIP icons of the blog, as data (spec illustration-pieces, "EIP icons
// as data"; design §5). Imported once from the published icon files
// (integration-patterns-in-mulesoft/images/icons/eip-*.svg) with every colour
// replaced by its token; this module is now the source and is edited by hand.
//
// Credit: each icon is redrawn from the Enterprise Integration Patterns icons
// by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com,
// licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Each
// entry keeps that credit in its description.
import { tokens } from "../../tokens/generated/tokens.ts";
import type { Attrs, SvgNode, SvgTag } from "./node.ts";

const C = tokens.color;
const I = tokens.illustration;
const n = (tag: SvgTag, attrs: Attrs, children: SvgNode[] = []): SvgNode => ({ tag, attrs, children });

export type EipIcon = { readonly name: string; readonly title: string; readonly description: string; readonly nodes: readonly SvgNode[] };

/** Every icon draws in a 64x40 box. */
export const EIP_ICON_WIDTH = 64;
export const EIP_ICON_HEIGHT = 40;

export const EIP_ICONS: readonly EipIcon[] = [
  {
    name: "aggregator",
    title: "Aggregator",
    description: "Icon of the Aggregator pattern: a component turning three messages into one. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("rect", { x: "16", y: "8", width: "6", height: "6", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "16", y: "16.5", width: "6", height: "6", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "16", y: "25", width: "6", height: "6", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "25.5,19.5 34.5,19.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "38.00,19.50 33.00,22.25 33.00,16.75", fill: C.ink }),
      n("rect", { x: "40", y: "15.5", width: "8", height: "8", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "canonical-data-model",
    title: "Canonical Data Model",
    description: "Icon of the Canonical Data Model pattern: two translators on both sides of one shared message format; the book has no icon for this pattern, so this is drawn from its sketch. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "4.5", y: "12.5", width: "14", height: "19", rx: "3", fill: C.ink }),
      n("rect", { x: "2", y: "10", width: "14", height: "19", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("polyline", { points: "5,13 13,26", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "5,26 13,13", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("rect", { x: "49.5", y: "12.5", width: "14", height: "19", rx: "3", fill: C.ink }),
      n("rect", { x: "47", y: "10", width: "14", height: "19", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("polyline", { points: "50,13 58,26", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "50,26 58,13", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "18.5,19.5 22.06,19.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "25.00,19.50 20.80,21.81 20.80,17.19", fill: C.ink }),
      n("polyline", { points: "39.5,19.5 43.06,19.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "46.00,19.50 41.80,21.81 41.80,17.19", fill: C.ink }),
      n("rect", { x: "28.5", y: "15.5", width: "11", height: "11", fill: C.ink }),
      n("rect", { x: "27", y: "14", width: "11", height: "11", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "29.2", y: "14.75", width: "1.9", height: "9.5", fill: C.caller }),
      n("rect", { x: "32.1", y: "14.75", width: "1.9", height: "9.5", fill: C.caller }),
      n("rect", { x: "35", y: "14.75", width: "1.9", height: "9.5", fill: C.caller }),
      n("rect", { x: "27", y: "14", width: "11", height: "11", fill: "none", stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "channel-adapter",
    title: "Channel Adapter",
    description: "Icon of the Channel Adapter pattern: an application with a wavy edge, an adapter plate, a two-way arrow and the end of a channel pipe. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("path", { d: "M4,4 H14 V35 H4 Q7.5,30 4,25 Q0.5,20 4,15 Q7.5,9.5 4,4 Z", fill: C.ink, transform: "translate(2 2)" }),
      n("path", { d: "M4,4 H14 V35 H4 Q7.5,30 4,25 Q0.5,20 4,15 Q7.5,9.5 4,4 Z", fill: C.transitional, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("polygon", { points: "16.00,6.00 26.00,11.50 26.00,31.50 16.00,37.00", fill: C.ink }),
      n("polygon", { points: "14.00,4.00 24.00,9.50 24.00,29.50 14.00,35.00", fill: C.caller, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("g", {  }, [
        n("path", { d: "M32,19.5 H39", fill: "none", stroke: C.ink, "stroke-width": "5.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "27.50,19.50 33.00,16.09 33.00,22.91", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
        n("polygon", { points: "44.00,19.50 38.50,22.91 38.50,16.09", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M32,19.5 H39", fill: "none", stroke: I.iconLine, "stroke-width": "2.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "27.50,19.50 33.00,16.09 33.00,22.91", fill: I.iconLine }),
        n("polygon", { points: "44.00,19.50 38.50,22.91 38.50,16.09", fill: I.iconLine }),
      ]),
      n("path", { d: "M48,14.0 H58 A2.475,5.5 0 0 1 58,25.0 H48 A2.475,5.5 0 0 1 48,14.0 Z", fill: C.ink, transform: "translate(2 2)" }),
      n("path", { d: "M48,14.0 H58 A2.475,5.5 0 0 1 58,25.0 H48 A2.475,5.5 0 0 1 48,14.0 Z", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("ellipse", { cx: "58", cy: "19.5", rx: "2.475", ry: "5.5", fill: C.white, stroke: C.ink, "stroke-width": "1.75" }),
    ],
  },
  {
    name: "claim-check",
    title: "Claim Check",
    description: "Icon of the Claim Check pattern: a component turning a large message into a small one, with a key. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("rect", { x: "12", y: "9.5", width: "13", height: "13", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "28,16 36.5,16.0", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "40.00,16.00 35.00,18.75 35.00,13.25", fill: C.ink }),
      n("rect", { x: "42", y: "12.5", width: "7", height: "7", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "48.5,28 56,28", fill: "none", stroke: C.ink, "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "53,28 53,31", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "55.6,28 55.6,30.5", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("circle", { cx: "45.5", cy: "28", r: "3.4", fill: C.transitional, stroke: C.ink, "stroke-width": "1.6" }),
    ],
  },
  {
    name: "competing-consumers",
    title: "Competing Consumers",
    description: "Icon of the Competing Consumers pattern: a channel arrow entering a component that fans out to three consumers. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M2,19 H22", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "31.00,19.00 22.00,24.58 22.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H22", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "31.00,19.00 22.00,24.58 22.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H22", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "31.00,19.00 22.00,24.58 22.00,13.42", fill: I.iconLine }),
      ]),
      n("polyline", { points: "31.5,19 43.383108288109796,11.62427761427668", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "46.00,10.00 43.54,14.38 40.99,10.26", fill: C.ink }),
      n("polygon", { points: "50.50,7.00 53.50,10.00 50.50,13.00 47.50,10.00", fill: C.ink }),
      n("polyline", { points: "31.5,19 42.92,19.0", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "46.00,19.00 41.60,21.42 41.60,16.58", fill: C.ink }),
      n("polygon", { points: "50.50,16.00 53.50,19.00 50.50,22.00 47.50,19.00", fill: C.ink }),
      n("polyline", { points: "31.5,19 43.383108288109796,26.37572238572332", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "46.00,28.00 40.99,27.74 43.54,23.62", fill: C.ink }),
      n("polygon", { points: "50.50,25.00 53.50,28.00 50.50,31.00 47.50,28.00", fill: C.ink }),
    ],
  },
  {
    name: "content-based-router",
    title: "Content-Based Router",
    description: "Icon of the Content-Based Router pattern: a component whose input switch connects to one of three outputs. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("polyline", { points: "6,20 17,20", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "17.00,17.40 19.60,20.00 17.00,22.60 14.40,20.00", fill: C.ink }),
      n("polyline", { points: "17,20 39,11", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "39.00,8.40 41.60,11.00 39.00,13.60 36.40,11.00", fill: C.ink }),
      n("polyline", { points: "39,11 58,11", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "39.00,17.40 41.60,20.00 39.00,22.60 36.40,20.00", fill: C.ink }),
      n("polyline", { points: "39,20 58,20", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "39.00,25.90 41.60,28.50 39.00,31.10 36.40,28.50", fill: C.ink }),
      n("polyline", { points: "39,28.5 58,28.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "content-enricher",
    title: "Content Enricher",
    description: "Icon of the Content Enricher pattern: a component turning a small message into a large one. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("rect", { x: "14", y: "15.5", width: "7", height: "7", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "24,19 32.5,19.0", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "36.00,19.00 31.00,21.75 31.00,16.25", fill: C.ink }),
      n("rect", { x: "38", y: "12", width: "14", height: "14", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "content-filter",
    title: "Content Filter",
    description: "Icon of the Content Filter pattern: a component turning a large message into a small one. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("rect", { x: "13", y: "12", width: "14", height: "14", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "30,19 38.5,19.0", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "42.00,19.00 37.00,21.75 37.00,16.25", fill: C.ink }),
      n("rect", { x: "44.5", y: "15.5", width: "7", height: "7", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "correlation-identifier",
    title: "Correlation Identifier",
    description: "Icon of the Correlation Identifier pattern: two ID tokens linked by an arrow, attached to messages A and B. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("circle", { cx: "13.6", cy: "10.6", r: "6", fill: C.ink }),
      n("circle", { cx: "12", cy: "9", r: "6", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75" }),
      n("circle", { cx: "41.6", cy: "10.6", r: "6", fill: C.ink }),
      n("circle", { cx: "40", cy: "9", r: "6", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75" }),
      n("polyline", { points: "33.5,9 22.1,9.0", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "18.60,9.00 23.60,6.25 23.60,11.75", fill: C.ink }),
      n("polyline", { points: "12,15 12,29 18,29", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "40,15 40,29 46,29", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("rect", { x: "20", y: "24", width: "12", height: "13", fill: C.ink }),
      n("rect", { x: "48", y: "24", width: "12", height: "13", fill: C.ink }),
      n("rect", { x: "18", y: "22", width: "12", height: "13", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "46", y: "22", width: "12", height: "13", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "21,34 24,25.2 27,34", fill: "none", stroke: C.ink, "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "22.1,31 25.9,31", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("path", { d: "M49.6,25.2 V34 H53 Q55.4,34 55.4,31.7 Q55.4,29.6 53,29.6 H49.6 M49.6,29.6 H52.6 Q54.8,29.6 54.8,27.4 Q54.8,25.2 52.6,25.2 H49.6", fill: "none", stroke: C.ink, "stroke-width": "1.8", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "dead-letter-channel",
    title: "Dead Letter Channel",
    description: "Icon of the Dead Letter Channel pattern: a channel pipe above a red stop sign. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("path", { d: "M9,4.5 H53 A2.9250000000000003,6.5 0 0 1 53,17.5 H9 A2.9250000000000003,6.5 0 0 1 9,4.5 Z", fill: C.ink, transform: "translate(2 2)" }),
      n("path", { d: "M9,4.5 H53 A2.9250000000000003,6.5 0 0 1 53,17.5 H9 A2.9250000000000003,6.5 0 0 1 9,4.5 Z", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("ellipse", { cx: "53", cy: "11", rx: "2.9250000000000003", ry: "6.5", fill: C.white, stroke: C.ink, "stroke-width": "1.75" }),
      n("polygon", { points: "40.73,32.67 36.67,36.73 30.93,36.73 26.87,32.67 26.87,26.93 30.93,22.87 36.67,22.87 40.73,26.93", fill: C.ink }),
      n("polygon", { points: "38.93,30.87 34.87,34.93 29.13,34.93 25.07,30.87 25.07,25.13 29.13,21.07 34.87,21.07 38.93,25.13", fill: C.backend, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "event-driven-consumer",
    title: "Event-Driven Consumer",
    description: "Icon of the Event-Driven Consumer pattern: a channel arrow entering a component that passes the message on at once. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "20.5", y: "6.5", width: "40", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "18", y: "4", width: "40", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M2,19 H27", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,19.00 27.00,24.58 27.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H27", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,19.00 27.00,24.58 27.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H27", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,19.00 27.00,24.58 27.00,13.42", fill: I.iconLine }),
      ]),
      n("polyline", { points: "38.5,19 45.28,19.0", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "48.50,19.00 43.90,21.53 43.90,16.47", fill: C.ink }),
      n("polygon", { points: "52.50,15.80 55.70,19.00 52.50,22.20 49.30,19.00", fill: C.ink }),
    ],
  },
  {
    name: "guaranteed-delivery",
    title: "Guaranteed Delivery",
    description: "Icon of the Guaranteed Delivery pattern: a channel arrow above a small database cylinder. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M4,10 H50", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,10.00 50.00,15.58 50.00,4.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M4,10 H50", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,10.00 50.00,15.58 50.00,4.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M4,10 H50", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,10.00 50.00,15.58 50.00,4.42", fill: I.iconLine }),
      ]),
      n("path", { d: "M25,23 V33 A7,2.6 0 0 0 39,33 V23 Z", fill: C.ink, transform: "translate(2 2)" }),
      n("path", { d: "M25,23 V33 A7,2.6 0 0 0 39,33 V23 Z", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("ellipse", { cx: "32", cy: "23", rx: "7", ry: "2.6", fill: C.white, stroke: C.ink, "stroke-width": "1.75" }),
    ],
  },
  {
    name: "idempotent-receiver",
    title: "Idempotent Receiver",
    description: "Icon of the Idempotent Receiver pattern: a channel arrow delivering a message into a component, with a badge showing the number 1. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "18.5", y: "11.5", width: "42", height: "27", rx: "3", fill: C.ink }),
      n("rect", { x: "16", y: "9", width: "42", height: "27", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M3,23 H27", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,23.00 27.00,28.58 27.00,17.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M3,23 H27", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,23.00 27.00,28.58 27.00,17.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M3,23 H27", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,23.00 27.00,28.58 27.00,17.42", fill: I.iconLine }),
      ]),
      n("rect", { x: "38.5", y: "17", width: "12", height: "12", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("circle", { cx: "17.8", cy: "11.3", r: "7.6", fill: C.ink }),
      n("circle", { cx: "16", cy: "9.5", r: "7.6", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75" }),
      n("polyline", { points: "13.6,7.6 16.4,5.4 16.4,13.8", fill: "none", stroke: C.ink, "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "13.8,13.8 19,13.8", fill: "none", stroke: C.ink, "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "invalid-message-channel",
    title: "Invalid Message Channel",
    description: "Icon of the Invalid Message Channel pattern: a channel pipe above a yellow warning sign. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("path", { d: "M9,4.5 H53 A2.9250000000000003,6.5 0 0 1 53,17.5 H9 A2.9250000000000003,6.5 0 0 1 9,4.5 Z", fill: C.ink, transform: "translate(2 2)" }),
      n("path", { d: "M9,4.5 H53 A2.9250000000000003,6.5 0 0 1 53,17.5 H9 A2.9250000000000003,6.5 0 0 1 9,4.5 Z", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("ellipse", { cx: "53", cy: "11", rx: "2.9250000000000003", ry: "6.5", fill: C.white, stroke: C.ink, "stroke-width": "1.75" }),
      n("polygon", { points: "33.80,22.30 43.30,37.80 24.30,37.80", fill: C.ink }),
      n("polygon", { points: "32.00,20.50 41.50,36.00 22.50,36.00", fill: C.transitional, stroke: C.ink, "stroke-width": "1.75", "stroke-linejoin": "round" }),
      n("polyline", { points: "32,25.5 32,30.5", fill: "none", stroke: C.ink, "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("circle", { cx: "32", cy: "33.2", r: "1.15", fill: C.ink }),
    ],
  },
  {
    name: "message-expiration",
    title: "Message Expiration",
    description: "Icon of the Message Expiration pattern: a clock face. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("circle", { cx: "34", cy: "22", r: "16", fill: C.ink }),
      n("circle", { cx: "32", cy: "20", r: "16", fill: C.white, stroke: C.ink, "stroke-width": "2.5" }),
      n("polyline", { points: "32,20 32,8.5", fill: "none", stroke: C.ink, "stroke-width": "2.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "32,20 42,20", fill: "none", stroke: C.ink, "stroke-width": "2.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "message-filter",
    title: "Message Filter",
    description: "Icon of the Message Filter pattern: a component with a funnel. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("polygon", { points: "22.60,10.10 44.60,10.10 36.60,19.60 36.60,31.60 30.60,31.60 30.60,19.60", fill: C.ink }),
      n("polygon", { points: "21.00,8.50 43.00,8.50 35.00,18.00 35.00,30.00 29.00,30.00 29.00,18.00", fill: I.iconLine, stroke: C.ink, "stroke-width": "1.6", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "message-translator",
    title: "Message Translator",
    description: "Icon of the Message Translator pattern: a component with two blocks crossed by an X. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("rect", { x: "11", y: "8", width: "17", height: "22", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "36", y: "8", width: "17", height: "22", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "13.5,10.5 50.5,27.5", fill: "none", stroke: C.ink, "stroke-width": "2.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "13.5,27.5 50.5,10.5", fill: "none", stroke: C.ink, "stroke-width": "2.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "point-to-point-channel",
    title: "Point-to-Point Channel",
    description: "Icon of the Point-to-Point Channel pattern: a single channel arrow. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M5,20 H50", fill: "none", stroke: C.ink, "stroke-width": "7.4", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,20.00 50.00,25.58 50.00,14.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M5,20 H50", fill: "none", stroke: C.ink, "stroke-width": "7.4", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,20.00 50.00,25.58 50.00,14.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M5,20 H50", fill: "none", stroke: I.iconLine, "stroke-width": "4.4", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,20.00 50.00,25.58 50.00,14.42", fill: I.iconLine }),
      ]),
    ],
  },
  {
    name: "polling-consumer",
    title: "Polling Consumer",
    description: "Icon of the Polling Consumer pattern: a channel arrow entering a component with a polling loop. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "20.5", y: "6.5", width: "40", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "18", y: "4", width: "40", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M2,19 H22", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "31.00,19.00 22.00,24.58 22.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H22", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "31.00,19.00 22.00,24.58 22.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H22", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "31.00,19.00 22.00,24.58 22.00,13.42", fill: I.iconLine }),
      ]),
      n("path", { d: "M47.80,22.17 A7.5,7.5 0 1 1 47.14,14.70", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round" }),
      n("polygon", { points: "48.98,17.32 44.47,15.10 48.44,12.33", fill: C.ink }),
      n("polygon", { points: "51.50,15.80 54.70,19.00 51.50,22.20 48.30,19.00", fill: C.ink }),
    ],
  },
  {
    name: "process-manager",
    title: "Process Manager",
    description: "Icon of the Process Manager pattern: a component with a small decision tree: a start point, a decision diamond and three steps. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("polyline", { points: "32,11.5 32,13", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "32,21.4 32,23.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "17.5,23.5 46.5,23.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "17.5,23.5 17.5,26", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "32,23.5 32,26", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "46.5,23.5 46.5,26", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("circle", { cx: "32", cy: "9", r: "2.6", fill: C.white, stroke: C.ink, "stroke-width": "1.5" }),
      n("polygon", { points: "32.00,13.00 36.20,17.20 32.00,21.40 27.80,17.20", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "11.5", y: "26", width: "12", height: "5.5", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "26", y: "26", width: "12", height: "5.5", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "40.5", y: "26", width: "12", height: "5.5", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "publish-subscribe-channel",
    title: "Publish-Subscribe Channel",
    description: "Icon of the Publish-Subscribe Channel pattern: one channel that forks into three arrows. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M4,20 H20 M20,7 V33 M20,7 H50 M20,20 H50 M20,33 H50", fill: "none", stroke: C.ink, "stroke-width": "6.2", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,7.00 51.00,11.96 51.00,2.04", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,20.00 51.00,24.96 51.00,15.04", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,33.00 51.00,37.96 51.00,28.04", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M4,20 H20 M20,7 V33 M20,7 H50 M20,20 H50 M20,33 H50", fill: "none", stroke: C.ink, "stroke-width": "6.2", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,7.00 51.00,11.96 51.00,2.04", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,20.00 51.00,24.96 51.00,15.04", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,33.00 51.00,37.96 51.00,28.04", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M4,20 H20 M20,7 V33 M20,7 H50 M20,20 H50 M20,33 H50", fill: "none", stroke: I.iconLine, "stroke-width": "3.2", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,7.00 51.00,11.96 51.00,2.04", fill: I.iconLine }),
        n("polygon", { points: "59.00,20.00 51.00,24.96 51.00,15.04", fill: I.iconLine }),
        n("polygon", { points: "59.00,33.00 51.00,37.96 51.00,28.04", fill: I.iconLine }),
      ]),
    ],
  },
  {
    name: "request-reply",
    title: "Request-Reply",
    description: "Icon of the Request-Reply pattern: a message going right on one channel and another coming back left on a second channel. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "6", y: "5.5", width: "11", height: "11", fill: C.ink }),
      n("rect", { x: "4", y: "3.5", width: "11", height: "11", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M21,10 H50", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,10.00 50.00,15.58 50.00,4.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M21,10 H50", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,10.00 50.00,15.58 50.00,4.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M21,10 H50", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "59.00,10.00 50.00,15.58 50.00,4.42", fill: I.iconLine }),
      ]),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M14,30 H43", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "5.00,30.00 14.00,24.42 14.00,35.58", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M14,30 H43", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "5.00,30.00 14.00,24.42 14.00,35.58", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M14,30 H43", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "5.00,30.00 14.00,24.42 14.00,35.58", fill: I.iconLine }),
      ]),
      n("rect", { x: "50", y: "26", width: "11", height: "11", fill: C.ink }),
      n("rect", { x: "48", y: "24", width: "11", height: "11", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "return-address",
    title: "Return Address",
    description: "Icon of the Return Address pattern: an envelope with an address block and a stamp. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "7", y: "6.5", width: "54", height: "31", rx: "1.5", fill: C.ink }),
      n("rect", { x: "4.5", y: "4", width: "54", height: "31", rx: "1.5", fill: C.transitional, stroke: C.ink, "stroke-width": "2" }),
      n("polyline", { points: "10,10 29,10", fill: "none", stroke: C.ink, "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "10,14.5 29,14.5", fill: "none", stroke: C.ink, "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "10,19 29,19", fill: "none", stroke: C.ink, "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("rect", { x: "45", y: "8", width: "9", height: "7.5", fill: C.white, stroke: C.ink, "stroke-width": "1.4", "stroke-linejoin": "round" }),
      n("polyline", { points: "45.5,8.5 49.5,12.3 53.5,8.5", fill: "none", stroke: C.ink, "stroke-width": "1.2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "22,25.5 46,25.5", fill: "none", stroke: C.ink, "stroke-width": "1.3", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "22,29.5 46,29.5", fill: "none", stroke: C.ink, "stroke-width": "1.3", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "scatter-gather",
    title: "Scatter-Gather",
    description: "Icon of the Scatter-Gather pattern: a component that fans one input out to three branches and joins them into one output. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("polyline", { points: "6,19 14,19", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "50,19 58,19", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "14,19 32,9.5 50,19", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "14,19 32,19 50,19", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polyline", { points: "14,19 32,28.5 50,19", fill: "none", stroke: C.ink, "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("circle", { cx: "14", cy: "19", r: "2.4", fill: C.ink }),
      n("circle", { cx: "50", cy: "19", r: "2.4", fill: C.ink }),
      n("polygon", { points: "32.00,6.30 35.20,9.50 32.00,12.70 28.80,9.50", fill: C.ink }),
      n("polygon", { points: "32.00,15.80 35.20,19.00 32.00,22.20 28.80,19.00", fill: C.ink }),
      n("polygon", { points: "32.00,25.30 35.20,28.50 32.00,31.70 28.80,28.50", fill: C.ink }),
    ],
  },
  {
    name: "splitter",
    title: "Splitter",
    description: "Icon of the Splitter pattern: a component turning one message into three. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("rect", { x: "16", y: "15.5", width: "8", height: "8", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("polyline", { points: "26.5,19.5 35.5,19.5", fill: "none", stroke: C.ink, "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      n("polygon", { points: "39.00,19.50 34.00,22.25 34.00,16.75", fill: C.ink }),
      n("rect", { x: "42", y: "8", width: "6", height: "6", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "42", y: "16.5", width: "6", height: "6", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("rect", { x: "42", y: "25", width: "6", height: "6", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
    ],
  },
  {
    name: "transactional-client",
    title: "Transactional Client",
    description: "Icon of the Transactional Client pattern: a channel arrow entering a component where the message sits inside a transaction boundary. Redrawn from the Enterprise Integration Patterns icon by Gregor Hohpe and Bobby Woolf, enterpriseintegrationpatterns.com, CC BY 4.0.",
    nodes: [
      n("rect", { x: "8.5", y: "6.5", width: "52", height: "30", rx: "3", fill: C.ink }),
      n("rect", { x: "6", y: "4", width: "52", height: "30", rx: "3", fill: C.healthy, stroke: C.ink, "stroke-width": "2" }),
      n("ellipse", { cx: "37", cy: "19", rx: "17", ry: "11.5", fill: C.caller, stroke: C.ink, "stroke-width": "1.6" }),
      n("rect", { x: "39", y: "13", width: "12", height: "12", fill: C.white, stroke: C.ink, "stroke-width": "1.5", "stroke-linejoin": "round" }),
      n("g", { transform: "translate(1.8 1.8)" }, [
        n("path", { d: "M2,19 H27", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,19.00 27.00,24.58 27.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H27", fill: "none", stroke: C.ink, "stroke-width": "6.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,19.00 27.00,24.58 27.00,13.42", fill: C.ink, stroke: C.ink, "stroke-width": "3", "stroke-linejoin": "round" }),
      ]),
      n("g", {  }, [
        n("path", { d: "M2,19 H27", fill: "none", stroke: I.iconLine, "stroke-width": "3.6", "stroke-linecap": "butt", "stroke-linejoin": "round" }),
        n("polygon", { points: "36.00,19.00 27.00,24.58 27.00,13.42", fill: I.iconLine }),
      ]),
    ],
  },
];

export const EIP_ICON_NAMES: readonly string[] = EIP_ICONS.map((icon) => icon.name);
