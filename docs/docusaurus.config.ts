const config = {
  title: 'Stratos Docs',
  tagline: 'Architecture & Engineering Guide',

  // No trailing slash — Docusaurus uses this to build canonical URLs,
  // the sitemap, and social-card meta tags (og:url, etc.).
  url: 'https://stratos-wallet.vercel.app',
  baseUrl: '/',

  favicon: 'img/stratos-mark.svg',

  organizationName: 'stratos',
  projectName: 'wallet',

  onBrokenLinks: 'throw',

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          breadcrumbs: false,
        },

        blog: false,

        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Stratos Docs',
      logo: {
        alt: 'Stratos Docs',
        src: 'img/stratos-mark.svg',
        srcDark: 'img/stratos-mark.svg',
      },
      items: [],
    },
  },

  markdown: {
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        // Builds the search index at build time and ships it as static
        // files — no external service, no API keys, no crawl approval.
        // Right-sized for a 46-page docs site.
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        // Must match presets[0].docs.routeBasePath above.
        docsRouteBasePath: '/',
        language: ['en'],
      },
    ],
  ],
};

export default config;
