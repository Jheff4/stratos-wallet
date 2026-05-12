const config = {
  title: 'Stratos Wallet Docs',
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
          editUrl:
            'https://github.com/your-repo/tree/main/docs/',
        },

        blog: false,

        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

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
