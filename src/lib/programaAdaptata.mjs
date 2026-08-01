/**
 * Programa adaptată pentru elevii cu cerințe educaționale speciale.
 *
 * ── De unde vine ─────────────────────────────────────────────────────────────
 *
 * Trei surse, în ordinea în care se impun:
 *
 * 1. **Programa școlară de matematică, clasele a V-a – a VIII-a**
 *    (OMEN nr. 3393/28.02.2017). Ea dă conținuturile. Nu se adaugă nimic peste
 *    ele și nu se scoate nimic care nu e listat mai jos ca redus.
 *
 * 2. **Legea nr. 198/2023 a învățământului preuniversitar, art. 69.** Sprijinul
 *    e împărțit pe patru niveluri de intensitate, nu elevii pe categorii. La
 *    nivelul II — suplimentar — elevul „necesită adaptări curriculare parțiale",
 *    cu „o reducere a componentei curriculare cu cel mult 20%". Restul programei
 *    rămâne obligatoriu. Pragul acesta e verificat în cod (`verificaPragul`), nu
 *    apreciat din ochi.
 *
 * 3. **Prioritizarea oficială franceză** — documentele éduscol „Attendus de fin
 *    d'année" (6e–3e). Fiecare domeniu are acolo o linie care spune ce se
 *    păstrează când timpul nu ajunge („Privilégier…") și ce se poate lăsa
 *    („…n'est pas une priorité", „peut être allégé"). Franța a făcut deja munca
 *    de a hotărî ce e miez și ce e podoabă; noi o mapăm pe conținuturile
 *    românești. Fiecare reducere de mai jos poartă linia franceză pe care se
 *    sprijină, în câmpul `temei`.
 *
 * ── Ce NU e ──────────────────────────────────────────────────────────────────
 *
 * Nu e un curriculum separat și nu ține locul certificatului de orientare
 * școlară și profesională emis de COSP, nici al Planului de Servicii
 * Individualizat. E lista de conținuturi pe care se lucrează, ca profesorul să
 * aibă de unde porni când primește un elev cu adaptare curriculară și n-are
 * nimic scris în față.
 *
 * ── Cum se citește ───────────────────────────────────────────────────────────
 *
 * `esential` = ce trebuie să știe fiecare elev, scris ca ce poate face, nu ca
 * titlu de capitol: un titlu nu se poate bifa, o acțiune da.
 *
 * `redus` = ce se scoate, cu temeiul alături. Se listează explicit tocmai ca
 * reducerea să fie verificabilă — o adaptare care nu se poate audita nu apără
 * pe nimeni, nici elevul, nici profesorul.
 */

export const TEMEI_LEGAL = {
  programa: 'Programa școlară de matematică, clasele a V-a – a VIII-a, aprobată prin OMEN nr. 3393/28.02.2017',
  lege: 'Legea nr. 198/2023 a învățământului preuniversitar, art. 69',
  reducereMaxima: 20,
  nivel: 'Nivelul II — suplimentar',
  sursaFranceza: 'Attendus de fin d\'année, éduscol, Ministère de l\'Éducation nationale (Franța)',
};

/* Liniile franceze de prioritizare, citate ca temei al reducerilor. */
const FR = {
  divizibilitate: 'éduscol, 5e: „Les critères de divisibilité ne sont pas une priorité. '
    + 'L\'utilisation de la décomposition en facteurs premiers inférieurs à 30 peut être allégée."',
  calculSimplu: 'éduscol, 6e: „Privilégier les calculs simples sur les nombres décimaux et les fractions, '
    + 'ainsi que l\'application de pourcentages."',
  formule: 'éduscol, 6e: „Privilégier l\'utilisation de formules pour calculer des grandeurs géométriques, '
    + 'les conversions d\'unités et la résolution de problèmes simples."',
  constructii: 'éduscol, 6e: „Privilégier les constructions et les représentations géométriques, '
    + 'ainsi que la verbalisation des procédures utilisées."',
  sensNotiuni: 'éduscol, 5e: „Privilégier le sens des notions et sur des calculs très simples."',
  figuriFundamentale: 'éduscol, 5e: „Pour les calculs de périmètres, d\'aires et de volumes, '
    + 'on privilégie les figures fondamentales."',
  inaltimiMediatoare: 'éduscol, 5e: „Les hauteurs et les médiatrices ne font pas l\'objet de développement."',
  radicalFactorizare: 'éduscol, 4e: „La racine carrée n\'est pas une priorité. '
    + 'La factorisation et la réduction d\'une expression ne sont pas des priorités."',
  ecuatii: 'éduscol, 4e: „Privilégier l\'usage d\'une lettre pour désigner une valeur inconnue, '
    + 'la mise en équation et la résolution des équations du 1er degré."',
  cosinusTriunghiuriEgale: 'éduscol, 4e: „Les triangles égaux, le cosinus, les frises et les pavages '
    + 'ne sont pas des priorités."',
  dublaDistributivitate: 'éduscol, 3e: „L\'utilisation de la double distributivité et la résolution '
    + 'd\'équations produits ne sont pas prioritaires."',
  proportionalitate: 'éduscol, 3e: „Privilégier les différentes procédures de calcul d\'une quatrième '
    + 'proportionnelle, les procédures d\'application et de calcul d\'un pourcentage."',
  formuleVolume: 'éduscol, 3e: „Privilégier les formules donnant les longueurs, aires et volumes '
    + 'et les conversions d\'unités."',
  demonstratie: 'éduscol, 4e: „Si l\'initiation à la démonstration est un objectif, veiller à la compléter '
    + 'par des activités moins abstraites de repérage, de calcul, de construction."',
};

