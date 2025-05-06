import React from 'react';
import 'katex/dist/katex.min.css';
import TeX from '@matejmazur/react-katex';

export default function Katex({ children }) {
  return <TeX block math={children} />;
}
