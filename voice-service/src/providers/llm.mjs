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

function createOpenAiCompatible({ name, baseUrl, apiKey, models, timeoutMs, maxRetries }) {
  const lista = models.filter(Boolean);
  // Modelul curent se ține la nivel de client, nu de cerere: odată ce bugetul
  // zilnic al celui principal s-a terminat, s-a terminat pentru toate cererile
  // care urmează. Fiecare ar redescoperi asta cu încă un 429 pierdut.
  let index = 0;

  return {
    name,
    get model() { return lista[index]; },
    async chat(messages, { json = false, temperature, maxTokens } = {}) {
      const model = lista[index];
      // Modelele cu raționament (gpt-oss) consumă bugetul în câmpul `reasoning`
      // și pot întoarce content gol în modul JSON strict. Ținem raționamentul
      // scurt: aici avem nevoie de extragere fidelă, nu de deliberare lungă.
      const isReasoning = /gpt-oss|thinking|reasoner|\bo\d\b/i.test(model);
      const body = {
        model: lista[index],
        messages,
        temperature: temperature ?? (json ? 0.1 : 0.6),
        stream: false,
      };
      if (json) body.response_format = { type: 'json_object' };
      if (maxTokens) body.max_tokens = maxTokens;
      if (isReasoning) body.reasoning_effort = 'low';

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
            err.epuizatPeZi = res.status === 429
              && (LIMITA_PE_ZI.test(text) || err.retryAfterMs > ASTEPTARE_MAXIMA_MS);
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
            model: data.model || model,
          };
        } catch (err) {
          lastError = err;

          /**
           * Bugetul zilnic al modelului s-a terminat: trecem la următorul din
           * listă și reîncercăm IMEDIAT, fără să consumăm o încercare.
           *
           * Modelele au bugete zilnice separate, deci al doilea chiar are ce
           * oferi. Explicația iese ceva mai simplă decât cu modelul principal,
           * dar o explicație bună azi bate una perfectă mâine.
           */
          if (err.epuizatPeZi && index < lista.length - 1) {
            index += 1;
            body.model = lista[index];
            console.warn(`[voice] buget zilnic epuizat, trec pe ${lista[index]}`);
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
