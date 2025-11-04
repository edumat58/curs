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
      titlu: 'Săptămâna 8: 03.11 - 07.11',
      note: 'Modulul 2: 03.11.2025 -> 19.12.2025',
      lectii: [
        { titlu: 'C15.1 - Metoda reducerii la unitate', zi: '03.11', tip: 'Algebra', link: 'c5/modul-2/1', pdf: '' },
        { titlu: 'C15.1 - Metoda reducerii la unitate', zi: '04.11 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Metoda reducerii la unitate', zi: '04.11 (ora 2)', tip: 'Algebra', link: 'c5/modul-2/2', pdf: '' },
        { titlu: 'LP (RELUARE) - Metoda reducerii la unitate', zi: '05.11', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C15.2 - Metoda Comparatiei', zi: '06.11', tip: 'Geometrie', link: 'c5/modul-2/3', pdf: '' },
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>26.09</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
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