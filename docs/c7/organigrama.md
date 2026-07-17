---
title: "Organigramă"
sidebar_position: 0
slug: /c7/organigrama
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
      note: 'Materiale incarcate',
      lectii: [
        {titlu: 'C18.2 - Funcții trigonometrice (proprietăți) (1)', zi: '09.03 (ora 1)', tip: 'Algebra', link: 'c7/modul-4/03', pdf: ''},
        {titlu: 'C18.2 - Funcții trigonometrice (proprietăți) (2)', zi: '09.03 (ora 2)', tip: 'Algebra', link: 'c7/modul-4/03', pdf: ''},
      ],
    },
    {
      titlu: 'Săptămâna 20: 02.03 - 06.03',
      note: 'Materiale incarcate',
      lectii: [
        {titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '02.03 (ora 1)', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '02.03 (ora 2)', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'RECAPITULARE - Modulul unui nr. rational', zi: '04.03', tip: 'Algebra', link: 'c7/modul-4/01', pdf: ''},
        {titlu: 'LP - Modulul unui nr. rational', zi: '05.03', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'C18.1 - Funcții trigonometrice (demonstrații)', zi: '06.03', tip: 'Algebra', link: 'c7/modul-4/02', pdf: ''},
      ],
    },
    {
      titlu: 'Săptămâna 19: 23.02 - 27.02',
      note: 'Modulul 4: 23.02 -> 03.04',
      lectii: [
        {titlu: 'RECAPITULARE - Calcul algebric in multimea nr. reale', zi: '23.02 (ora 1)', tip: 'Algebra', link: 'c7/modul-2/08', pdf: ''},
        {titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '23.02 (ora 2)', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '25.02', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '26.02', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '27.02', tip: 'Algebra', link: '', pdf: ''},
      ],
    },
    {
      titlu: 'Săptămâna 18: 09.02 - 13.02 | FINAL MODUL 3',
      note: '',
      lectii: [
        {titlu: 'LP - Poligoane regulate înscrise în cerc', zi: '09.02 (ora 1)', tip: 'Geometrie', link: '', pdf: ''},
        {titlu: 'G7.4 - Lungimea cercului și aria discului', zi: '09.02 (ora 2)', tip: 'Geometrie', link: 'c7/modul-3/09', pdf: ''},
        {titlu: 'LP - Lungimea cercului și aria discului', zi: '11.02', tip: 'Geometrie', link: '', pdf: ''},
        {titlu: 'LP - Lungimea cercului și aria discului', zi: '12.02', tip: 'Geometrie', link: '', pdf: ''},
        {titlu: 'PREZENTARE PROIECT (partea II)', zi: '13.02', tip: 'Proiect', link: '', pdf: ''},
        
      ],
    },
    {
      titlu: 'Săptămâna 17: 02.02 - 06.02',
      note: 'PROIECT (partea II) | 06.02 -> 13.02',
      lectii: [
        {titlu: 'LP - Unghi înscris în cerc, coarde şi arce în cerc', zi: '02.02 (ora 1)', tip: 'Proiect', link: '', pdf: ''},
        {titlu: 'G7.2 - Tangente dintr-un punct exterior la un cerc', zi: '02.02 (ora 2)', tip: 'Geometrie', link: 'c7/modul-3/07', pdf: ''},
        {titlu: 'LP - Tangente dintr-un punct exterior la un cerc', zi: '04.02', tip: 'Geometrie', link: '', pdf: ''},
        {titlu: 'G7.3 - Poligoane regulate înscrise în cerc', zi: '05.02', tip: 'Geometrie', link: 'c7/modul-3/08', pdf: ''},
        {titlu: 'LP - Poligoane regulate înscrise în cerc', zi: '06.02', tip: 'Geometrie', link: '', pdf: ''},
        {titlu: 'PROIECT (partea II)', zi: '06.02', tip: 'Proiect', link: 'c7/modul-3/10', pdf: ''},
      ],
    },
    {
      titlu: 'Săptămâna 16: 26.01 - 30.01',
      note: 'TEST 26.01 (ora 2) 100% NOTA 5 | C17.1 - C17.4',
      lectii: [
        {titlu: 'LP - RECAPITULARE TEST', zi: '26.01 (ora 1)', tip: 'Recapitulare', link: '', pdf: ''},
        {titlu: 'TEST 26.01 (ora 2) 100% NOTA 5', zi: '26.01 (ora 2)', tip: 'Evaluare Sumativa', link: '', pdf: ''},
        {titlu: 'G7.1 - Unghi înscris în cerc, coarde şi arce în cerc (partea 1)', zi: '28.01', tip: 'Geometrie', link: 'c7/modul-3/06', pdf: ''},
        {titlu: 'G7.1 - Unghi înscris în cerc, coarde şi arce în cerc (partea 2)', zi: '29.01', tip: 'Geometrie', link: 'c7/modul-3/06', pdf: ''},
        {titlu: 'PREZENTARE PROIECT (partea I)', zi: '30.01', tip: 'Proiect', link: '', pdf: ''},
      ],
    },
    {
      titlu: 'Săptămâna 15: 19.01 - 23.01',
      note: 'PROIECT (partea I) | 23.01 -> 30.01',
      lectii: [
        {titlu: 'C17.3 - Reprezentarea şi interpretarea unor dependenţe funcţionale prin tabele, diagrame şi grafice', zi: '19.01 (ora 1)', tip: 'Algebra', link: 'c7/modul-3/03', pdf: ''},
        {titlu: 'LP - Reprezentarea şi interpretarea unor dependenţe funcţionale prin tabele, diagrame şi grafice', zi: '19.01 (ora 2)', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'LP - Reprezentarea şi interpretarea unor dependenţe funcţionale prin tabele, diagrame şi grafice', zi: '21.01', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'C17.4 - Poligonul frecvenţelor', zi: '22.01', tip: 'Algebra', link: 'c7/modul-3/04', pdf: ''},
        {titlu: 'LP - Poligonul frecvenţelor', zi: '23.01', tip: 'Algebra', link: '', pdf: ''},
        {titlu: 'PROIECT (partea I)', zi: '23.01', tip: 'Proiect', link: 'c7/modul-3/05', pdf: ''},

      ],
    },
  {
      titlu: 'Săptămâna 14: 12.01 - 16.01',
      note: 'Modulul 3: 08.01.2026 -> 13.02.2026',
      lectii: [
        { titlu: 'C17.1 - Sistem de axe ortogonale în plan', zi: '12.01 (ora 1)', tip: 'Algebra', link: 'c7/modul-3/01', pdf: '' },
        { titlu: 'LP - Sistem de axe ortogonale în plan', zi: '12.01 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C17.2 - Distanţa dintre două puncte din plan', zi: '14.01', tip: 'Algebra', link: 'c7/modul-3/02', pdf: '' },
        { titlu: 'LP - Distanţa dintre două puncte din plan', zi: '15.01', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Reprezentarea într-un sistem de axe ortogonale', zi: '16.01', tip: 'Algebra', link: 'c7/modul-3/03', pdf: '' },

      ],
    },
          {
      titlu: 'Săptămâna 13: 08.12 - 12.12 | FINAL MODUL 2',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C15 - Operații cu mulțimi (2)', zi: '08.12 (ora 1)', tip: 'Algebra', link: 'c7/modul-2/09', pdf: '' },
        { titlu: 'LP - Operații cu mulțimi', zi: '08.12 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Operații cu mulțimi', zi: '10.12 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C16 - Apartenența la o mulțime', zi: '11.12', tip: 'Algebra', link: 'c7/modul-2/10', pdf: '' },
        { titlu: 'LP - Apartenența la o mulțime', zi: '12.12', tip: 'Algebra', link: '', pdf: '' },

      ],
    },
      {
      titlu: 'Săptămâna 12: 02.12 - 05.12',
      note: 'Materiale încarcate | 1 decembrie liber',
      lectii: [
        { titlu: 'LP - REZOLVARE TEST', zi: '03.12', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C15 - Operații cu mulțimi (1)', zi: '04.12', tip: 'Algebra', link: 'c7/modul-2/09', pdf: '' },
        { titlu: 'LP - Operații cu mulțimi', zi: '05.12', tip: 'Algebra', link: '', pdf: '' },

      ],
    },
      {
      titlu: 'Săptămâna 11: 24.11 - 28.11',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - RECAPITULARE TEST | Geometrie', zi: '24.11 (ora 1)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'TEST 3 (C11 - C13.2 și G4 - G6) | 100% NOTA 3', zi: '24.11 (ora 2)', tip: 'Evaluare Sumativa', link: '', pdf: '' },
        { titlu: 'LP - Rezolvare test', zi: '26.11', tip: '-', link: '', pdf: '' },
        {titlu: 'C14 - Operații cu numere reale (recapitulare)', zi: '27.11', tip: 'Algebra', link: 'c7/modul-2/08', pdf: '' },
        {titlu: 'LP - Operații cu numere reale (recapitulare)', zi: '28.11', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
      {
      titlu: 'Săptămâna 10: 17.11 - 21.11',
      note: 'TEST 24.11 (ora 2) [NOTA 3]: C11 - C13.2 și G4 - G6',
      lectii: [
        { titlu: 'C13.2 - Probleme care se rezolvă cu ajutorul sistemelor de ecuații', zi: '17.11 (ora 1)', tip: 'Algebra', link: 'c7/modul-2/06', pdf: '' },
        { titlu: 'LP - Sisteme de ecuații', zi: '17.11 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Sisteme de ecuații', zi: '19.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'G6 - Centrul de greutate al unui triunghi', zi: '20.11', tip: 'Geometrie', link: 'c7/modul-2/07', pdf: '' },
        { titlu: 'LP - RECAPITULARE TEST | Algebră', zi: '21.11', tip: 'Algebra', link: '', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 9: 10.11 - 14.11',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'G5 - Linia mijlocie în triunghi', zi: '10.11 (ora 1)', tip: 'Geometrie', link: 'c7/modul-2/04', pdf: '' },
        { titlu: 'LP - Linia mijlocie în triunghi', zi: '10.11 (ora 2)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'C13.1 - Sisteme de ecuații (1)', zi: '12.11', tip: 'Algebra', link: 'c7/modul-2/05', pdf: '' },
        { titlu: 'C13.1 - Sisteme de ecuații (2)', zi: '14.11', tip: 'Algebra', link: '', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 8: 03.11 - 07.11',
      note: 'Modulul 2: 03.11.2025 -> 19.12.2025',
      lectii: [
        { titlu: 'G4 - Paralelogramul', zi: '03.11 (ora 1)', tip: 'Geometrie', link: 'c7/modul-2/01', pdf: '' },
        { titlu: 'LP - Paralelogramul', zi: '03.11 (ora 2)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'C11 - Relația de egalitate', zi: '05.11', tip: 'Algebra', link: 'c7/modul-2/02', pdf: '' },
        { titlu: 'LP - Relația de egalitate', zi: '06.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C12 - Ecuația ax+b=0', zi: '07.11', tip: 'Algebra', link: 'c7/modul-2/03', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 7 - 20.10 - 24.10 | FINAL MODUL 1',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - (rec) Operatii in multimea nr. reale', zi: '20.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C10 - Aproximări ale numerelor iraționale', zi: '20.10 (ora 2)', tip: 'Algebra', link: 'c7/modul-1/17', pdf: '' },
        { titlu: 'LP - Aproximări ale numerelor iraționale și REEVALUARE - ELEVI ABSENTI TEST 1', zi: '22.10', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - RECAPITULARE TEST', zi: '23.10', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'TEST 2 (C9 | G1 -> G3) | 100% NOTA 2', zi: '24.10', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 6 - 13.10 - 17.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C9 - Ecuatia x² = a', zi: '13.10 (ora 1)', tip: 'Algebra', link: 'c7/modul-1/14', pdf: '' },
        { titlu: 'LP - Ecuatia x² = a', zi: '13.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'G3 - Patrulaterul convex', zi: '15.10', tip: 'Geometrie', link: 'c7/modul-1/15', pdf: '' },
        { titlu: 'LP - Patrulaterul convex', zi: '16.10', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'LP - (rec) Operatii in multimea nr. reale', zi: '17.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 5 - 06.10 - 10.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - RECAPITULARE TEST si aplicatii calcule algebrice', zi: '06.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST 1 - C1 -> C8.2 [100% NOTA 1]', zi: '06.10 (ora 2) ', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
        { titlu: 'G1 - Punct, dreapta si plan', zi: '08.10', tip: 'Geometrie', link: 'c7/modul-1/12', pdf: '' },
        { titlu: 'G2 - Unghiul. Clasificare și măsurarea unghiurilor', zi: '09.10', tip: 'Geometrie', link: 'c7/modul-1/13', pdf: '' },
        { titlu: 'LP - Elemente de geometrie in plan', zi: '10.10', tip: 'Geometrie', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 4 - 29.09 - 03.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Operatii in multimea nr. reale', zi: '29.09 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Operatii in multimea nr. reale', zi: '29.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C8.1 - Media aritmetica', zi: '01.10', tip: 'Algebra', link: 'c7/modul-1/10', pdf: '' },
        { titlu: 'C8.2 - Media geometrica', zi: '02.10', tip: 'Algebra', link: 'c7/modul-1/11', pdf: '' },
        { titlu: 'LP - Media aritmetica si media geometrica', zi: '03.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },  
    {
      titlu: 'Săptămâna 3 - 22.09 - 26.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C5 - Multimea nr. reale (1)', zi: '22.09', tip: 'Algebra', link: 'c7/modul-1/06', pdf: '' },
        { titlu: 'C5 - Multimea nr. reale (2)', zi: '24.09 (ora 1)', tip: 'Algebra', link: 'c7/modul-1/07', pdf: '' },
        { titlu: 'C6 - Modulul, compararea si ordonarea nr. reale', zi: '24.09 (ora 2)', tip: 'Algebra', link: 'c7/modul-1/08', pdf: '' },
        { titlu: 'C7 - Rationalizarea numitorului de forma a√b', zi: '26.09 (ora 1)', tip: 'Algebra', link: 'c7/modul-1/09', pdf: '' },
        { titlu: 'LP - Rationalizarea numitorului', zi: '26.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 2: 15.09 - 19.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Calcul cu radicali', zi: '17.09 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Calcul cu radicali', zi: '17.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C4.1 - Notatia stiintifica si simplifcarea puterilor', zi: '18.09', tip: 'Algebra', link: 'c7/modul-1/04', pdf: '' },
        { titlu: 'C4.2 - Puteri: prioritatea operatiilor si notatia stiintifica', zi: '19.09', tip: 'Algebra', link: 'c7/modul-1/05', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 1: 08.09 - 12.09',
      note: 'Modulul 1: 08.09.2025 -> 25.10.2025',
      lectii: [
        { titlu: 'C1 - Definitia si utilizarea puterilor', zi: '09.09.2025', tip: 'Algebra', link: 'c7/modul-1/01', pdf: '' },
        { titlu: 'C2 - Formule de calcul cu puteri', zi: '10.09.2025 (ora 1)', tip: 'Algebra', link: 'c7/modul-1/02', pdf: '' },
        { titlu: 'LP - Puteri', zi: '10.09.2025 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C3 - Calcul cu radicali. Proprietati', zi: '11.09.2025', tip: 'Algebra', link: 'c7/modul-1/03', pdf: '' },
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>X</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>30.01</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>100% (2/2)</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>06.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>24.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>24.11</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>11.12</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>26.01</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>13.02</td>
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
      <li>PROIECT (partea I) - Elemente de organizare a datelor | 30.01 <b>(50% NOTA 6)</b></li>
      <li>PROIECT (partea II) - Geometria cercului | 13.02 <b>(50% NOTA 6)</b></li>
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>9:00 - 9:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>9:00 - 9:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>12:00 - 12:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>9:00 - 9:50</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>13:00 - 13:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
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