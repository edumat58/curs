/**
 * Stratul de furnizor LLM — UN SINGUR model, fără lanț de rezerve.
 *
 * Lanțul de modele de rezervă (gpt-oss-120b → llama-3.3-70b → gpt-oss-20b) era
 * chiar sursa calității inconstante: o lecție ieșea de la modelul bun, alta de
 * la cel slab, iar elevul auzea când o explicație umană, când una robotică și
 * plină de greșeli. Un singur model înseamnă o singură calitate, previzibilă.
 *
 * Când bugetul zilnic al modelului se termină, NU coborâm pe unul mai slab: îi
 * spunem elevului să revină mai târziu. O explicație proastă e mai rea decât
 * niciuna — el nu are cum să știe că e greșită.
 *
 * Restul sistemului cere `chat(messages, {json})` și primește text. Schimbarea
 * modelului sau a furnizorului se face din variabile de mediu.
 */

/**
 * Node abandonează singur o cerere lungă — chiar dacă noi nu-i cerem.
 *
 * `fetch` din Node (undici) are un timeout INTERN de 5 minute pe primirea
 * corpului. Un model local, lent (RoLlama pe CPU, ~1,7 tokeni pe secundă),
 * generează o lecție în peste 5 minute, iar undici întrerupe cu „fetch failed" —
 * indiferent de `AbortController`-ul nostru de 15 minute, care e altă limită.
 * Punem un dispatcher fără acest timeout, ca generările lungi să meargă până la
 * capăt. `connect` rămâne scurt: dacă serverul chiar e mort, aflăm repede.
 */
try {
  const { setGlobalDispatcher, Agent } = await import('undici');
  setGlobalDispatcher(new Agent({
    headersTimeout: 0,
    bodyTimeout: 0,
    connect: { timeout: 10000 },
  }));
} catch {
  // undici lipsește (runtime neașteptat): rămânem pe comportamentul implicit.
}

const DEFAULTS = {
  // llama-3.3-70b-versatile: cel mai fluent la proză românească dintre modelele
  // gratuite Groq. Modelele gpt-oss sunt centrate pe raționament și sună mai
  // țeapăn — exact ce nu vrem la o naratiune caldă.
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  // Model LOCAL, pe serverul propriu (llama.cpp cu backend Vulkan pe RX 580).
  // Fără buget zilnic, fără dependență de un furnizor extern. Serverul llama.cpp
  // expune același dialect OpenAI la /v1. Portul și modelul se dau din mediu.
  local: { baseUrl: 'http://127.0.0.1:8090/v1', model: 'local' },
  ollama: { baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' },
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

/** Peste atâta așteptare într-o cerere nu mai are sens să blocăm elevul. */
const ASTEPTARE_MAXIMA_MS = 45000;
const LIMITA_PE_ZI = /per day|\bTPD\b|\bRPD\b/i;

/** Modelele cu raționament (gpt-oss, o-uri) cer `reasoning_effort`; restul îl refuză. */
const CU_RATIONAMENT = /gpt-oss|thinking|reasoner|\bo\d\b/i;

function createOpenAiCompatible({ name, baseUrl, apiKey, model, timeoutMs, maxRetries }) {
  const isReasoning = CU_RATIONAMENT.test(model);

  return {
    name,
    model,
    async chat(messages, { json = false, temperature, maxTokens, signal } = {}) {
      const body = {
        model,
        messages,
        temperature: temperature ?? (json ? 0.1 : 0.6),
        stream: false,
      };
      if (json) body.response_format = { type: 'json_object' };
      if (maxTokens) body.max_tokens = maxTokens;
      if (isReasoning) body.reasoning_effort = 'low';

      // Unele modele nu respectă `response_format` (json_validate_failed) sau
      // întorc gol; atunci reîncercăm fără el (promptul cere oricum JSON).
      let relaxJson = false;
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        if (relaxJson) delete body.response_format;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        // Dacă apelantul anulează (elevul a plecat), abandonăm imediat.
        const onAbort = () => controller.abort();
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
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
            const retryable = res.status === 429 || res.status >= 500;
            const headerWait = Number(res.headers.get('retry-after')) * 1000;
            const bodyWait = /try again in ([\d.]+)s/i.exec(text);
            const err = new LlmError(`${name} ${res.status}: ${text.slice(0, 300)}`, {
              status: res.status, provider: name, retryable,
            });
            // +1,5 s peste ce cere furnizorul: fereastra pe minut e glisantă.
            err.retryAfterMs = Number.isFinite(headerWait) && headerWait > 0
              ? headerWait + 1500
              : bodyWait ? Math.ceil(parseFloat(bodyWait[1]) * 1000) + 1500 : 0;
            // Bugetul ZILNIC epuizat: nu se rezolvă așteptând câteva secunde.
            err.epuizatPeZi = res.status === 429
              && (LIMITA_PE_ZI.test(text) || err.retryAfterMs > ASTEPTARE_MAXIMA_MS);
            // 413: promptul + rezerva depășesc fereastra pe minut.
            err.preaMare = res.status === 413 || /request too large/i.test(text);
            throw err;
          }

          const data = await res.json();
          const choice = data?.choices?.[0] || {};
          const content = choice.message?.content;
          if (typeof content !== 'string' || !content.trim()) {
            if (body.response_format) relaxJson = true;
            throw new LlmError(`${name}: răspuns gol`, { provider: name, retryable: true });
          }
          return {
            content,
            finishReason: choice.finish_reason || null,
            usage: data.usage || null,
            model: data.model || model,
          };
        } catch (err) {
          lastError = err;

          // Bugetul zilnic s-a terminat: nu are rost să reîncercăm, nici să
          // coborâm pe alt model. Ridicăm o eroare clară, pe care serverul o
          // transformă în „revino mai târziu".
          if (err.epuizatPeZi) {
            err.retryable = false;
            break;
          }

          // Cererea nu încape: o înjumătățim o dată, apoi renunțăm.
          if (err.preaMare && body.max_tokens && body.max_tokens > 900) {
            body.max_tokens = Math.floor(body.max_tokens / 2);
            console.warn(`[voice] cerere prea mare, reduc la ${body.max_tokens} tokeni`);
            attempt -= 1;
            continue;
          }

          const retryable = err.retryable || err.name === 'AbortError';
          if (!retryable || attempt === maxRetries) break;
          const wait = err.retryAfterMs
            || Math.min(8000, 400 * 2 ** attempt) + Math.floor(Math.random() * 250);
          await new Promise((r) => setTimeout(r, Math.min(wait, 30000)));
        } finally {
          clearTimeout(timer);
          if (signal) signal.removeEventListener('abort', onAbort);
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

  return createOpenAiCompatible({
    name: provider,
    baseUrl: env.VOICE_LLM_BASE_URL || preset.baseUrl,
    apiKey,
    model: env.VOICE_LLM_MODEL || preset.model,
    timeoutMs: Number(env.VOICE_LLM_TIMEOUT_MS || 60000),
    maxRetries: Number(env.VOICE_LLM_MAX_RETRIES || 3),
  });
}

export { LlmError };
