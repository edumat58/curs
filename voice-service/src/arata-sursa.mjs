/**
 * Sursa unei lecții, EXACT cum o vede pipeline-ul de voce: fără frontmatter și
 * importuri, cu figurile citite și descrise. Pentru cine scrie sau verifică un
 * transcript — ca nimeni să nu mai citească sursa „filtrată" cu unelte de shell
 * care pierd rânduri.
 *
 *   node voice-service/src/arata-sursa.mjs docs/c6/modul-1/01.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { curataSursa } from './pipeline/prompts.mjs';
import { titluriDinSursa } from './verifica-structura.mjs';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cale = path.isAbsolute(process.argv[2]) ? process.argv[2] : path.join(RADACINA, process.argv[2]);
const curata = curataSursa(fs.readFileSync(cale, 'utf8'));
console.log('═══ TITLURI (în ordinea asta, rostite întocmai) ═══');
titluriDinSursa(curata).forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
console.log('\n═══ MATERIALUL ═══');
console.log(curata);
