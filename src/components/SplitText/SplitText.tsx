import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number;
    animationFrom?: gsap.TweenVars;
    animationTo?: gsap.TweenVars;
    easing?: string;
    threshold?: number;
    rootMargin?: string;
    textAlign?: React.CSSProperties['textAlign'];
    onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
    text,
    className = '',
    delay = 100,
    animationFrom = { opacity: 0, y: 40 },
    animationTo = { opacity: 1, y: 0 },
    easing = 'power3.out',
    threshold = 0.1,
    rootMargin = '-100px',
    textAlign = 'center',
    onLetterAnimationComplete
}) => {
    const words = text.split(' ').map(word => word.split(''));
    const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

    useGSAP(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                gsap.fromTo(lettersRef.current.filter((l): l is HTMLSpanElement => l !== null),
                    animationFrom,
                    {
                        ...animationTo,
                        delay: delay / 1000,
                        ease: easing,
                        stagger: 0.02,
                        duration: 1,
                        onComplete: onLetterAnimationComplete
                    },
                );
                observer.disconnect();
            }
        }, { threshold, rootMargin });

        if (lettersRef.current.length > 0 && lettersRef.current[0]?.parentElement) {
            observer.observe(lettersRef.current[0].parentElement);
        }

        return () => observer.disconnect();
    }, [text, delay, easing, animationFrom, animationTo, threshold, rootMargin, onLetterAnimationComplete]);

    return (
        <p
            className={`split-parent ${className}`}
            style={{ textAlign, display: 'inline', whiteSpace: 'normal', wordWrap: 'break-word' }}
        >
            {words.map((word, i) => (
                <span key={i} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {word.map((char, j) => {
                        const index = words.slice(0, i).reduce((acc, w) => acc + w.length, 0) + j;
                        return (
                            <span
                                key={j}
                                ref={el => { if (el) lettersRef.current[index] = el }}
                                style={{ display: 'inline-block', opacity: 0, willChange: 'transform, opacity' }}
                            >
                                {char}
                            </span>
                        );
                    })}
                    <span style={{ display: 'inline-block' }}>&nbsp;</span>
                </span>
            ))}
        </p>
    );
};

export default SplitText;
