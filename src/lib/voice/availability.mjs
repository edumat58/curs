/**
 * Starea serviciului de voce, una singură pentru tot site-ul.
 *
 * Butoanele de explicație apar pe fiecare titlu al lecției, plus unul pe toată
 * lecția. Dacă serviciul cade, fiecare dintre ele ar descoperi asta pe cont
 * propriu, la primul click: elevul ar apăsa, ar aștepta, ar primi o eroare, ar
 * încerca următorul buton și tot așa. De aceea starea stă aici, într-un singur
 * loc, iar toate butoanele o ascultă.
 *
 * „Indisponibil" acoperă deliberat ambele feluri de cădere. Nu se poate genera
 * o explicație nouă, dar nu se poate reda nici una veche — audio-ul stă în
 * GridFS și e servit tot de serviciu, deci un cache plin nu ajută la nimic dacă
 * serviciul nu răspunde. Un buton care promite ceva ce nu poate livra e mai rău
 * decât un buton care lipsește.
 *
 * Recuperarea e automată: după o cădere se reîncearcă periodic, iar când
 * serviciul revine butoanele reapar fără ca elevul să reîncarce pagina.
 */

/** Cât ținem un rezultat bun înainte să reverificăm. */
const VALABIL_MS = 5 * 60 * 1000;
/** Cât de des reîncercăm cât timp serviciul e căzut. */
const REINCERCARE_MS = 20 * 1000;
/**
 * Verificarea are voie să dureze. Opt secunde păreau generoase, dar pe o
 * conexiune mobilă slabă un răspuns întârziat trecea drept serviciu mort, iar
 * butoanele dispăreau degeaba.
 */
const TIMP_MAXIM_MS = 20000;
/**
 * Câte eșecuri LA RÂND înseamnă cu adevărat că serviciul e jos.
 *
 * Unul singur nu înseamnă nimic: un pachet pierdut, o schimbare de rețea, un
 * telefon care trece de pe wifi pe date. Prima variantă stingea butoanele la
 * prima cerere ratată, iar elevul trebuia să reîncarce pagina ca să și le
 * recapete — exact comportamentul pe care mecanismul ăsta trebuia să îl evite.
 */
const ESECURI_PENTRU_CADERE = 2;

const stare = {
  disponibil: null, // null = încă nu știm
  verificatLa: 0,
  inCurs: null,
  esecuri: 0,
};

/** Dispozitivul e offline? Atunci nu serviciul e de vină, iar butoanele rămân. */
function dispozitivOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

const ascultatori = new Set();

function anunta() {
  for (const fn of ascultatori) {
    try {
      fn(stare.disponibil);
    } catch {
      // Un ascultător stricat nu are voie să oprească restul.
    }
  }
}

function seteaza(disponibil) {
  const schimbat = stare.disponibil !== disponibil;
  stare.disponibil = disponibil;
  stare.verificatLa = Date.now();
  if (schimbat) anunta();
}

/**
 * Un eșec. Nu stinge nimic până nu se repetă — și niciodată dacă dispozitivul
 * însuși e offline, caz în care problema nu e la serviciu și nu are ce rezolva
 * un mesaj despre el.
 */
function inregistreazaEsec() {
  if (dispozitivOffline()) return;
  stare.esecuri += 1;
  stare.verificatLa = Date.now();
  if (stare.esecuri >= ESECURI_PENTRU_CADERE) seteaza(false);
}

function inregistreazaReusita() {
  stare.esecuri = 0;
  seteaza(true);
}

/** @returns {boolean|null} `null` cât timp încă nu s-a verificat nimic. */
export function stareCurenta() {
  return stare.disponibil;
}

export function asculta(fn) {
  ascultatori.add(fn);
  return () => ascultatori.delete(fn);
}

/**
 * O cerere reală a eșuat. Contează mai mult decât o verificare de sănătate:
 * e dovada că serviciul nu poate livra, nu doar că nu răspunde la ping.
 */
export function raporteazaCadere() {
  inregistreazaEsec();
}

/** O cerere reală a reușit — serviciul e viu, indiferent ce credeam înainte. */
export function raporteazaReusita() {
  inregistreazaReusita();
}

/**
 * Verifică serviciul, cel mult o dată pe interval.
 *
 * Apelurile simultane primesc aceeași promisiune: zece butoane pe o pagină nu
 * trebuie să producă zece cereri de sănătate.
 */
export function verifica(baseUrl, { fortat = false } = {}) {
  if (stare.inCurs) return stare.inCurs;

  const proaspat = Date.now() - stare.verificatLa
    < (stare.disponibil === false ? REINCERCARE_MS : VALABIL_MS);
  if (!fortat && stare.disponibil !== null && proaspat) {
    return Promise.resolve(stare.disponibil);
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const ceas = setTimeout(() => controller && controller.abort(), TIMP_MAXIM_MS);

  stare.inCurs = fetch(`${baseUrl}/health`, {
    signal: controller && controller.signal,
    // Fără cache: un `/health` servit din memoria browserului ar raporta la
    // nesfârșit starea de acum cinci minute.
    cache: 'no-store',
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (json && json.ok) inregistreazaReusita();
      else inregistreazaEsec();
    })
    .catch(() => inregistreazaEsec())
    .then(() => {
      clearTimeout(ceas);
      stare.inCurs = null;
      return stare.disponibil;
    });

  return stare.inCurs;
}

/**
 * Ține starea proaspătă cât timp pagina e deschisă.
 *
 * Reverificăm des doar cât timp serviciul e căzut — atunci contează să prindem
 * revenirea. Cât e sus, un ping la cinci minute e destul, iar dacă ceva chiar
 * s-a stricat va afla oricum prima cerere reală.
 */
export function pornesteSupravegherea(baseUrl) {
  verifica(baseUrl);
  const id = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    verifica(baseUrl);
  }, REINCERCARE_MS);

  /**
   * Revenirea trebuie să fie imediată, nu la următorul tur de ceas.
   *
   * Cele trei momente în care merită reverificat pe loc sunt exact cele în care
   * elevul se uită la ecran: când dispozitivul revine online, când se întoarce
   * la filă și când redeschide pagina. Fără ele, cineva care a trecut printr-un
   * tunel rămânea cu butoanele stinse zeci de secunde după ce semnalul
   * revenise, și învăța că „trebuie dat reload".
   */
  const acum = () => verifica(baseUrl, { fortat: true });
  const laVizibilitate = () => { if (!document.hidden) acum(); };
  if (typeof window !== 'undefined') {
    window.addEventListener('online', acum);
    window.addEventListener('focus', acum);
    document.addEventListener('visibilitychange', laVizibilitate);
  }

  return () => {
    clearInterval(id);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', acum);
      window.removeEventListener('focus', acum);
      document.removeEventListener('visibilitychange', laVizibilitate);
    }
  };
}
