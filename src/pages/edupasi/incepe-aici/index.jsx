import React from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';

const DESTINATION = 'https://www.kulturosfera.com/edupasi';

export default function EduPasiLegacyGuideRedirect() {
  React.useEffect(() => {
    window.location.replace(DESTINATION);
  }, []);

  return (
    <Layout title="Ghidul EduPAȘI">
      <Head>
        <meta httpEquiv="refresh" content={`0;url=${DESTINATION}`} />
        <link rel="canonical" href={DESTINATION} />
      </Head>
      <main
        style={{
          width: 'min(720px, calc(100% - 2rem))',
          margin: '0 auto',
          padding: '5rem 0',
        }}
      >
        <h1>Ghidul EduPAȘI este în Kulturosfera</h1>
        <p>
          Te redirecționăm către sursa canonică. Dacă pagina nu se deschide automat,
          {' '}
          <a href={DESTINATION}>continuă spre EduPAȘI</a>.
        </p>
      </main>
    </Layout>
  );
}
