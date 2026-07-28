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
import styles from './styles.module.css';

/**
 * DocCard compactizat — stil EduPAȘI cu accent portocaliu.
 * Grid: [iconiță/număr] [titlu + descriere] [CTA →]
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

function FolderIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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

function CardLayout({ href, icon, title, description, isEduPasi }) {
  return (
    <Link
      href={href}
      className={clsx(styles.cardContainer, isEduPasi && styles.cardContainerEduPasi)}>
      <span className={clsx(styles.cardIcon, isEduPasi && styles.cardIconEduPasi)}>{icon}</span>
      <div className={styles.cardCopy}>
        <strong className={clsx(styles.cardTitle, isEduPasi && styles.cardTitleEduPasi)} title={title}>
          {title}
        </strong>
        {description && (
          <small className={styles.cardDescription} title={description}>
            {description}
          </small>
        )}
      </div>
      <span className={clsx(styles.cardCta, isEduPasi && styles.cardCtaEduPasi)}>
        Deschide <ArrowIcon />
      </span>
    </Link>
  );
}

function CardCategory({ item }) {
  const href = findFirstSidebarItemLink(item);
  const categoryItemsPlural = useCategoryItemsPlural();
  if (!href) {
    return null;
  }
  const isEduPasi = href?.includes('/edupasi') || item.label?.includes('EduPAȘI');
  return (
    <CardLayout
      href={href}
      icon={isEduPasi ? <FolderIcon /> : <CategoryIcon />}
      title={item.label}
      description={item.description ?? categoryItemsPlural(item.items.length)}
      isEduPasi={isEduPasi}
    />
  );
}

function CardLink({ item }) {
  const isEduPasi = item.href?.includes('/edupasi') || item.label?.includes('EduPAȘI');
  const icon = isEduPasi ? <FolderIcon /> : isInternalUrl(item.href) ? <DocIcon /> : <ExternalIcon />;
  const doc = useDocById(item.docId ?? undefined);
  return (
    <CardLayout
      href={item.href}
      icon={icon}
      title={item.label}
      description={item.description ?? doc?.description}
      isEduPasi={isEduPasi}
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
