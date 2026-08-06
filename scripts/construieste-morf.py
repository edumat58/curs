#!/usr/bin/env python3
"""Pregătește datele pentru metamorfoza cuvântului „Incluzivă" din eroul EduPAȘI.

Cuvântul din titlu nu se schimbă prin încrucișare de imagini, ci prin
INTERPOLAREA CONTURURILOR: fiecare literă e scoasă din fiecare font ca poligon
închis, cu ACELAȘI număr de puncte și aceeași ordine, așa încât punctul k din
Inter să aibă un corespondent în Atkinson și în OpenDyslexic. La rulare, litera
intermediară e media dintre ele — o formă care nu există în niciun font.

Ce face scriptul, pe scurt:
  1. desenează fiecare literă cu un pen care aplatizează curbele în segmente;
  2. normalizează fiecare contur: sens trigonometric, punct de pornire canonic
     (colțul stânga-sus al cadrului lui), N puncte la distanțe egale pe contur;
  3. potrivește conturile aceleiași litere între fonturi după centroid, ca golul
     din „a" să se ducă tot în gol, nu în bara lui „ă";
  4. așază literele cu avansurile reale + tracking-ul titlului (-0,04em).

Fonturi: Inter (SIL OFL), Atkinson Hyperlegible (SIL OFL), OpenDyslexic (SIL
OFL). Georgia — opțiunea „cu piciorușe" — lipsește dinadins: e font proprietar
Microsoft, iar conturile lui n-au ce căuta publicate într-un fișier al site-ului.

Rulare:  python3 scripts/construieste-morf.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

RADACINA = Path(__file__).resolve().parent.parent
CUVANT = "Incluzivă"
PUNCTE = 72          # puncte per contur, aceleași în toate fonturile
UPEM_TINTA = 1000    # unități de referință (em = 1000)
TRACKING = -40       # letter-spacing: -0.04em din `.hero h1`
SUBDIVIZIUNI = 24    # segmente per curbă înainte de reeșantionare

FONTURI = [
    {
        "cheie": "implicit",
        "eticheta": "Implicit",
        "fisiere": [Path.home() / "Library/Fonts/Inter_18pt-Bold.ttf"],
    },
    {
        "cheie": "lizibil",
        "eticheta": "Litere clare",
        "fisiere": [
            RADACINA / "static/fonts/AtkinsonHyperlegible-Bold-latin.woff2",
            RADACINA / "static/fonts/AtkinsonHyperlegible-Bold-latin-ext.woff2",
        ],
    },
    {
        "cheie": "dislexie",
        "eticheta": "Pentru dislexie",
        "fisiere": [RADACINA / "static/fonts/OpenDyslexic-Bold.woff2"],
    },
]


class PenPoligon(BasePen):
    """Desenează un contur ca listă de puncte: curbele sunt tăiate în segmente."""

    def __init__(self, glyphSet):
        super().__init__(glyphSet)
        self.contururi = []
        self._curent = None

    def _moveTo(self, pt):
        self._curent = [pt]

    def _lineTo(self, pt):
        self._curent.append(pt)

    def _curveToOne(self, p1, p2, p3):
        p0 = self._curent[-1]
        for i in range(1, SUBDIVIZIUNI + 1):
            t = i / SUBDIVIZIUNI
            u = 1 - t
            self._curent.append((
                u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
                u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
            ))

    def _qCurveToOne(self, p1, p2):
        p0 = self._curent[-1]
        for i in range(1, SUBDIVIZIUNI + 1):
            t = i / SUBDIVIZIUNI
            u = 1 - t
            self._curent.append((
                u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
            ))

    def _closePath(self):
        self._inchide()

    def _endPath(self):
        self._inchide()

    def _inchide(self):
        if self._curent and len(self._curent) > 2:
            if self._curent[0] == self._curent[-1]:
                self._curent.pop()
            self.contururi.append(self._curent)
        self._curent = None


def aria(puncte):
    s = 0.0
    for i, (x, y) in enumerate(puncte):
        x2, y2 = puncte[(i + 1) % len(puncte)]
        s += x * y2 - x2 * y
    return s / 2


def centroid(puncte):
    n = len(puncte)
    return (sum(p[0] for p in puncte) / n, sum(p[1] for p in puncte) / n)


def normalizeaza(puncte, n=PUNCTE):
    """Sens trigonometric, pornire canonică, n puncte la distanțe egale."""
    if aria(puncte) < 0:
        puncte = puncte[::-1]

    # pornire canonică: punctul cel mai apropiat de colțul stânga-sus al cadrului
    xmin = min(p[0] for p in puncte)
    ymax = max(p[1] for p in puncte)
    start = min(range(len(puncte)),
                key=lambda i: (puncte[i][0] - xmin) ** 2 + (puncte[i][1] - ymax) ** 2)
    puncte = puncte[start:] + puncte[:start]

    inel = puncte + [puncte[0]]
    lungimi = [0.0]
    for i in range(1, len(inel)):
        dx = inel[i][0] - inel[i - 1][0]
        dy = inel[i][1] - inel[i - 1][1]
        lungimi.append(lungimi[-1] + math.hypot(dx, dy))
    total = lungimi[-1]
    if total == 0:
        return [puncte[0]] * n

    iesire = []
    j = 0
    for k in range(n):
        tinta = total * k / n
        while j < len(lungimi) - 2 and lungimi[j + 1] < tinta:
            j += 1
        seg = lungimi[j + 1] - lungimi[j]
        t = 0 if seg == 0 else (tinta - lungimi[j]) / seg
        iesire.append((
            inel[j][0] + (inel[j + 1][0] - inel[j][0]) * t,
            inel[j][1] + (inel[j + 1][1] - inel[j][1]) * t,
        ))
    return iesire


def deschide(fisiere):
    """Tabelele de care avem nevoie, adunate din una sau două bucăți de font."""
    surse = [TTFont(str(f)) for f in fisiere]
    return surse


def litera(surse, ch):
    """Conturile normalizate ale unei litere + avansul ei, în unități de 1000."""
    for font in surse:
        cmap = font.getBestCmap()
        if ord(ch) not in cmap:
            continue
        nume = cmap[ord(ch)]
        glyphSet = font.getGlyphSet()
        pen = PenPoligon(glyphSet)
        glyphSet[nume].draw(pen)
        upem = font["head"].unitsPerEm
        s = UPEM_TINTA / upem
        avans = font["hmtx"][nume][0] * s
        contururi = [[(x * s, y * s) for x, y in c] for c in pen.contururi]
        return [normalizeaza(c) for c in contururi], avans
    raise SystemExit(f"litera „{ch}” lipsește din {[f.name for f in surse]}")


def cadru(contur):
    """Conturul adus în pătratul unitate, ca să poată fi comparat între fonturi."""
    xs = [p[0] for p in contur]
    ys = [p[1] for p in contur]
    lx = max(1e-6, max(xs) - min(xs))
    ly = max(1e-6, max(ys) - min(ys))
    return [((x - min(xs)) / lx, (y - min(ys)) / ly) for x, y in contur]


def roteste_la_potrivire(referinta, contur):
    """Alege punctul de pornire care aduce conturul cel mai aproape de referință.

    Reeșantionarea dă puncte la distanțe egale, dar nu spune de UNDE se pornește.
    Dacă „a" din Inter pornește din umărul de sus și „a" din OpenDyslexic din
    coada de jos, interpolarea răsucește litera. Încercăm toate cele N porniri și
    o luăm pe cea cu suma pătratelor cea mai mică — N e mic, e ieftin.
    """
    a = cadru(referinta)
    b = cadru(contur)
    n = len(b)
    cea_mai_buna, scor_min = 0, None
    for k in range(n):
        scor = 0.0
        for i in range(n):
            bx, by = b[(i + k) % n]
            scor += (a[i][0] - bx) ** 2 + (a[i][1] - by) ** 2
        if scor_min is None or scor < scor_min:
            scor_min, cea_mai_buna = scor, k
    return contur[cea_mai_buna:] + contur[:cea_mai_buna]


def potriveste(referinta, altele):
    """Reordonează conturile lui `altele` ca să corespundă celor din `referinta`.

    Comparația se face pe centroid, adus în cadrul propriu al literei: golul din
    „a" e la fel de sus și de la mijloc în orice font, chiar dacă litera are alte
    proporții.
    """
    def normalizat(contururi):
        toate = [p for c in contururi for p in c]
        xmin = min(p[0] for p in toate); xmax = max(p[0] for p in toate)
        ymin = min(p[1] for p in toate); ymax = max(p[1] for p in toate)
        lx = max(1e-6, xmax - xmin); ly = max(1e-6, ymax - ymin)
        return [((centroid(c)[0] - xmin) / lx, (centroid(c)[1] - ymin) / ly, abs(aria(c)) / (lx * ly))
                for c in contururi]

    ref = normalizat(referinta)
    alt = normalizat(altele)
    libere = list(range(len(altele)))
    ordine = []
    for r in ref:
        j = min(libere, key=lambda k: (r[0] - alt[k][0]) ** 2 + (r[1] - alt[k][1]) ** 2
                + 0.25 * (r[2] - alt[k][2]) ** 2)
        libere.remove(j)
        ordine.append(j)
    return [altele[j] for j in ordine]


def main():
    brute = []
    for spec in FONTURI:
        surse = deschide(spec["fisiere"])
        litere = []
        x = 0.0
        for ch in CUVANT:
            contururi, avans = litera(surse, ch)
            litere.append({"litera": ch, "contururi": contururi, "x": x})
            x += avans + TRACKING
        brute.append({**spec, "litere": litere, "latime": x})

    referinta = brute[0]
    for spec in brute[1:]:
        for i, gl in enumerate(spec["litere"]):
            ref = referinta["litere"][i]["contururi"]
            if len(gl["contururi"]) != len(ref):
                raise SystemExit(
                    f"„{gl['litera']}” are {len(gl['contururi'])} contururi în "
                    f"{spec['cheie']} față de {len(ref)} în implicit — "
                    "interpolarea ar sări dintr-o formă în alta"
                )
            asezate = potriveste(ref, gl["contururi"])
            gl["contururi"] = [roteste_la_potrivire(r, c) for r, c in zip(ref, asezate)]

    # Ieșirea ține POZIȚIA literei separat de FORMA ei. La rulare, forma se
    # metamorfozează cu decalaj de la o literă la alta (valul), dar așezarea pe
    # rând se face cu același ceas pentru toate — altfel o literă ajunsă la
    # lățimea fontului lat s-ar sui peste vecina rămasă în urmă.
    # y e deja întors pentru SVG: baseline = 0, sus = negativ.
    fonturi = []
    for spec in brute:
        litere = []
        for gl in spec["litere"]:
            contururi = [
                # „or 0.0" scapă de -0.0: în JS, -0 și 0 nu sunt egale strict,
                # iar testul de la capetele interpolării ar pica degeaba
                [round(v, 1) or 0.0 for p in c for v in (p[0], -p[1])]
                for c in gl["contururi"]
            ]
            litere.append({"x": round(gl["x"], 1), "contururi": contururi})
        fonturi.append({
            "cheie": spec["cheie"],
            "eticheta": spec["eticheta"],
            "latime": round(spec["latime"], 1),
            "litere": litere,
        })

    # câte contururi are fiecare literă — ca „I" să poată fi colorat separat
    pe_litere = [{"litera": gl["litera"], "contururi": len(gl["contururi"])}
                 for gl in referinta["litere"]]

    sus = max(-v for f in fonturi for l in f["litere"] for c in l["contururi"] for v in c[1::2])
    jos = min(-v for f in fonturi for l in f["litere"] for c in l["contururi"] for v in c[1::2])

    date = {
        "cuvant": CUVANT,
        "upem": UPEM_TINTA,
        "puncte": PUNCTE,
        "sus": round(sus, 1),
        "jos": round(jos, 1),
        "litere": pe_litere,
        "fonturi": fonturi,
    }
    iesire = RADACINA / "src/components/EduPasiHero/morfIncluziva.json"
    iesire.write_text(json.dumps(date, ensure_ascii=False, separators=(",", ":")))
    nr_contururi = sum(len(l["contururi"]) for l in fonturi[0]["litere"])
    print(f"{iesire.relative_to(RADACINA)}: {iesire.stat().st_size / 1024:.1f} KB, "
          f"{len(fonturi)} fonturi × {nr_contururi} contururi × {PUNCTE} puncte")
    for f in fonturi:
        print(f"  {f['cheie']:9} lățime {f['latime']:7.1f}")


if __name__ == "__main__":
    main()
