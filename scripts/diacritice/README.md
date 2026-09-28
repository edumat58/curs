# Diacritice românești în editor

Pune diacriticele în lecțiile `.mdx` și `.md` **pe măsură ce scrii**, fără să
atingă cod, formule KaTeX, JSX sau frontmatter. Tastezi „impartirea numarului"
și rămâne „împărțirea numărului".

```bash
npm run diacritice:construiește   # o dată: lexicon + model de context
npm run diacritice:instalează     # copiază extensia în VS Code / Cursor
# apoi: Cmd+Shift+P → „Developer: Reload Window"
```

În bara de jos apare `✓ diacritice`. Apasă pe ea ca s-o oprești sau s-o pornești.

---

## Cum decide

Fiecare cuvânt tastat trece pe una din trei uși.

**Sigur** — o singură formă românească se scrie așa fără semne. `impartirea` nu
poate fi decât `împărțirea`. Se aplică pe loc, local, în microsecunde. Aici cad
majoritatea cuvintelor.

**Nesigur** — mai multe forme reale se scriu la fel fără semne. `fata` poate fi
*fata* (copila), *fată*, *fața* sau *față*. Aici dicționarul nu mai ajută și
intră contextul: întâi modelul local de bigrame, iar ce nu lămurește el ajunge
la Gemini. Până se lămurește, cuvântul **rămâne cum l-ai scris** și primește o
subliniere; `Cmd+.` deschide lista variantelor.

**Neatins** — cuvântul are deja diacritice, sau stă într-o zonă protejată.

Regula care ține editorul cinstit: **nu se atinge niciodată de un cuvânt pe care
l-ai scris tu cu diacritice.** Singurele cuvinte pe care și le permite să le
revizuiască sunt cele scrise chiar de el.

## Reajustarea la schimbarea sensului

Deciziile nesigure sunt legate de propoziția în care stau, nu de cuvânt. Schimbi
fraza — se pune întrebarea din nou și cuvintele puse de motor se pot schimba:

| Ce scrii | Ce iese |
|---|---|
| `Am pus farfuria pe masa.` | Am pus farfuria pe **masă**. |
| `Fata a pus cartea pe masa din bucatarie.` | **Fata** a pus cartea pe **masa** din bucătărie. |
| `Fata s-a asezat.` | **Fata** s-a așezat. |
| `L-a lovit peste fata.` | L-a lovit peste **față**. |
| `Am prins un peste in lac.` | Am prins un **pește** în lac. |
| `Am sarit peste gard.` | Am sărit **peste** gard. |

