import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { JSX } from 'react/jsx-runtime';
import React from 'react';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Algebră',
    Svg: require('@site/static/img/alg.svg').default,
    description: (
      <>
        Explorează cum conceptele algebrei matematice te ajută să înțelegi și să rezolvi probleme din viața de zi cu zi.
      </>
    ),
    },
    {
    title: 'Geometrie în plan',
    Svg: require('@site/static/img/geop.svg').default,
    description: (
      <>
      Descoperiți conceptele geometriei în plan, cum ar fi punctele, liniile, 
      unghiurile și formele plane, pentru a înțelege mai bine lumea bidimensională.
      </>
    ),
  },
  {
    title: 'Geometrie în spațiu',
    Svg: require('@site/static/img/geos.svg').default,
    description: (
      <>
        Explorați fundamentele geometriei în spațiu, plane și corpuri geometrice, pentru a dezvolta o înțelegere solidă a conceptelor tridimensionale.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
