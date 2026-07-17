---
title: "Organigramă"
sidebar_position: 0
slug: /c5/organigrama
hide_title: false
description: ""
---
import React, { useState } from 'react';


export default function LectiiTreeView() {
  

  const saptamani = [
    {
      hide: true,
      titlu: 'Săptămâna 22: 16.03 - 20.03',
      note: 'Materiale incarcate',
      lectii: [
      ],
    },
    {
      titlu: 'Săptămâna 21: 09.03 - 13.03',
      note: 'TEST FRACTII | [NOTA 6] C22 -> C24',
      lectii: [
        {titlu: 'C25 - Scrierea numerelor zecimale neperiodice sub formă de fracții ordinare', zi: '09.03', tip: 'Algebra', link: 'c5/modul-4/04', pdf: ''},
        {titlu: 'LP - Scrierea numerelor zecimale neperiodice sub formă de fracții ordinare', zi: '10.03 (ora 1)', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'LP - RECAPITULARE TEST', zi: '10.03 (ora 2)', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'TEST FRACTII | [NOTA 6] C22 -> C24', zi: '10.03 (ora 1)', tip: 'Algebra', link: '', pdf: ''},
      ],
    },
    {
      titlu: 'Săptămâna 20: 02.03 - 06.03',
      note: 'Materiale incarcate',
      lectii: [
      ],
    },
    {
      titlu: 'Săptămâna 19: 23.02 - 27.02',
      note: 'Modulul 4: 23.02 -> 03.04',
      lectii: [
      ],
    },
    {
      titlu: 'Săptămâna 18: 09.02 - 13.02 | FINAL MODUL 3',
      note: '',
      lectii: [
        { titlu: 'LP - Amplificarea și simplificarea fracțiilor', zi: '09.02', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C21.1 - Cel mai mic multiplu comun a două numere naturale', zi: '10.02 (ora 1)', tip: 'Algebra', link: 'c5/modul-3/08', pdf: '' },
        { titlu: 'LP - Cel mai mic multiplu comun a două numere naturale', zi: '10.02 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C21.2 - Aducerea fracțiilor la un numitor comun', zi: '11.02', tip: 'Algebra', link: 'c5/modul-3/09', pdf: '' },
        { titlu: 'LP - Aducerea fracțiilor la un numitor comun', zi: '12.02', tip: 'Algebra', link: '', pdf: '' },  

      ],
    },
    {
      titlu: 'Săptămâna 17: 02.02 - 06.02',
      note: 'TEST 05.02 [NOTA a 4-a] | C19.1 -> C19.5',
      lectii: [
        { titlu: 'C20.1 - Cel mai mare divizor comun a două numere naturale', zi: '03.02 (ora 1)', tip: 'Algebra', link: 'c5/modul-3/06', pdf: '' },
        { titlu: 'LP - Cel mai mare divizor comun a două numere naturale', zi: '03.02 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C20.2 - Amplificarea și simplificarea fracțiilor', zi: '04.02', tip: 'Algebra', link: 'c5/modul-3/07', pdf: '' },
        { titlu: 'TEST 05.02 [NOTA a 4-a] | C19.1 -> C19.5', zi: '05.02', tip: 'Algebra', link: '', pdf: '' },  
      ],
    },
    {
      hide: true,
      titlu: 'Săptămâna 16: 26.01 - 30.01',
      note: '',
      lectii: [
        { titlu: 'C19.4 - Reprezentarea pe axa numerelor a unei fracții ordinare', zi: '26.01', tip: 'Algebra', link: 'c5/modul-3/04', pdf: '' },
        { titlu: 'LP - Reprezentarea pe axa numerelor a unei fracții ordinare', zi: '27.01 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C19.5 - Introducerea și scoaterea întregilor dintr-o fracție', zi: '27.01 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Introducerea și scoaterea întregilor dintr-o fracție', zi: '27.01 (ora 3)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Introducerea și scoaterea întregilor dintr-o fracție', zi: '21.01', tip: 'Algebra', link: 'c5/modul-3/05', pdf: '' },
        { titlu: 'LP - Introducerea și scoaterea întregilor dintr-o fracție', zi: '22.01', tip: 'Algebra', link: '', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 15: 19.01 - 23.01',
      note: '',
      lectii: [
        { titlu: 'LP - Calcul procentual şi fracții', zi: '19.01', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Calcul procentual şi fracții', zi: '20.01 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Calcul procentual şi fracții', zi: '20.01 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C19.3 - Compararea fracțiilor cu același numitor sau numărător', zi: '21.01', tip: 'Algebra', link: 'c5/modul-3/03', pdf: '' },
        { titlu: 'LP - Compararea fracțiilor cu același numitor sau numărător', zi: '22.01', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
  {
      titlu: 'Săptămâna 14: 12.01 - 16.01',
      note: 'Modulul 3: 08.01.2026 -> 13.02.2026',
      lectii: [
        { titlu: 'PROIECT', zi: '08.01', tip: 'Proiect', link: 'c5/modul-3/00', pdf: '' },
        { titlu: 'C19.1 - Fracții subunitare, echiunitare şi supraunitare', zi: '12.01', tip: 'Algebra', link: 'c5/modul-3/01', pdf: '' },
        { titlu: 'LP - Fracții subunitare, echiunitare şi supraunitare', zi: '13.01 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Fracții subunitare, echiunitare şi supraunitare', zi: '13.01 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C19.2 - Procente şi fracții echivalente', zi: '14.01', tip: 'Algebra', link: 'c5/modul-3/02', pdf: '' },
        { titlu: 'LP - Procente şi fracții echivalente', zi: '15.01', tip: 'Algebra', link: '', pdf: '' },

      ],
    },
      {
      titlu: 'Săptămâna 13: 08.12 - 12.12 | FINAL MODUL 2',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - REZOLVARE TEST', zi: '08.12', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C18 - Numar prim si numar compus (1)', zi: '09.12 (ora 1)', tip: 'Algebra', link: 'c5/modul-2/10', pdf: '' },
        { titlu: 'C18 - Numar prim si numar compus (2)', zi: '09.12 (ora 2)', tip: 'Algebra', link: 'c5/modul-2/10', pdf: '' },
        { titlu: 'LP - Numar prim si numar compus', zi: '10.12', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Numar prim si numar compus', zi: '11.12', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
      {
      titlu: 'Săptămâna 12: 02.12 - 05.12',
      note: '1 decembrie liber',
      lectii: [
        { titlu: 'C17 - Criterii de divizibilitate', zi: '02.12 (ora 1)', tip: 'Algebra', link: 'c5/modul-2/9', pdf: '' },
        { titlu: 'LP - Criterii de divizibilitate', zi: '02.12 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'RECAPITULARE TEST', zi: '03.12', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST 4.12 [NOTA 3]: C15.1 - C16 și G1 - G2', zi: '04.12', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
      ],
    },
      {
      titlu: 'Săptămâna 11: 24.11 - 28.11',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'G2 - Semiplan, semidreaptă și segment', zi: '24.11', tip: 'Geometrie', link: 'c5/modul-2/6', pdf: '' },
        { titlu: 'LP - Semiplan, semidreaptă și segment', zi: '25.11 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C15.5 - Metoda falsei ipoteze', zi: '25.11 (ora 2)', tip: 'Algebra', link: 'c5/modul-2/7', pdf: '' },
        { titlu: 'LP - Metoda falsei ipoteze', zi: '26.11 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C16 - Divizori și multiplii.', zi: '27.11', tip: 'Algebra', link: 'c5/modul-2/8', pdf: '' },
      ],
    },
      {
      titlu: 'Săptămâna 10: 17.11 - 21.11',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C15.4 - Metoda mersului invers', zi: '17.11', tip: 'Algebra', link: 'c5/modul-2/4', pdf: '' },
        { titlu: 'LP - Metoda mersului invers', zi: '18.11 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Metoda mersului invers', zi: '18.11 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'G1 - Punct, dreaptă și plan', zi: '19.11 (ora 1)', tip: 'Geometrie', link: 'c5/modul-2/5', pdf: '' },
        { titlu: 'LP - Punct, dreaptă și plan', zi: '19.11 (ora 2)', tip: 'Geometrie', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 9: 10.11 - 14.11',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Metoda reducerii la unitate', zi: '10.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Metoda Comparatiei', zi: '11.11 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C15.3 - Metoda figurativă', zi: '11.11 (ora 2)', tip: 'Algebra', link: 'c5/modul-2/3', pdf: '' },
        { titlu: 'LP - Metoda figurativă', zi: '12.11', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 8: 03.11 - 07.11',
      note: 'Modulul 2: 03.11.2025 -> 19.12.2025',
      lectii: [
        { titlu: 'C15.1 - Metoda reducerii la unitate', zi: '03.11', tip: 'Algebra', link: 'c5/modul-2/1', pdf: '' },
        { titlu: 'C15.1 - Metoda reducerii la unitate', zi: '04.11 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Metoda reducerii la unitate', zi: '04.11 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP (RELUARE) - Metoda reducerii la unitate', zi: '05.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C15.2 - Metoda Comparatiei', zi: '06.11', tip: 'Algebra', link: 'c5/modul-2/2', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 7 - 20.10 - 24.10 | FINAL MODUL 1',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C14 - Media aritmetica a doua numere', zi: '20.10', tip: 'Algebra', link: 'c5/modul-1/16', pdf: '' },
        { titlu: 'LP - Media aritmetica', zi: '21.10', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - RECAPITULARE TEST', zi: '22.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST 2 (C7.1 -> C14) | 50% NOTA 2 [2/2]', zi: '22.10 (ora 2)', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
        { titlu: 'LP - REZOLVARE TEST si TEMA DE VACANTA', zi: '23.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 6 - 13.10 - 17.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Compararea puterilor', zi: '13.10', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C12 - Scrierea în baza 10 și baza 2', zi: '14.10', tip: 'Algebra', link: 'c5/modul-1/14', pdf: '' },
        { titlu: 'LP - Scrierea în baza 10 și baza 2 si REEVALUARE - ELEVI ABSENTI TEST 1', zi: '15.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C13 - Ordinea efectuarii operatiilor', zi: '15.10 (ora 2)', tip: 'Algebra', link: 'c5/modul-1/15', pdf: '' },
        { titlu: 'LP - Ordinea efectuarii operatiilor', zi: '16.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 5 - 06.10 - 10.10',
      note: 'Materiale încărcate',
      lectii: [
        { titlu: 'C10 - Factor comun', zi: '06.10', tip: 'Algebra', link: 'c5/modul-1/12', pdf: '' },
        { titlu: 'LP - Inmultiri si factorizare', zi: '07.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C11 - Compararea nr. ridicate la o putere și pătratul perfect', zi: '07.10 (ora 2)', tip: 'Algebra', link: 'c5/modul-1/13', pdf: '' },
        { titlu: 'LP - Operatii cu puteri', zi: '09.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Operatii cu puteri', zi: '09.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 4 - 29.09 - 03.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C8 - Proprietati ale inmultirii (1)', zi: '30.09', tip: 'Algebra', link: 'c5/modul-1/10.mdx', pdf: '' },
        { titlu: 'C8.1 - Proprietati ale inmultirii (2)', zi: '', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Inmultiri', zi: '02.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'Seminar Anti-Bullying SALVATI COPIII', zi: '02.10 (ora 2)', tip: 'EXTRASCOLAR', link: '', pdf: '' },
        { titlu: 'C9 - Proprietati puteri cu exponent natural', zi: '03.10', tip: 'Algebra', link: 'c5/modul-1/11', pdf: '' },
      ],
    },   
    {
      titlu: 'Săptămâna 3 - 22.09 - 26.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C7.1 - Ilustrarea fractiilor echiunitare, subunitare si supraunitare', zi: '23.09', tip: 'Algebra', link: 'c5/modul-1/08', pdf: '' },
        { titlu: 'TEST DIN LECTIA DE ZI (C6.2) | 100% NOTA 1', zi: '23.09', tip: 'EVALUARE FORMATIVA', link: '', pdf: '' },
        { titlu: 'CORECTARE TEST', zi: '24.09', tip: 'CORECTARE', link: '', pdf: '' },
        { titlu: 'C7.2 - Fractii si scrierea procentuala', zi: '25.09', tip: 'Algebra', link: 'c5/modul-1/09', pdf: '' },
        { titlu: 'LP - Fractii si RECAPITULARE TEST', zi: '26.09 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST 1 (C1 -> C6.2) | 50% NOTA 2 [1/2]', zi: '26.09 (ora 2)', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 2: 15.09 - 19.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C5 - Semidreapta gradata', zi: '16.09', tip: 'Algebra', link: 'c5/modul-1/05', pdf: '' },
        { titlu: 'LP - Semidreapta gradata', zi: '17.09', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C6.1 - Multimi. Multimea nr. naturale', zi: '18.09', tip: 'Algebra', link: 'c5/modul-1/06', pdf: '' },
        { titlu: 'C6.2 - Scrierea si citirea nr. naturale', zi: '19.09 (ora 1)', tip: 'Algebra', link: 'c5/modul-1/07', pdf: '' },
        { titlu: 'LP - Scrierea si citirea nr. naturale', zi: '19.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 1: 08.09 - 12.09',
      note: 'Modulul 1: 08.09.2025 -> 25.10.2025',
      lectii: [
        { titlu: 'C1 - Scrierea sub forma zecimala', zi: '10.09.2025', tip: 'Algebra', link: 'c5/modul-1/01', pdf: '' },
        { titlu: 'C2 - Adunarea si scaderea nr. zecimale', zi: '11.09.2025 (ora 1)', tip: 'Algebra', link: 'c5/modul-1/02', pdf: '' },
        { titlu: 'C3 - Inmultirea numerelor zecimale', zi: '11.09.2025 (ora 2)', tip: 'Algebra', link: 'c5/modul-1/03', pdf: '' },
        { titlu: 'C4 - Impartirea Euclidiana. Impartirea nr. zecimale', zi: '12.09.2025', tip: 'Algebra', link: 'c5/04', pdf: '' },
      ],
    },
  ];

  const [query, setQuery] = useState('');
  const [expandedSaptamani, setExpandedSaptamani] = useState(saptamani.map(() => false));
  const [tipFilter, setTipFilter] = useState('');

  const toggleAll = () => {
    const allExpanded = expandedSaptamani.every(Boolean);
    setExpandedSaptamani(expandedSaptamani.map(() => !allExpanded));
  };

  const toggleSaptamana = (idx) => {
    const updated = [...expandedSaptamani];
    updated[idx] = !updated[idx];
    setExpandedSaptamani(updated);
  };

  const filtered = saptamani.map((s, idx) => {
    const lectiiFiltrate = s.lectii.filter((lec) => {
      const matchesQuery =
        lec.titlu.toLowerCase().includes(query.toLowerCase()) ||
        lec.zi.toLowerCase().includes(query.toLowerCase());
      const matchesTip = tipFilter === '' || lec.tip === tipFilter;
      return matchesQuery && matchesTip;
    });
    return { ...s, lectii: lectiiFiltrate, idx };
  }).filter((s) => (s.lectii.length > 0 || s.note) && !s.hide);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <hr />
      <h2>
      Grila de notare
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>PONDERE</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 1</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 2</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 3</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 4</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 5</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 6</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 7</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 8</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 9</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 10</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nota 11</th>
            
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>50% (1/2)</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>26.09</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>100% (2/2)</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>23.09</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>22.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>04.12</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>05.02</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>10.02</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>10.03</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
        </tbody>
      </table>
      <h2>
      Proiecte
      </h2>
      <ul>
      <li>PROIECT 10.02 | "Numere de ieri şi de azi..." & "Dăruieşte un meniu sănătos"  - <b>100% NOTA 5</b></li>
      </ul>
      <h2>
      Orar - 5 ore/saptamana
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Luni</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Marți</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Miercuri</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Joi</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Vineri</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>8:00 - 8:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>8:00 - 8:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>13:00 - 13:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>9:00 - 9:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>13:00 - 13:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
        </tbody>
      </table>
      <input
        type="text"
        placeholder="Caută lecție sau zi..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      <select
        value={tipFilter}
        onChange={(e) => setTipFilter(e.target.value)}
        style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', width: 'fit-content' }}
      >
        <option value="">Toate tipurile</option>
        <option value="Algebra">Algebra</option>
        <option value="Geometrie">Geometrie</option>
      </select>
      <button
        onClick={toggleAll}
        style={{
          alignSelf: 'flex-start',
          padding: '0.5rem 1rem',
          fontWeight: 'bold',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        {expandedSaptamani.every(Boolean) ? 'Ascunde tot' : 'Arată tot'}
      </button>

      {filtered.map((s) => (
        <div key={s.idx} style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{s.titlu}</span>
            {s.lectii.length > 0 && (
              <button
                onClick={() => toggleSaptamana(s.idx)}
                style={{
                  padding: '0.3rem 0.7rem',
                  fontSize: '0.9rem',
                  background: '#e0e0e0',
                  border: '1px solid #aaa',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                {expandedSaptamani[s.idx] ? '−' : '+'}
              </button>
            )}
          </div>
          {s.note && (
            <div style={{ marginTop: '0.5rem' }}>
              Note suplimentare:{' '}
              <span style={{ color: '#b45309', fontWeight: 'bold' }}>{s.note}</span>
            </div>
          )}
          {expandedSaptamani[s.idx] && s.lectii.length > 0 && (
            <ul style={{ marginTop: '0.5rem' }}>
              {s.lectii.map((lec, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span>
                      <strong>{lec.titlu}</strong> – {lec.zi} ({lec.tip})
                    </span>
                    <span style={{ display: 'flex', gap: '0.5rem' }}>
                      {lec.link && (
                        <a href={`/curs/docs/${lec.link}`} className="button button--primary button--sm" target="_blank">
                          Vezi lecția
                        </a>
                      )}
                      {lec.pdf && (
                        <a href={`/curs/c5_pdf/${lec.pdf}`} className="button button--secondary button--sm" download>
                          Descarcă PDF
                        </a>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}