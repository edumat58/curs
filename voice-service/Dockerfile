# AI Voice Teacher — imagine pentru Synology (x86_64) sau orice gazdă Docker.
#
# Conține: Node (serviciul), Python + Piper (sinteza vocală), opus-tools
# (compresie). Modelul care înțelege lecția rulează la distanță (Groq), deci
# imaginea rămâne mică și merge pe un NAS obișnuit.
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PIPER_PYTHON=/opt/piper-venv/bin/python \
    PIPER_MODEL=/opt/piper-voices/ro_RO-raluca-high.onnx \
    NODE_ENV=production \
    PORT=8099

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-venv python3-pip \
        opus-tools ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Piper într-un mediu virtual propriu, ca să nu se amestece cu Python-ul sistemului.
RUN python3 -m venv /opt/piper-venv \
    && /opt/piper-venv/bin/pip install --no-cache-dir piper-tts

# Vocile feminine românești (CC-BY-NC — proiect educațional necomercial).
#
# Toate trei intră în imagine, ca schimbarea vocii să fie o variabilă de mediu,
# nu o reconstruire. Diferența nu e estetică: măsurat pe un NAS Synology
# (AMD R1600), vocea `high` cere ~2 secunde de calcul pentru fiecare secundă de
# audio, iar modelele `medium` — jumătate ca dimensiune — sunt de circa trei ori
# mai rapide. Pe un procesor slab, asta e diferența dintre trei minute și unul.
ARG VOICE_BASE=https://huggingface.co/eduardem/piper-tts-romanian/resolve/main/voices
RUN mkdir -p /opt/piper-voices && cd /opt/piper-voices \
    && for v in raluca/ro_RO-raluca-high lili/ro_RO-lili-medium sanda/ro_RO-sanda-medium; do \
         n="${v##*/}"; \
         curl -fsSL -o "$n.onnx"      "$VOICE_BASE/$v.onnx" \
         && curl -fsSL -o "$n.onnx.json" "$VOICE_BASE/$v.onnx.json"; \
       done \
    && ls -1 /opt/piper-voices

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src ./src

# Rulăm ca utilizator neprivilegiat: serviciul nu are nevoie de root.
# Imaginea `node` are deja utilizatorul `node` (uid 1000); îl refolosim în loc
# să creăm altul (imaginea conține deja un grup numit `voice`, care ar da conflict).
RUN chown -R node:node /app
USER node

EXPOSE 8099

HEALTHCHECK --interval=60s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8099/health || exit 1

CMD ["node", "src/server.mjs"]
