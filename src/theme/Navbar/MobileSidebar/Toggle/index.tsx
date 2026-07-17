import React, { type ReactNode } from 'react';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import IconMenu from '@theme/Icon/Menu';

export default function MobileSidebarToggle(): ReactNode {
  const { toggle, shown } = useNavbarMobileSidebar();
  const [btnVisible, setBtnVisible] = React.useState(!shown);

  React.useEffect(() => {
    if (shown) {
      // Hide immediately when sidebar opens
      setBtnVisible(false);
    } else {
      // Show with delay when sidebar closes
      const timer = setTimeout(() => {
        setBtnVisible(true);
      }, 200); // 200ms delay
      return () => clearTimeout(timer);
    }
  }, [shown]);

  return (
    <>
      {btnVisible && (
        <a href="/curs/navigation" className="mobile-menu-btn">
          Meniu
        </a>
      )}
      <button
        onClick={toggle}
        aria-label={translate({
          id: 'theme.docs.sidebar.toggleSidebarButtonAriaLabel',
          message: 'Toggle navigation bar',
          description:
            'The ARIA label for hamburger menu button of mobile navigation',
        })}
        aria-expanded={shown}
        className="navbar__toggle clean-btn"
        type="button">
        <IconMenu />
      </button>
    </>
  );
}
