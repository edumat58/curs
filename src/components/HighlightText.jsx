import React from 'react';

const colorMap = {
  red: '#FF6B6B',
  teal: '#4ECDC4',
  orange: '#FF8C00',
  purple: '#9370DB',
  blue: '#4ECDC4',
  green: '#32CD32'
};

const HighlightText = ({ children, color = 'red', bold = true }) => {
  const style = {
    color: colorMap[color] || color,
    fontWeight: bold ? 'bold' : 'normal'
  };

  return <span style={style}>{children}</span>;
};

export default HighlightText;