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
  "cover": {
    "height": 420,
    "labelSize": 19,
    "labelWeight": 800,
    "pillHeight": 36,
    "ringRadius": 90,
    "ringStep": 28,
    "ringWidth": 2,
    "width": 800
  },
  "coverBackground": {
    "blush": {
      "fill": "#F6CFE0",
      "ring": "#ECBAD0"
    },
    "cobalt": {
      "fill": "#1E4FA0",
      "ring": "#2758AE"
    },
    "cream": {
      "fill": "#FFF1C9",
      "ring": "#F4E2AE"
    },
    "deepTeal": {
      "fill": "#0F6E6E",
      "ring": "#167A79"
    },
    "emerald": {
      "fill": "#2F9E6E",
      "ring": "#38AB79"
    },
    "forest": {
      "fill": "#24604F",
      "ring": "#2B6E5B"
    },
    "lavender": {
      "fill": "#B8A6F0",
      "ring": "#AC98EA"
    },
    "lime": {
      "fill": "#D4EC9C",
      "ring": "#C4E086"
    },
    "mint": {
      "fill": "#CDE5D3",
      "ring": "#BCDAC4"
    },
    "mustard": {
      "fill": "#F2C14E",
      "ring": "#E6B33E"
    },
    "navy": {
      "fill": "#14215A",
      "ring": "#1C2D74"
    },
    "olive": {
      "fill": "#8A9A3B",
      "ring": "#7E8E33"
    },
    "peach": {
      "fill": "#F4D8BC",
      "ring": "#EAC7A3"
    },
    "plum": {
      "fill": "#3D2B66",
      "ring": "#483577"
    },
    "raspberry": {
      "fill": "#C94F7C",
      "ring": "#BE4572"
    },
    "salmon": {
      "fill": "#FF9E7A",
      "ring": "#F48D68"
    },
    "sky": {
      "fill": "#BFE3F7",
      "ring": "#AAD5EC"
    },
    "slate": {
      "fill": "#2E3A59",
      "ring": "#38466A"
    },
    "teal": {
      "fill": "#1F8A8A",
      "ring": "#2A9A99"
    },
    "violet": {
      "fill": "#5B3CC4",
      "ring": "#6748CF"
    },
    "wine": {
      "fill": "#6B2340",
      "ring": "#7A2D4C"
    }
  },
  "font": {
    "mono": "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    "sans": "Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    "weightBold": 700,
    "weightHeavy": 900
  },
  "illustration": {
    "accent": "#1E6FEB",
    "codePanel": "#14215A",
    "healthyShade": "#2BB673",
    "iconLine": "#B9C3E0",
    "road": "#5B6478",
    "tape": "#FFE2C8",
    "textBar": "#C9D6F5",
    "transitionalShade": "#E8B830"
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
