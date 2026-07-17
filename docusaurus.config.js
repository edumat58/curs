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

  clientModules: [require.resolve('./src/clientModules/uiFixes.js')],

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
      title: '',
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
            <button id="ui-toggle-btn" class="ui-eye-btn" title="Mod proiecție: ascunde bara de navigație" aria-label="Mod proiecție: ascunde bara de navigație"
              onclick="if (window.toggleUIHiding) { window.toggleUIHiding(); } else { const hideUI = localStorage.getItem('hideUI') === 'true'; localStorage.setItem('hideUI', !hideUI); window.dispatchEvent(new CustomEvent('uiToggle')); } this.dataset.hidden = String(localStorage.getItem('hideUI') === 'true');">
              <svg class="ui-eye-on" viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.42 8.1 7.22 5 12 5s8.58 3.1 9.94 6.65a1 1 0 0 1 0 .7C20.58 15.9 16.78 19 12 19s-8.58-3.1-9.94-6.65z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg class="ui-eye-off" viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c4.78 0 8.58 3.1 9.94 6.65a1 1 0 0 1 0 .7 13.2 13.2 0 0 1-1.67 2.68"></path>
                <path d="M6.61 6.61A13.5 13.5 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.42 15.9 7.22 19 12 19c1.34 0 2.6-.24 3.77-.66"></path>
                <path d="M10 10a3 3 0 0 0 4.13 4.13"></path>
                <line x1="3" y1="3" x2="21" y2="21"></line>
              </svg>
            </button>
          `,
        },
        {
          type: 'html',
          position: 'right',
          value: `
            <a class="educonnect-nav-btn" href="/curs/admin" title="Administrare — autentificare EduConnect+">EduConnect+</a>
          `,
        },
        {
          type: 'html',
          position: 'right',
          value: `
            <span class="nav-update" title="Ultima actualizare">
              <svg viewBox="0 0 24 24" width="13" height="13" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <polyline points="12 7 12 12 15.5 14"></polyline>
              </svg>
              <span class="nav-update-date">18.07.2026, 01:04</span>
            </span>
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
