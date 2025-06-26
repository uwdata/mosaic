export {
  Coordinator,
  MosaicClient,
  RestConnector,
  SocketConnector,
  DuckDBWASMConnector,
  restConnector, // deprecated
  socketConnector, // deprecated
  wasmConnector // deprecated
} from '@uwdata/mosaic-core';

export * from './api.js';

export {
  namedPlots,
  requestNamedPlot
} from './plot/named-plots.js';

export {
  connect
} from './connect.js';

export {
  createAPIContext
} from './context.js';

export * as attributeDirectives from './plot/attributes.js';
export * as markDirectives from './plot/marks.js';
export * as interactorDirectives from './plot/interactors.js';
export * as legendDirectives from './plot/legends.js';
