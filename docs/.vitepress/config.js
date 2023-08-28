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
          { text: 'St Lukes (Bethlehem)', link: '/examples/stlukes-bethlehem' },
        ]
      },
      { text: 'Help',
        items: [
          { text: 'Your support network', link: '/help/your-personal-support-network' },
          { text: 'Advocacy & children', link: '/help/supporting-health-care-self-advocacy-in-children' }, 
        ]
      }  
    ],

    sidebar: {
      '/': [
        { text: 'Examples', link: '/examples/' },
      ],

      '/examples/': [
        {
          text: 'Examples',
          collapsed: false,
          items: [
            { text: 'Mount Sinai', link: '/examples/mount-sinai' },
            { text: 'St Lukes (Bethlehem)', link: '/examples/stlukes-bethlehem' }
          ],
        },
      ],

      '/help/': [
        {
          text: 'Help',
          collapsed: false,
          items: [
            { text: 'Patient-centered mindset', link: '/help/embracing-a-patient-centered-mindset' },            
            { text: 'Advocacy & children', link: '/help/supporting-health-care-self-advocacy-in-children' }, 
            { text: 'Your support network', link: '/help/your-personal-support-network' },
            { text: 'Your support network', link: '/help/shared-decision-making' },
           
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
