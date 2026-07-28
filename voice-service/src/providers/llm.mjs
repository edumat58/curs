/**
 * Stratul de furnizor LLM — singurul loc care știe CU CINE vorbim.
 *
 * Restul sistemului cere `chat(messages, {json})` și primește text. Schimbarea
 * furnizorului (Groq → alt serviciu → model local) se face prin variabile de
 * mediu, fără să se atingă pipeline-ul, prompturile sau interfața.
 */

const DEFAULTS = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b' },
  ollama: { baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen3:30b-instruct' },
};

class LlmError extends Error {
  constructor(message, { status, provider, retryable = false } = {}) {
    super(message);
    this.name = 'LlmError';
    this.status = status;
    this.provider = provider;
    this.retryable = retryable;
  }
}

/**
 * Ambii furnizori vorbesc dialectul OpenAI /chat/completions, deci avem un
 * singur client. Diferă doar baza URL, cheia și modelul implicit.
 */
/**
 * Cât are sens să așteptăm în interiorul unei cereri.
 *
 * Limita pe tokeni/MINUT se trece așteptând: fereastra e glisantă și trece
 * repede. Limita pe ZI nu — furnizorul cere „try again in 30m", iar un elev
 * care a apăsat un buton nu poate fi ținut o jumătate de oră. Peste pragul
 * ăsta nu mai așteptăm, ci schimbăm modelul.
 */
const ASTEPTARE_MAXIMA_MS = 45000;
const LIMITA_PE_ZI = /per day|\bTPD\b|\bRPD\b/i;

/**
 * Modelele cu raționament (gpt-oss) consumă bugetul în câmpul `reasoning` și
 * pot întoarce content gol în modul JSON strict. Le ținem raționamentul scurt:
 * aici avem nevoie de extragere fidelă, nu de deliberare lungă.
 */
const CU_RATIONAMENT = /gpt-oss|thinking|reasoner|\bo\d\b/i;

/**
 * Schimbă modelul din cerere ÎMPREUNĂ cu câmpurile care depind de el.
 *
 * Nu e o comoditate, e o corecție. `reasoning_effort` se punea o singură dată,
 * după modelul inițial, iar trecerea pe rezervă schimba doar `model`. Așa,
 * fiecare lecție întreagă murea: cererea mare lua 413 de la gpt-oss-120b,
 * trecea pe llama-3.3-70b-versatile — care refuză `reasoning_effort` — și
 * primea 400, o eroare pe care nu o reîncercăm. Elevul vedea „generarea a
 * eșuat" după nouă secunde, fără ca vreun buget să fi fost depășit cu adevărat.
 */
function aplicaModel(body, model) {
  body.model = model;
  if (CU_RATIONAMENT.test(model)) body.reasoning_effort = 'low';
  else delete body.reasoning_effort;
}

