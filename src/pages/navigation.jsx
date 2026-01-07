/* src/pages/navigation.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { motion } from 'framer-motion';
import styles from './navigation.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';

/* -------------------------------------------------------------------------------------------------
 * CONFIGURATION - EDIT HERE
 * ----------------------------------------------------------------------------------------------- */
const SCHOOL_YEAR_CONFIG = {
    // Format: YYYY-MM-DD
    startDate: '2025-09-08',
    endDate: '2026-06-20',
    holidays: [
        { name: 'Vacanța de toamnă', start: '2025-10-27', end: '2025-11-02' },
        { name: 'Vacanța de iarnă', start: '2025-12-20', end: '2026-01-07' },
        { name: 'Vacanța de schi', start: '2026-02-14', end: '2026-02-22' },
        { name: 'Vacanța de primăvară', start: '2026-04-04', end: '2026-04-14' },
    ],
};

const getNavLinks = () => [
    {
        title: 'Kulturosfera',
        description: 'Ecosistemul tău educațional complet.',
        link: 'https://kulturosfera.com',
        image: useBaseUrl('/img/kulturosfera_logo.png'),
        external: true,
    },
    {
        title: 'EduREV',
        description: 'Vizualizarea evaluărilor și progresului.',
        link: 'https://edurev.kulturosfera.com',
        icon: 'data_thresholding',
        external: true,
    },
    {
        title: 'Bun Venit!',
        description: 'Ghidul de introducere în platformă.',
        link: '/curs/docs/intro',
        icon: 'waving_hand',
    },
    {
        title: 'Stare Sistem',
        description: 'Verifică disponibilitatea serviciilor.',
        link: '/curs/docs/status',
        icon: 'dns',
    },
    {
        title: 'Clasa a V-a',
        description: 'Materiale de studiu pentru clasa a V-a.',
        link: '/curs/docs/category/curs-v',
        icon: 'filter_5',
    },
    {
        title: 'Clasa a VI-a',
        description: 'Materiale de studiu pentru clasa a VI-a.',
        link: '/curs/docs/category/curs-vi',
        icon: 'filter_6',
    },
    {
        title: 'Clasa a VII-a',
        description: 'Materiale de studiu pentru clasa a VII-a.',
        link: '/curs/docs/category/curs-vii',
        icon: 'filter_7',
    },
    {
        title: 'Clasa a VIII-a',
        description: 'Materiale de studiu pentru clasa a VIII-a.',
        link: '/curs/docs/category/curs-viii',
        icon: 'filter_8',
    },
];

/* -------------------------------------------------------------------------------------------------
 * HELPERS
 * ----------------------------------------------------------------------------------------------- */
const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

const getPercentage = (date, start, end) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const dateTime = new Date(date).getTime();

    if (dateTime < startTime) return 0;
    if (dateTime > endTime) return 100;

    return ((dateTime - startTime) / (endTime - startTime)) * 100;
};

/* -------------------------------------------------------------------------------------------------
 * COMPONENT: SchoolYearProgress
 * ----------------------------------------------------------------------------------------------- */
