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
                 desenele SVG intră aici ca geometrie citită din markup —
                 puncte, segmente, egalități, unghiuri drepte — nu ca markup
              2. NARAȚIUNE   (LLM, text de rostit, listă de acoperire punct cu punct)
              3. FidelityGuard → valori inexistente în sursă SAU formulări
                 despre material („figura arată", „nu explică în detaliu")
                 → cere rescrierea
              4. Stratul de rostire → text pe care espeak-ng chiar îl poate citi
              5. Piper TTS, un singur apel, cu pauze între propoziții
              6. Opus 28 kbps → GridFS; metadate → MongoDB
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

## Cele două straturi care țin explicația onestă

**FidelityGuard** (`fidelity.mjs`) verifică programatic ce a ieșit din model.
Prinde două lucruri, și amândouă cer rescrierea:

- **valori care nu există în material** — un exemplu numeric inventat;
- **vorbitul despre lecție în loc de predarea ei** — „figura arată…",
  „formula din material…", „am parcurs…", și mai ales evaluarea materialului:
  „imaginea de mai jos nu este foarte bine făcută" nu are ce căuta într-o
  explicație pentru un elev.

Tiparele sunt scrise cu `\p{L}`, nu cu `\b`: în JavaScript `\b` cunoaște doar
literele ASCII, deci „închei" nu are graniță de cuvânt la început. Distincția
între termen de manual și referire la suport se păstrează — „figură geometrică"
trece, „figura de mai jos" nu.

**Stratul de rostire** (`speakable.mjs`) e ultimul dinaintea sintezei. Piper nu
citește litere, ci foneme produse de espeak-ng; ce espeak nu recunoaște e tăiat
în tăcere, citit în engleză sau rupt în bucăți. Cazul care a pornit fișierul:
modelul scrie separatorul de mii cu **spațiu îngust** (U+202F), iar espeak
citea atunci `1 000` ca „unu zero zero zero" în loc de „o mie". Fiecare regulă
de acolo are în comentariu măsurătoarea care o justifică.

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
| `VOICE_PUBLIC_URL` | URL-ul public, folosit în `audioUrl`. **Obligatoriu în spatele unui reverse proxy** |
| `VOICE_MAX_REPAIRS` | câte rescrieri la încălcarea fidelității (implicit 2) |

`VOICE_PUBLIC_URL` nu e opțional când în față stă un proxy. Fără el, `audioUrl`
se construiește din antetul `Host` primit, iar DSM îl rescrie către destinație:
clientul ar primi o adresă de tailnet, pe `http`, pe care browserul nici nu o
poate deschide, nici nu ar accepta-o dintr-o pagină `https`.

## Legarea în site

În `docusaurus.config.js`, la `scripts`, sau într-un client module:

```js
window.EDUPASI_VOICE_API = 'https://voce.exemplu.ro';
```

Fără această setare, clientul folosește `http://localhost:8099` în dezvoltare.

## Instalare pe PC, cu adresa publică păstrată

Sinteza e singura parte care rulează local și e legată direct de procesor.
Pe NAS ea durează **mai mult decât audio-ul rezultat**, deci fiecare explicație
nouă costă dublu cât ține. Pe un PC obișnuit merge de câteva ori mai repede
decât timpul real. Mutăm doar serviciul; Groq, MongoDB, site-ul și adresa
publică rămân neatinse.

```
elev → https://voce.asbrihome.synology.me   (cert valid, reverse proxy DSM)
            │
            └── Tailscale ──→ PC:8099  (Docker: Node + Piper + opus-tools)
```

### Pe o gazdă Linux sau macOS

`docker compose up -d --build`, și gata. Fișierul `docker-compose.yml` fixează
`VOICE_PUBLIC_URL` și repornirea automată.

### Pe Windows Server: nativ, fără Docker

**Docker nu e o opțiune aici**, și merită spus de ce, ca să nu se piardă o oră
căutând comutatorul: pe Windows Server, Docker rulează containere Windows
(`docker info` → `OSType=windows`), iar imaginea noastră pornește de la
`node:22-bookworm-slim`, care e Linux. Containerele Linux ar cere Docker Desktop
(nesuportat pe Server) sau WSL2 cu o distribuție instalată. Instalarea nativă
are, oricum, mai puțini pași.

