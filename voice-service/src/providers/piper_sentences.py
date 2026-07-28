"""Sinteză Piper cu granițele propozițiilor păstrate și ritmul verificat.

Linia de comandă `python -m piper` lipește toate propozițiile într-un singur WAV
și aruncă informația despre unde începe și unde se termină fiecare. Piper le
sintetizează oricum separat — modelul produce un fragment audio per propoziție —
deci granițele există, doar că nu ies afară. Aici le scoatem.

Fără ele nu se poate face evidențierea sincronizată: ar trebui ghicit ce se
rostește la secunda 37, iar o estimare din numărul de caractere se dezaliniază
după câteva fraze, exact cât să fie enervant.

RITMUL SE VERIFICĂ DUPĂ SINTEZĂ, nu se presupune înainte. Vezi `sintetizeazaCuRitm`.

Se încarcă modelul o singură dată, ca la varianta pe linie de comandă: pe un
procesor obișnuit încărcarea costă ~2 secunde, iar per propoziție ar fi fost
insuportabil.

Utilizare:
    python piper_sentences.py MODEL IESIRE.wav [--length-scale 1.0]
                              [--sentence-silence 0.4]
Textul vine pe stdin (UTF-8). La stdout iese JSON:
    {"sampleRate": 22050, "sentences": [{"start": 0.0, "end": 2.31}],
     "rapide": 0}
"""

import argparse
import json
import re
import sys
import wave

from piper import PiperVoice, SynthesisConfig

# Sub câte milisecunde pe fonem considerăm că modelul nu mai articulează.
#
# Măsurat pe lecția C3 cu vocea ro_RO-raluca-high, ritmul propozițiilor sănătoase
# stă între 44 și 69 ms pe fonem. Cele stricate ies la 25-29 — de două ori mai
# repede decât poate articula vocea. Fonemele sunt CORECTE în ambele cazuri:
# modelul nu greșește ce are de spus, ci îndeasă tot într-un timp prea scurt, și
# atunci se aud silabe mâncate și bolboroseală.
#
# Ce declanșează asta, izolat prin măsurare:
#
#     25,3 ms/fon  „…pentru 10, 100, 1000 și pentru 0,1, 0,01, 0,001."   rupt
#     61,9 ms/fon  aceeași frază cu numerele scrise în cuvinte           bun
#     55,3 ms/fon  „Numerele 10, 100 și 1000 sunt puteri ale lui zece."  bun
#     50,7 ms/fon  „Avem 37540,85 aici."                                 bun
#
# Deci un ȘIR LUNG de numere rupe modelul, unul scurt nu — iar lungimea în sine
# nu e criteriul: bucăți de 108 foneme ies rupte, iar altele de 117 sunt bune.
# De aceea nu ghicim care texte îl rup. Sintetizăm, măsurăm, și retăiem ce a
# ieșit prea repede. Pragul e la jumătatea distanței dintre cele două grupuri.
PRAG_MS_PE_FONEM = 38

# Câte retăieri încercăm până renunțăm. Fiecare înjumătățește bucata; patru
# niveluri iau o frază de 400 de foneme sub 25, adică sub orice prag rezonabil.
RETAIERI_MAXIME = 4

# Unde se taie, în ordinea preferinței. Punctul și virgula despart idei; virgula
# doar respiră. Tăiem întâi unde se aude oricum o pauză.
SEMNE_DE_TAIERE = [';', ':', ',']

# Cât de mult se tace între bucățile ACELEIAȘI propoziții.
#
# Nu cât între propoziții: tăietura e a noastră, nu a autorului, iar o pauză de
# propoziție acolo ar transforma o frază lungă în telegrame. Atât cât se aude
# firesc la o virgulă.
PAUZA_INTRE_BUCATI = 0.09


