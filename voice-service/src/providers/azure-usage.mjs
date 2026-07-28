/**
 * Consumul și cota Azure, luate DIRECT de la Azure — nu ținute ca numere fixe.
 *
 * Limitele Azure se pot schimba (alt tier, cotă mărită), iar o valoare scrisă în
 * cod ar minți tăcut a doua zi. Interogăm Azure Resource Manager, care întoarce
 * pentru resursa de Speech metricile cu `currentValue` și `limit` reale. Nimic
 * hardcodat: dacă tierul se schimbă, cifrele se schimbă singure.
 *
 * Autentificarea e prin service principal (client credentials): cheia de Speech
 * nu dă acces la Management API. Variabilele necesare:
 *   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET,
 *   AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_ACCOUNT_NAME
 *
 * Dacă lipsesc, `azureUsageLive` întoarce null și apelantul cade pe evidența
 * locală — dar limita tot NU se inventează, se raportează necunoscută.
 */

const ARM = 'https://management.azure.com';
const AUTHORITY = 'https://login.microsoftonline.com';

/** Configurația e completă doar dacă avem tot ce trebuie pentru ARM. */
export function areConfigArm(env) {
  return Boolean(
    env.AZURE_TENANT_ID && env.AZURE_CLIENT_ID && env.AZURE_CLIENT_SECRET &&
    env.AZURE_SUBSCRIPTION_ID && env.AZURE_RESOURCE_GROUP && env.AZURE_ACCOUNT_NAME
  );
}

let tokenCache = { value: null, expira: 0 };

async function tokenArm(env, acum) {
  // Reutilizăm tokenul cât e valid: fiecare cerere de token e o rundă în plus
  // către Azure, iar tokenul ține o oră.
  if (tokenCache.value && acum < tokenCache.expira) return tokenCache.value;
  const res = await fetch(`${AUTHORITY}/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.AZURE_CLIENT_ID,
      client_secret: env.AZURE_CLIENT_SECRET,
      scope: `${ARM}/.default`,
    }),
  });
  if (!res.ok) throw new Error(`Azure token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  tokenCache = { value: data.access_token, expira: acum + (data.expires_in - 60) * 1000 };
  return tokenCache.value;
}

/**
 * Consumul live de la Azure pentru resursa de Speech.
 *
 * @returns {{folosit, limita, ramas, procent, seResetLa, sursa, metrici}|null}
 *   null dacă ARM nu e configurat. Valorile vin toate de la Azure.
 */
export async function azureUsageLive(env, acum = Date.now()) {
  if (!areConfigArm(env)) return null;

  const token = await tokenArm(env, acum);
  const url = `${ARM}/subscriptions/${env.AZURE_SUBSCRIPTION_ID}`
    + `/resourceGroups/${env.AZURE_RESOURCE_GROUP}`
    + `/providers/Microsoft.CognitiveServices/accounts/${env.AZURE_ACCOUNT_NAME}`
    + `/usages?api-version=2023-05-01`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Azure usages ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const metrici = Array.isArray(data.value) ? data.value : [];

  // Metrica de sinteză vocală neurală (caractere). Numele exact variază între
  // tieruri, așa că o alegem după cuvintele-cheie, nu după un nume fix.
  const vocea = metrici.find((m) => {
    const nume = ((m.name && (m.name.value || m.name.localizedValue)) || '').toLowerCase();
    return /voice|synthes|neural|tts|character|text.to.speech/.test(nume);
  }) || metrici[0];

  if (!vocea) return { folosit: 0, limita: null, ramas: null, procent: null, seResetLa: null, sursa: 'azure', metrici: [] };

  const folosit = Number(vocea.currentValue) || 0;
  const limita = vocea.limit != null && Number(vocea.limit) >= 0 ? Number(vocea.limit) : null;
  return {
    folosit,
    limita,
    ramas: limita != null ? Math.max(0, limita - folosit) : null,
    procent: limita ? Math.round((folosit / limita) * 1000) / 10 : null,
    // Azure dă și când se reînnoiește cota, dacă tierul o expune.
    seResetLa: vocea.nextResetTime || null,
    sursa: 'azure',
    // Toate metricile brute, ca administratorul să vadă exact ce spune Azure.
    metrici: metrici.map((m) => ({
      nume: (m.name && (m.name.localizedValue || m.name.value)) || '?',
      folosit: Number(m.currentValue) || 0,
      limita: m.limit != null ? Number(m.limit) : null,
      unitate: m.unit || null,
    })),
  };
}
