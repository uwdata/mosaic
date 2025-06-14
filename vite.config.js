/** @type {import('vite').UserConfig} */
export default {
  server: {
    open: '/dev/index.html',
  },
  test: {
    projects: [
      'packages/*',
    ]
  }
};
