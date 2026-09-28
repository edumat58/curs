/**
 * Extensia VS Code: diacritice puse pe măsură ce scrii.
 *
 * Fișierul ăsta e doar învelișul. Toată judecata stă în `../motor.mjs`,
 * `../context.mjs` și `../gemini.mjs`, care nu știu nimic despre editor și pot
 * fi rulate și testate din linia de comandă. Aici se rezolvă doar problemele
 * care apar din faptul că textul se schimbă sub tine în timp ce lucrezi.
 *
 * ── Cele trei reguli care fac diferența între ajutor și bătaie de cap ──────
 *
 * 1. NU ATINGEM CUVÂNTUL SUB CURSOR. Dacă ai tastat „impart" și te uiți la el,
 *    corectorul care sare acum să-l facă „împart" tocmai ți-a stricat cuvântul
 *    pe care nu-l terminaseși. Așteptăm să treci de el — spațiu, virgulă,
 *    Enter — și abia atunci ne atingem de el.
 *
 * 2. NU ATINGEM CUVINTELE CU DIACRITICE PUSE DE TINE. Dacă ai scris „fată",
 *    aia rămâne „fată". Singurele cuvinte pe care ni le permitem să le
 *    revizuim sunt cele pe care le-am scris chiar noi — le ținem minte în
 *    `puse` — fiindcă alea au fost ghicitura noastră, nu hotărârea ta.
 *
 * 3. O SINGURĂ APĂSARE DE Cmd+Z ANULEAZĂ O CORECTURĂ ÎNTREAGĂ. Toate
 *    schimbările dintr-o trecere se aplică într-un singur `WorkspaceEdit`.
 *    Altfel ai fi avut de apăsat Cmd+Z de cincisprezece ori ca să scapi de o
 *    corectură pe care n-o voiai.
 *
 * ── De ce CommonJS și `import()` ───────────────────────────────────────────
 *
 * Gazda de extensii a VS Code încarcă `main` cu `require`, deci intrarea
 * trebuie să fie CommonJS. Motorul e însă ESM, ca restul scripturilor din
 * proiect. Le împăcăm cu `await import(...)`, care merge din CommonJS și ne
 * scutește de un pas de compilare — extensia se instalează copiind un folder,
 * fără `npm run build`.
 */

const vscode = require('vscode');
const path = require('node:path');

/** Motorul, încărcat o singură dată, la prima nevoie. */
let motorul = null;
let seIncarca = null;

async function incarcaMotorul() {
  if (motorul) return motorul;
  if (seIncarca) return seIncarca;

  seIncarca = (async () => {
    /*
     * Unde stă motorul depinde de cum a fost instalată extensia:
     *
     *   `..`            când rulezi direct din repo (Extension Development Host);
     *   `motor-sursa`   când e instalată în `~/.vscode/extensions/`, unde
     *                   `instalează.mjs` lasă o legătură simbolică spre repo.
     *
     * Legătura, și nu o copie, ca reconstruirea lexiconului să se vadă imediat
     * în editor — altfel ai fi avut de reinstalat extensia după fiecare rulare
     * a scripturilor de construcție.
     */
    const fs = require('node:fs');
    const legatura = path.join(__dirname, 'motor-sursa');
    const radacina = fs.existsSync(path.join(legatura, 'motor.mjs'))
      ? legatura
      : path.resolve(__dirname, '..');

    const catreUrl = (fisier) => require('node:url').pathToFileURL(path.join(radacina, fisier)).href;

    const [motor, context, gemini] = await Promise.all([
      import(catreUrl('motor.mjs')),
      import(catreUrl('context.mjs')),
      import(catreUrl('gemini.mjs')),
    ]);

    motorul = {
      ...motor,
      lexicon: motor.Lexicon.dinFisier(),
      context: context.Context.dinFisier(),
      alegeFormele: gemini.alegeFormele,
    };
    return motorul;
  })();

  return seIncarca;
}

/** Starea ținută pentru fiecare fișier deschis. */
const stari = new Map();

function stareaFisierului(document) {
  const cheie = document.uri.toString();
  if (!stari.has(cheie)) {
    stari.set(cheie, {
      /** Poziții de start ale cuvintelor scrise de noi → forma ASCII tastată. */
      puse: new Map(),
      /** Propoziții deja judecate de Gemini, ca să nu întrebăm de două ori. */
      cache: new Map(),
      /** Variantele fiecărei ambiguități, pentru meniul de quick-fix. */
      variante: new Map(),
      ceasSigur: null,
      ceasGemini: null,
    });
  }
  return stari.get(cheie);
}

