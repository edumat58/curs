#!/usr/bin/env node
/**
 * Instalează extensia de diacritice în VS Code.
 *
 * Fără `.vsix`, fără marketplace, fără `vsce`: VS Code citește la pornire orice
 * folder din `~/.vscode/extensions` care are un `package.json` valid, așa că e
 * de ajuns să punem unul acolo.
 *
 * Ce copiem și ce legăm:
 *   · `package.json` și `extensie.js` se COPIAZĂ — sunt mici și se schimbă rar;
 *   · motorul și datele lui se LEAGĂ simbolic spre repo, fiindcă `lexicon.txt`
 *     are 7,5 MB și fiindcă vrei ca după `construieste-lexicon.mjs` editorul să
 *     folosească imediat lexiconul nou, nu unul înțepenit de la instalare.
 *
 * Rulare:  node scripts/diacritice/instaleaza.mjs
 *          node scripts/diacritice/instaleaza.mjs --scoate
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AICI = path.dirname(fileURLToPath(import.meta.url));
const SURSA = path.join(AICI, 'vscode');

/** Și VS Code, și Cursor citesc din același fel de folder. */
const GAZDE = [
  { nume: 'VS Code', dosar: path.join(os.homedir(), '.vscode', 'extensions') },
  { nume: 'Cursor', dosar: path.join(os.homedir(), '.cursor', 'extensions') },
];

const NUME = 'edumat-diacritice-1.0.0';

function instaleaza({ nume, dosar }) {
  if (!fs.existsSync(dosar)) return null;

  const tinta = path.join(dosar, NUME);
  fs.rmSync(tinta, { recursive: true, force: true });
  fs.mkdirSync(tinta, { recursive: true });

  for (const fisier of ['package.json', 'extensie.js']) {
    fs.copyFileSync(path.join(SURSA, fisier), path.join(tinta, fisier));
  }
  fs.symlinkSync(AICI, path.join(tinta, 'motor-sursa'), 'dir');

  return { nume, tinta };
}

function scoate({ nume, dosar }) {
  const tinta = path.join(dosar, NUME);
  if (!fs.existsSync(tinta)) return null;
  fs.rmSync(tinta, { recursive: true, force: true });
  return { nume, tinta };
}

function main() {
  const seScoate = process.argv.includes('--scoate');

  if (!fs.existsSync(path.join(AICI, 'date', 'lexicon.txt'))) {
    console.error('Lipsește date/lexicon.txt. Rulează întâi:');
    console.error('  node scripts/diacritice/construieste-lexicon.mjs');
    console.error('  node scripts/diacritice/construieste-context.mjs');
    process.exit(1);
  }

  const facute = GAZDE.map(seScoate ? scoate : instaleaza).filter(Boolean);

  if (!facute.length) {
    console.log(seScoate ? 'N-am găsit extensia instalată nicăieri.' : 'N-am găsit nici VS Code, nici Cursor.');
    return;
  }

  for (const { nume, tinta } of facute) {
    console.log(`${seScoate ? 'Scos din' : 'Instalat în'} ${nume}: ${tinta}`);
  }

  if (!seScoate) {
    console.log('\nRepornește editorul (Cmd+Shift+P → „Developer: Reload Window").');
    console.log('În bara de jos apare „✓ diacritice"; apasă pe ea ca s-o oprești sau s-o pornești.');
  }
}

main();
