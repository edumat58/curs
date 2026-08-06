import React from 'react';
import clsx from 'clsx';
import AdmonitionLayout from '@theme/Admonition/Layout';
import IconSoft from '@theme/Admonition/Icon/Soft';

/**
 * `:::soft` — caseta blândă.
 *
 * Celelalte tipuri strigă: definiție, atenție, cerință. Aceasta doar întinde
 * mâna: o recomandare, un sprijin, ceva care se poate face și altfel. De aceea
 * nu împrumută clasele `alert` ale Infimei (culoare tare, contur gros), ci are
 * stilul ei din `custom.css`, pe plăcuța cremă a lecției.
 */
const defaultProps = {
  icon: <IconSoft />,
  title: 'recomandare',
};

export default function AdmonitionTypeSoft(props) {
  return (
    <AdmonitionLayout
      {...defaultProps}
      {...props}
      className={clsx('alert', 'admonition-soft', props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
