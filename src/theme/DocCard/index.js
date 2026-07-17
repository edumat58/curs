import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import { usePluralForm } from '@docusaurus/theme-common';
import isInternalUrl from '@docusaurus/isInternalUrl';
import { translate } from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

/**
 * DocCard fără emoji — regula Kulturosfera: doar iconițe SVG stroke.
 * Modulele (categorii) primesc straturile din limbajul butonului „Cuprins";
 * paginile primesc documentul, linkurile externe săgeata.
 */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function CategoryIcon() {
  return (
    <svg {...iconProps}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg {...iconProps}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function useCategoryItemsPlural() {
  const { selectMessage } = usePluralForm();
  return (count) =>
    selectMessage(
      count,
      translate(
        {
          message: '1 item|{count} items',
          id: 'theme.docs.DocCard.categoryDescription.plurals',
          description:
            'The default description for a category card in the generated index about how many items this category includes',
        },
        { count },
      ),
    );
}

function CardContainer({ href, children }) {
  return (
    <Link href={href} className={clsx('card padding--lg', styles.cardContainer)}>
      {children}
    </Link>
  );
}

function CardLayout({ href, icon, title, description }) {
  return (
    <CardContainer href={href}>
      <Heading as="h2" className={clsx('text--truncate', styles.cardTitle)} title={title}>
        <span className={styles.cardIcon}>{icon}</span>
        {title}
      </Heading>
      {description && (
        <p className={clsx('text--truncate', styles.cardDescription)} title={description}>
          {description}
        </p>
      )}
    </CardContainer>
  );
}

function CardCategory({ item }) {
  const href = findFirstSidebarItemLink(item);
  const categoryItemsPlural = useCategoryItemsPlural();
  if (!href) {
    return null;
  }
  return (
    <CardLayout
      href={href}
      icon={<CategoryIcon />}
      title={item.label}
      description={item.description ?? categoryItemsPlural(item.items.length)}
    />
  );
}

function CardLink({ item }) {
  const icon = isInternalUrl(item.href) ? <DocIcon /> : <ExternalIcon />;
  const doc = useDocById(item.docId ?? undefined);
  return (
    <CardLayout
      href={item.href}
      icon={icon}
      title={item.label}
      description={item.description ?? doc?.description}
    />
  );
}

export default function DocCard({ item }) {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
