# Cum se scrie un transcript de lecție

Transcriptul este ce AUDE elevul, cuvânt cu cuvânt, și ce VEDE în player.
Se scrie ca și cum un profesor bun ar explica lecția la tablă: limpede, cald,
fără grabă și fără nimic în plus. Etalonul este `transcripts/c6/modul-1/01.md`.

## Forma fișierului

```
---
identitate: MAT-06-C01-0-0
ruta: /docs/c6/modul-1/01
titlu: "C1 - Multiplii si divizori"
titluri:
  - "Vocabular"
  - "Criterii de divizibilitate"
stare: propus
sursa: docs/c6/modul-1/01.md
---
<textul, paragrafe despărțite de linii goale>
```

Frontmatter-ul vine gata calculat — se copiază NESCHIMBAT. `stare: propus`
înseamnă că textul așteaptă aprobarea omului; nimeni nu generează audio din el
automat.

## Regulile de fier

1. **Titlul lecției este prima frază**, copiat întocmai, urmat de o introducere
   de 1–2 fraze: „În acest curs vom aborda… O să înveți…".

2. **Fiecare titlu de secțiune se rostește exact cum e scris în material** —
   literă cu literă, cu tot cu prefixe („a) Cu ajutorul raportorului", „1.
   Demonstrația…"), în ordinea din material. Niciun titlu sărit, niciunul
   inventat.

3. **Fiecare secțiune vorbește DOAR despre conținutul ei.** Exemplul din
   secțiunea a doua se spune în secțiunea a doua, cu numerele LUI. Regula cea
   mai des încălcată — și motivul pentru care există verificatorul: e ușor să
   repeți exemplul dinainte și să-l pierzi pe cel nou. Toate numerele unui
   exemplu se rostesc: enunț, pași intermediari, rezultat.

4. **Nimic din material nu se sare**: fiecare definiție, fiecare proprietate,
   fiecare exemplu cu valorile lui exacte, fiecare observație. Transcriptul e
   lecția întreagă, nu un rezumat.

5. **Formulele rămân formule**: se scriu între dolari, `$24 = 6 \times 4$`, cu
   LaTeX-ul sursei. Ele se randează frumos în transcript și se rostesc corect
   de sinteză. NU se transcrie formula în cuvinte („douăzeci și patru egal…") —
   asta o face sistemul.

6. **Literele singure se marchează**: `<a>`, `<b>`, `<k>`, `<x>` — ca vocea să
   spună numele literei, nu s-o mormăie. În perechi de coordonate sau nume
   geometrice de mai multe litere NU se marchează (AB, MON rămân așa, în
   formule).

7. **Zecimalele cu virgulă și cifre**: „0,54", nu „zero virgulă cincizeci și
   patru". Numerele mari se scriu normal: „3 850". Numerele mici din vorbirea
   curentă pot fi litere („trei divizori").

8. **Figurile nu se pomenesc** („în figură vedem…" — interzis). Ce ÎNVAȚĂ
   desenul se spune ca fapt: „segmentele OP și ON au aceeași lungime". Ce e
   doar desenat (repere, axe, bare) se VEDE pe ecran — nu se recită.

9. **Terminologia școlară românească**: tg, ctg (nu tan/cot), „ipotenuză",
   „catetă", „numărător"/„numitor", „membru stâng", „a patra proporțională",
   „supra" la fracții. Fără anglicisme, fără emoji.

10. **Legături scurte între idei**, ca la clasă: „Să luăm un exemplu.", „Observă
    că…", „De aici vine…", iar la final de secțiune, unde ajută, o frază de
    reținut: „Reține că…". Fără formule goale de politețe, fără „în concluzie".

## Cum se verifică

```
node voice-service/src/verifica-structura.mjs transcripts/<cale>.md
```

Verificatorul se rulează OBLIGATORIU după scriere și textul se corectează până
nu mai raportează nicio problemă. El prinde: secțiuni lipsă sau în altă ordine,
exemple rătăcite între secțiuni (pe numere), LaTeX scăpat în afara formulelor,
marcaje stricate, nume fonetice în textul scris, semne care nu se pot rosti.

Avertismentele (~) se citesc cu ochii: unele sunt zgomot, altele sunt conținut
pierdut. La îndoială, se compară cu sursa completă:

```
node voice-service/src/arata-sursa.mjs docs/<cale>
```
