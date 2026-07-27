import React from 'react';
import styles from './HighlightText.module.css';

const supportedColors = new Set(['red', 'teal', 'orange', 'purple', 'blue', 'green']);

const HighlightText = ({ children, color = 'red', bold = true }) => {
  const knownColor = supportedColors.has(color);
  const className = [
    styles.highlight,
    knownColor ? styles[color] : '',
    bold ? styles.bold : styles.regular,
  ].filter(Boolean).join(' ');

  return (
    <span className={className} style={knownColor ? undefined : { color }}>
      {children}
    </span>
  );
};

export default HighlightText;
