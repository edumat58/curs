import React from 'react';

import styles from './styles.module.css';

/**
 * Nota de sursă a unei lecții — cine a redactat activitățile care au stat la
 * bază și în ce publicație.
 *
 * Se pune ÎNAINTEA titlului în fișierul lecției; la randare ajunge între codul
 * canonic al lecției și titlu (eticheta codului se inserează, la rulare, chiar
 * deasupra notei — vezi `SectionVoice`).
 *
 * Forma e deliberat modestă: un rând-două de text mic, cu o linie subțire în
 * stânga, fără fundal colorat și fără casetă. Aceeași informație stătea până
 * acum într-un `:::info` sub titlu, care ocupa cât o secțiune de lecție și
 * trăgea privirea înaintea materiei. O notă de drepturi trebuie să fie
 * prezentă și verificabilă, nu vizibilă prima.
 *
 * Valorile implicite sunt cele ale sursei folosite la cursul EduPAȘI; orice
 * altă sursă se dă prin proprietăți.
 */

const IMPLICIT = {
  autor: 'prof. Delphine Urvoy',
  editura: 'LAROUSSE',
  titlu: 'Réussir en maths avec la pédagogie de Singapour',
  isbn: '978-2-03-605-807-1',
  href: 'https://www.editions-larousse.fr/livre/reussir-en-maths-avec-la-pedagogie-de-singapour-6e-9782036058071/',
};

export default function SursaCurs(props) {
  const { autor, editura, titlu, isbn, href } = { ...IMPLICIT, ...props };

  return (
    <aside className={styles.sursa} data-sursa-curs aria-label="Notă privind drepturile de autor">
      <span className={styles.eticheta}>Sursă</span>
      <p className={styles.text}>
        Curs realizat folosind ca suport activități redactate de <strong>{autor}</strong>,
        în <span className={styles.editura}>{editura}</span> —{' '}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            <em>{titlu}</em>
          </a>
        ) : (
          <em>{titlu}</em>
        )}
        {isbn ? <>. ISBN {isbn}</> : null}.
      </p>
    </aside>
  );
}
