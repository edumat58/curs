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
      titlu: 'Săptămâna 5 - În pregătire',
      note: 'Materiale în curs de creare',
      lectii: [
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 4 - 29.09 - 03.10',
      note: 'Materiale în curs de creare',
      lectii: [
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
        { titlu: '', zi: '', tip: '', link: '', pdf: '' },
      ],
    },  
    {
      titlu: 'Săptămâna 3 - 22.09 - 26.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'C5.1 - Multimea nr. reale', zi: '22.09', tip: 'Algebra', link: 'c7/06', pdf: '' },
        { titlu: 'C5.2 - Multimea nr. reale (h1)', zi: '24.09 (ora 1)', tip: 'Algebra', link: 'c7/07', pdf: '' },
        { titlu: 'C6 - Modulul, compararea si ordonarea nr. reale', zi: '24.09 (ora 2)', tip: 'Algebra', link: 'c7/08', pdf: '' },
        { titlu: 'C7 - Rationalizarea numitorului de forma a√b', zi: '26.09 (ora 1)', tip: 'Algebra', link: 'c7/09', pdf: '' },
        { titlu: 'LP - Rationalizarea numitorului', zi: '26.09 (ora 2)', tip: 'EVALUARE SUMATIVA', link: '', pdf: '' },
      ],
    },
    {
      titlu: 'Săptămâna 2: 15.09 - 19.09',
      note: 'Materiale încarcate',
      lectii: [
        { titlu: 'LP - Calcul cu radicali', zi: '17.09 (ora 1)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'LP - Calcul cu radicali', zi: '17.09 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C4.1 - Notatia stiintifica si simplifcarea puterilor', zi: '18.09', tip: 'Algebra', link: 'c7/04', pdf: '' },
        { titlu: 'C4.2 - Puteri: prioritatea operatiilor si notatia stiintifica', zi: '19.09', tip: 'Algebra', link: 'c7/05', pdf: '' },
        
      ],
    },
    {
      titlu: 'Săptămâna 1: 08.09 - 12.09',
      note: 'Modulul 1: 08.09.2025 -> 25.10.2025',
      lectii: [
        { titlu: 'C1 - Definitia si utilizarea puterilor', zi: '09.09.2025', tip: 'Algebra', link: 'c7/01', pdf: '' },
        { titlu: 'C2 - Formule de calcul cu puteri', zi: '10.09.2025 (ora 1)', tip: 'Algebra', link: 'c7/02', pdf: '' },
        { titlu: 'LP - Puteri', zi: '10.09.2025 (ora 2)', tip: 'Algebra', link: '', pdf: '' },
        { titlu: 'C3 - Calcul cu radicali. Proprietati', zi: '11.09.2025', tip: 'Algebra', link: 'c7/03', pdf: '' },
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