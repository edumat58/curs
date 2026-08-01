/**
 * Scrie paginile rubricii „Programa adaptată" din EduPAȘI, pornind de la
 * `src/lib/programaAdaptata.mjs`.
 *
 * Conținutul stă în modul, nu în pagini, dintr-un motiv care s-a dovedit deja
 * la automatisme: ce se ține de mână se desincronizează. Aici miza e mai mare —
 * pragul legal de 20% (Legea nr. 198/2023, art. 69) e verificat de un test pe
 * datele din modul; dacă paginile ar fi scrise separat, testul ar păzi un fișier
 * și situl ar afișa altul.
 *
 * Pe pagină NU se explică de ce s-a redus fiecare conținut — rubrica spune ce
 * trebuie să știe elevul, atât. Temeiurile stau în modul, pentru audit.
 *
 *   node scripts/build-programa-adaptata.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROGRAMA_ADAPTATA, TEMEI_LEGAL, verificaPragul } from '../src/lib/programaAdaptata.mjs';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSAR = path.join(RADACINA, 'docs', 'edupasi', 'programa-adaptata');

const NUME_CLASA = { 5: 'a V-a', 6: 'a VI-a', 7: 'a VII-a', 8: 'a VIII-a' };

// Pragul se verifică și la generare, nu doar la teste: o pagină publicată cu o
// reducere ilegală e mai rea decât un test picat.
for (const r of verificaPragul()) {
  if (!r.inLimita) {
    console.error(`REFUZ: clasa a ${r.clasa}-a reduce ${r.procent}%, peste pragul legal de ${TEMEI_LEGAL.reducereMaxima}%`);
    process.exit(1);
  }
}

fs.mkdirSync(DOSAR, { recursive: true });
for (const f of fs.readdirSync(DOSAR)) {
  if (f.endsWith('.mdx') || f.endsWith('.md')) fs.unlinkSync(path.join(DOSAR, f));
}

fs.writeFileSync(path.join(DOSAR, '_category_.json'), `${JSON.stringify({
  label: 'Programa adaptată',
  position: 1,
  collapsible: true,
  collapsed: true,
  link: {
    type: 'generated-index',
    slug: '/edupasi/programa-adaptata',
    title: 'Programa adaptată',
    description: 'Conținuturile esențiale pentru elevii cu cerințe educaționale speciale, '
      + 'pe clase, cu adaptarea curriculară prevăzută de lege.',
  },
}, null, 2)}\n`);

let scrise = 0;
for (const [clasa, domenii] of Object.entries(PROGRAMA_ADAPTATA)) {
  const sectiuni = domenii.map((d) => {
    const esential = d.esential.map((e) => `- ${e}`).join('\n');
    const redus = d.redus.length
      ? `\n\n**Conținuturi la care se aplică adaptarea curriculară:** ${d.redus.map((r) => r.ce).join('; ')}.`
      : '';
    return `## ${d.domeniu}\n\nElevul:\n\n${esential}${redus}`;
  }).join('\n\n');

  const continut = `---
sidebar_position: ${Number(clasa) - 4}
sidebar_label: "Clasa ${NUME_CLASA[clasa]}"
title: "Programa adaptată — clasa ${NUME_CLASA[clasa]}"
description: "Conținuturile esențiale de matematică pentru clasa ${NUME_CLASA[clasa]}, cu adaptarea curriculară prevăzută de Legea nr. 198/2023."
---

# Programa adaptată — clasa ${NUME_CLASA[clasa]}

Conținuturile de mai jos urmează programa școlară de matematică (OMEN
nr. 3393/28.02.2017), cu adaptarea curriculară pentru elevii cu cerințe
educaționale speciale prevăzută de Legea nr. 198/2023, art. 69: sprijin de
nivel II, cu o reducere a componentei curriculare de cel mult 20%.
Conținuturile marcate ca adaptate se parcurg doar orientativ, fără a fi
evaluate; restul programei rămâne obligatoriu.

${sectiuni}

---

*Temei: ${TEMEI_LEGAL.programa}; ${TEMEI_LEGAL.lege} (${TEMEI_LEGAL.nivel}).
Adaptarea nu înlocuiește certificatul de orientare școlară și profesională și
nici Planul de Servicii Individualizat.*
`;
  fs.writeFileSync(path.join(DOSAR, `clasa-${clasa}.mdx`), continut);
  scrise += 1;
}

const bilant = verificaPragul().map((r) => `clasa ${r.clasa}: ${r.procent}%`).join(', ');
console.log(`programa adaptată: ${scrise} pagini (reduceri: ${bilant})`);
