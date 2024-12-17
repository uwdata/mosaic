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
      message: 'Mosaic is a collaboration of the <a href="https://idl.uw.edu/">UW Interactive Data Lab</a> and the <a href="https://dig.cmu.edu/">CMU Data Interaction Group</a>.',
      copyright: 'Released under the BSD License. Copyright © 2023-Present UW Interactive Data Lab.'
    },

    search: {
      provider: "local"
    },

    nav: [
      { text: 'Overview', link: '/what-is-mosaic/' },
      {
        text: 'Guide',
        items: [
          { text: 'Mosaic Core', link: '/core/' },
          { text: 'Mosaic SQL', link: '/sql/' },
          { text: 'Mosaic Inputs', link: '/inputs/' },
          { text: 'Mosaic vgplot', link: '/vgplot/' },
          { text: 'Mosaic Spec', link: '/spec/' },
          { text: 'Mosaic Server', link: '/server/' },
          { text: 'Jupyter Widget', link: '/jupyter/' }
        ]
      },
      { text: 'Examples', link: '/examples/' },
      { text: 'Reference', link: '/api/' }
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
          text: 'Guide',
          collapsed: false,
          items: [
            { text: 'Mosaic Core', link: '/core/' },
            { text: 'Mosaic SQL', link: '/sql/' },
            { text: 'Mosaic Inputs', link: '/inputs/' },
            { text: 'Mosaic vgplot', link: '/vgplot/' },
            { text: 'Mosaic Spec', link: '/spec/' },
            { text: 'Mosaic Server', link: '/server/' },
            { text: 'Jupyter Widget', link: '/jupyter/' }
          ]
        },
        { text: 'Examples', link: '/examples/' },
        { text: 'API Reference', link: '/api/' }
      ],

      '/examples/': [
        {
          text: 'Examples',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/examples/' }
          ],
        },
        {
          text: 'Basic Marks & Inputs',
          collapsed: true,
          items: [
            { text: 'Mark Types', link: '/examples/mark-types' },
            { text: 'Symbol Plots', link: '/examples/symbols' },
            { text: 'Axes & Gridlines', link: '/examples/axes' },
            { text: 'Airline Travelers', link: '/examples/airline-travelers' },
            { text: 'Aeromagnetic Survey', link: '/examples/aeromagnetic-survey' },
            { text: 'Athlete Birth Waffle', link: '/examples/athlete-birth-waffle' },
            { text: 'Driving Shifts into Reverse', link: '/examples/driving-shifts' },
            { text: 'Population Arrows', link: '/examples/population-arrows' },
            { text: 'Presidential Opinion', link: '/examples/presidential-opinion' },
            { text: 'Voronoi Diagram', link: '/examples/voronoi' },
            { text: 'Seattle Temperatures', link: '/examples/seattle-temp' },
            { text: 'Sorted Bars', link: '/examples/sorted-bars' },
            { text: 'Sortable Table', link: '/examples/table' }
          ]
        },
        {
          text: 'Data Transformation',
          collapsed: true,
          items: [
            { text: 'Athlete Height Intervals', link: '/examples/athlete-height' },
            { text: 'Bias Parameter', link: '/examples/bias' },
            { text: 'Linear Regression', link: '/examples/linear-regression' },
            { text: 'Linear Regression 10M', link: '/examples/linear-regression-10m' },
            { text: 'Moving Average', link: '/examples/moving-average' },
            { text: 'Line Multi-Series', link: '/examples/line-multi-series' },
            { text: 'Normalized Stock Prices', link: '/examples/normalize' },
            { text: 'Overview + Detail', link: '/examples/overview-detail' },
            { text: 'Wind Map', link: '/examples/wind-map' },
            { text: 'WNBA Shot Chart', link: '/examples/wnba-shots' }
          ]
        },
        {
          text: 'Maps & Spatial Data',
          collapsed: true,
          items: [
            { text: 'Earthquakes Feed', link: '/examples/earthquakes-feed' },
            { text: 'Earthquakes Globe', link: '/examples/earthquakes-globe' },
            { text: 'U.S. States', link: '/examples/us-state-map' },
            { text: 'U.S. Counties', link: '/examples/us-county-map' },
            { text: 'U.S. Unemployment', link: '/examples/unemployment' },
            { text: 'Walmart Openings', link: '/examples/walmart-openings' },
            { text: 'NYC Taxi Rides', link: '/examples/nyc-taxi-rides' }
          ]
        },
        {
          text: 'Multi-View Coordination',
          collapsed: true,
          items: [
            { text: 'Cross-Filter Flights 200k', link: '/examples/flights-200k' },
            { text: 'Cross-Filter Flights 10M', link: '/examples/flights-10m' },
            { text: 'Gaia Star Catalog', link: '/examples/gaia' },
            { text: 'Observable Latency', link: '/examples/observable-latency' },
            { text: 'Olympic Athletes', link: '/examples/athletes' },
            { text: 'Protein Design', link: '/examples/protein-design' },
            { text: 'Pan & Zoom', link: '/examples/pan-zoom' },
            { text: 'Scatter Plot Matrix', link: '/examples/splom' },
            { text: 'Seattle Weather', link: '/examples/weather' }
          ]
        },
        {
          text: 'Density Visualizations',
          collapsed: true,
          items: [
            { text: 'Contours', link: '/examples/contours' },
            { text: 'Density Groups', link: '/examples/density-groups' },
            { text: 'Density 1D', link: '/examples/density1d' },
            { text: 'Density 2D', link: '/examples/density2d' },
            { text: 'Flights Density', link: '/examples/flights-density' },
            { text: 'Flights Hexbin', link: '/examples/flights-hexbin' },
            { text: 'Line Density', link: '/examples/line-density' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/' }
          ],
        },
        {
          text: 'Mosaic Core',
          collapsed: true,
          items: [
            { text: 'Client', link: '/api/core/client' },
            { text: 'Coordinator', link: '/api/core/coordinator' },
            { text: 'Connectors', link: '/api/core/connectors' },
            { text: 'Param', link: '/api/core/param' },
            { text: 'Selection', link: '/api/core/selection' },
            { text: 'Multi-Database Support', link: '/api/core/multi-database-support' }
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
            { text: 'Marks', link: '/api/vgplot/marks' },
            { text: 'Interactors', link: '/api/vgplot/interactors' },
            { text: 'Legends', link: '/api/vgplot/legends' },
            { text: 'Layout', link: '/api/vgplot/layout' },
            { text: 'API Context', link: '/api/vgplot/context' }
          ]
        },
        {
          text: 'Mosaic Spec',
          collapsed: true,
          items: [
            { text: 'Specification Format', link: '/api/spec/format' },
            { text: 'Parser & Generators', link: '/api/spec/parser-generators' }
          ]
        },
        {
          text: 'Mosaic DuckDB',
          collapsed: true,
          items: [
            { text: 'DuckDB API', link: '/api/duckdb/duckdb' },
            { text: 'Data Server', link: '/api/duckdb/data-server' }
          ]
        },
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/uwdata/mosaic' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/idl.uw.edu' }
    ]
  }
})