De care avem nevoie: **Node 20+**, **Python 3.12**, `piper-tts` din pip, vocile,
și `ffmpeg` sau `opusenc` pentru compresie. Totul se poate pune pe alt disc
decât `C:`, iar în cazul de față chiar trebuie.

```powershell
D:\Python312\python.exe -m venv D:\edupasi\.voice-venv
D:\edupasi\.voice-venv\Scripts\python.exe -m pip install piper-tts
```

Vocile se descarcă de la aceleași adrese ca în `Dockerfile`, în
`D:\edupasi\.voice-models`. În `.env`, căile se scriu cu **bară oblică
normală** (`D:/edupasi/...`) — Node le acceptă pe Windows, iar backslash-ul e o
sursă inepuizabilă de scăpări de tip escape la orice pas care trece printr-un
shell.

Serviciul se înregistrează ca **sarcină planificată**, nu se pornește de mână:
un proces lansat dintr-o sesiune SSH sau RDP moare odată cu sesiunea.

```powershell
$act = New-ScheduledTaskAction -Execute 'C:\Program Files\nodejs\node.exe' -Argument '--env-file=.env src/server.mjs' -WorkingDirectory 'D:\edupasi\voice-service'
$prn = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName 'EduPASI Voce' -Action $act -Trigger (New-ScheduledTaskTrigger -AtStartup) -Principal $prn
```

Rulează ca `SYSTEM` intenționat: pornește la boot fără ca cineva să fie logat și
fără să ceară o parolă de cont.

Portul se deschide o singură dată, din PowerShell ca administrator:

```powershell
New-NetFirewallRule -DisplayName 'EduPASI voce' -Direction Inbound -LocalPort 8099 -Protocol TCP -Action Allow
```

### Comutarea adresei publice

În DSM → Panou de control → Portal de conectare → Avansat → Proxy invers, la
intrarea `voce.asbrihome.synology.me` se schimbă destinația din `localhost:8099`
în adresa de tailnet a PC-ului, portul 8099. Site-ul nu se atinge: adresa
publică și certificatul rămân aceleași.

Ce oprește serviciul fără să pară o defecțiune: PC-ul care intră în somn. Merită
dezactivat din setările de alimentare.

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

Pe NAS (Synology DS923+, AMD R1600):

| | |
|---|---|
| Secțiune mare (1670 caractere) — generare completă | **176 s**, pentru 118 s de audio |
| Secțiune mică (125 caractere) | ~60 s |
| Click-uri următoare (cache) | **113 ms** |
| Sinteză vocală (`raluca-high`) | ~1,2 s de calcul pentru 1 s de audio |
| Audio (Opus 28 kbps) | ~3,5 KB/secundă |
| Limită Groq gratuit | 8 000 tokeni/minut (respectată automat prin `retry-after`) |

Aceeași sinteză, același text, pe un procesor de PC (MacBook Pro M4 Pro,
14 nuclee): **30,6 s de audio în 3,9 s** — 0,13 s de calcul pentru 1 s de audio,
adică de nouă ori mai repede decât pe NAS. Consumul a fost de 23 s de CPU în
3,9 s de ceas, deci câștigul vine din numărul de nuclee, nu din frecvență.

Sinteza domină timpul, iar vocea `high` e cea mai lentă. Vocile `medium`
disponibile în același depozit (`ro_RO-lili-medium`, `ro_RO-sanda-medium`) sunt
de ~3 ori mai rapide la o calitate ceva mai joasă; se schimbă din `PIPER_MODEL`,
fără cod nou. Prima generare a unei secțiuni e singura care așteaptă — după ea,
oricine deschide lecția primește audio instant.

## Teste

```bash
node --test voice-service/src/pipeline/*.test.mjs
```

Verifică stratul de rostire și garda de fidelitate. Cazurile nu sunt inventate:
citatele din teste sunt luate din explicații generate real, iar fiecare regulă
de rostire a fost întâi măsurată direct pe espeak-ng cu vocea românească.

## Licențe

Vocile românești Piper (Raluca/Lili/Sanda) sunt **CC-BY-NC 4.0**, deci pot fi
folosite doar în context **necomercial**, cu atribuire. Dacă platforma devine
comercială, vocea trebuie schimbată — se face din `PIPER_MODEL`, fără cod nou.
