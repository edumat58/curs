import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Admonition from '@theme/Admonition';

/**
 * Trimiterea către rubrica „Ghidul părintelui", din afara EduPAȘI.
 *
 * În lecție se scrie doar calea fișierului:
 *
 *   <ResurseParinti fisier="00" />
 *   <ResurseParinti fisier="docs/parinti/03.mdx" />
 *   <ResurseParinti fisier="00 04" />        (mai multe resurse)
 *
 * și apare recomandarea cu TITLUL resursei, cel din `#`-ul fișierului, ca link
 * care se deschide în tab nou. Titlul nu se scrie de mână în lecție: se citește
 * din fișierul resursei la build (`resurseleParintilor()` din
 * `docusaurus.config.js`), deci dacă redenumești resursa, lecția se actualizează
 * singură și nu rămâne cu un titlu vechi.
 *
 * Tab nou pentru că e o ieșire din traseul lecției: părintele deschide resursa
 * fără să piardă locul unde era elevul.
 */

/** „docs/parinti/03.mdx", „parinti/03", „03.mdx" → „03". */
function cheie(valoare) {
  return String(valoare)
    .trim()
    .replace(/^\/+/, '')
    .replace(/^docs\//, '')
    .replace(/^parinti\//, '')
    .replace(/\.mdx?$/, '');
}

function Trimitere({ resursa, cale }) {
  const href = useBaseUrl(cale);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      „{resursa}"
    </a>
  );
}

export default function ResurseParinti({ fisier, fisiere, titlu }) {
  const { siteConfig } = useDocusaurusContext();
  const catalog = (siteConfig.customFields && siteConfig.customFields.resurseParinti) || {};

  const cerute = String(fisier || fisiere || '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(cheie);

  if (cerute.length === 0) return null;

  const gasite = cerute.map((k) => ({ k, date: catalog[k] }));
  const lipsa = gasite.filter((g) => !g.date).map((g) => g.k);

  if (lipsa.length && typeof console !== 'undefined') {
    // Autorul trebuie să afle imediat, nu după ce publică: lecția arată calea
    // greșită, iar în consolă scrie ce s-a căutat.
    console.warn(
      `[ResurseParinti] nu există docs/parinti/${lipsa.join('.mdx, docs/parinti/')}.mdx. ` +
        'Dacă fișierul e nou, repornește serverul de dev — catalogul se citește la pornire.',
    );
  }

  return (
    <Admonition type="soft" title={titlu || 'ghidul părintelui'}>
      <p>
        Resurse recomandate pentru părinți sau pentru lucru asistat:{' '}<b>
        {gasite.map((g, i) => (
          <React.Fragment key={g.k}>
            {i > 0 && ', '}
            {g.date ? (
              <Trimitere resursa={g.date.titlu} cale={g.date.cale} />
            ) : (
              <em>docs/parinti/{g.k}.mdx (resursă negăsită)</em>
            )}
          </React.Fragment>
        ))}</b>
      </p>
    </Admonition>
  );
}
