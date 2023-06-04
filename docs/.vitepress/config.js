import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Mosaic',
  description: 'Scalable, interactive data visualization',
  base: '/mosaic/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: '/mosaic.svg',
      dark: '/mosaic-dark.svg',
      alt: 'Mosaic'
    },
    siteTitle: false,

    footer: {
      message: 'Mosaic is a collaboration of the <a href="https://idl.cs.washington.edu/">UW Interactive Data Lab</a> and the <a href="https://dig.cmu.edu/">CMU Data Interaction Group</a>.',
      copyright: 'Released under the BSD License. Copyright © 2023-Present UW Interactive Data Lab.'
    },

    search: {
      provider: "local"
    },

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Packages',
        items: [
          { text: 'Mosaic Core', link: '/core/' },
          { text: 'Mosaic DuckDB', link: '/duckdb/' },
          { text: 'Mosaic SQL', link: '/sql/' },
          { text: 'Mosaic Inputs', link: '/inputs/' },
          { text: 'Mosaic vgplot', link: '/vgplot/' },
          { text: 'Jupyter Widget', link: '/jupyter/' }
        ]
      },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Introduction',
          collapsed: false,
          items: [
            { text: 'What is Mosaic?', link: '/what-is-mosaic/' },
            { text: 'Why Mosaic?', link: '/why-mosaic/' },
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
            { text: 'Mosaic Inputs', link: '/inputs/' },
            { text: 'Mosaic vgplot', link: '/vgplot/' },
            { text: 'Jupyter Widget', link: '/jupyter/' }
          ]
        },
        { text: 'Examples', link: '/examples/' },
        { text: 'API Reference', link: '/api/' }
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
                { text: 'Seattle Temperatures', link: '/examples/seattle-temp' },
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
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            {
              text: 'Mosaic Core',
              collapsed: true,
              items: [
                { text: 'Coordinator', link: '/api/core/coordinator' },
                { text: 'Client', link: '/api/core/client' },
                { text: 'Param', link: '/api/core/param' },
                { text: 'Selection', link: '/api/core/selection' },
                { text: 'Connectors', link: '/api/core/connectors' }
              ]
            },
            {
              text: 'Mosaic DuckDB',
              collapsed: true,
              items: [
                { text: 'DuckDB', link: '/api/duckdb/duckdb' },
                { text: 'dataServer', link: '/api/duckdb/dataServer' }
              ]
            },
            {
              text: 'Mosaic SQL',
              collapsed: true,
              items: [
                { text: 'Queries', link: '/api/sql/queries' },
                { text: 'Expressions', link: '/api/sql/expressions' },
                { text: 'Operators', link: '/api/sql/operators' },
                { text: 'Date Functions', link: '/api/sql/date-functions' },
                { text: 'Aggregate Functions', link: '/api/sql/aggregate-functions' },
                { text: 'Window Functions', link: '/api/sql/window-functions' },
                { text: 'Data Loading', link: '/api/sql/data-loading' }
              ]
            },
            {
              text: 'Mosaic Inputs',
              collapsed: true,
              items: [
                { text: 'Menu', link: '/api/inputs/menu' },
                { text: 'Search', link: '/api/inputs/search' },
                { text: 'Slider', link: '/api/inputs/slider' },
                { text: 'Table', link: '/api/inputs/table' }
              ]
            },
            {
              text: 'Mosaic vgplot',
              collapsed: true,
              items: [
                { text: 'Plot', link: '/api/vgplot/plot' },
                { text: 'Attributes', link: '/api/vgplot/attributes' },
                {
                  text: 'Marks',
                  collapsed: true,
                  items: [
                    { text: 'Area', link: '/api/vgplot/marks/area' },
                    { text: 'Arrow', link: '/api/vgplot/marks/arrow' },
                    { text: 'Axis', link: '/api/vgplot/marks/axis' },
                    { text: 'Bar', link: '/api/vgplot/marks/bar' },
                    { text: 'Cell', link: '/api/vgplot/marks/cell' },
                    { text: 'Contour', link: '/api/vgplot/marks/contour' },
                    { text: 'Density (1D)', link: '/api/vgplot/marks/density-1d' },
                    { text: 'Density (2D)', link: '/api/vgplot/marks/density-2d' },
                    { text: 'Dot', link: '/api/vgplot/marks/dot' },
                    { text: 'Dense Line', link: '/api/vgplot/marks/dense-line' },
                    { text: 'Grid', link: '/api/vgplot/marks/grid' },
                    { text: 'Hexbin', link: '/api/vgplot/marks/hexbin' },
                    { text: 'Hexgrid', link: '/api/vgplot/marks/hexgrid' },
                    { text: 'Image', link: '/api/vgplot/marks/image' },
                    { text: 'Line', link: '/api/vgplot/marks/line' },
                    { text: 'Raster', link: '/api/vgplot/marks/raster' },
                    { text: 'Regression', link: '/api/vgplot/marks/regression' },
                    { text: 'Tick', link: '/api/vgplot/marks/tick' },
                    { text: 'Vector', link: '/api/vgplot/marks/vector' }
                  ]
                },
                { text: 'Interactors', link: '/api/vgplot/interactors' },
                { text: 'Legends', link: '/api/vgplot/legends' },
                { text: 'Layout', link: '/api/vgplot/layout' }
              ]
            },
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
