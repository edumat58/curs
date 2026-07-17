import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { EdumatWordmark } from '@site/src/components/Brand';
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
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let width, height, dpr, raf;
        let t = 0;

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        // --- grila planului cartezian, în drift lent -------------------------
        const drawGrid = () => {
            const step = 56;
            const off = (t * 6) % step;
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = -off; x < width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for (let y = -off * 0.6; y < height; y += step) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();
        };

        // --- unda Fourier compusă (3 armonici) + armonicele ei slabe ---------
        const fourierY = (x, phase) =>
            Math.sin(x * 0.008 + phase) * 34 +
            Math.sin(x * 0.016 + phase * 1.7) * 16 +
            Math.sin(x * 0.032 + phase * 2.3) * 7;

        const drawWaves = () => {
            const baseY = height * 0.68;
            // armonicele individuale, abia vizibile
            for (let h = 0; h < 3; h++) {
                const k = 0.008 * Math.pow(2, h);
                const A = [34, 16, 7][h];
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255,255,255,0.10)';
                ctx.lineWidth = 1;
                for (let x = 0; x <= width; x += 6) {
                    const y = baseY + Math.sin(x * k + t * (1 + h * 0.7)) * A;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            // suma lor — unda vie, principală
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 2;
            for (let x = 0; x <= width; x += 4) {
                const y = baseY + fourierY(x, t);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            // puncte care călătoresc pe undă
            for (let i = 0; i < 5; i++) {
                const px = ((t * 90 + (i * width) / 5) % (width + 40)) - 20;
                const py = baseY + fourierY(px, t);
                ctx.beginPath();
                ctx.arc(px, py, 3.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.fill();
            }
        };

        // --- figura Lissajous cu raport care se morfează ---------------------
        const drawLissajous = () => {
            const cx = width * 0.82, cy = height * 0.30;
            const R = Math.min(width, height) * 0.13;
            const a = 3, b = 2 + Math.sin(t * 0.1) * 0.28; // morfare lentă
            const delta = t * 0.35;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.34)';
            ctx.lineWidth = 1.5;
            for (let s = 0; s <= Math.PI * 2; s += 0.01) {
                const x = cx + R * Math.sin(a * s + delta);
                const y = cy + R * Math.sin(b * s);
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            // cometa care trasează figura
            const s0 = (t * 0.9) % (Math.PI * 2);
            for (let k = 0; k < 12; k++) {
                const s = s0 - k * 0.02;
                const x = cx + R * Math.sin(a * s + delta);
                const y = cy + R * Math.sin(b * s);
                ctx.beginPath();
                ctx.arc(x, y, 3 - k * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.9 - k * 0.07})`;
                ctx.fill();
            }
        };

        // --- spirala de aur, rotație imperceptibilă --------------------------
        const drawSpiral = () => {
            const cx = width * 0.15, cy = height * 0.26;
            const rot = t * 0.05;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx.lineWidth = 1.25;
            for (let s = 0; s < Math.PI * 6; s += 0.05) {
                const r = 3 * Math.exp(0.18 * s);
                if (r > Math.min(width, height) * 0.16) break;
                const x = cx + r * Math.cos(s + rot);
                const y = cy + r * Math.sin(s + rot);
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        // --- constelația de poligoane: contururi mici, rotații lente ---------
        const POLY = [
            { fx: 0.34, fy: 0.22, n: 3, r: 17, sp: 0.22 },
            { fx: 0.60, fy: 0.16, n: 4, r: 13, sp: -0.16 },
            { fx: 0.48, fy: 0.84, n: 6, r: 15, sp: 0.12 },
            { fx: 0.90, fy: 0.72, n: 5, r: 12, sp: -0.2 },
            { fx: 0.08, fy: 0.66, n: 3, r: 11, sp: 0.18 },
        ];
        const drawPolys = () => {
            for (const p of POLY) {
                const cx = width * p.fx, cy = height * p.fy;
                const rot = t * p.sp;
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255,255,255,0.22)';
                ctx.lineWidth = 1.25;
                for (let i = 0; i <= p.n; i++) {
                    const ang = rot + (i * Math.PI * 2) / p.n - Math.PI / 2;
                    const x = cx + p.r * Math.cos(ang);
                    const y = cy + p.r * Math.sin(ang);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fill();
            }
        };

        const frame = () => {
            ctx.clearRect(0, 0, width, height);
            drawGrid();
            drawSpiral();
            drawLissajous();
            drawPolys();
            drawWaves();
        };

        const animate = () => {
            t += 0.016;
            frame();
            raf = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        if (reduced) {
            t = 2; frame(); // un singur cadru static, tot compozit
        } else {
            animate();
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <header className={styles.heroContainer}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />
            <div className={styles.heroOverlay}></div>
            <div className={clsx('container', styles.heroContent)}>
                <h1 className={styles.heroTitle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: '#fff' }}>
                        <EdumatWordmark width={420} />
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
