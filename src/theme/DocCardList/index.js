import React from 'react';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import {
  useCurrentSidebarCategory,
  filterDocCardListItems,
} from '@docusaurus/plugin-content-docs/client';
import DocCard from '@theme/DocCard';
import styles from './styles.module.css';

const CLASS_EDUPASI_MAP = [
  { match: /curs-v|c5/i, slug: '/docs/edupasi/c5', label: 'EduPAȘI — Clasa a V-a', desc: 'Lecții adaptate pentru clasa a V-a' },
  { match: /curs-vi|c6/i, slug: '/docs/edupasi/c6', label: 'EduPAȘI — Clasa a VI-a', desc: 'Lecții adaptate pentru clasa a VI-a' },
  { match: /curs-vii|c7/i, slug: '/docs/edupasi/c7', label: 'EduPAȘI — Clasa a VII-a', desc: 'Lecții adaptate pentru clasa a VII-a' },
  { match: /curs-viii|c8/i, slug: '/docs/edupasi/c8', label: 'EduPAȘI — Clasa a VIII-a', desc: 'Lecții adaptate pentru clasa a VIII-a' },
];

function DocCardListForCurrentSidebarCategory({ className }) {
  const category = useCurrentSidebarCategory();
  return <DocCardList items={category.items} className={className} />;
}

export default function DocCardList(props) {
  const { items, className } = props;
  const location = useLocation();

  if (!items) {
    return <DocCardListForCurrentSidebarCategory {...props} />;
  }

  let filteredItems = [...filterDocCardListItems(items)];
  const pathname = location?.pathname || '';

  // Check if we need to guarantee an EduPAȘI folder card for the current class
  const classMatch = CLASS_EDUPASI_MAP.find((c) => c.match.test(pathname));
  if (classMatch) {
    const hasEduPasi = filteredItems.some(
      (item) => item.href?.includes('/edupasi') || item.label?.includes('EduPAȘI')
    );
    if (!hasEduPasi) {
      filteredItems.unshift({
        type: 'link',
        label: classMatch.label,
        href: classMatch.slug,
        description: classMatch.desc,
      });
    }
  }

  return (
    <section className={clsx(styles.compactList, className)}>
      {filteredItems.map((item, index) => (
        <article key={index} className={styles.compactItem}>
          <DocCard item={item} />
        </article>
      ))}
    </section>
  );
}
