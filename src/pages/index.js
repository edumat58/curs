import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Hero from '@site/src/components/Hero/Hero';
import styles from './index.module.css';

// HomepageHeader removed in favor of Hero component

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Bonjour, stud.Edumat58`}
      description="Platformă de învățare online pentru cursurile de Matematică">
      <Hero />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
