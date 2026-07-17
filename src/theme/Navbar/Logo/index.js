import React from 'react';
import Link from '@docusaurus/Link';
import { EdumatWordmark } from '@site/src/components/Brand';

/**
 * Navbar: logoul ORIGINAL Edumat58 (rămâne pentru totdeauna) + wordmark-ul
 * edumat58 lângă el, în loc de titlul text.
 */
export default function NavbarLogo() {
  return (
    <Link
      to="/"
      className="navbar__brand"
      aria-label="Edumat58 — acasă"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--km-ink)', flexShrink: 0 }}
    >
      <img
        src="/curs/img/logo.png"
        alt=""
        aria-hidden="true"
        style={{ height: '2.1rem', width: 'auto', display: 'block', flexShrink: 0 }}
      />
      <EdumatWordmark width={150} />
    </Link>
  );
}