export const PROGRAMA_ADAPTATA = {
  5: [
    {
      domeniu: 'Numere naturale',
      esential: [
        'Scrie, citește și compară numere naturale și le așază pe axa numerelor.',
        'Adună și scade numere naturale.',
        'Înmulțește și împarte numere naturale.',
        'Împarte cu rest și spune care este câtul și care este restul.',
        'Calculează puterea unui număr natural și recunoaște un pătrat perfect.',
        'Aplică regulile de calcul cu puteri: produs, cât, putere a unei puteri.',
        'Efectuează operațiile în ordinea corectă, inclusiv cu paranteze.',
        'Rezolvă probleme prin metoda reducerii la unitate, metoda comparației, '
          + 'metoda figurativă și metoda mersului invers.',
        'Găsește divizorii și multiplii unui număr natural.',
        'Recunoaște un număr prim și un număr compus.',
        'Află cel mai mare divizor comun și cel mai mic multiplu comun a două numere.',
      ],
      redus: [
        { ce: 'Scrierea unui număr în baza 2', temei: FR.calculSimplu },
        { ce: 'Compararea puterilor prin aducere la aceeași bază sau la același exponent', temei: FR.calculSimplu },
        { ce: 'Metoda falsei ipoteze', temei: FR.sensNotiuni },
        { ce: 'Criteriile de divizibilitate cu 10ⁿ', temei: FR.divizibilitate },
      ],
    },
    {
      domeniu: 'Fracții ordinare și fracții zecimale',
      esential: [
        'Recunoaște o fracție subunitară, echiunitară sau supraunitară.',
        'Amplifică și simplifică o fracție și o scrie sub formă ireductibilă.',
        'Compară fracții cu același numitor sau cu același numărător.',
        'Aduce două fracții la același numitor.',
        'Adună și scade fracții ordinare.',
        'Înmulțește și împarte fracții ordinare.',
        'Calculează o fracție sau un procent dintr-un număr.',
        'Scrie, compară și ordonează fracții zecimale.',
        'Adună, scade și înmulțește fracții zecimale.',
        'Împarte fracții zecimale.',
        'Calculează media aritmetică a mai multor numere.',
        'Citește un tabel, un grafic cu bare și un grafic cu linii.',
      ],
      redus: [
        { ce: 'Transformarea unei fracții zecimale periodice în fracție ordinară', temei: FR.calculSimplu },
        { ce: 'Ridicarea fracțiilor ordinare la putere', temei: FR.calculSimplu },
      ],
    },
    {
      domeniu: 'Elemente de geometrie și unități de măsură',
      esential: [
        'Recunoaște și notează punctul, dreapta, semidreapta, segmentul și planul.',
        'Recunoaște puncte coliniare, drepte concurente și drepte paralele.',
        'Măsoară un segment, află mijlocul lui și construiește simetricul unui punct.',
        'Măsoară un unghi cu raportorul și construiește un unghi de măsură dată.',
        'Clasifică un unghi: nul, ascuțit, drept, obtuz, alungit.',
        'Adună măsuri de unghiuri exprimate în grade și minute.',
        'Calculează perimetrul și aria pătratului și ale dreptunghiului.',
        'Calculează volumul cubului și al paralelipipedului dreptunghic.',
        'Transformă unități de lungime, de arie, de volum, de masă și de timp.',
      ],
      redus: [
        { ce: 'Axa de simetrie determinată prin pliere', temei: FR.constructii },
      ],
    },
  ],

  6: [
    {
      domeniu: 'Mulțimi. Divizibilitate',
      esential: [
        'Scrie o mulțime prin enumerarea elementelor și spune câte elemente are.',
        'Face reuniunea, intersecția și diferența a două mulțimi.',
        'Descompune un număr natural în produs de factori primi.',
        'Află cel mai mare divizor comun și cel mai mic multiplu comun folosind descompunerea.',
      ],
      redus: [
        { ce: 'Proprietățile relației de divizibilitate, demonstrate', temei: FR.divizibilitate },
        { ce: 'Numere prime între ele', temei: FR.divizibilitate },
      ],
    },
    {
      domeniu: 'Rapoarte și proporții',
      esential: [
        'Scrie un raport și calculează valoarea lui.',
        'Află termenul necunoscut dintr-o proporție.',
        'Rezolvă probleme cu mărimi direct proporționale.',
        'Rezolvă probleme cu mărimi invers proporționale.',
        'Aplică regula de trei simplă.',
        'Calculează un procent dintr-un număr și numărul când se cunoaște procentul.',
        'Citește și completează un tabel sau un grafic cu date.',
        'Calculează probabilitatea unui eveniment simplu.',
      ],
      redus: [
        { ce: 'Proporții derivate', temei: FR.proportionalitate },
        { ce: 'Șirul de rapoarte egale cu mai mult de două rapoarte', temei: FR.proportionalitate },
      ],
    },
    {
      domeniu: 'Numere întregi',
      esential: [
        'Așază numerele întregi pe axa numerelor și spune care e opusul unui număr.',
        'Calculează modulul unui număr întreg.',
        'Compară și ordonează numere întregi.',
        'Adună și scade numere întregi.',
        'Înmulțește și împarte numere întregi.',
        'Calculează puteri cu exponent natural ale unui număr întreg.',
        'Rezolvă ecuații și inecuații simple în mulțimea numerelor întregi.',
      ],
      redus: [],
    },
    {
      domeniu: 'Numere raționale',
      esential: [
        'Recunoaște un număr rațional și îl așază pe axa numerelor.',
        'Compară și ordonează numere raționale.',
        'Adună și scade numere raționale.',
        'Înmulțește și împarte numere raționale.',
        'Rezolvă ecuații de tipul $x + a = b$, $ax = b$ și $ax + b = c$.',
      ],
      redus: [
        { ce: 'Puterea cu exponent număr întreg a unui număr rațional nenul', temei: FR.sensNotiuni },
      ],
    },
    {
      domeniu: 'Noțiuni geometrice fundamentale',
      esential: [
        'Recunoaște unghiuri opuse la vârf și știe că au aceeași măsură.',
        'Recunoaște unghiuri adiacente, complementare și suplementare și le calculează măsura.',
        'Construiește bisectoarea unui unghi și calculează măsurile care apar.',
        'Recunoaște drepte paralele tăiate de o secantă și calculează măsurile unghiurilor formate.',
        'Construiește drepte paralele și drepte perpendiculare.',
        'Recunoaște elementele unui cerc: centru, rază, coardă, diametru, arc.',
      ],
      redus: [
        { ce: 'Mediatoarea unui segment, construcție și proprietăți', temei: FR.inaltimiMediatoare },
        { ce: 'Pozițiile relative a două cercuri', temei: FR.constructii },
      ],
    },
    {
      domeniu: 'Triunghiul',
      esential: [
        'Clasifică un triunghi după laturi și după unghiuri.',
        'Calculează perimetrul unui triunghi.',
        'Folosește faptul că suma măsurilor unghiurilor unui triunghi este $180^\\circ$.',
        'Calculează măsura unui unghi exterior.',
        'Verifică dacă trei lungimi pot fi laturile unui triunghi.',
        'Recunoaște triunghiuri congruente folosind criteriile de congruență.',
        'Folosește proprietățile triunghiului isoscel și ale celui echilateral.',
        'Verifică dacă un triunghi este dreptunghic folosind teorema lui Pitagora.',
      ],
      redus: [
        { ce: 'Concurența înălțimilor și a mediatoarelor; cercul înscris și cercul circumscris', temei: FR.inaltimiMediatoare },
        { ce: 'Metoda triunghiurilor congruente ca metodă de demonstrație', temei: FR.demonstratie },
      ],
    },
  ],

  7: [
    {
      domeniu: 'Mulțimea numerelor reale',
      esential: [
        'Calculează rădăcina pătrată a unui pătrat perfect.',
        'Scoate factorii de sub radical.',
        'Recunoaște un număr irațional și știe incluziunile $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$.',
        'Calculează modulul unui număr real.',
        'Compară și ordonează numere reale.',
        'Estimează între ce numere naturale se află rădăcina pătrată a unui număr.',
        'Adună, scade, înmulțește și împarte numere reale.',
        'Calculează media aritmetică a mai multor numere reale.',
        'Calculează media geometrică a două numere pozitive.',
        'Rezolvă ecuația $x^2 = a$.',
      ],
      redus: [
        { ce: 'Raționalizarea numitorului de forma $a\\sqrt{b}$', temei: FR.radicalFactorizare },
      ],
    },
    {
      domeniu: 'Ecuații și sisteme de ecuații',
      esential: [
        'Rezolvă ecuația de forma $ax + b = 0$.',
        'Verifică dacă un număr este soluția unei ecuații.',
        'Transformă un enunț în ecuație și îl rezolvă.',
        'Transformă o egalitate într-o egalitate echivalentă.',
        'Rezolvă un sistem de două ecuații cu două necunoscute prin metoda substituției sau a reducerii.',
      ],
      redus: [
      ],
    },
    {
      domeniu: 'Organizarea datelor',
      esential: [
        'Scrie produsul cartezian a două mulțimi mici.',
        'Așază puncte într-un sistem de axe ortogonale și le citește coordonatele.',
        'Calculează distanța dintre două puncte din plan.',
        'Citește un tabel, o diagramă și un grafic.',
      ],
      redus: [
        { ce: 'Poligonul frecvențelor', temei: FR.proportionalitate },
      ],
    },
    {
      domeniu: 'Patrulaterul',
      esential: [
        'Folosește faptul că suma măsurilor unghiurilor unui patrulater convex este $360^\\circ$.',
        'Folosește proprietățile paralelogramului: laturi opuse, unghiuri, diagonale.',
        'Recunoaște dreptunghiul, rombul și pătratul și le folosește proprietățile.',
        'Recunoaște trapezul și calculează linia mijlocie.',
        'Calculează linia mijlocie într-un triunghi.',
        'Recunoaște centrul de greutate al unui triunghi și folosește raportul $2:1$ pe mediană.',
        'Calculează perimetre și arii: paralelogram, dreptunghi, romb, pătrat, triunghi, trapez.',
      ],
      redus: [
        { ce: 'Proprietățile trapezului isoscel, demonstrate', temei: FR.demonstratie },
      ],
    },
    {
      domeniu: 'Cercul',
      esential: [
        'Calculează măsura unui unghi înscris în cerc.',
        'Recunoaște poligoanele regulate înscrise în cerc.',
        'Calculează lungimea cercului și aria discului.',
      ],
      redus: [
        { ce: 'Proprietățile coardelor și ale arcelor, demonstrate', temei: FR.demonstratie },
        { ce: 'Tangente dintr-un punct exterior la un cerc', temei: FR.constructii },
      ],
    },
    {
      domeniu: 'Asemănarea triunghiurilor',
      esential: [
        'Aplică teorema lui Thales pentru a afla o lungime.',
        'Recunoaște triunghiuri asemenea și scrie raportul de asemănare.',
        'Calculează lungimi folosind asemănarea.',
        'Folosește faptul că raportul ariilor a două triunghiuri asemenea este pătratul raportului de asemănare.',
      ],
      redus: [
        { ce: 'Reciproca teoremei lui Thales', temei: FR.demonstratie },
        { ce: 'Împărțirea unui segment în părți proporționale', temei: FR.constructii },
      ],
    },
    {
      domeniu: 'Relații metrice în triunghiul dreptunghic',
      esential: [
        'Aplică teorema lui Pitagora pentru a afla o latură.',
        'Aplică teorema înălțimii și teorema catetei în triunghiul dreptunghic.',
        'Verifică dacă un triunghi este dreptunghic folosind reciproca teoremei lui Pitagora.',
        'Cunoaște valorile sinusului, cosinusului și tangentei pentru $30^\\circ$, $45^\\circ$ și $60^\\circ$.',
        'Calculează elemente în triunghiul echilateral și în pătrat.',
      ],
      redus: [
        { ce: 'Cotangenta', temei: FR.cosinusTriunghiuriEgale },
        { ce: 'Elemente în hexagonul regulat', temei: FR.figuriFundamentale },
      ],
    },
  ],

  8: [
    {
      domeniu: 'Intervale de numere reale. Inecuații',
      esential: [
        'Scrie un interval de numere reale și îl reprezintă pe axa numerelor.',
        'Recunoaște o mulțime definită printr-o proprietate a elementelor ei.',
        'Face intersecția și reuniunea a două intervale.',
        'Rezolvă o inecuație de forma $ax + b \\ge 0$.',
      ],
      redus: [],
    },
    {
      domeniu: 'Calcul algebric',
      esential: [
        'Reduce termenii asemenea dintr-o expresie.',
        'Desface parantezele folosind distributivitatea simplă.',
        'Aplică formulele $(a \\pm b)^2$ și $(a-b)(a+b)$.',
        'Descompune în factori scoțând factorul comun.',
        'Descompune în factori folosind formula $a^2 - b^2$.',
        'Simplifică o fracție algebrică.',
        'Spune pentru ce valori o fracție algebrică nu are sens.',
        'Rezolvă ecuația de gradul al doilea prin descompunere în factori.',
      ],
      redus: [
        { ce: 'Descompunerea în factori prin gruparea termenilor', temei: FR.dublaDistributivitate },
        { ce: 'Ridicarea la putere a fracțiilor algebrice', temei: FR.dublaDistributivitate },
      ],
    },
    {
      domeniu: 'Funcții. Organizarea datelor',
      esential: [
        'Citește o funcție definită pe o mulțime finită dintr-un tabel de valori.',
        'Calculează imaginea unui număr printr-o funcție $f(x) = ax + b$.',
        'Află antecedentul unui număr printr-o funcție $f(x) = ax + b$.',
        'Reprezintă grafic o funcție de gradul I.',
        'Citește de pe grafic valori ale unei funcții.',
        'Calculează media, mediana, modul și amplitudinea unui set de date.',
      ],
      redus: [],
    },
    {
      domeniu: 'Geometrie în spațiu',
      esential: [
        'Recunoaște și denumește corpurile studiate: prismă, piramidă, cub, paralelipiped, cilindru, con.',
        'Identifică muchiile, fețele și vârfurile unui corp.',
        'Recunoaște drepte paralele și drepte perpendiculare într-un corp.',
        'Recunoaște înălțimea unui corp.',
        'Desenează desfășurarea unui cub, a unui paralelipiped și a unui cilindru.',
        'Calculează distanța de la un punct la un plan în corpurile studiate.',
        'Recunoaște unghiul dintre o dreaptă și un plan.',
      ],
      redus: [
        { ce: 'Teorema celor trei perpendiculare', temei: FR.demonstratie },
        { ce: 'Unghiul diedru și unghiul plan corespunzător', temei: FR.demonstratie },
        { ce: 'Secțiuni diagonale și secțiuni axiale', temei: FR.figuriFundamentale },
      ],
    },
    {
      domeniu: 'Arii și volume',
      esential: [
        'Calculează aria laterală, aria totală și volumul paralelipipedului dreptunghic și ale cubului.',
        'Calculează aria laterală și volumul prismei drepte.',
        'Calculează volumul piramidei regulate.',
        'Calculează aria laterală și volumul cilindrului circular drept.',
        'Calculează volumul conului circular drept.',
        'Calculează diagonala paralelipipedului dreptunghic.',
        'Calculează aria și volumul sferei.',
      ],
      redus: [
        { ce: 'Trunchiul de piramidă regulată: arii și volum', temei: FR.formuleVolume },
        { ce: 'Trunchiul de con circular drept: arii și volum', temei: FR.formuleVolume },
      ],
    },
  ],
};

/**
 * Verifică pragul legal: reducerea nu poate trece de 20% din conținuturi.
 *
 * Se numără elementele, nu orele — programa dă conținuturi, nu un buget de timp.
 * E o măsură aproximativă a „componentei curriculare", dar are avantajul că se
 * poate verifica automat și că nu depinde de cine o citește.
 *
 * @returns {{clasa, esential, redus, procent, inLimita}[]}
 */
export function verificaPragul() {
  return Object.entries(PROGRAMA_ADAPTATA).map(([clasa, domenii]) => {
    const esential = domenii.reduce((s, d) => s + d.esential.length, 0);
    const redus = domenii.reduce((s, d) => s + d.redus.length, 0);
    const procent = (redus / (esential + redus)) * 100;
    return {
      clasa: Number(clasa),
      esential,
      redus,
      procent: Math.round(procent * 10) / 10,
      inLimita: procent <= TEMEI_LEGAL.reducereMaxima,
    };
  });
}
