"""AB#307 concepts for the default share image (og, 1200x630). EXPLORATION / PREVIEW.

Art: built by the released CLI (@brunosouzas/design-system@0.8.1, format og).
Type: the design system draws no serif title today, so the text layer is a
PREVIEW injected here (Source Serif 4 4.005R Bold / Italic, Source Sans 3 from
the package), embedded as full TTFs. Never shipped.
Run with /opt/homebrew/bin/python3.14 gen.py
"""
import base64, json, pathlib, subprocess, html

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"; OUT.mkdir(exist_ok=True)
SPEC = ROOT / "spec"; SPEC.mkdir(exist_ok=True)
CLI = ROOT / "node_modules/.bin/brunosouzas-cover"
SERIF = ROOT / "fonts/source-serif-4.005_Desktop/TTF"
SANS = ROOT / "node_modules/@brunosouzas/design-system/fonts"

L = dict(bg="#F6F3EC", text="#121212", muted="#5C5852", accent="#E04E17")
D = dict(bg="#121110", text="#F1EEE8", muted="#ADA79D", accent="#FF7A45")

TXT = {
    "en": dict(slogan=["Code that runs for", "the problem you have."],
               big=["Code that runs", "for the problem", "you have."],
               sub="Articles and notes on integration, MuleSoft and AI-assisted engineering."),
    "pt": dict(slogan=["Código que roda para", "o problema que você tem."],
               big=["Código que roda", "para o problema", "que você tem."],
               sub="Artigos e notas sobre integração, MuleSoft e engenharia assistida por AI."),
}


def b64(p):
    return base64.b64encode(p.read_bytes()).decode()


FONT_CSS = (
    "@font-face{font-family:'Source Serif 4';font-weight:700;font-style:normal;"
    f"src:url(data:font/ttf;base64,{b64(SERIF/'SourceSerif4-Bold.ttf')}) format('truetype')}}"
    "@font-face{font-family:'Source Serif 4';font-weight:400;font-style:italic;"
    f"src:url(data:font/ttf;base64,{b64(SERIF/'SourceSerif4-It.ttf')}) format('truetype')}}"
    "@font-face{font-family:'PrevSans';font-weight:400;"
    f"src:url(data:font/ttf;base64,{b64(SANS/'SourceSans3-Regular.ttf')}) format('truetype')}}"
)


