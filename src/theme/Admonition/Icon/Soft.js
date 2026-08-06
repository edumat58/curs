import React from 'react';

/**
 * Iconița tipului `soft`: o inimă deasupra unei palme făcute căuș.
 *
 * Palma e un semi-inel deschis în sus, nu un contur de mână cu degete: la 1,6em
 * degetele s-ar strânge într-o mâzgăleală. Forma de căuș se citește din prima ca
 * „ținut în palmă", iar inima deasupra dă sensul — sprijin, nu avertizare.
 *
 * Atenție la semnul de sens al arcelor: cu `sweep-flag` 1 pe arcul exterior,
 * căușul iese întors, ca o boltă peste inimă. Exteriorul merge cu 0, interiorul
 * cu 1 — așa se închide inelul pe partea de jos.
 */
export default function IconSoft(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        transform="translate(6.6 0.4) scale(0.45)"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
      <path d="M4 13.2 A8 8 0 0 0 20 13.2 L17.3 13.2 A5.3 5.3 0 0 1 6.7 13.2 Z" />
    </svg>
  );
}
