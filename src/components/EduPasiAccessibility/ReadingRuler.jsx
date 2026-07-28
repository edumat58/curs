import React from 'react';

/**
 * Rigla de citire.
 *
 * Problema pe care o rezolvă nu e vederea, ci ÎNTOARCEREA. La capătul rândului,
 * ochiul trebuie să sară înapoi la începutul următorului — iar la cititorii cu
 * dislexie sau cu deficit de atenție saltul ăsta ratează des rândul, ceea ce
 * obligă la recitire și rupe înțelegerea. O bandă care marchează rândul curent
 * dă ochiului un reper de care să se agațe.
 *
 * Două forme, pentru că nevoile sunt opuse:
 *   - BANDĂ: subliniază rândul, restul rămâne vizibil. Pentru cine are nevoie
 *     doar de un reper, dar vrea să vadă contextul.
 *   - REFLECTOR: întunecă tot în afara rândului. Pentru cine e distras de
 *     restul paginii — dar exact de asta nu e implicit: ascunde contextul, iar
 *     la matematică contextul e adesea formula de deasupra.
 *
 * Se desenează cu două suprafețe fixe și `pointer-events: none`, ca să nu
 * intercepteze niciun click. Poziția se ia din mișcarea mouse-ului sau a
 * degetului, nu din derulare: rigla urmărește unde SE UITĂ omul, nu unde e
 * pagina.
 */
export default function ReadingRuler() {
  const [mod, setMod] = React.useState('oprit');
  const [y, setY] = React.useState(-1000);

  React.useEffect(() => {
    const root = document.documentElement;
    const citeste = () => setMod(root.getAttribute('data-edupasi-rigla') || 'oprit');
    citeste();
    // Panoul schimbă atributul pe `<html>`; îl urmărim în loc să ne abonăm la
    // starea lui, ca rigla să nu depindă de panou ca să existe.
    const observer = new MutationObserver(citeste);
    observer.observe(root, { attributes: true, attributeFilter: ['data-edupasi-rigla'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (mod === 'oprit') return undefined;
    const laMouse = (e) => setY(e.clientY);
    const laDeget = (e) => {
      if (e.touches && e.touches[0]) setY(e.touches[0].clientY);
    };
    window.addEventListener('mousemove', laMouse, { passive: true });
    window.addEventListener('touchmove', laDeget, { passive: true });
    return () => {
      window.removeEventListener('mousemove', laMouse);
      window.removeEventListener('touchmove', laDeget);
    };
  }, [mod]);

  if (mod === 'oprit' || y < 0) return null;

  /** Cât de înaltă e fereastra riglei — aproximativ două rânduri de text. */
  const inaltime = 44;
  const sus = Math.max(0, y - inaltime / 2);

  if (mod === 'banda') {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: sus,
          height: inaltime,
          pointerEvents: 'none',
          zIndex: 1140,
          background: 'var(--edupasi-accent-soft, #d9eef7)',
          opacity: 0.42,
          borderTop: '2px solid var(--edupasi-accent, #003058)',
          borderBottom: '2px solid var(--edupasi-accent, #003058)',
        }}
      />
    );
  }

  // Reflector: două panouri opace, deasupra și dedesubtul rândului. Mai simplu
  // și mai rapid decât o mască, și funcționează pe orice fundal.
  const panou = {
    position: 'fixed',
    left: 0,
    right: 0,
    pointerEvents: 'none',
    zIndex: 1140,
    background: 'rgba(12, 20, 28, 0.55)',
  };
  return (
    <>
      <div aria-hidden="true" style={{ ...panou, top: 0, height: sus }} />
      <div aria-hidden="true" style={{ ...panou, top: sus + inaltime, bottom: 0 }} />
    </>
  );
}