(Primele două rânduri nu se contrazic: româna cere „pe masă" nearticulat, dar
„pe masa din bucătărie" articulat, când urmează un determinant.)

## Ce nu atinge niciodată

Blocuri de cod și `` `cod în rând` ``; formule `$…$` și `$$…$$`; linii `import`
și `export`; etichete JSX cu tot cu atribute — dar **nu** și valorile
atributelor de proză (`title`, `subtitle`, `alt`, `label`), care se
diacritizează; `slug:` și celelalte chei tehnice din frontmatter, spre deosebire
de `title:` și `description:`; adrese web, e-mailuri, entități HTML; expresii
MDX `{…}`.

---

## Din ce e făcut

| Fișier | Ce face |
|---|---|
| `masca-mdx.mjs` | Un scaner cu stare care marchează zonele interzise |
| `motor.mjs` | Lexiconul căutat binar, tokenizarea, propunerile |
| `context.mjs` | Judecata locală după vecini, cu prag calibrat |
| `gemini.mjs` | Dezambiguizarea prin alegere constrânsă |
| `corpus.mjs` | Româna corectă extrasă din lecțiile tale |
| `vscode/` | Extensia propriu-zisă |

Scripturi de construcție: `construieste-lexicon.mjs`, `construieste-context.mjs`,
`curata-ascii.mjs`. Unelte: `repara.mjs` (linie de comandă), `evalueaza.mjs`
(măsurători), `instaleaza.mjs`.

### Datele

Lexiconul are **313.715 chei** și se naște din dicționarul hunspell `ro_RO`
(prin `@cspell/dict-ro-ro`, care îl livrează cu toate formele flexionare
desfăcute — 1.213.189 la număr). Doar **1%** din chei rămân ambigue.

Dicționarul singur nu e de ajuns, din două motive. Tolerează scrierea fără
semne — pentru hunspell „patrat" e la fel de valid ca „pătrat" — și pune pe
același plan cuvinte uzuale și forme pe care nu le scrie nimeni („fâță",
„făța"). Lista de frecvențe OpenSubtitles taie formele inexistente, iar
`ascii-reale.txt` spune care forme fără semne sunt cuvinte adevărate.

Atenție dacă umbli la ele: în subtitrări româna e scrisă **majoritar fără
diacritice** — „si" apare de 1.078.118 ori, „și" doar de 392.140. Frecvența
brută arată deci exact invers decât adevărul, și de aceea e folosită numai
pentru a TĂIA forme inexistente, niciodată pentru a ALEGE între variante.

### Cât de bine merge

Proba se face singură: lecțiile tale sunt deja scrise corect, așa că le dezbrăcăm
de semne și verificăm dacă motorul le pune la loc (`npm run diacritice:evaluează`).

Pe 56.290 de cuvinte de proză, doar cu lexiconul, fără context și fără Gemini:

```
corectate     12009  96,06%   au ieșit exact ca originalul
normalizate      41   0,33%   sedila ţ/ş → virgula corectă ț/ș
îndreptate      442   3,54%   lecția n-avea semne acolo; motorul le-a pus
STRICATE          9   0,07%   ← toate nouă sunt tot corecturi
```

Cele nouă „stricate" sunt `Împarțirea → Împărțirea`, `Nemarginită →
Nemărginită`, `Proprietați → Proprietăți`: originalul avea semnul lipsă.
Pagubă reală: **zero**.

Cu modelul local de context pornit se rezolvă încă ~2.700 de cuvinte, cu cinci
greșeli adevărate — una la 11.000 de cuvinte. Pragul de încredere e ales din
măsurătoarea asta, nu din intuiție; motivarea completă e în `context.mjs`.

La dezambiguizarea prin Gemini, măsurată pe un set de propoziții-capcană:
**20 din 21**, iar singura ratare e ambiguă și pentru un om („a luat nota / notă
de la profesor").

### De ce alegere constrânsă și nu rescriere

Prima variantă cerea modelului să rescrie propoziția cu diacritice. Pe „fata a
pus cartea pe masa din bucatarie" a răspuns:

> „**Fața** a pus cartea pe masa din bucătărie."

Adică *chipul* a pus cartea. Și, mai rău, avea voie să schimbe topica, să adauge
cuvinte, să „îmbunătățească" fraza — inacceptabil pentru ceva ce scrie direct în
fișierul tău.

Acum lexiconul stabilește exact ce variante sunt posibile, iar modelul doar
alege dintr-o listă închisă. Orice răspuns care nu e literalmente una dintre
variantele oferite e aruncat la validare, deci **halucinația e imposibilă**:
modelul nu poate inventa un cuvânt și nu poate rescrie fraza.

## Cheia Gemini

Se citește din `GEMINI_API_KEY`, apoi din `voice-service/.env` și
`backend/.env.local` — aceeași cheie folosită deja de `voice-service`. Nu
trebuie pusă nicăieri din nou.

Fără cheie sau cu cota depășită, motorul lucrează local și lasă cuvintele
ambigue subliniate. Nivelul gratuit limitează cererile **pe minut**, nu doar pe
zi, iar extensia întreabă o dată pe propoziție, cu răspunsurile ținute în cache.

## Reglaje

`Cmd+,` → caută „diacritice": pornit/oprit, ce limbi, dacă folosește Gemini, ce
model, cât să aștepte după ultima tastă (`pauzăScris`, `pauzăGemini`).

Comenzi (`Cmd+Shift+P`): **Diacritice: pornește sau oprește**, **Diacritice:
repară tot fișierul**.

Din linia de comandă:

```bash
npm run diacritice -- docs/c5/modul-1/05.mdx           # arată ce ar schimba
npm run diacritice -- docs/c5/modul-1/05.mdx --scrie   # și le scrie
echo "fata a pus cartea pe masa" | npm run diacritice
```

## Licențe

Dicționarul `ro_RO` (via `@cspell/dict-ro-ro`) e sub GPL-2.0 / LGPL-2.1 /
MPL-1.1. Lista de frecvențe vine din
[hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
(OpenSubtitles, CC-BY-SA-4.0). Niciuna nu ajunge în site-ul publicat: sunt
folosite doar la construirea lexiconului, pe calculatorul tău.
