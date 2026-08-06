import React, { useEffect, useMemo, useRef } from 'react';
import date from './morfIncluziva.json';
import { amesteca, aplatizeaza, caleDin, cateAreInitiala } from './morf.mjs';
import styles from './CuvantMorf.module.css';

/**
 * Cuvântul „Incluzivă" din titlul EduPAȘI, care se METAMORFOZEAZĂ dintr-un font
 * în altul: nu se estompează o literă ca să apară alta, ci conturul literei se
 * transformă, punct cu punct, în conturul din fontul următor. Stările din mijloc
 * sunt litere care nu există în niciun font — o simbioză între ele.
 *
 * Trece prin fonturile din panoul de accesibilitate („Forma literelor"), fiindcă
 * exact asta face platforma: același text, alt fel de literă, pentru alt fel de
 * cititor. Lipsește doar „cu piciorușe" (Georgia): e font proprietar, iar
 * conturile lui n-ar avea ce căuta publicate în fișierele site-ului.
 *
 * Datele vin din `scripts/construieste-morf.py`: fiecare literă, în fiecare
 * font, ca poligoane cu același număr de puncte, în aceeași ordine și cu aceeași
 * pornire — de aceea media dintre două fonturi e o literă întreagă, nu un ghem.
 *
 * Literele nu pleacă toate odată: fiecare o ia din urma celei dinainte, așa că
 * transformarea trece prin cuvânt ca un val. Cutia are lățimea celui mai lat
 * font, deci rândul din titlu nu se mișcă niciodată.
 *
 * `prefers-reduced-motion`: rămâne pe forma implicită, fără buclă.
 */

const PAUZA = 2100; // cât stă pe un font, în ms
const DURATA = 1150; // cât ține metamorfoza

export default function CuvantMorf({ className }) {
  const initialaRef = useRef(null);
  const restulRef = useRef(null);

  const { initiala, latime, sus, jos, fonturi, asezate } = useMemo(() => ({
    initiala: cateAreInitiala(date.fonturi[0]),
    latime: Math.max(...date.fonturi.map((x) => x.latime)),
    sus: date.sus,
    jos: date.jos,
    fonturi: date.fonturi,
    // forma așezată a fiecărui font, gata calculată: în răgazul dintre
    // metamorfoze nu mai are rost să se refacă la fiecare cadru
    asezate: date.fonturi.map(aplatizeaza),
  }), []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (fonturi.length < 2) return undefined;

    let raf = 0;
    let pornire = 0;
    const CICLU = PAUZA + DURATA;

    const deseneaza = (acum) => {
      if (!pornire) pornire = acum;
      const scurs = acum - pornire;
      const pas = Math.floor(scurs / CICLU);
      const inCiclu = scurs - pas * CICLU;
      const dela = pas % fonturi.length;
      const catre = (dela + 1) % fonturi.length;
      const t = inCiclu <= PAUZA ? 0 : (inCiclu - PAUZA) / DURATA;

      const contururi = t === 0
        ? asezate[dela]
        : amesteca(fonturi[dela], fonturi[catre], t);

      initialaRef.current?.setAttribute('d', caleDin(contururi, 0, initiala));
      restulRef.current?.setAttribute(
        'd',
        caleDin(contururi, initiala, contururi.length - initiala),
      );

      raf = requestAnimationFrame(deseneaza);
    };

    raf = requestAnimationFrame(deseneaza);
    return () => cancelAnimationFrame(raf);
  }, [asezate, fonturi, initiala]);

  const pornireInitiala = caleDin(asezate[0], 0, initiala);
  const pornireRestul = caleDin(asezate[0], initiala, asezate[0].length - initiala);

  return (
    <span className={[styles.cuvant, className].filter(Boolean).join(' ')}>
      {/* textul adevărat rămâne în pagină pentru cititoarele de ecran, pentru
          căutare și pentru copiere — desenul e doar înfățișarea lui */}
      <span className={styles.doarCitit}>{date.cuvant}</span>
      <svg
        className={styles.desen}
        aria-hidden="true"
        focusable="false"
        viewBox={`0 ${-sus} ${latime} ${sus - jos}`}
        style={{
          width: `${latime / date.upem}em`,
          height: `${(sus - jos) / date.upem}em`,
          verticalAlign: `${jos / date.upem}em`,
        }}
      >
        <path ref={initialaRef} className={styles.initiala} fillRule="evenodd" d={pornireInitiala} />
        <path ref={restulRef} fill="currentColor" fillRule="evenodd" d={pornireRestul} />
      </svg>
    </span>
  );
}
