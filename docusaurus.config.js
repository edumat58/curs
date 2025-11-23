// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';
const math = require('remark-math');
const katex = require('rehype-katex');

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Edumat58',
  tagline: 'Platforma digitala de matematica pentru clasele V - VIII',
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
          sidebarPath: './sidebars.js',
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
  ],
  scripts: [
    '/status.js',
  ],
  themeConfig: ({
    image: 'img/logo.png',
    admonitions: {
      customTypes: {
        def: 'tip',
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
            <span style="font-size: 0.9rem; opacity: 0.7;">Ultima actualizare: 16.11.2025, 16:25</span>
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
      style: 'dark',
      links: [
        {
          title: 'Mai multe',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Edumat58`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  }),
};

module.exports = config;
