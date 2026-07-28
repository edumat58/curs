import React, { type ReactNode } from 'react';
import OriginalPrimaryMenu from '@theme-original/Navbar/MobileSidebar/PrimaryMenu';
import SearchBar from '@theme/SearchBar';

/**
 * Meniul principal din sidebarul de mobil, cu BARA DE SEARCH adăugată sus.
 *
 * Cerut explicit: pe mobil căutarea stă în sidebar (drawerul de sub hamburger),
 * nu în bara de sus. Pluginul local (`@easyops-cn/docusaurus-search-local`) pune
 * bara doar în navbar, iar Docusaurus n-o replică în meniul de mobil — de aceea
 * o randăm noi aici, deasupra linkurilor. Pe desktop bara din navbar rămâne (pe
 * rândul doi); instanța de aici e ascunsă odată cu tot drawerul.
 */
export default function NavbarMobilePrimaryMenu(): ReactNode {
  return (
    <>
      <div className="edupasi-mobile-search">
        <SearchBar />
      </div>
      <OriginalPrimaryMenu />
    </>
  );
}
