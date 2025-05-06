import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Math({ children, display = false }) {
  const html = katex.renderToString(children, {
    throwOnError: false,
    displayMode: display,
  });

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ display: display ? 'block' : 'inline', margin: display ? '1em 0' : 0 }}
    />
  );
}