def build(spec: dict, name: str) -> str:
    p = SPEC / f"{name}.json"
    p.write_text(json.dumps(spec, indent=2))
    out = OUT / f"{name}.art.svg"
    r = subprocess.run([str(CLI), str(p), "--out", str(out)], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{name}: {r.stdout}{r.stderr}")
    return out.read_text()


def text_layer(items, pal):
    """items: (kind, x, y, size, str[, anchor]) kind in serif|italic|sans|sansmuted"""
    parts = [f'<g stroke="none" data-preview="text">']
    for it in items:
        kind, x, y, size, s = it[:5]
        anchor = it[5] if len(it) > 5 else "start"
        fam, wt, st, fill = {
            "serif": ("'Source Serif 4', serif", 700, "normal", pal["text"]),
            "italic": ("'Source Serif 4', serif", 400, "italic", pal["text"]),
            "sans": ("PrevSans, sans-serif", 400, "normal", pal["muted"]),
        }[kind]
        ls = ' letter-spacing="-0.01em"' if kind == "serif" else ""
        parts.append(
            f'<text x="{x}" y="{y}" font-family="{fam}" font-weight="{wt}" font-style="{st}" '
            f'font-size="{size}" fill="{fill}" text-anchor="{anchor}"{ls}>{html.escape(s)}</text>')
    parts.append("</g>")
    return "\n".join(parts)


def compose(art: str, layer: str, dark=False) -> str:
    svg = art
    if dark:  # PREVIEW of a dark og: the og format has no dark background today
        svg = svg.replace('fill="#F6F3EC"', f'fill="{D["bg"]}"', 1)
        svg = svg.replace('stroke="#D8D6D0"', 'stroke="#2A2825"')
        # signature has no surface parameter: its ink outline would vanish on dark
        svg = svg.replace('stroke="#121212"', 'stroke="#ADA79D"')
    svg = svg.replace("</desc>", f"</desc>\n<style>{FONT_CSS}</style>", 1)
    return svg.replace("</svg>", layer + "\n</svg>")


def base(id_, rings, pieces, surface=None):
    if surface:
        for p in pieces:
            if p["piece"] in ("mira", "symbol", "messageArrow", "brandNotationIcon", "bankObject"):
                p["surface"] = surface
    return {"id": id_, "title": "Bruno Souza — Code that runs for the problem you have.",
            "description": "PREVIEW for AB#307", "format": "og", "background": "neutral",
            "rings": rings, "pieces": pieces, "signature": True}


# ---- concept A: "Prancha" (phase-4 prototype A4: wordmark, slogan, line to Mira)
def concept_a(lang, dark=False):
    s = "dark" if dark else None
    pal = D if dark else L
    pieces = [
        {"piece": "symbol", "x": 140, "y": 66, "scale": 1.1},
        {"piece": "messageArrow", "from": [0, 540], "to": [520, 540], "curve": "straight", "dashed": True, "head": False, "width": 5},
        {"piece": "brandNotationIcon", "name": "message", "x": 590, "y": 516},
        {"piece": "messageArrow", "from": [520, 540], "to": [840, 540], "curve": "straight", "head": False, "width": 5},
        {"piece": "messageArrow", "from": [840, 540], "to": [918, 318], "controls": [[918, 540], [918, 420]], "head": False, "width": 5},
        {"piece": "mira", "x": 1000, "y": 470, "scale": 1.1, "needleAngle": -154, "carries": True, "expression": "done"},
    ]
    art = build(base(f"og-a-{lang}{'-dark' if dark else ''}", {"cx": 1000, "cy": 380}, pieces, s), f"a-{lang}{'-dark' if dark else ''}")
    t = TXT[lang]
    layer = text_layer([
        ("italic", 184, 96, 32, "Bruno Souza"),
        ("serif", 140, 250, 66 if lang == "en" else 58, t["slogan"][0]),
        ("serif", 140, 328 if lang == "en" else 320, 66 if lang == "en" else 58, t["slogan"][1]),
        ("sans", 142, 388, 24, t["sub"]),
    ], pal)
    return compose(art, layer, dark)


# ---- concept B: "Rota" (the home banner's route under a centred title)
def concept_b(lang, dark=False):
    s = "dark" if dark else None
    pal = D if dark else L
    pieces = [
        {"piece": "messageArrow", "from": [0, 520], "to": [380, 520], "curve": "straight", "dashed": True, "head": False, "width": 5},
        {"piece": "brandNotationIcon", "name": "message", "x": 430, "y": 496},
        {"piece": "brandNotationIcon", "name": "message", "x": 560, "y": 496},
        {"piece": "messageArrow", "from": [380, 520], "to": [680, 520], "curve": "straight", "head": False, "width": 5},
        {"piece": "messageArrow", "from": [680, 520], "to": [800, 410], "controls": [[800, 520], [800, 470]], "head": False, "width": 5},
        {"piece": "mira", "x": 870, "y": 560, "scale": 1.0, "needleAngle": -154, "carries": True, "expression": "done"},
    ]
    art = build(base(f"og-b-{lang}{'-dark' if dark else ''}", {"cx": 870, "cy": 470}, pieces, s), f"b-{lang}{'-dark' if dark else ''}")
    t = TXT[lang]
    layer = text_layer([
        ("serif", 600, 160, 64, t["slogan"][0], "middle"),
        ("serif", 600, 236, 64, t["slogan"][1], "middle"),
        ("italic", 600, 300, 30, "Bruno Souza", "middle"),
    ], pal)
    return compose(art, layer, dark)


# ---- concept C: "Título" (type leads, readable as a thumbnail; the four tracks)
def concept_c(lang, dark=False):
    pal = D if dark else L
    cats = ["integration", "delivery", "aiEngineering", "personalTools"]
    pieces = [{"piece": "categoryIcon", "category": c, "x": 140 + i * 112, "y": 470, "scale": 2}
              for i, c in enumerate(cats)]
    pieces.insert(0, {"piece": "symbol", "x": 960, "y": 120, "scale": 2.6})
    art = build(base(f"og-c-{lang}{'-dark' if dark else ''}", {"cx": 1010, "cy": 150}, pieces, "dark" if dark else None), f"c-{lang}{'-dark' if dark else ''}")
    t = TXT[lang]
    layer = text_layer([
        ("serif", 140, 190, 96, t["big"][0]),
        ("serif", 140, 296, 96, t["big"][1]),
        ("serif", 140, 402, 96, t["big"][2]),
    ], pal)
    return compose(art, layer, dark)


if __name__ == "__main__":
    import sys
    which = sys.argv[1:] or ["a-en", "b-en", "c-en", "a-pt", "c-pt", "a-en-dark", "b-en-dark", "c-en-dark"]
    fns = {"a": concept_a, "b": concept_b, "c": concept_c}
    for w in which:
        c, lang, *rest = w.split("-")
        svg = fns[c](lang, dark=bool(rest))
        (OUT / f"{w}.svg").write_text(svg)
        print("wrote", OUT / f"{w}.svg")
