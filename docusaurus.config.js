// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';
const math = require('remark-math');
const katex = require('rehype-katex');

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Edumat58',
  tagline: 'Platforma digitală de matematică dedicată claselor V - VIII',
  favicon: 'img/logo.jpg',

  // Set the production url of your site here
  url: 'https://edumat58.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/curs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'edumat58', // Usually your GitHub org/user name.
  projectName: 'curs', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [math],
          rehypePlugins: [katex],
          admonitions: {
            keywords: ['edumat'],
            extendDefaults: true,
          },
          sidebarPath: './sidebars.js',
          // Custom sidebar generator to hide docs with hide: true
          sidebarItemsGenerator: async function ({
            defaultSidebarItemsGenerator,
            ...args
          }) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);
            const filterHidden = (items) => {
              return items.filter((item) => {
                if (item.type === 'category') {
                  item.items = filterHidden(item.items);
                  // If category becomes empty after filtering, you might want to hide it too
                  // return item.items.length > 0;
                  return true;
                }
                if (item.type === 'doc') {
                  const doc = args.docs.find((d) => d.id === item.id);
                  return !doc?.frontMatter?.hide;
                }
                return true;
              });
            };
            return filterHidden(sidebarItems);
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        blog: {
          remarkPlugins: [math],
          rehypePlugins: [katex],
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css',
      type: 'text/css',
      crossorigin: 'anonymous',
    },
    {
      href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
      type: 'text/css',
    },
  ],
  scripts: [
    '/status.js',
  ],
  themeConfig: ({
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    admonitions: {
      customTypes: {
        def: 'tip',
        edumat: 'edumat',
      },
    },
    navbar: {
      title: 'Edumat58',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          label: 'Meniu',
          to: '/navigation',
          position: 'left',
          className: 'desktop-menu-link', // Custom class for styling/hiding
        },
        {
          position: 'left',
          label: 'Curs V',
          to: '/docs/category/curs-v',
        },
        {
          position: 'left',
          label: 'Curs VI',
          to: '/docs/category/curs-vi',
        },
        {
          position: 'left',
          label: 'Curs VII',
          to: '/docs/category/curs-vii',
        },
        {
          position: 'left',
          label: 'Curs VIII',
          to: '/docs/category/curs-viii',
        },
        {
          type: 'html',
          position: 'right',
          value: `
            <button id="ui-toggle-btn" title="Ascunde/Afișează UI" style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              padding: 6px;
              border: 1px solid #ccc;
              border-radius: 6px;
              background-color: #f8f9fa;
              color: #333;
              font-family: sans-serif;
              cursor: pointer;
              transition: background-color 0.2s;
            " onclick="if (window.toggleUIHiding) { window.toggleUIHiding(); } else { const hideUI = localStorage.getItem('hideUI') === 'true'; localStorage.setItem('hideUI', !hideUI); window.dispatchEvent(new CustomEvent('uiToggle')); }"
            onmouseover="this.style.backgroundColor='#e9ecef'"
            onmouseout="this.style.backgroundColor='#f8f9fa'">
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          `,
        },
        {
          type: 'html',
          position: 'right',
          value: `
            <span style="font-size: 0.9rem; opacity: 0.7;">Ultima actualizare: 25.05.2026, 13:51</span>
          `,
        },
        {
          type: 'html',
          position: 'right',
          value: `
            <div id="site-status" data-status="stable" style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 6px 12px;
              border-left: 5px solid #27ae60;
              border-radius: 6px;
              background-color: #d5f4e6;
              color: #27ae60;
              font-size: 0.9rem;
              font-family: sans-serif;
              cursor: pointer;
            " onclick="window.location.href='/curs/docs/status';">
              <svg viewBox="0 0 16 16" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#27ae60">
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
              </svg>
              <span style="font-weight: 600;">Mod Stabil</span>
            </div>
          `,
        },
        // <div id="site-status" data-status="unstable" style="
        //       display: flex;
        //       align-items: center;
        //       gap: 10px;
        //       padding: 6px 12px;
        //       border-left: 5px solid #f1c40f;
        //       border-radius: 6px;
        //       background-color: #fef9e7;
        //       color: #f39c12;
        //       font-size: 0.9rem;
        //       font-family: sans-serif;
        //       cursor: pointer;
        //     " onclick="window.location.href='/curs/docs/status';">
        //   <svg viewBox="0 0 16 16" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#f1c40f">
        //     <path fill-rule="evenodd" d="M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z" />
        //   </svg>
        //   <span style="font-weight: 600;">Mod Stabil</span>
        // </div>

      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Cursuri',
          items: [
            {
              label: 'Clasa a V-a',
              to: '/docs/category/curs-v',
            },
            {
              label: 'Clasa a VI-a',
              to: '/docs/category/curs-vi',
            },
            {
              label: 'Clasa a VII-a',
              to: '/docs/category/curs-vii',
            },
            {
              label: 'Clasa a VIII-a',
              to: '/docs/category/curs-viii',
            },
          ],
        },
        {
          title: 'Platformă',
          items: [
            {
              label: 'Acasă',
              to: '/',
            },
            {
              label: 'Stare Sistem',
              to: '/docs/status',
            }
          ],
        },
        {
          title: 'Comunitate',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/edumat58/curs',
            },
            {
              label: 'Raportează o problemă',
              href: 'https://github.com/edumat58/curs/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Edumat58.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  }),
};

module.exports = config;
