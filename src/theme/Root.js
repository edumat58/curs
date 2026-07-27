import React from 'react';
import { useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';

// Root înfășoară toată aplicația (în interiorul router-ului). Montăm butonul de
// chat Doamna Căpșunică DOAR pe paginile de lecție (/docs/…), în colț, în
// afara coloanei de conținut. Pe restul paginilor nu apare.
// SectionAccessibility (EduPAȘI controls) se montează din DocRoot/Layout.
export default function Root({ children }) {
  const { pathname } = useLocation();
  const baseUrl = useBaseUrl('/');
  const basePath = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const pathInsideSite = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname.replace(/^\/+/, '');
  const normalizedPath = pathInsideSite.replace(/\/+$/, '');
  const onLesson = normalizedPath.startsWith('docs/');
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
