"""Sinteză Piper cu granițele propozițiilor păstrate.

Linia de comandă `python -m piper` lipește toate propozițiile într-un singur WAV
și aruncă informația despre unde începe și unde se termină fiecare. Piper le
sintetizează oricum separat — modelul produce un fragment audio per propoziție —
deci granițele există, doar că nu ies afară. Aici le scoatem.

Fără ele nu se poate face evidențierea sincronizată: ar trebui ghicit ce se
rostește la secunda 37, iar o estimare din numărul de caractere se dezaliniază
după câteva fraze, exact cât să fie enervant.

Se încarcă modelul o singură dată, ca la varianta pe linie de comandă: pe un
procesor obișnuit încărcarea costă ~2 secunde, iar per propoziție ar fi fost
insuportabil.

Utilizare:
    python piper_sentences.py MODEL IESIRE.wav [--length-scale 1.0]
                              [--sentence-silence 0.4]
Textul vine pe stdin (UTF-8). La stdout iese JSON:
    {"sampleRate": 22050, "sentences": [{"text": "...", "start": 0.0, "end": 2.31}]}
"""

import argparse
import json
import sys
import wave

from piper import PiperVoice, SynthesisConfig


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
    silence = bytes(int(rate * args.sentence_silence * 2))

    sentences = []
    pcm = bytearray()
    for index, chunk in enumerate(voice.synthesize(text, config)):
        if index > 0:
            pcm.extend(silence)
        start = len(pcm) / 2 / rate
        pcm.extend(chunk.audio_int16_bytes)
        sentences.append(
            {
                # Piper nu întoarce textul propoziției, doar fonemele ei. Textul
                # îl reface serviciul, împărțind la aceleași semne de punctuație;
                # aici trimitem doar timpii, care sunt adevărul măsurat.
                "start": round(start, 3),
                "end": round(len(pcm) / 2 / rate, 3),
            }
        )

    with wave.open(args.output, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(bytes(pcm))

    json.dump({"sampleRate": rate, "sentences": sentences}, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
