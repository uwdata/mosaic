module.exports = {
  forbidden: [{
    name: 'no-circular-runtime-dependencies',
    severity: 'error',
    from: {},
    to: {
      circular: true,
      dependencyTypesNot: ['type-only']
    }
  }],
  options: {
    tsPreCompilationDeps: 'specify'
  }
};
