import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { EdumatWordmark, KulturosferaLine } from '@site/src/components/Brand';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './Hero.module.css';
import KulturosferaButton from '../KulturosferaButton';
import SplitText from '../SplitText/SplitText';

export default function Hero() {
    const { siteConfig } = useDocusaurusContext();
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;

        // Configuration
        const waveCount = 50; // Number of points across
        const amplitude = 50;
        const frequency = 0.02;
        const speed = 0.02;
        let waveOffset = 0;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const init = () => {
            resize();
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            const centerY = height / 2;

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;

            // Draw multiple sine waves
            for (let j = 0; j < 5; j++) { // 5 layers of waves
                ctx.beginPath();
                for (let i = 0; i < width; i += 10) {
                    const y = centerY + Math.sin(i * frequency + waveOffset + j) * (amplitude + j * 20) * Math.sin(waveOffset * 0.5);
                    ctx.lineTo(i, y);
                }
                ctx.stroke();
            }

            // Draw points on the main wave
            for (let i = 0; i < width; i += 30) {
                const y = centerY + Math.sin(i * frequency + waveOffset) * amplitude * Math.sin(waveOffset * 0.5);

                ctx.beginPath();
                ctx.arc(i, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
            }

            waveOffset += speed;
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <header className={styles.heroContainer}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />
            <div className={styles.heroOverlay}></div>
            <div className={clsx('container', styles.heroContent)}>
                <h1 className={styles.heroTitle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <span
                        style={{
                            fontFamily: "'Space Grotesk', system-ui, sans-serif",
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            letterSpacing: '0.22em',
                            color: '#fff',
                        }}
                    >
                        KULTUROSFERA
                    </span>
                    <KulturosferaLine width={110} />
                    <span style={{ color: '#fff', marginTop: 6 }}>
                        <EdumatWordmark width={340} />
                    </span>
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                        {siteConfig.title}
                    </span>
                </h1>
                <SplitText
                    text={siteConfig.tagline}
                    className={styles.heroSubtitle}
                    delay={50}
                    animationFrom={{ opacity: 0, transform: 'translate3d(0,40px,0)' }}
                    animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                    easing="easeOutCubic"
                    threshold={0.1}
                    rootMargin="-100px"
                />
                <br></br>
                <br></br>
                <div className={styles.buttons}>
                    <Link
                        className={clsx('button button--lg', styles.glowButton)}
                        to="/navigation">
                        Descoperă Edumat
                    </Link>
                    <KulturosferaButton />
                </div>
            </div>
        </header>
    );
}