function createOpenAiCompatible({ name, baseUrl, apiKey, models, timeoutMs, maxRetries }) {
  const lista = models.filter(Boolean);
  /**
   * Retrogradarea de durată — și DOAR pentru bugetul zilnic.
   *
   * Ce era înainte: orice 429 cu o așteptare lungă muta clientul pe modelul de
   * rezervă, definitiv, pentru tot procesul. Iar 429-urile lungi vin mai ales
   * de la limita pe MINUT, care se golește singură în câteva zeci de secunde.
   * Consecința, măsurată: prima rescriere a primei lecții epuiza fereastra pe
   * minut, serviciul trecea pe llama-3.3-70b-versatile și rămânea acolo până la
   * repornire. Toate explicațiile de după ieșeau de la un model mai slab —
   * scurte, cu fraze despre „formula care arată astfel". Nimeni nu vedea de ce.
   *
   * Acum retrogradarea are termen: `blocatPanaLa` vine din ce spune chiar
   * furnizorul („try again in 30m"), iar după el se încearcă din nou modelul
   * bun. Limita pe minut nu mai retrogradează pe termen lung — se rezolvă în
   * interiorul cererii, așteptând sau cerând o singură dată de la rezervă.
   */
  let index = 0;
  let blocatPanaLa = 0;

  /** Ceasul e injectabil ca testele să nu aștepte o jumătate de oră. */
  const acum = () => Date.now();

  function modelCurent() {
    if (index > 0 && blocatPanaLa && acum() > blocatPanaLa) {
      console.warn(`[voice] revin pe ${lista[0]}: fereastra de buget s-a golit`);
      index = 0;
      blocatPanaLa = 0;
    }
    return lista[index];
  }

  return {
    name,
    get model() { return modelCurent(); },
    async chat(messages, { json = false, temperature, maxTokens } = {}) {
      // Poziția din listă folosită de CEREREA asta. Poate coborî temporar sub
      // cea a clientului (limită pe minut, cerere prea mare) fără să condamne
      // și cererile următoare la modelul slab.
      let local = lista.indexOf(modelCurent());
      const body = {
        model: lista[local],
        messages,
        temperature: temperature ?? (json ? 0.1 : 0.6),
        stream: false,
      };
      if (json) body.response_format = { type: 'json_object' };
      if (maxTokens) body.max_tokens = maxTokens;
      aplicaModel(body, lista[local]);

      // Unele modele nu respectă `response_format` (json_validate_failed) sau
      // întorc gol. Atunci reîncercăm fără el: promptul cere oricum JSON, iar
      // parserul nostru e tolerant.
      let relaxJson = false;

      let lastError;
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        if (relaxJson) delete body.response_format;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!res.ok) {
            const text = await res.text();
            if (/json_validate_failed/.test(text) && body.response_format) {
              relaxJson = true;
              throw new LlmError(`${name}: JSON strict refuzat, reîncerc relaxat`, {
                status: res.status, provider: name, retryable: true,
              });
            }
            // 429 = rate limit, 5xx = indisponibilitate temporară → merită reîncercare
            const retryable = res.status === 429 || res.status >= 500;
            // Furnizorul ne spune exact cât să așteptăm; backoff-ul generic e
            // prea scurt pentru limite pe tokeni/minut (observat: „try again in 13.77s").
            const headerWait = Number(res.headers.get('retry-after')) * 1000;
            const bodyWait = /try again in ([\d.]+)s/i.exec(text);
            const err = new LlmError(`${name} ${res.status}: ${text.slice(0, 300)}`, {
              status: res.status,
              provider: name,
              retryable,
            });
            // +1,5 s peste ce cere furnizorul: fereastra de tokeni pe minut e
            // glisantă, iar la o cerere mare „exact cât a spus" o prinde încă
            // plină și primim al doilea 429 degeaba.
            err.retryAfterMs = Number.isFinite(headerWait) && headerWait > 0
              ? headerWait + 1500
              : bodyWait ? Math.ceil(parseFloat(bodyWait[1]) * 1000) + 1500 : 0;
            /**
             * Doar limita pe ZI retrogradează clientul. Un 429 pe minut cu
             * așteptare lungă rămâne o problemă a cererii curente: se rezolvă
             * cerând de la rezervă acum, nu condamnând orele următoare la un
             * model mai slab. Distincția o face textul furnizorului, nu durata.
             */
            err.epuizatPeZi = res.status === 429 && LIMITA_PE_ZI.test(text);
            err.asteptarePreaLunga = res.status === 429
              && err.retryAfterMs > ASTEPTARE_MAXIMA_MS;
            /**
             * 413 nu e o limită de ritm, e o limită de MĂRIME.
             *
             * „Request too large … tokens per minute: Limit 8000" înseamnă că
             * promptul plus `max_tokens` rezervat depășesc fereastra — și vor
             * depăși-o la fel și peste un minut. A aștepta e inutil: singurele
             * ieșiri sunt să cerem mai puțin sau să întrebăm alt model. O
             * lecție întreagă lovea exact aici, iar elevul rămânea cu bara
             * oprită la prima etapă.
             */
            err.preaMare = res.status === 413 || /request too large/i.test(text);
            throw err;
          }

          const data = await res.json();
          const choice = data?.choices?.[0] || {};
          const message = choice.message || {};
          const content = message.content;
          if (typeof content !== 'string' || !content.trim()) {
            if (body.response_format) relaxJson = true;
            throw new LlmError(`${name}: răspuns gol`, { provider: name, retryable: true });
          }
          return {
            content,
            // `length` înseamnă că modelul a fost oprit de plafonul de tokeni,
            // nu că a terminat ce avea de spus. Fără acest semnal, trunchierea
            // ajunge nedetectată în audio, ca frază tăiată la mijloc.
            finishReason: choice.finish_reason || null,
            usage: data.usage || null,
            model: data.model || lista[local],
          };
        } catch (err) {
          lastError = err;

          /**
           * Cererea nu încape: o înjumătățim o dată, apoi trecem la alt model.
           * Jumătate din buget e tot o explicație bună; niciuna nu e nimic.
           */
          if (err.preaMare && body.max_tokens && body.max_tokens > 900) {
            body.max_tokens = Math.floor(body.max_tokens / 2);
            console.warn(`[voice] cerere prea mare, reduc la ${body.max_tokens} tokeni`);
            attempt -= 1;
            continue;
          }

          /**
           * Bugetul ZILNIC s-a terminat: retrogradăm clientul, cu termen.
           *
           * Modelele au bugete zilnice separate, deci al doilea chiar are ce
           * oferi. Explicația iese ceva mai simplă decât cu modelul principal,
           * dar o explicație bună azi bate una perfectă mâine. Termenul îl dă
           * furnizorul; până atunci nu mai plătim un 429 la fiecare cerere.
           */
          if (err.epuizatPeZi && index < lista.length - 1) {
            index += 1;
            blocatPanaLa = acum() + Math.min(err.retryAfterMs || 1800000, 86400000);
            local = index;
            aplicaModel(body, lista[local]);
            console.warn(`[voice] buget zilnic epuizat, trec pe ${lista[local]} — ${err.message.slice(0, 200)}`);
            attempt -= 1;
            continue;
          }

          /**
           * Limită pe minut cu așteptare lungă, sau cerere care nu încape nici
           * înjumătățită: întrebăm rezerva DOAR pentru cererea asta. Clientul
           * rămâne pe modelul bun, pentru că fereastra pe minut se golește
           * singură până la următorul elev.
           */
          if ((err.asteptarePreaLunga || err.preaMare) && local < lista.length - 1) {
            local += 1;
            aplicaModel(body, lista[local]);
            console.warn(`[voice] fereastră plină, cer de la ${lista[local]} doar acum — ${err.message.slice(0, 200)}`);
            attempt -= 1;
            continue;
          }

          const retryable = err.retryable || err.name === 'AbortError';
          if (!retryable || attempt === maxRetries) break;
          // Dacă furnizorul a spus cât să așteptăm, îl ascultăm; altfel backoff
          // exponențial cu jitter, ca să nu lovim în val limita de rată.
          const wait = err.retryAfterMs
            || Math.min(8000, 400 * 2 ** attempt) + Math.floor(Math.random() * 250);
          await new Promise((r) => setTimeout(r, Math.min(wait, 30000)));
        } finally {
          clearTimeout(timer);
        }
      }
      throw lastError;
    },
  };
}

