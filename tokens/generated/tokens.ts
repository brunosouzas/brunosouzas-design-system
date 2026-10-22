// Generated from tokens/source.json by scripts/tokens.ts (npm run tokens). Do not edit by hand.

export const tokens = {
  "color": {
    "backend": "#FF6B6B",
    "blocked": "#FF8A3D",
    "caller": "#8FB2FF",
    "failFast": "#E0661F",
    "failure": "#E04848",
    "healthy": "#3DDC84",
    "ink": "#0A1033",
    "panel": "#EEF2FF",
    "ring": "#E0E7FB",
    "transitional": "#FFD25A",
    "white": "#FFFFFF"
  },
  "font": {
    "mono": "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    "sans": "Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    "weightBold": 700,
    "weightHeavy": 900
  },
  "motion": {
    "dimOpacity": 0.42,
    "drawArrow": 20,
    "fade": 10,
    "focus": {
      "damping": 200,
      "mass": 1,
      "stiffness": 120
    },
    "focusScale": 1.06,
    "fps": 30,
    "pop": {
      "damping": 13,
      "mass": 0.7,
      "stiffness": 140
    },
    "readingHold": 90,
    "travel": 22
  },
  "outline": {
    "arrow": 4,
    "block": 4,
    "small": 3
  },
  "radius": {
    "block": 18,
    "pill": 22,
    "small": 6
  },
  "shadow": {
    "block": 10,
    "pill": 6,
    "small": 4
  }
} as const;

export type Tokens = typeof tokens;
