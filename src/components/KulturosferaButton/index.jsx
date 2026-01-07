import React from 'react';
import { motion } from 'framer-motion';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const KulturosferaButton = () => {
    return (
        <Link to="https://kulturosfera.com" className={styles.wrapper}>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={styles.shinyButton}
            >
                <span className={styles.textContainer}>
                    <img
                        src={useBaseUrl('/img/kulturosfera_logo_white.png')}
                        alt="Descoperă Kulturosfera"
                        className={styles.logo}
                    />
                    <span className={styles.text}>Descoperă Kulturosfera</span>
                </span>
            </motion.button>
        </Link>
    );
};

export default KulturosferaButton;
