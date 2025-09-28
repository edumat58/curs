import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import TagsListInline from '@theme/TagsListInline';
export default function DocItemFooter() {
  const {metadata} = useDoc();
  const {tags} = metadata;
  const canDisplayTagsRow = tags.length > 0;
  return (
    <footer
      className={clsx(ThemeClassNames.docs.docFooter, 'docusaurus-mt-lg')}>
      {canDisplayTagsRow && (
        <div
          className={clsx(
            'row margin-top--sm',
            ThemeClassNames.docs.docFooterTagsRow,
          )}>
          <div className="col">
            <TagsListInline tags={tags} />
          </div>
        </div>
      )}
      <div
        className={clsx(
          'margin-top--sm',
          ThemeClassNames.docs.docFooterEditMetaRow,
        )}
        style={{
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textAlign: 'left',
          opacity: 0.2, // opacitate scazuta ca watermark
          letterSpacing: '0.10em', // litere mai departate
        }}>
        © Proprietate intelectuala Edumat58
      </div>
    </footer>
  );
}