/**
 * Mută pozițiile ținute minte după o editare făcută de om.
 *
 * Fără pasul ăsta, `puse` ar arăta după prima tastare spre cuvinte cu totul
 * altele decât cele scrise de noi, iar regula „revizuim doar ce-am scris noi"
 * s-ar transforma în „rescriem la întâmplare". Un cuvânt peste care a scris
 * omul iese din evidență: de-acum e al lui.
 */
function mutaPozitiile(stare, schimbari) {
  for (const schimbare of schimbari) {
    const { rangeOffset, rangeLength, text } = schimbare;
    const delta = text.length - rangeLength;
    const mutate = new Map();

    for (const [pozitie, ascii] of stare.puse) {
      if (pozitie >= rangeOffset + rangeLength) mutate.set(pozitie + delta, ascii);
      else if (pozitie < rangeOffset) mutate.set(pozitie, ascii);
      // Cuvintele atinse de editare se pierd dinadins: au trecut în grija ta.
    }
    stare.puse = mutate;
  }
}

const setari = () => vscode.workspace.getConfiguration('diacritice');

function esteDeAlNostru(document) {
  if (!setari().get('pornit')) return false;
  return (setari().get('limbi') ?? ['mdx', 'markdown']).includes(document.languageId);
}

/** Pozițiile tuturor cursoarelor din editoarele care arată documentul. */
function cursoarele(document) {
  const pozitii = [];
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document !== document) continue;
    for (const selectie of editor.selections) pozitii.push(document.offsetAt(selectie.active));
  }
  return pozitii;
}

/**
 * Cuvântul e sub degetele tale chiar acum?
 *
 * Cuprindem și capătul din dreapta: după „impart" cursorul stă exact pe
 * `sfarsit`, iar cuvântul e neterminat. Abia când tastezi spațiul cursorul
 * ajunge dincolo și cuvântul devine al nostru.
 */
function subCursor(bucata, pozitii) {
  return pozitii.some((pozitie) => pozitie >= bucata.start && pozitie <= bucata.sfarsit);
}

const NOI_SCRIEM = { activ: false };

async function scrie(document, schimbari, stare) {
  if (!schimbari.length) return false;

  const editare = new vscode.WorkspaceEdit();
  for (const schimbare of schimbari) {
    editare.replace(
      document.uri,
      new vscode.Range(document.positionAt(schimbare.start), document.positionAt(schimbare.sfarsit)),
      schimbare.propunere,
    );
  }

  NOI_SCRIEM.activ = true;
  try {
    const reusit = await vscode.workspace.applyEdit(editare);
    if (!reusit) return false;
  } finally {
    NOI_SCRIEM.activ = false;
  }

  /*
   * Ținem minte ce-am scris, cu poziția de DUPĂ aplicare.
   *
   * În practică `deplasare` rămâne mereu zero, și nu din întâmplare: punerea
   * diacriticelor românești păstrează lungimea. Fiecare semn înlocuiește o
   * literă cu alta — a→ă, i→î, s→ș, t→ț — iar toate cele cinci stau în planul
   * Unicode de bază, deci ocupă exact o unitate UTF-16, adică unitatea în care
   * numără VS Code pozițiile. De aceea diagnosticele calculate înainte de
   * scriere rămân valabile după ea.
   *
   * Calculul e păstrat totuși explicit: dacă cineva adaugă vreodată o corectură
   * care schimbă lungimea (o cratimă, un apostrof), pozițiile se mută corect de
   * la sine, în loc să se strice tăcut.
   */
  let deplasare = 0;
  for (const schimbare of [...schimbari].sort((a, b) => a.start - b.start)) {
    stare.puse.set(schimbare.start + deplasare, schimbare.tastat ?? schimbare.text);
    deplasare += schimbare.propunere.length - (schimbare.sfarsit - schimbare.start);
  }

  return true;
}

const diagnostice = vscode.languages.createDiagnosticCollection('diacritice');

function arataAmbiguitatile(document, nesigure, stare) {
  stare.variante.clear();
  const lista = [];

  for (const nesigura of nesigure) {
    const interval = new vscode.Range(
      document.positionAt(nesigura.start),
      document.positionAt(nesigura.sfarsit),
    );

    const problema = new vscode.Diagnostic(
      interval,
      `„${nesigura.text}" poate fi: ${nesigura.variante.join(', ')}`,
      vscode.DiagnosticSeverity.Information,
    );
    problema.source = 'diacritice';
    lista.push(problema);
    stare.variante.set(`${nesigura.start}:${nesigura.sfarsit}`, nesigura.variante);
  }

  diagnostice.set(document.uri, lista);
}

/**
 * Trecerea locală: lexicon + model de context. Rapidă, fără rețea.
 * Întoarce ambiguitățile rămase, pentru trecerea cu Gemini.
 */
