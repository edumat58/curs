/**
 * Sursa brută a lecției, adusă la client.
 *
 * Modelul primea până acum o reconstrucție a lecției — text extras din DOM,
 * formule reconvertite, figuri traduse în propoziții de noi. Fiecare pas pierdea
 * ceva, și de acolo veneau greșelile pe care le-a auzit un om, nu un test:
 *
 *   - `0{,}1` din material ajungea la model ca „zero virgulă unu", adică deja
 *     interpretat; odată ce primește o interpretare, modelul se simte liber să
 *     dea alta „mai bună" — „patru ori zece la puterea minus unu". Corect
 *     matematic, greșit pentru clasa a V-a, și mai ales nu ce scrie în lecție.
 *   - ordinea lecției trebuia ghicită de model, deși în cod e explicită.
 *
 * Sursa nu are ce reinterpreta: acolo scrie `0{,}1` și atât.
 */

let cache = null;

/** Fișierul e mare, deci se aduce o singură dată pe sesiune, la prima cerere. */
async function toateSursele(baseUrl) {
  if (cache) return cache;
  const res = await fetch(`${baseUrl}lesson-sources.json`, { cache: 'force-cache' });
  cache = res.ok ? await res.json() : {};
  return cache;
}

/**
 * Bucata de sursă care corespunde unei secțiuni.
 *
 * Se taie pe titluri Markdown, nu pe DOM: în fișier, un titlu de nivel N ține
 * până la următorul titlu de nivel ≤ N. E aceeași regulă pe care o folosește și
 * randarea, doar că aici e citită din text, nu dedusă din elemente.
 */
export function feliaSectiunii(sursa, heading, level) {
  if (!sursa || !heading) return '';
  const linii = sursa.split('\n');
  const titlu = new RegExp(`^(#{1,6})\\s+(.*)$`);
  const curat = (s) => String(s).replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ro');
  const tinta = curat(heading);

  let start = -1;
  let rang = Number(level) || 2;
  for (let i = 0; i < linii.length; i += 1) {
    const m = titlu.exec(linii[i]);
    if (m && curat(m[2]) === tinta) { start = i; rang = m[1].length; break; }
  }
  if (start < 0) return '';

  let end = linii.length;
  for (let i = start + 1; i < linii.length; i += 1) {
    const m = titlu.exec(linii[i]);
    if (m && m[1].length <= rang) { end = i; break; }
  }
  return linii.slice(start, end).join('\n').trim();
}

/** Frontmatter și importurile nu spun nimic despre matematică. */
function faraAmbalaj(sursa) {
  return String(sursa)
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^\s*import\s.+$/gm, '')
    .trim();
}

/**
 * @returns {Promise<string>} sursa de trimis la generare — lecția întreagă sau
 * doar secțiunea cerută.
 */
export async function sursaPentru(baseUrl, route, { heading, level, intreaga }) {
  try {
    const toate = await toateSursele(baseUrl);
    const cheie = Object.keys(toate).find(
      (k) => k === route || route.startsWith(k) || k.startsWith(route)
    );
    if (!cheie) return '';
    const sursa = faraAmbalaj(toate[cheie]);
    if (intreaga) return sursa;
    return feliaSectiunii(sursa, heading, level) || '';
  } catch {
    // Fără sursă, generarea merge mai departe pe forma reconstruită: mai slabă,
    // dar existentă. O explicație imperfectă bate o eroare.
    return '';
  }
}
