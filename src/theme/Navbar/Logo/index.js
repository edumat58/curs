import React from 'react';
import Link from '@docusaurus/Link';
import { EdumatLockup } from '@site/src/components/Brand';

/**
 * Logo-ul din navbar, înlocuit cu lockup-ul familiei Kulturosfera:
 * emblema + KULTUROSFERA peste linia de brand + wordmark-ul edumat.
 */
export default function NavbarLogo() {
  return (
    <Link to="/" className="navbar__brand" aria-label="edumat — acasă" style={{ color: 'inherit' }}>
      <EdumatLockup wordmarkWidth={96} />
    </Link>
  );
}
