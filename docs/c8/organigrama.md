---
title: "Organigramă"
sidebar_position: 0
slug: /c8/organigrama
hide_title: false
description: ""
---
import React, { useState } from 'react';


export default function LectiiTreeView() {
  const saptamani = [
      {
      titlu: 'Săptămâna 7 - 20.10 - 24.10 | FINAL MODUL 1',
      note: 'EVALUARE SUMATIVA: Miercuri 22.10',
      lectii: [
        { titlu: 'G3 - Piramida', zi: '20.10', tip: 'Geometrie', link: 'c8/modul-1/15', pdf: '' },
        { titlu: 'LP - RECAPITULARE TEST', zi: '22.10 (ora 1)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'TEST 2 (C5 -> C9 | G1, G2) | 100% NOTA 3', zi: '22.10 (ora 2)', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
        { titlu: 'LP - Piramida', zi: '23.10 (ora 1)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'LP - REZOLVARE TEST si TEMA DE VACANTA', zi: '23.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 6 - 13.10 - 17.10',
      note: 'Materiale în curs de creare',
      lectii: [
        { titlu: 'G2 - Relatii intre puncte, drepte si plane (1)', zi: '13.10', tip: 'Geometrie', link: 'c8/modul-1/13', pdf: '' },
        { titlu: 'G2 - Relatii intre puncte, drepte si plane (2)', zi: '15.10 (ora 1)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'LP - Determinarea dreptei si planului și REEVALUARE - ELEVI ABSENTI TEST 1', zi: '15.10 (ora 2)', tip: 'Geometrie', link: '', pdf: '' },
        { titlu: 'C9 - Existenta,amplificarea si simplificarea fractiilor algebrice', zi: '16.10 (ora 1)', tip: 'Algebra', link: 'c8/modul-1/14', pdf: '' },
        { titlu: 'LP - Existenta,amplificarea si simplificarea fractiilor algebrice', zi: '17.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 5 - 06.10 - 10.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C8.1 - Calcul literal: expresii algebrice', zi: '06.10', tip: 'Algebra', link: 'c8/modul-1/10', pdf: '' },
        { titlu: 'C8.2 - Calcul literal: descompuneri in factori', zi: '08.10 (ora 1)', tip: 'Algebra', link: 'c8/modul-1/11', pdf: '' },
        { titlu: 'LP - Expresii algebrice', zi: '08.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST DIN LECTIA DE ZI (C8.1 | C8.2) | 100% NOTA 2', zi: '09.10 (ora 1)', tip: 'EVALUARE FORMATIVA', link: '', pdf: '' },
        { titlu: 'G1 - Punct, dreaptă și plan', zi: '09.10 (ora 2)', tip: 'Geometrie', link: 'c8/modul-1/12', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 4 - 29.09 - 03.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C6 - Raționalizarea numitorului unei fractii folosind conjugata', zi: '29.09', tip: 'Algebra', link: 'c8/modul-1/08', pdf: '' },
        { titlu: 'LP - Raționalizarea numitorului unei fractii folosind conjugata', zi: '01.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C7 - Fractii: amplificarea si simplificarea', zi: '01.10 (ora 2)', tip: 'Algebra', link: 'c8/modul-1/09', pdf: '' },
        { titlu: 'LP - Calcul algebric in multimea nr. reale', zi: '02.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Fractii algebrice: amplificarea si simplificarea', zi: '02.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 3 - 22.09 - 26.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Expresii algebrice si formule de calcul prescurtat', zi: '23.09 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C4 - Intervale si comparatii in multimea nr. reale', zi: '23.09 (ora 2)', tip: 'Algebra', link: 'c8/modul-1/06', pdf: '' },
        { titlu: 'LP - Intervale si comparatii', zi: '24.09', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C5 - Inecuatii de forma ax + b', zi: '25.09 (ora 1)', tip: 'Algebra', link: 'c8/modul-1/07', pdf: '' },
        { titlu: 'TEST 1 (C1 -> C3.3) | 100% NOTA 1', zi: '25.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 2: 15.09 - 19.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C3.1 - Egalitatea expresiilor literale. Distributivitate simplă', zi: '16.09 (ora 1)', tip: 'Algebra', link: 'c8/modul-1/03', pdf: '' },
        { titlu: 'C3.2 - Dezvoltarea și simplificarea expresiilor literale', zi: '16.09 (ora 2)', tip: 'Algebra', link: 'c8/modul-1/04', pdf: '' },
        { titlu: 'LP - Expresii Algebrice', zi: '17.09', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C3.3 - Dublă distributivitate și identitate remarcabilă', zi: '18.09 (ora 1)', tip: 'Algebra', link: 'c8/modul-1/05', pdf: '' },
        { titlu: 'LP - Dublă distributivitate și identitate remarcabilă', zi: '18.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 1: 08.09 - 12.09',
      note: 'Modulul 1: 08.09.2025 -> 25.10.2025',
      lectii: [
        { titlu: 'C1 - Notatii si simboluri matematice', zi: '11.09.2025 (ora 1)', tip: 'Algebra', link: 'c8/modul-1/01', pdf: 'c8_01.pdf' },
        { titlu: 'C2 - Multimea nr. reale R', zi: '11.09.2025 (ora 2)', tip: 'Algebra', link: 'c8/modul-1/02', pdf: 'c8_02.pdf' },
      ],
    }
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>25.09</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>09.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>22.10</td>
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>12:00 - 12:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>10:00 - 10:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>11:00 - 11:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>11:00 - 11:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>14:00 - 14:50</td>
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
                        <a href={`/curs/c8_pdf/${lec.pdf}`} className="button button--secondary button--sm" download>
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