async function trecereLocala(document) {
  const { lexicon, context, analizeaza, dezbraca } = await incarcaMotorul();
  const stare = stareaFisierului(document);
  const text = document.getText();

  const { sigure, nesigure } = analizeaza(text, { lexicon, puseDeNoi: new Set(stare.puse.keys()) });
  const pozitiiCursor = cursoarele(document);

  const deScris = sigure.filter((s) => !subCursor(s, pozitiiCursor));
  const raman = [];

  for (const nesigura of nesigure) {
    if (subCursor(nesigura, pozitiiCursor)) continue;

    const vecini = vecinii(nesigura, text, dezbraca);
    const ales = context.alege(nesigura.variante, vecini);

    if (ales && ales !== nesigura.text) {
      deScris.push({ ...nesigura, propunere: ales });
    } else if (!ales) {
      raman.push(nesigura);
    }
  }

  if (deScris.length) await scrie(document, deScris, stare);
  arataAmbiguitatile(document, raman, stare);
  return raman;
}

/** Cuvintele din stânga și din dreapta, dezbrăcate, pentru modelul de context. */
function vecinii(bucata, text, dezbraca) {
  const inainte = text.slice(Math.max(0, bucata.start - 40), bucata.start).match(/([\p{L}-]+)\W*$/u);
  const dupa = text.slice(bucata.sfarsit, bucata.sfarsit + 40).match(/^\W*([\p{L}-]+)/u);
  return {
    vecinStanga: inainte ? dezbraca(inainte[1]).toLowerCase() : '‹',
    vecinDreapta: dupa ? dezbraca(dupa[1]).toLowerCase() : '›',
  };
}

const stareBara = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);

function arataInBara(mesaj, sfat) {
  stareBara.text = mesaj;
  stareBara.tooltip = sfat;
  stareBara.command = 'diacritice.comută';
  stareBara.show();
}

/**
 * Trecerea cu Gemini: doar ambiguitățile pe care nici lexiconul, nici contextul
 * nu le-au lămurit, grupate pe propoziții, câte o cerere pe propoziție.
 *
 * Cheia de cache e propoziția cu toate fantele dezbrăcate. Schimbi un cuvânt
 * din frază — cheia se schimbă, întrebarea se pune din nou, iar cuvintele
 * puse de noi se pot revizui. Nu schimbi nimic — răspunsul vine din cache și
 * nu pleacă nicio cerere. De aici vine și purtarea pe care ai cerut-o: „dacă
 * modifici sensul propoziției, cuvintele afectate se ajustează".
 */
async function trecereGemini(document, nesigure) {
  if (!nesigure.length || !setari().get('foloseșteGemini')) return;

  const { propozitii, tokenizeaza, alegeFormele } = await incarcaMotorul();
  const stare = stareaFisierului(document);
  const text = document.getText();

  const grupuri = propozitii(tokenizeaza(text), text);
  const deScris = [];

  for (const grup of grupuri) {
    const fante = nesigure.filter((n) => grup.some((b) => b.start === n.start));
    if (!fante.length) continue;

    let propozitie = '';
    let ultima = grup[0].start;
    const numerotate = [];

    for (const bucata of grup) {
      propozitie += text.slice(ultima, bucata.start);
      const fanta = fante.findIndex((f) => f.start === bucata.start);
      if (fanta >= 0) {
        propozitie += `{${fanta + 1}}`;
        numerotate.push({ numar: fanta + 1, variante: fante[fanta].variante, bucata: fante[fanta] });
      } else {
        propozitie += bucata.text;
      }
      ultima = bucata.sfarsit;
    }

    const cheie = `${propozitie}|${numerotate.map((n) => n.variante.join(',')).join(';')}`;
    let alese = stare.cache.get(cheie);

    if (!alese) {
      try {
        arataInBara('$(sync~spin) diacritice', 'Întreb Gemini despre cuvintele ambigue…');
        alese = await alegeFormele({
          propozitie,
          fante: numerotate.map(({ numar, variante }) => ({ numar, variante })),
          model: setari().get('model'),
        });
        stare.cache.set(cheie, alese);
        arataInBara('$(check) diacritice', 'Diacritice pornite. Apasă pentru a opri.');
      } catch (eroare) {
        // Cotă depășită, rețea căzută: rămân subliniate, ceea ce e purtarea
        // cerută pentru cazurile nesigure. Nu insistăm și nu ghicim.
        arataInBara('$(warning) diacritice', `Gemini nu răspunde: ${eroare.message}`);
        return;
      }
    }

    for (const { numar, bucata } of numerotate) {
      const forma = alese.get?.(numar) ?? alese[numar];
      if (forma && forma !== bucata.text) deScris.push({ ...bucata, propunere: forma });
    }
  }

  const pozitiiCursor = cursoarele(document);
  const sigureDeScris = deScris.filter((s) => !subCursor(s, pozitiiCursor));
  if (sigureDeScris.length) {
    await scrie(document, sigureDeScris, stare);
    // Ce-a lămurit Gemini nu mai are de ce să stea subliniat.
    const ramase = (diagnostice.get(document.uri) ?? []).filter((problema) => !sigureDeScris.some(
      (s) => problema.range.start.isEqual(document.positionAt(s.start)),
    ));
    diagnostice.set(document.uri, ramase);
  }
}

