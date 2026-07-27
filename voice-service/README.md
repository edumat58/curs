# EduPAȘI — AI Voice Teacher (serviciul de voce)

Explicații pedagogice generate de AI și rostite cu voce feminină românească,
pentru fiecare secțiune de lecție. Generare o singură dată, cache permanent.

## Cum funcționează

```
Elevul dă click pe 🔊 lângă un heading
        │
        ▼
Clientul (browser) extrage secțiunea din DOM-ul RANDAT  ← aici KaTeX e desenat
  text + formule (sursa TeX) + SVG-uri + context
        │  calculează SHA-256 canonic
        ▼
POST /voice/section  { sectionHash, section }
        │
        ├── hash găsit în MongoDB → 200, răspuns în ~100 ms
        │
        └── lipsă → 202 „pending", iar generarea pornește pe server:
              1. ÎNȚELEGERE  (LLM, JSON structurat, evidence cu surse din enum,
                              inventar explicit al exemplelor din material)
              2. NARAȚIUNE   (LLM, text de rostit, listă de acoperire punct cu punct)
              3. FidelityGuard → dacă apar valori inexistente în sursă, cere rescrierea
              4. Piper TTS, un singur apel, cu pauze între propoziții
              5. Opus 28 kbps → GridFS; metadate → MongoDB
        │
        ▼
GET /voice/section/:hash   202 cât timp lucrează, 200 când e gata
        ▼
GET /voice/audio/:hash     (suportă Range → derulare)
```

Generarea nu așteaptă pe conexiune. O secțiune mare se explică integral în
câteva minute, iar reverse proxy-ul din față închide conexiunile la 180 de
secunde — răspunsul imediat cu 202 și interogarea periodică scot complet
limita de timp a rețelei din ecuație.

De ce extrage clientul și nu serverul: în HTML-ul static **nu există KaTeX**
(se randează în browser). Doar clientul vede lecția așa cum o vede elevul, deci
doar el poate produce un hash care corespunde conținutului real.

## Instalare locală

```bash
cd voice-service
npm install
cp .env.example .env      # completează cheile
npm start                 # :8099
curl localhost:8099/health
```

Piper (o singură dată, în rădăcina repo-ului):

```bash
python3.13 -m venv .voice-venv
./.voice-venv/bin/pip install piper-tts
mkdir -p .voice-models && cd .voice-models
curl -LO https://huggingface.co/eduardem/piper-tts-romanian/resolve/main/voices/raluca/ro_RO-raluca-high.onnx
curl -LO https://huggingface.co/eduardem/piper-tts-romanian/resolve/main/voices/raluca/ro_RO-raluca-high.onnx.json
brew install opus-tools   # compresie audio (fără el, se servește WAV)
```

## Variabile de mediu

| Variabilă | Rol |
|---|---|
| `GROQ_API_KEY` | cheia gratuită de la console.groq.com |
| `VOICE_LLM_PROVIDER` | `groq` (implicit) sau `ollama` |
| `VOICE_LLM_MODEL` | implicit `openai/gpt-oss-120b` |
| `MONGODB_URI_EDUCONNECT` | conexiunea MongoDB |
| `VOICE_DB_NAME` | baza de date (implicit `edupasi`) |
| `PIPER_PYTHON` / `PIPER_MODEL` | calea către venv și vocea `.onnx` |
| `PIPER_LENGTH_SCALE` | 1.0 normal; >1 mai rar, <1 mai rapid |
| `VOICE_ALLOWED_ORIGINS` | listă separată prin virgulă; gol = permite tot |
| `VOICE_PUBLIC_URL` | URL-ul public, folosit în `audioUrl` |
| `VOICE_MAX_REPAIRS` | câte rescrieri la încălcarea fidelității (implicit 2) |

## Legarea în site

În `docusaurus.config.js`, la `scripts`, sau într-un client module:

```js
window.EDUPASI_VOICE_API = 'https://voce.exemplu.ro';
```

Fără această setare, clientul folosește `http://localhost:8099` în dezvoltare.

## Instalare pe Oracle Cloud Always Free (24/7, gratuit)

Tierul gratuit a fost redus pe 15 iunie 2026 la **2 OCPU / 12 GB** — suficient,
pentru că LLM-ul rulează la Groq, iar local rămâne doar Piper (CPU, ~100 MB).

1. Creează o instanță **Ampere A1 (ARM)**, Ubuntu 24.04, forma `VM.Standard.A1.Flex`
   cu 2 OCPU / 12 GB (limita Always Free).
2. Deschide portul: în Security List adaugă `443` (și `80` pentru certificat).
3. Pe instanță:

```bash
sudo apt update && sudo apt install -y nodejs npm python3-venv opus-tools caddy
git clone https://github.com/edumat58/curs.git && cd curs
python3 -m venv .voice-venv && ./.voice-venv/bin/pip install piper-tts
mkdir -p .voice-models && cd .voice-models && \
  curl -LO https://huggingface.co/eduardem/piper-tts-romanian/resolve/main/voices/raluca/ro_RO-raluca-high.onnx && \
  curl -LO https://huggingface.co/eduardem/piper-tts-romanian/resolve/main/voices/raluca/ro_RO-raluca-high.onnx.json
cd ../voice-service && npm install --omit=dev && cp .env.example .env && nano .env
```

4. HTTPS automat, cu Caddy (`/etc/caddy/Caddyfile`):

```
voce.exemplu.ro {
    reverse_proxy localhost:8099
}
```

5. Serviciu systemd, ca să pornească la boot și să se repornească singur:

```ini
# /etc/systemd/system/edupasi-voice.service
[Unit]
Description=EduPASI AI Voice Teacher
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/curs/voice-service
ExecStart=/usr/bin/node --env-file=.env src/server.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now edupasi-voice && systemctl status edupasi-voice
```

## Cifre măsurate

Pe NAS (Synology DS923+, AMD R1600), unde rulează în producție:

| | |
|---|---|
| Secțiune mare (1670 caractere) — generare completă | **176 s**, pentru 118 s de audio |
| Secțiune mică (125 caractere) | ~60 s |
| Click-uri următoare (cache) | **113 ms** |
| Sinteză vocală (`raluca-high`) | ~1,2 s de calcul pentru 1 s de audio |
| Audio (Opus 28 kbps) | ~3,5 KB/secundă |
| Limită Groq gratuit | 8 000 tokeni/minut (respectată automat prin `retry-after`) |

Sinteza domină timpul, iar vocea `high` e cea mai lentă. Vocile `medium`
disponibile în același depozit (`ro_RO-lili-medium`, `ro_RO-sanda-medium`) sunt
de ~3 ori mai rapide la o calitate ceva mai joasă; se schimbă din `PIPER_MODEL`,
fără cod nou. Prima generare a unei secțiuni e singura care așteaptă — după ea,
oricine deschide lecția primește audio instant.

## Licențe

Vocile românești Piper (Raluca/Lili/Sanda) sunt **CC-BY-NC 4.0**, deci pot fi
folosite doar în context **necomercial**, cu atribuire. Dacă platforma devine
comercială, vocea trebuie schimbată — se face din `PIPER_MODEL`, fără cod nou.