/**
 * Construiește furnizorul din configurație.
 * env: VOICE_LLM_PROVIDER, VOICE_LLM_MODEL, GROQ_API_KEY, VOICE_LLM_TIMEOUT_MS
 */
export function createLlm(env = process.env) {
  const provider = (env.VOICE_LLM_PROVIDER || 'groq').toLowerCase();
  const preset = DEFAULTS[provider];
  if (!preset) throw new Error(`Furnizor LLM necunoscut: ${provider}`);

  const apiKey = provider === 'groq' ? env.GROQ_API_KEY : env.VOICE_LLM_API_KEY;
  if (provider === 'groq' && !apiKey) {
    throw new Error('Lipsește GROQ_API_KEY. Pune-l în voice-service/.env');
  }

  /**
   * Modelele de rezervă au bugete zilnice separate la același furnizor. Fără
   * ele, tierul gratuit al Groq (200 000 de tokeni pe zi pe model) oprea complet
   * generarea la câteva zeci de explicații, iar elevul primea o eroare pe care
   * nu avea cum să o rezolve.
   */
  const fallbacks = String(
    env.VOICE_LLM_FALLBACKS ?? 'llama-3.3-70b-versatile,openai/gpt-oss-20b'
  ).split(',').map((s) => s.trim()).filter(Boolean);

  const principal = env.VOICE_LLM_MODEL || preset.model;

  return createOpenAiCompatible({
    name: provider,
    baseUrl: env.VOICE_LLM_BASE_URL || preset.baseUrl,
    apiKey,
    models: [principal, ...fallbacks.filter((m) => m !== principal)],
    timeoutMs: Number(env.VOICE_LLM_TIMEOUT_MS || 60000),
    // 3 reîncercări, nu 2: pe tierul gratuit limita e pe tokeni/minut, iar o
    // secțiune mare poate prinde fereastra plină de două ori la rând.
    maxRetries: Number(env.VOICE_LLM_MAX_RETRIES || 3),
  });
}

export { LlmError };