function programeaza(document) {
  const stare = stareaFisierului(document);
  clearTimeout(stare.ceasSigur);
  clearTimeout(stare.ceasGemini);

  stare.ceasSigur = setTimeout(async () => {
    let ramase = [];
    try {
      ramase = await trecereLocala(document);
    } catch (eroare) {
      console.error('diacritice: trecerea locală a eșuat', eroare);
      return;
    }

    stare.ceasGemini = setTimeout(() => {
      trecereGemini(document, ramase).catch((eroare) => {
        console.error('diacritice: trecerea Gemini a eșuat', eroare);
      });
    }, Math.max(0, (setari().get('pauzăGemini') ?? 1400) - (setari().get('pauzăScris') ?? 260)));
  }, setari().get('pauzăScris') ?? 260);
}

function activate(contextExtensie) {
  arataInBara('$(check) diacritice', 'Diacritice pornite. Apasă pentru a opri.');

  contextExtensie.subscriptions.push(
    stareBara,
    diagnostice,

    vscode.workspace.onDidChangeTextDocument((eveniment) => {
      if (NOI_SCRIEM.activ) return;
      if (!esteDeAlNostru(eveniment.document)) return;
      if (!eveniment.contentChanges.length) return;

      mutaPozitiile(stareaFisierului(eveniment.document), eveniment.contentChanges);
      programeaza(eveniment.document);
    }),

    vscode.workspace.onDidCloseTextDocument((document) => {
      const stare = stari.get(document.uri.toString());
      if (stare) { clearTimeout(stare.ceasSigur); clearTimeout(stare.ceasGemini); }
      stari.delete(document.uri.toString());
      diagnostice.delete(document.uri);
    }),

    vscode.commands.registerCommand('diacritice.comută', async () => {
      const pornit = setari().get('pornit');
      await setari().update('pornit', !pornit, vscode.ConfigurationTarget.Global);
      if (pornit) {
        diagnostice.clear();
        arataInBara('$(circle-slash) diacritice', 'Diacritice oprite. Apasă pentru a porni.');
      } else {
        arataInBara('$(check) diacritice', 'Diacritice pornite. Apasă pentru a opri.');
      }
    }),

    vscode.commands.registerCommand('diacritice.reparăTot', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const ramase = await trecereLocala(editor.document);
      await trecereGemini(editor.document, ramase);
      vscode.window.showInformationMessage(
        ramase.length
          ? `Diacritice puse. ${ramase.length} cuvinte au rămas de lămurit — sunt subliniate.`
          : 'Diacritice puse peste tot.',
      );
    }),

    /** Meniul Cmd+. pe un cuvânt subliniat: variantele posibile. */
    vscode.languages.registerCodeActionsProvider(
      (setari().get('limbi') ?? ['mdx', 'markdown']).map((limba) => ({ language: limba })),
      {
        provideCodeActions(document, interval) {
          const stare = stareaFisierului(document);
          const actiuni = [];

          for (const problema of diagnostice.get(document.uri) ?? []) {
            if (!problema.range.intersection(interval)) continue;

            const cheie = `${document.offsetAt(problema.range.start)}:${document.offsetAt(problema.range.end)}`;
            for (const varianta of stare.variante.get(cheie) ?? []) {
              const actiune = new vscode.CodeAction(`Pune „${varianta}"`, vscode.CodeActionKind.QuickFix);
              actiune.edit = new vscode.WorkspaceEdit();
              actiune.edit.replace(document.uri, problema.range, varianta);
              actiune.diagnostics = [problema];
              actiuni.push(actiune);
            }
          }
          return actiuni;
        },
      },
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
  );

  // Încărcăm motorul din timp, ca prima tastare să nu aștepte cele 7,5 MB.
  incarcaMotorul().catch((eroare) => {
    arataInBara('$(error) diacritice', `Motorul nu s-a încărcat: ${eroare.message}`);
  });
}

function deactivate() {
  for (const stare of stari.values()) {
    clearTimeout(stare.ceasSigur);
    clearTimeout(stare.ceasGemini);
  }
}

module.exports = { activate, deactivate };