def taieLaMijloc(text):
    """Împarte textul în două, la semnul de punctuație cel mai apropiat de mijloc.

    Mijlocul, nu prima potrivire: două jumătăți apropiate ca mărime au amândouă
    șanse să iasă bine, pe când o tăietură la margine lasă o bucată aproape la
    fel de lungă și mai cere încă o trecere degeaba.
    """
    mijloc = len(text) // 2
    for semn in SEMNE_DE_TAIERE:
        pozitii = [
            m.start() for m in re.finditer(re.escape(semn), text)
            if 0.15 * len(text) < m.start() < 0.85 * len(text)
        ]
        if pozitii:
            t = min(pozitii, key=lambda p: abs(p - mijloc))
            stanga, dreapta = text[: t + 1].strip(), text[t + 1 :].strip()
            if stanga and dreapta:
                return stanga, dreapta

    # Fără punctuație utilă: tăiem la spațiul cel mai apropiat de mijloc. Mai
    # bine o pauză nefirească decât o frază bolborosită.
    spatii = [
        m.start() for m in re.finditer(r' ', text)
        if 0.15 * len(text) < m.start() < 0.85 * len(text)
    ]
    if not spatii:
        return None
    t = min(spatii, key=lambda p: abs(p - mijloc))
    stanga, dreapta = text[:t].strip(), text[t:].strip()
    return (stanga, dreapta) if stanga and dreapta else None


def sintetizeazaCuRitm(voice, config, rate, text, adancime=0):
    """Sintetizează textul și retaie ce a ieșit rostit prea repede.

    @returns (pcm: bytearray, rapide: int) — `rapide` numără bucățile care au
    rămas sub prag chiar și după toate retăierile, ca serviciul să știe că acea
    explicație merită reascultată.
    """
    foneme = sum(len(f) for f in voice.phonemize(text))
    pcm = bytearray()
    for chunk in voice.synthesize(text, config):
        pcm.extend(chunk.audio_int16_bytes)

    durata = len(pcm) / 2 / rate
    ritm = durata * 1000 / max(1, foneme)
    if ritm >= PRAG_MS_PE_FONEM or adancime >= RETAIERI_MAXIME:
        return pcm, (0 if ritm >= PRAG_MS_PE_FONEM else 1)

    bucati = taieLaMijloc(text)
    if not bucati:
        return pcm, 1

    stanga, rapideS = sintetizeazaCuRitm(voice, config, rate, bucati[0], adancime + 1)
    dreapta, rapideD = sintetizeazaCuRitm(voice, config, rate, bucati[1], adancime + 1)
    intreg = bytearray(stanga)
    intreg.extend(bytes(int(rate * PAUZA_INTRE_BUCATI * 2)))
    intreg.extend(dreapta)
    return intreg, rapideS + rapideD


def imparteInPropozitii(text):
    """Propozițiile, așa cum le vede și Piper: la punct, semn de întrebare sau exclamare."""
    return [p for p in re.split(r'(?<=[.!?])\s+', text.strip()) if p.strip()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("model")
    parser.add_argument("output")
    parser.add_argument("--length-scale", type=float, default=1.0)
    parser.add_argument("--sentence-silence", type=float, default=0.4)
    args = parser.parse_args()

    # stdin explicit ca UTF-8: pe Windows codificarea implicită e cea locală, iar
    # „și" ar ajunge la sinteză ca „È™" — adică ™, rostit „marcă comercială".
    text = sys.stdin.buffer.read().decode("utf-8").strip()
    if not text:
        print(json.dumps({"error": "text gol"}))
        return 1

    voice = PiperVoice.load(args.model)
    config = SynthesisConfig(length_scale=args.length_scale)
    rate = voice.config.sample_rate
    tacere = bytes(int(rate * args.sentence_silence * 2))

    sentences = []
    pcm = bytearray()
    rapide = 0

    for index, propozitie in enumerate(imparteInPropozitii(text)):
        if index > 0:
            pcm.extend(tacere)
        start = len(pcm) / 2 / rate
        # Granițele raportate rămân ale PROPOZIȚIEI, nu ale bucăților: retăierea
        # e o măsură tehnică de sinteză, iar evidențierea din pagină urmărește
        # fraza pe care o vede elevul.
        bucata, rapideAici = sintetizeazaCuRitm(voice, config, rate, propozitie)
        pcm.extend(bucata)
        rapide += rapideAici
        sentences.append({"start": round(start, 3), "end": round(len(pcm) / 2 / rate, 3)})

    with wave.open(args.output, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(bytes(pcm))

    json.dump({"sampleRate": rate, "sentences": sentences, "rapide": rapide}, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
