import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Mosaic',
  description: 'Scalable, interactive data visualization',
  base: '/mosaic/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: '/assets/mosaic.svg',
      dark: '/assets/mosaic-dark.svg',
      alt: 'Mosaic'
    },
    siteTitle: false,

    footer: {
      message: 'Mosaic is a collaboration of the <a href="https://idl.cs.washington.edu/">UW Interactive Data Lab</a> and the <a href="https://dig.cmu.edu/">CMU Data Interaction Group</a>.',
      copyright: 'Released under the BSD License. Copyright © 2023-Present UW Interactive Data Lab.'
    },

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Packages',
        items: [
          { text: 'Mosaic Core', link: '/core/' },
          { text: 'Mosaic DuckDB', link: '/duckdb/' },
          { text: 'Mosaic SQL', link: '/sql/' },
          { text: 'Jupyter Widget', link: '/jupyter/' },
          { text: 'vgplot', link: '/vgplot/' }
        ]
      },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Mosaic?', link: '/about/' },
            { text: 'Get Started', link: '/get-started/' }
          ]
        },
        {
          text: 'Packages',
          collapsed: false,
          items: [
            { text: 'Mosaic Core', link: '/core/' },
            { text: 'Mosaic DuckDB', link: '/duckdb/' },
            { text: 'Mosaic SQL', link: '/sql/' },
            { text: 'Jupyter Widget', link: '/jupyter/' }
          ]
        },
        {
          text: 'vgplot',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/vgplot/' },
            { text: 'Plots', link: '/vgplot/plots' },
            { text: 'Attributes', link: '/vgplot/attributes' },
            { text: 'Marks', link: '/vgplot/marks' },
            { text: 'Params', link: '/vgplot/params' },
            { text: 'Selections', link: '/vgplot/selections' },
            { text: 'Interactors', link: '/vgplot/interactors' },
            { text: 'Legends', link: '/vgplot/legends' },
            { text: 'Inputs', link: '/vgplot/inputs' },
            { text: 'Layout', link: '/vgplot/layout' }
          ]
        },
        { text: 'Examples', link: '/examples/' }
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            {
              text: 'Basic Marks & Inputs',
              collapsed: false,
              items: [
                { text: 'Mark Types', link: '/examples/mark-types' },
                { text: 'Symbol Plots', link: '/examples/symbols' },
                { text: 'Axes & Gridlines', link: '/examples/axes' },
                { text: 'Population Arrows', link: '/examples/population-arrows' },
                { text: 'Presidential Opinion', link: '/examples/presidential-opinion' },
                { text: 'Voronoi Diagram', link: '/examples/voronoi' },
                { text: 'Sortable Table', link: '/examples/table' },
                { text: 'Earthquakes', link: '/examples/earthquakes' }
              ]
            },
            {
              text: 'Data Transformation',
              collapsed: false,
              items: [
                { text: 'Bias Parameter', link: '/examples/bias' },
                { text: 'Moving Average', link: '/examples/moving-average' },
                { text: 'Normalized Stock Prices', link: '/examples/normalize' },
                { text: 'Overview + Detail', link: '/examples/overview-detail' },
                { text: 'Linear Regression', link: '/examples/linear-regression' },
                { text: 'Wind Map', link: '/examples/wind-map' }
              ]
            },
            {
              text: 'Multi-View Coordination',
              collapsed: false,
              items: [
                { text: 'Cross-Filter Flights 200k', link: '/examples/flights-200k' },
                { text: 'Cross-Filter Flights 10M', link: '/examples/flights-10m' },
                { text: 'Gaia Star Catalog', link: '/examples/gaia' },
                { text: 'Olympic Athletes', link: '/examples/athletes' },
                { text: 'Pan & Zoom', link: '/examples/pan-zoom' },
                { text: 'Scatter Plot Matrix', link: '/examples/splom' },
                { text: 'Seattle Weather', link: '/examples/weather' }
              ]
            },
            {
              text: 'Density Visualizations',
              collapsed: false,
              items: [
                { text: 'Contours', link: '/examples/contours' },
                { text: 'Density 1D', link: '/examples/density1d' },
                { text: 'Density 2D', link: '/examples/density2d' },
                { text: 'Flights Density', link: '/examples/flights-density' },
                { text: 'Flights Hexbin', link: '/examples/flights-hexbin' },
                { text: 'Line Density', link: '/examples/line-density' }
              ]
            }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/uwdata/mosaic' },
      { icon: 'twitter', link: 'https://twitter.com/uwdata/' }
    ]
  }
})
