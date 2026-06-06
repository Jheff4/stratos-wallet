const config = {
  title: 'Stratos Wallet',
  tagline: 'Architecture & Engineering Guide',

  url: 'http://localhost:7700',
  baseUrl: '/',

  favicon: 'img/favicon.ico',

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
      title: 'Stratos Wallet',
      logo: {
        alt: 'Stratos Wallet',
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

  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
