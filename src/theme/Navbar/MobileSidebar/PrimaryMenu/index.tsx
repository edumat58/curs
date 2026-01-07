import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import IconExternalLink from '@theme/Icon/ExternalLink';

// Helper for section headers
function MenuSection({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="menu__section menu__section--custom">
      <h3 className="menu__section-header">
        {title}
      </h3>
      <ul className="menu__list">
        {children}
      </ul>
    </div>
  );
}

// Helper for individual menu items
function MenuItem({ to, label, icon, onClick }: { to: string, label: string, icon?: ReactNode, onClick: () => void }) {
  const isExternal = to.startsWith('http');
  return (
    <li className="menu__list-item">
      <Link
        className="menu__link menu__link--custom"
        to={to}
        onClick={onClick}
      >
        {icon && <span className="menu__link-icon">{icon}</span>}
        <span className="menu__link-label">{label}</span>
        {isExternal && <IconExternalLink width={12} height={12} className="menu__link-external" />}
      </Link>
    </li>
  );
}

export default function NavbarMobilePrimaryMenu(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const closeSidebar = () => mobileSidebar.toggle();

  return (
    <div className="menu-custom-container">

      <MenuSection title="EduREV">
        <MenuItem to="https://edurev.kulturosfera.com" label="EduREV - Platforma pentru vizualizarea evaluărilor" onClick={closeSidebar} icon={<span className="material-icons">data_thresholding</span>} />
      </MenuSection>
      {/* Cursuri Section */}
      <MenuSection title="Cursuri">
        <MenuItem to="/docs/category/curs-v" label="Clasa a V-a" onClick={closeSidebar} icon={<span className="material-icons">filter_5</span>} />
        <MenuItem to="/docs/category/curs-vi" label="Clasa a VI-a" onClick={closeSidebar} icon={<span className="material-icons">filter_6</span>} />
        <MenuItem to="/docs/category/curs-vii" label="Clasa a VII-a" onClick={closeSidebar} icon={<span className="material-icons">filter_7</span>} />
        <MenuItem to="/docs/category/curs-viii" label="Clasa a VIII-a" onClick={closeSidebar} icon={<span className="material-icons">filter_8</span>} />
      </MenuSection>

      {/* Platformă Section */}
      <MenuSection title="Platformă">
        <MenuItem to="/" label="Acasă" onClick={closeSidebar} icon={<span className="material-icons">home</span>} />
        <MenuItem to="/docs/status" label="Stare Sistem" onClick={closeSidebar} icon={<span className="material-icons">check_circle</span>} />
      </MenuSection>

      {/* Comunitate Section */}
      <MenuSection title="Comunitate">
        <MenuItem to="https://github.com/edumat58/curs" label="GitHub" onClick={closeSidebar} icon={<span className="material-icons">code</span>} />
        <MenuItem to="https://github.com/edumat58/curs/issues" label="Raportează o problemă" onClick={closeSidebar} icon={<span className="material-icons">bug_report</span>} />
      </MenuSection>

    </div>
  );
}
