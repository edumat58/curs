import React from 'react';
import { useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Root înfășoară toată aplicația (în interiorul router-ului). Montăm butonul de
// chat Doamna Căpșunică DOAR pe paginile de lecție (/curs/docs/…), în colț, în
// afara coloanei de conținut. Pe restul paginilor nu apare.
export default function Root({ children }) {
  const { pathname } = useLocation();
  const onLesson = pathname.startsWith('/curs/docs/');
  return (
    <>
      {children}
      {onLesson && (
        <BrowserOnly>
          {() => {
            const DoamnaCapsunica = require('@site/src/components/DoamnaCapsunica').default;
            return <DoamnaCapsunica />;
          }}
        </BrowserOnly>
      )}
    </>
  );
}
