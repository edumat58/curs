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
function createOpenAiCompatible({ name, baseUrl, apiKey, model, timeoutMs, maxRetries }) {
  return {
    name,
    model,
    async chat(messages, { json = false, temperature, maxTokens } = {}) {
      // Modelele cu raționament (gpt-oss) consumă bugetul în câmpul `reasoning`
      // și pot întoarce content gol în modul JSON strict. Ținem raționamentul
      // scurt: aici avem nevoie de extragere fidelă, nu de deliberare lungă.
      const isReasoning = /gpt-oss|thinking|reasoner|\bo\d\b/i.test(model);
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
            err.retryAfterMs = Number.isFinite(headerWait) && headerWait > 0
              ? headerWait
              : bodyWait ? Math.ceil(parseFloat(bodyWait[1]) * 1000) + 500 : 0;
            throw err;
          }

          const data = await res.json();
          const message = data?.choices?.[0]?.message || {};
          const content = message.content;
          if (typeof content !== 'string' || !content.trim()) {
            if (body.response_format) relaxJson = true;
            throw new LlmError(`${name}: răspuns gol`, { provider: name, retryable: true });
          }
          return {
            content,
            usage: data.usage || null,
            model: data.model || model,
          };
        } catch (err) {
          lastError = err;
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

  return createOpenAiCompatible({
    name: provider,
    baseUrl: env.VOICE_LLM_BASE_URL || preset.baseUrl,
    apiKey,
    model: env.VOICE_LLM_MODEL || preset.model,
    timeoutMs: Number(env.VOICE_LLM_TIMEOUT_MS || 60000),
    maxRetries: Number(env.VOICE_LLM_MAX_RETRIES || 2),
  });
}

export { LlmError };
