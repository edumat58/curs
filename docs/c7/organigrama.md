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
      titlu: 'Săptămâna 13: 08.12 - 12.12 | FINAL MODUL 2',
      note: 'Materiale încarcate',
      lectii: [

      ],
    },
      {
      titlu: 'Săptămâna 12: 02.12 - 05.12',
      note: 'Materiale încarcate | 1 decembrie liber',
      lectii: [
        { titlu: 'LP - REZOLVARE TEST', zi: '03.12', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C15 - Operații cu mulțimi', zi: '04.12', tip: 'Algebra', link: 'c7/modul-2/9', pdf: '' },
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
        {titlu: 'C14 - Operații cu numere reale (recapitulare)', zi: '27.11', tip: 'Algebra', link: 'c7/modul-2/8', pdf: '' },
        {titlu: 'LP - Operații cu numere reale (recapitulare)', zi: '28.11', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
      {
      titlu: 'Săptămâna 10: 17.11 - 21.11',
      note: 'TEST 24.11 (ora 2) [NOTA 3]: C11 - C13.2 și G4 - G6',
      lectii: [
        { titlu: 'C13.2 - Probleme care se rezolvă cu ajutorul sistemelor de ecuații', zi: '17.11 (ora 1)', tip: 'Algebra', link: 'c7/modul-2/6', pdf: '' },
        { titlu: 'LP - Sisteme de ecuații', zi: '17.11 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Sisteme de ecuații', zi: '19.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'G6 - Centrul de greutate al unui triunghi', zi: '20.11', tip: 'Geometrie', link: 'c7/modul-2/7', pdf: '' },
        { titlu: 'LP - RECAPITULARE TEST | Algebră', zi: '21.11', tip: 'Algebra', link: '', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 9: 10.11 - 14.11',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'G5 - Linia mijlocie în triunghi', zi: '10.11 (ora 1)', tip: 'Geometrie', link: 'c7/modul-2/4', pdf: '' },
        { titlu: 'LP - Linia mijlocie în triunghi', zi: '10.11 (ora 2)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'C13.1 - Sisteme de ecuații (1)', zi: '12.11', tip: 'Algebra', link: 'c7/modul-2/5', pdf: '' },
        { titlu: 'C13.1 - Sisteme de ecuații (2)', zi: '14.11', tip: 'Algebra', link: '', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 8: 03.11 - 07.11',
      note: 'Modulul 2: 03.11.2025 -> 19.12.2025',
      lectii: [
        { titlu: 'G4 - Paralelogramul', zi: '03.11 (ora 1)', tip: 'Geometrie', link: 'c7/modul-2/1', pdf: '' },
        { titlu: 'LP - Paralelogramul', zi: '03.11 (ora 2)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'C11 - Relația de egalitate', zi: '05.11', tip: 'Algebra', link: 'c7/modul-2/2', pdf: '' },
        { titlu: 'LP - Relația de egalitate', zi: '06.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C12 - Ecuația ax+b=0', zi: '07.11', tip: 'Algebra', link: 'c7/modul-2/3', pdf: '' },
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
  }).filter((s) => s.lectii.length > 0 || s.note);

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
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>50% (1/2)</td>
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>06.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>24.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>24.11</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
        </tbody>
      </table>
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