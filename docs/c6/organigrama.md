---
title: "Organigramă"
sidebar_position: 0
slug: /c6/organigrama
hide_title: false
description: ""
---
import React, { useState } from 'react';


export default function LectiiTreeView() {
  const saptamani = [
    {
      titlu: 'Săptămâna 7 - 20.10 - 24.10 | FINAL MODUL 1',
      note: 'EVALUARE SUMATIVA: Joi 23.10',
      lectii: [
        { titlu: 'C9 - Relatii si operatii intre multimi', zi: '21.10', tip: 'Algebra', link: 'c6/modul-1/18', pdf: '' },
        { titlu: 'LP - Relatii si operatii intre multimi', zi: '22.10', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - RECAPITULARE TEST', zi: '23.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST 2 (C6.1 -> C9) | 100% NOTA 2', zi: '23.10 (ora 2)', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
        { titlu: 'LP - REZOLVARE TEST si TEMA DE VACANTA', zi: '24.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 6 - 13.10 - 17.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Probabilitati', zi: '14.10', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C8.1 - Cel mai mare divizor comun', zi: '15.10', tip: 'Algebra', link: 'c6/modul-1/16', pdf: '' },
        { titlu: 'C8.2 - Cel mai mic multiplu comun', zi: '16.10 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/17', pdf: '' },
        { titlu: 'LP - C.M.M.D.C. și REEVALUARE - ELEVI ABSENTI TEST 1', zi: '16.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - C.M.M.M.C.', zi: '17.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
        {
      titlu: 'Săptămâna 5 - 06.10 - 10.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C6.3 - Regula de trei simpla (1)', zi: '08.10 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/14', pdf: '' },
        { titlu: 'C6.3 - Regula de trei simpla (2)', zi: '08.10 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Regula de trei simpla', zi: '08.10 (ora 3)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C7 - Probabilitati', zi: '09.10', tip: 'Algebra', link: 'c6/modul-1/15', pdf: '' },
        { titlu: 'LP - Probabilitati', zi: '10.10', tip: 'Algebra', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 4 - 29.09 - 03.10',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C6.1 - Marimi direct proportionale', zi: '30.09', tip: 'Algebra', link: 'c6/modul-1/12', pdf: '' },
        { titlu: 'LP - Marimi direct proportionale', zi: '01.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C6.2 - Marimi invers proportionale', zi: '01.10 (ora 2)', tip: 'Algebra', link: 'c6/modul-1/13', pdf: '' },
        { titlu: 'LP - Marimi invers proportionale', zi: '02.10 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'TEST 1 (C1 -> C5.7) | 100% NOTA 1', zi: '02.10 (ora 2)', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
      ],
    }, 
        {
      titlu: 'Săptămâna 3 - 22.09 - 26.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C5.5 - Rapoarte', zi: '24.09', tip: 'Algebra', link: 'c6/modul-1/09', pdf: '' },
        { titlu: 'C5.6 - Scara numerică (1)', zi: '25.09 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/10', pdf: '' },
        { titlu: 'C5.6 - Scara numerică (2)', zi: '25.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C5.7 - Proporții', zi: '26.09 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/11', pdf: '' },
        { titlu: 'TEST DIN LECTIA DE ZI | 0% NOTA 1 si LP - Proportii', zi: '26.09 (ora 2)', tip: 'EVALUARE FORMATIVA/CONTINUA', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 2 - 15.09 - 19.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C5.1 – Diagrame în bastoane și histograme', zi: '17.09', tip: 'Algebra', link: 'c6/modul-1/05', pdf: '' },
        { titlu: 'C5.2 - Diagrame circulare', zi: '18.09 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/06', pdf: '' },
        { titlu: 'LP - Diagrame circulare', zi: '18.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C5.3 - Procente. Calcul procentual', zi: '19.09 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/07', pdf: '' },
        { titlu: 'C5.4 - Procente de marire si micsorare', zi: '19.09 (ora 2)', tip: 'Algebra', link: 'c6/modul-1/08', pdf: '' },
      ],
    }, 
    {
      titlu: 'Săptămâna 1: 08.09 - 12.09',
      note: 'Modulul 1: 08.09.2025 -> 25.10.2025',
      lectii: [
        { titlu: 'C1 - Multiplii si divizori', zi: '10.09.2025', tip: 'Algebra', link: 'c6/modul-1/01', pdf: 'c6_01.pdf' },
        { titlu: 'C2 - Numere prime. Descompunerea in factori primi', zi: '11.09.2025 (ora 1)', tip: 'Algebra', link: 'c6/modul-1/02', pdf: 'c6_02.pdf' },
        { titlu: 'C3 - Multimi. Multimea nr. naturale', zi: '11.09.2025 (ora 2)', tip: 'Algebra', link: 'c6/modul-1/03', pdf: 'c6_03.pdf' },
        { titlu: 'C4 - Multimea nr. intregi. Sistemul de coordonate', zi: '12.09.2025', tip: 'Algebra', link: 'c6/modul-1/04', pdf: 'c6_04.pdf' },
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
    <hr /><h2>
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>100% (2/2)</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>02.10</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>23.10</td>
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
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>8:00 - 8:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>12:00 - 12:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>8:00 - 8:50</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>8:00 - 8:50</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>13:50 - 13:50</td>
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
                        <a href={`/curs/c6_pdf/${lec.pdf}`} className="button button--secondary button--sm" download>
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