const SchoolYearProgress = () => {
    const { startDate, endDate, holidays } = SCHOOL_YEAR_CONFIG;
    const [progress, setProgress] = useState(0);
    const [currentIntervalName, setCurrentIntervalName] = useState('');

    // 1. Helper to parse YYYY-MM-DD as local midnight to avoid timezone shifts
    // or use UTC consistently. Here we'll treat them as UTC timestamps for calculation,
    // but we want inclusive end dates.
    const parseDate = (str) => new Date(str).getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Derive structure: Modules interleaved with Holidays
    const { structure, totalDuration, timelineStart, timelineEnd } = useMemo(() => {
        // Start of the school year
        const start = parseDate(startDate);

        // Sort holidays
        const sortedHolidays = [...holidays].sort((a, b) => parseDate(a.start) - parseDate(b.start));

        // Determine visual end. 
        // We want the timeline to end exactly at the end of the last holiday (Summer) or the official end date.
        // NOTE: We treat holiday end dates as INCLUSIVE. So if it ends on 07, we visualize up to start of 08.
        let visualEnd = parseDate(endDate);

        // If last holiday is Summer Holiday (or just the last one), we might extend the year end
        if (sortedHolidays.length > 0) {
            const lastHolidayEnd = parseDate(sortedHolidays[sortedHolidays.length - 1].end) + ONE_DAY;
            if (lastHolidayEnd > visualEnd) {
                visualEnd = lastHolidayEnd;
            }
        }

        // Total duration for percentage calc
        const duration = visualEnd - start;

        const segments = [];
        let currentStart = start;
        let moduleCount = 1;

        sortedHolidays.forEach((holiday) => {
            const hStart = parseDate(holiday.start);
            // Holiday end date + 1 day to be inclusive (e.g., ends on 7th means 7th is holiday, school starts 8th)
            const hEnd = parseDate(holiday.end) + ONE_DAY;

            // Add Module before this holiday (if gap exists and we haven't passed M5)
            // Note: We check moduleCount <= 5 to ensure we don't accidentally create M6 if config is weird
            if (hStart > currentStart && moduleCount <= 5) {
                const modWidth = ((hStart - currentStart) / duration) * 100;
                const modLeft = ((currentStart - start) / duration) * 100;
                segments.push({
                    type: 'module',
                    name: `Modulul ${moduleCount}`,
                    left: modLeft,
                    width: modWidth,
                    start: currentStart,
                    end: hStart - ONE_DAY // Visual display end (inclusive)
                });
                moduleCount++;
            }

            // Add Holiday
            const holWidth = ((hEnd - hStart) / duration) * 100;
            const holLeft = ((hStart - start) / duration) * 100;

            // Determine display name for holiday end (subtract 1 day because hEnd is exclusive start of next day)
            const visualHolidayEnd = hEnd - ONE_DAY;

            segments.push({
                type: 'holiday',
                name: holiday.name,
                left: holLeft,
                width: holWidth,
                start: hStart,
                end: visualHolidayEnd
            });

            currentStart = hEnd;
        });

        // Add final Module (M5 probably, or if we stopped early)
        // Only add if we are still within the limit and there is space
        if (currentStart < visualEnd && moduleCount <= 5) {
            const modWidth = ((visualEnd - currentStart) / duration) * 100;
            const modLeft = ((currentStart - start) / duration) * 100;
            segments.push({
                type: 'module',
                name: `Modulul ${moduleCount}`,
                left: modLeft,
                width: modWidth,
                start: currentStart,
                end: visualEnd - ONE_DAY
            });
        }

        return { structure: segments, totalDuration: duration, timelineStart: start, timelineEnd: visualEnd };
    }, [startDate, endDate, holidays]);

    useEffect(() => {
        const updateProgress = () => {
            const now = new Date();
            const nowTime = now.getTime();

            // Calculate progress percentage
            let pct = 0;
            if (nowTime >= timelineStart && nowTime <= timelineEnd) {
                pct = ((nowTime - timelineStart) / totalDuration) * 100;
            } else if (nowTime > timelineEnd) {
                pct = 100;
            }
            setProgress(pct);

            // Identify current interval
            // Logic: Iterate segments, checking if now is within [start, end]
            // Note: segments use inclusive dates.
            // We need to match precise day.

            const activeSegment = structure.find(seg => {
                // Check roughly if current time falls in range
                return nowTime >= seg.start && nowTime <= (seg.end + ONE_DAY);
            });

            if (activeSegment) {
                setCurrentIntervalName(activeSegment.name);
            } else {
                if (nowTime < timelineStart) setCurrentIntervalName('Încă nu a început');
                else if (nowTime > timelineEnd) setCurrentIntervalName('Vacanță de vară'); // or end of year
                else setCurrentIntervalName('Activitate');
            }
        };
        updateProgress();
        const interval = setInterval(updateProgress, 60000);
        return () => clearInterval(interval);
    }, [structure, timelineStart, timelineEnd, totalDuration]);

    return (
        <div className={styles.progressContainer}>
            <div className={styles.progressHeaderRow}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.progressTitle}>Structura Anului Școlar</h2>
                    <p className={styles.progressSubtitle}>Progres: {Math.round(progress)}%</p>
                </div>

                <div className={styles.datesGroup}>
                    {/* Current Date Label */}
                    <div className={styles.currentDateLabel}>
                        Azi: {formatDate(new Date())} {currentIntervalName && <span>({currentIntervalName})</span>}
                    </div>
                    {/* School Year Range */}
                    <div className={styles.progressDates}>
                        {formatDate(startDate)} — {formatDate(new Date(timelineEnd - ONE_DAY))}
                    </div>
                </div>
            </div>

            <div className={styles.statusBarContainer}>
                {/* Base Year (Turquoise) */}
                <div className={styles.statusBarBackground} />

                {/* Segments */}
                {structure.map((seg, idx) => {
                    const rangeStr = `${formatDate(seg.start)} - ${formatDate(seg.end)}`;

                    // Determine rounded corners based on position
                    // If it's the first segment, round left.
                    // If it's the last segment, round right.
                    const isFirst = idx === 0;
                    const isLast = idx === structure.length - 1;

                    const segmentClasses = [
                        seg.type === 'module' ? styles.segmentModule : styles.segmentHoliday,
                        isFirst ? styles.roundedLeft : '',
                        isLast ? styles.roundedRight : ''
                    ].join(' ');

                    return (
                        <div
                            key={idx}
                            className={segmentClasses}
                            style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                        >
                            <div className={styles.segmentTooltip}>
                                <strong>{seg.name}</strong>
                                <br />
                                {rangeStr}
                            </div>

                            {seg.width > 3 && (
                                <span className={styles.segmentLabel}>
                                    {seg.type === 'module' ? `M${seg.name.split(' ')[1]}` : ''}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Current Time Indicator */}
                <div
                    className={styles.currentTimeIndicator}
                    style={{ left: `${progress}%` }}
                />
            </div>


            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendColorBox} style={{ background: '#20c997' }}></div>
                    <span>Module (Cursuri)</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColorBox} style={{ background: '#fd7e14' }}></div>
                    <span>Vacanțe</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColorBox} style={{ background: '#ff6b6b', width: '2px', height: '14px' }}></div>
                    <span>Astăzi</span>
                </div>
            </div>
        </div >
    );
};

/* -------------------------------------------------------------------------------------------------
 * COMPONENT: NavigationCard
 * ----------------------------------------------------------------------------------------------- */
const NavigationCard = ({ item, index }) => {
    return (
        <motion.a
            href={item.link}
            target={item.external ? "_blank" : "_self"}
            rel={item.external ? "noopener noreferrer" : ""}
            className={styles.card}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
        >
            <div className={styles.cardGlow} />

            <div className={styles.cardIconWrapper}>
                {item.image ? (
                    <img src={item.image} alt={item.title} className={styles.cardImage} />
                ) : (
                    <span className="material-icons">{item.icon}</span>
                )}
            </div>

            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDescription}>{item.description}</p>

            <div className={styles.cardHoverLine} />
        </motion.a>
    );
};

/* -------------------------------------------------------------------------------------------------
 * MAIN PAGE
 * ----------------------------------------------------------------------------------------------- */
export default function NavigationPage() {
    const links = getNavLinks();

    return (
        <Layout title="Navigare" description="Centrul de comandă Edumat58" noFooter>
            <Head>
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
            </Head>

            <main className={styles.mainWrapper}>
                <div className={styles.contentContainer}>

                    <div className={styles.pageHeader}>
                        <br></br>
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={styles.mainTitle}
                        >
                            Meniu Principal
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={styles.mainSubtitle}
                        >
                            Acces rapid la toate resursele educaționale.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={styles.progressWrapper}
                    >
                        <SchoolYearProgress />
                    </motion.div>

                    <div className={styles.grid}>
                        {links.map((item, index) => (
                            <NavigationCard key={index} item={item} index={index} />
                        ))}
                    </div>
                    <br></br>
                    <br></br>

                </div>
            </main>
        </Layout>
    );
}
