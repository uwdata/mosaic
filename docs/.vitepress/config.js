import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Payless Health',
  description: 'Why pay more?',
  base: '/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      // light: 'Payless Health',
      // dark: 'Payless Health',
      alt: 'Payless Health'
    },
    siteTitle: false,

    footer: {
      message: 'Payless Health is sponsored by the Brown Institute at Columbia and Stanford (https://brown.columbia.edu/22-23-magic/) and Patient Rights Advocate (https://www.patientrightsadvocate.org/).',
      copyright: 'Released under the Apache 2.0 License. Copyright © 2023-Present One Fact Foundation.'
    },

    search: {
      provider: "local"
    },

    nav: [
      { text: 'Examples', 
        items: [
          { text: 'Mount Sinai', link: '/examples/mount-sinai' },
        ]
      },
    ],

    sidebar: {
      '/': [
        { text: 'Examples', link: '/examples/' },
      ],

      '/examples/': [
        {
          text: 'Examples',
          collapsed: true,
          items: [
            { text: 'Mount Sinai', link: '/examples/mount-sinai' }
          ],
        },
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/onefact' },
      { icon: 'twitter', link: 'https://twitter.com/onefact_org/' }
    ]
  }
})
