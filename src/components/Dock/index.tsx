
import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import clsx from "clsx";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// Icons 
import { Home, BookOpen, GraduationCap, ChevronLeft, LayoutGrid, Calendar, ChevronRight, MoreHorizontal, XCircle } from "lucide-react";

export interface DockItemData {
    title: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
}

interface DockProps {
    items?: DockItemData[];
    className?: string;
}

const DEFAULT_ITEMS: DockItemData[] = [
    { title: "Curs V", icon: <strong className="font-bold text-2xl">V</strong>, href: "/curs/docs/category/curs-v" },
    { title: "Curs VI", icon: <strong className="font-bold text-2xl">VI</strong>, href: "/curs/docs/category/curs-vi" },
    { title: "Curs VII", icon: <strong className="font-bold text-2xl">VII</strong>, href: "/curs/docs/category/curs-vii" },
    { title: "Curs VIII", icon: <strong className="font-bold text-2xl">VIII</strong>, href: "/curs/docs/category/curs-viii" },
];

export default function Dock({ items, className }: DockProps) {
    const mouseX = useMotionValue(Infinity);
    const location = useLocation();
    const { globalData } = useDocusaurusContext();

    const [hideUI, setHideUI] = React.useState(() => ExecutionEnvironment.canUseDOM ? localStorage.getItem('hideUI') === 'true' : false);

    React.useEffect(() => {
        const handleStorageChange = () => {
            setHideUI(localStorage.getItem('hideUI') === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        // Also listen for custom event if needed
        window.addEventListener('uiToggle', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('uiToggle', handleStorageChange);
        };
    }, []);

    const finalItems = React.useMemo(() => {
        if (items) return items;

        const path = location.pathname;

        // Extract pluginData and allDocs at the top level of useMemo so they are available to all helpers
        const pluginData = globalData?.['docusaurus-plugin-content-docs']?.default as any;
        const allDocs = pluginData?.versions?.[0]?.docs;

        // Helper to find a category in the sidebar by its link
        const findSidebarCategory = (items: any[], href: string): any => {
            if (!items || !Array.isArray(items)) return null;
            for (const item of items) {
                if (item.href === href || (item.link && item.link.href === href)) {
                    return item;
                }
                if (item.items) {
                    const found = findSidebarCategory(item.items, href);
                    if (found) return found;
                }
            }
            return null;
        };

        // Helper to generate items for a specific course (Category View)
        const getCourseItems = (
            courseId: string, // e.g. "curs-viii" (part of URL) or full identifier checks
            courseLabel: string,
            organigramaPath: string
        ) => {
            const courseCategoryPath = `/curs/docs/category/${courseId}`;
            // Normalize path to ignore trailing slash for comparison if needed, 
            // though Docusaurus usually normalizes.
            const isAtCourseCategory = path === courseCategoryPath || path === courseCategoryPath + '/';

            const secondItem = isAtCourseCategory ? {
                title: "Acasă",
                icon: <Home size={28} />,
                href: "/curs/"
            } : {
                title: courseLabel,
                icon: <strong className="font-bold text-2xl">{courseLabel.replace("Curs ", "")}</strong>,
                href: courseCategoryPath
            };

            const baseItems: DockItemData[] = [
                {
                    title: "Organigramă",
                    icon: <Calendar size={28} />,
                    href: organigramaPath
                },
                secondItem
            ];

            // Try to find modules dynamically from sidebar
            // pluginData is now available from outer scope

            // Note: client-side globalData sidebar might be metadata only. 
            // If we can't traverse sidebar, we scan the flat docs list.

            // Strategy 1: Attempt Sidebar Traversal (if available)
            const sidebar = pluginData?.versions?.[0]?.sidebars?.tutorialSidebar;
            if (sidebar && Array.isArray(sidebar)) {
                const courseHref = `/curs/docs/category/${courseId}`;
                const courseCategory = findSidebarCategory(sidebar, courseHref);

                if (courseCategory && courseCategory.items) {
                    console.log(`[Dock] Strategy 1 (Sidebar) used for ${courseId}. Found items:`, courseCategory.items.length);
                    const modules = courseCategory.items
                        .filter((item: any) => item.label && item.label.toString().startsWith("Modul"))
                        .map((item: any) => {
                            const match = item.label.match(/Modul (\d+)/);
                            const num = match ? match[1] : "?";
                            return {
                                title: item.label,
                                icon: <strong className="font-bold text-xl">M{num}</strong>,
                                href: item.href || item.link?.href
                            };
                        });

                    if (modules.length > 0) return [...baseItems, ...modules.reverse()];
                } else {
                    console.log(`[Dock] Strategy 1 failed: Course category not found for ${courseHref}`);
                }
            }

            // Strategy 2: Scan flat docs list (heuristic)
            // allDocs is available from outer scope
            console.log(`[Dock] Attempting Strategy 2 (Flat Docs) for ${courseId}. Total docs:`, allDocs?.length);
            if (Array.isArray(allDocs)) {
                // We need to find modules that belong to this course.
                // WE assume courseId (e.g. 'curs-viii') appears in the ID or Path of the module.
                // Example: /curs/docs/c8/modul-4 -> id might be 'c8/modul-4' or similar?
                // Or user's custom slug '/category/modul-4' makes it hard.

                // Let's look for docs that have 'Modul' in label or path AND match our course heuristics
                // For 'curs-viii' we look for 'c8' or '-3' suffix or just assume if it's 'Modul 4' it's here?
                // No, that's dangerous.

                // Let's filter by the known numeric suffixes for existing modules? 
                // c8 -> -3, c7 -> -2, c6 -> -1

                // But the NEW module-4 didn't have a suffix in the logs? 
                // Logged: "id": "/category/modul-4", "path": "/curs/docs/category/modul-4"

                // If it has NO suffix, it's ambiguous. But we can check if it *should* be here.

                const relevantDocs = allDocs.filter((doc: any) => {
                    // Check if it looks like a module category
                    if (!doc.path.includes('/category/modul-')) return false;

                    // Helper regex for strict suffix (must be preceded by digit, i.e. modul-X-suffix)
                    // Valid: modul-1-3. Invalid: modul-3.
                    const hasStrictSuffix = (suf: string) => new RegExp(`-\\d+${suf}$`).test(doc.path);

                    // Check course association
                    if (courseId === 'curs-viii') {
                        return doc.id.includes('c8') || doc.path.includes('c8') || hasStrictSuffix('-3') || doc.path.endsWith('modul-4');
                    }
                    if (courseId === 'curs-vii') return doc.id.includes('c7') || doc.path.includes('c7') || hasStrictSuffix('-2');
                    if (courseId === 'curs-vi') return doc.id.includes('c6') || doc.path.includes('c6') || hasStrictSuffix('-1');
                    if (courseId === 'curs-v') {
                        // Curs V has no suffix (usually) or generic
                        return doc.id.includes('c5') || doc.path.includes('c5') ||
                            (doc.path.match(/modul-\d+$/) && !doc.path.includes('c6') && !doc.path.includes('c7') && !doc.path.includes('c8'));
                    }

                    return false;
                });
                console.log(`[Dock] Strategy 2 found docs:`, relevantDocs.map(d => d.path));

                if (relevantDocs.length > 0) {
                    // Sort by module number
                    relevantDocs.sort((a: any, b: any) => {
                        const getNum = (p: string) => {
                            const match = p.match(/modul-(\d+)/);
                            return match ? parseInt(match[1]) : 99;
                        };
                        return getNum(b.path) - getNum(a.path);
                    });

                    const modules = relevantDocs.map((doc: any) => {
                        const match = doc.path.match(/modul-(\d+)/);
                        const num = match ? match[1] : "?";
                        return {
                            title: `Modul ${num}`,
                            icon: <strong className="font-bold text-xl">M{num}</strong>,
                            href: doc.path
                        };
                    });

                    // De-duplicate with preference for specific suffix
                    const distinctModules = new Map<string, any>();

                    // Define target suffix for this course
                    const targetSuffix =
                        courseId === "curs-viii" ? "-3" :
                            courseId === "curs-vii" ? "-2" :
                                courseId === "curs-vi" ? "-1" : "";

                    for (const m of modules) {
                        if (!distinctModules.has(m.title)) {
                            distinctModules.set(m.title, m);
                        } else {
                            // Collision: Check if current 'm' is better than existing
                            const existing = distinctModules.get(m.title);

                            // Preference 1: Has strict suffix
                            const currentHasStrict = targetSuffix ? new RegExp(`-\\d+${targetSuffix}$`).test(m.href) : false;
                            const existingHasStrict = targetSuffix ? new RegExp(`-\\d+${targetSuffix}$`).test(existing.href) : false;

                            if (currentHasStrict && !existingHasStrict) {
                                distinctModules.set(m.title, m);
                                continue;
                            }
                            if (existingHasStrict && !currentHasStrict) continue;

                            // Preference 2: Longer path (usually implies more specific)
                            if (m.href.length > existing.href.length) {
                                distinctModules.set(m.title, m);
                            }
                        }
                    }

                    const uniqueModules = Array.from(distinctModules.values());

                    if (uniqueModules.length > 0) return [...baseItems, ...uniqueModules];
                }
            }

            console.log(`[Dock] Fallback to Hardcoded Strategy for ${courseId}`);

            // hardcoded fallback 
            const fallbackSuffix =
                courseId === "curs-viii" ? "-3" :
                    courseId === "curs-vii" ? "-2" :
                        courseId === "curs-vi" ? "-1" : "";

            return [
                ...baseItems,
                ...[3, 2, 1].map(m => ({
                    title: `Modul ${m}`,
                    icon: <strong className="font-bold text-xl">M{m}</strong>,
                    href: `/curs/docs/category/modul-${m}${fallbackSuffix}`
                }))
            ];
        };

        // Dynamic Max lessons calculation
        // allDocs is available from outer scope

        const getMaxLessonsForModule = (courseId: string, moduleNum: number): number => {
            if (!allDocs || !Array.isArray(allDocs)) return 99; // Fallback

            // Define course path identifiers
            const coursePathIdentifier: Record<string, string> = {
                "curs-v": "/c5/",
                "curs-vi": "/c6/",
                "curs-vii": "/c7/",
                "curs-viii": "/c8/"
            };

            const searchPath = coursePathIdentifier[courseId];
            if (!searchPath) return 99;

            let maxFound = 0;
            const moduleRegex = new RegExp(`modul-${moduleNum}/(\\d+)$`); // Matches .../modul-X/YY

            allDocs.forEach((doc: any) => {
                // Check if doc belongs to this course
                if (doc.path.includes(searchPath)) {
                    const match = doc.path.match(moduleRegex);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num) && num > maxFound) {
                            maxFound = num;
                        }
                    }
                }
            });

            // If no lessons found (maybe structure is different), fallback to strict suffix check or other heuristics if needed
            // But for now, assuming standard structure .../cX/modul-Y/ZZ
            return maxFound > 0 ? maxFound : 1; // Default to at least 1 if we can't find any (prevents errors)
        };

        // Cache results to avoid re-scanning too often if needed, but in useMemo it's fine.
        // We will call this function instead of looking up COURSE_MAX_LESSONS.

        // Helper for Lesson View (Specific Page .../modul-X/XX)
        const getLessonItems = (
            courseId: string,
            courseLabel: string,
            organigramaPath: string,
            lessonNumberStr: string,
            baseLessonPath: string
        ) => {
            const lessonNum = parseInt(lessonNumberStr, 10); // e.g. 18

            // Extract current module number from baseLessonPath (e.g. ".../modul-1/" or ".../modul-1-1/")
            // Using strict regex on baseLessonPath seems safest
            const moduleMatch = baseLessonPath.match(/modul-(\d+)/);
            const currentModuleNum = moduleMatch ? parseInt(moduleMatch[1], 10) : 1;

            const maxLessons = getMaxLessonsForModule(courseId, currentModuleNum);

            const formatNum = (n: number) => n.toString().padStart(2, '0');

            const dockItems: DockItemData[] = [
                {
                    title: "Organigramă",
                    icon: <Calendar size={28} />,
                    href: organigramaPath
                },
                {
                    title: courseLabel,
                    icon: <strong className="font-bold text-2xl">{courseLabel.replace("Curs ", "")}</strong>,
                    href: `/curs/docs/category/${courseId}`
                }
            ];

            // Previous Button
            if (lessonNum > 1) {
                dockItems.push({
                    title: "Precedent",
                    icon: <ChevronLeft size={30} />,
                    href: `${baseLessonPath}${formatNum(lessonNum - 1)}`
                });
            } else if (currentModuleNum > 1) {
                // Lesson is 1, but we have a previous module.
                // Go to the LAST lesson of the previous module.
                const prevModNum = currentModuleNum - 1;
                const prevModMaxLessons = getMaxLessonsForModule(courseId, prevModNum);

                // Construct path similar to Next logic
                const prevBase = baseLessonPath.replace(`modul-${currentModuleNum}`, `modul-${prevModNum}`);

                dockItems.push({
                    title: `Modul ${prevModNum}`,
                    icon: <strong className="font-bold text-xl">M{prevModNum}</strong>,
                    href: `${prevBase}${formatNum(prevModMaxLessons)}`
                });
            }
            // Else: Lesson 1 of Module 1 -> No Previous Button (Implicitly handled by failing both checks)    }

            // Next Button logic
            if (lessonNum < maxLessons) {
                // Normal next lesson
                dockItems.push({
                    title: "Următor",
                    icon: <ChevronRight size={30} />,
                    href: `${baseLessonPath}${formatNum(lessonNum + 1)}`
                });
            } else {
                // End of module, offer transition to next module if exists
                // Assuming max 3 modules for now based on known structure
                if (currentModuleNum < 3) {
                    const nextModNum = currentModuleNum + 1;
                    // Construct new path: replace "modul-X" with "modul-Y"
                    // This handles ".../modul-1/" -> ".../modul-2/" regardless of suffixes like -1, -2
                    // BUT we must be careful not to break suffixes if they exist in the folder path but not the slug?
                    // The baseLessonPath comes from URL.
                    // URL: /curs/docs/c6/modul-1/  (Docusaurus probably handled collisions by suffixing CATEGORY slug, but docs might live in 'modul-1' folder?)
                    // Wait, user said "modul-1" is ".../modul-1/". "modul-2" is ".../modul-2".
                    // Slugs in c6/modul-1 might be ".../c6/modul-1/...". 
                    // Slugs in c6/modul-2 might be ".../c6/modul-2/...".
                    // So simple replacement of `modul-{current}` with `modul-{next}` in the string should work

                    const nextBase = baseLessonPath.replace(`modul-${currentModuleNum}`, `modul-${nextModNum}`);

                    dockItems.push({
                        title: `Modul ${nextModNum}`,
                        icon: <strong className="font-bold text-xl">M{nextModNum}</strong>, // "M2" logic
                        href: `${nextBase}01` // Start at 01
                    });
                }
            }

            return dockItems;
        };


        // Regex to detect lesson: .../modul-\d+/(\d+)$
        // Capture groups: 1=modul-slug (might imply course), 2=lessonNumber
        // But we need to know WHICH course to link Organigrama correctly.
        // We can infer course from path segments "c7", "curs-vii", etc.

        // Check specific lesson structure first
        const lessonMatch = path.match(/(.*\/modul-\d+(?:-\d+)?\/)(\d+)$/);
        if (lessonMatch) {
            const [_, basePath, lessonNumStr] = lessonMatch;

            if (path.includes("curs-viii") || path.includes("/c8/")) {
                return getLessonItems("curs-viii", "Curs VIII", "/curs/docs/c8/organigrama", lessonNumStr, basePath);
            } else if (path.includes("curs-vii") || path.includes("/c7/")) {
                return getLessonItems("curs-vii", "Curs VII", "/curs/docs/c7/organigrama", lessonNumStr, basePath);
            } else if (path.includes("curs-vi") || path.includes("/c6/")) {
                return getLessonItems("curs-vi", "Curs VI", "/curs/docs/c6/organigrama", lessonNumStr, basePath);
            } else if (path.includes("curs-v") || path.includes("/c5/")) {
                return getLessonItems("curs-v", "Curs V", "/curs/docs/c5/organigrama", lessonNumStr, basePath);
            }
        }

        // Fix: Order checks from most specific (longest) to least specific to avoid substring matches
        // e.g., 'curs-vi' contains 'curs-v', so we must check 'curs-vi' first if we used simple includes.
        // Ideally use exact matches or stricter regex, but reverse order works well here.

        // We already have 5 items max for now (Organigrama + Label + 3 Modules = 5).
        // But adhering to user request for max 5 icons with expand capability.

        // Helper for Module Category View (e.g. .../category/modul-2-1)
        const getModuleCategoryItems = (
            courseId: string,
            courseLabel: string,
            organigramaPath: string
        ) => {
            return [
                {
                    title: "Acasă",
                    icon: <Home size={28} />,
                    href: "/curs/"
                },
                {
                    title: "Organigramă",
                    icon: <Calendar size={28} />,
                    href: organigramaPath
                },
                {
                    title: courseLabel,
                    icon: <strong className="font-bold text-2xl">{courseLabel.replace("Curs ", "")}</strong>,
                    href: `/curs/docs/category/${courseId}`
                }
            ];
        };

        // Detect Module Category Page
        // Pattern: .../category/modul-{N}{-suffix}?
        if (path.includes("/category/modul-")) {
            // Determine course based on suffix
            // -3 -> C8
            // -2 -> C7
            // -1 -> C6
            // none -> C5

            // Check suffixes first!
            if (path.match(/modul-\d+-3$/)) {
                return getModuleCategoryItems("curs-viii", "Curs VIII", "/curs/docs/c8/organigrama");
            }
            if (path.match(/modul-\d+-2$/)) {
                return getModuleCategoryItems("curs-vii", "Curs VII", "/curs/docs/c7/organigrama");
            }
            if (path.match(/modul-\d+-1$/)) {
                return getModuleCategoryItems("curs-vi", "Curs VI", "/curs/docs/c6/organigrama");
            }
            // If no suffix or just digit
            if (path.match(/modul-\d+$/)) {
                return getModuleCategoryItems("curs-v", "Curs V", "/curs/docs/c5/organigrama");
            }
        }

        // Category View
        let computedItems = DEFAULT_ITEMS;

        if (path.includes("curs-viii") || path.includes("/c8/")) {
            computedItems = getCourseItems("curs-viii", "Curs VIII", "/curs/docs/c8/organigrama");
        } else if (path.includes("curs-vii") || path.includes("/c7/")) {
            computedItems = getCourseItems("curs-vii", "Curs VII", "/curs/docs/c7/organigrama");
        } else if (path.includes("curs-vi") || path.includes("/c6/")) {
            computedItems = getCourseItems("curs-vi", "Curs VI", "/curs/docs/c6/organigrama");
        } else if (path.includes("curs-v") || path.includes("/c5/")) {
            computedItems = getCourseItems("curs-v", "Curs V", "/curs/docs/c5/organigrama");
        }

        return computedItems;
    }, [items, location.pathname]);

    const [isExpanded, setIsExpanded] = React.useState(false);
    const MAX_ITEMS = 5;

    const visibleItems = React.useMemo(() => {
        if (finalItems.length <= MAX_ITEMS) return finalItems;
        if (isExpanded) {
            return [...finalItems, {
                title: "Restrânge", // "Collapse" in Romanian
                icon: <XCircle size={24} />,
                onClick: () => setIsExpanded(false)
            }];
        }
        // Show MAX_ITEMS - 1 (space for toggle)
        return [
            ...finalItems.slice(0, MAX_ITEMS - 1),
            {
                title: "Mai mult", // "More" in Romanian
                icon: <MoreHorizontal size={30} />,
                onClick: () => setIsExpanded(true)
            }
        ];
    }, [finalItems, isExpanded]);

    // Portal logic to escape parent constraints
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || hideUI) return null;

    // Use Portal to render directly in body to avoid parent transforms/overflows
    // affecting position: fixed
    const { createPortal } = require('react-dom');

    return createPortal(
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={clsx(styles.dock, className)}
        >
            {visibleItems.map((item, index) => (
                <DockIcon key={index} mouseX={mouseX} item={item} />
            ))}
        </motion.div>,
        document.body
    );
}

function DockIcon({ mouseX, item }: { mouseX: MotionValue<number>; item: DockItemData }) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const content = (
        <motion.div
            ref={ref}
            style={{ width }}
            className={styles.dockIcon}
        >
            <span className={styles.dockIconContent}>{item.icon}</span>
            <span className={styles.dockTooltip}>{item.title}</span>
        </motion.div>
    );

    const handleClick = () => {
        mouseX.set(Infinity);
        if (item.onClick) item.onClick();
    };

    if (item.href) {
        return (
            <Link to={item.href} className={styles.dockItemLink} onClick={handleClick}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={handleClick} className={styles.dockItemLink}>
            {content}
        </button>
    );
}
