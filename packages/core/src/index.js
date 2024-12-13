export { MosaicClient } from './MosaicClient.js';
export { Coordinator, coordinator } from './Coordinator.js';
export { Selection, isSelection } from './Selection.js';
export { Param, isParam } from './Param.js';
export { Priority } from './QueryManager.js';

export { restConnector } from './connectors/rest.js';
export { socketConnector } from './connectors/socket.js';
export { wasmConnector } from './connectors/wasm.js';

export {
  clauseInterval,
  clauseIntervals,
  clausePoint,
  clausePoints,
  clauseMatch
} from './SelectionClause.js';

export { decodeIPC } from './util/decode-ipc.js';
export { distinct } from './util/distinct.js';
export { isArrowTable } from './util/is-arrow-table.js';
export { synchronizer } from './util/synchronizer.js';
export { throttle } from './util/throttle.js';
export { toDataColumns } from './util/to-data-columns.js';
export { queryFieldInfo } from './util/field-info.js';
export { jsType } from './util/js-type.js';

/**
 * @typedef {import('./util/selection-types.js').ClauseMetadata} ClauseMetadata
 * @typedef {import('./util/selection-types.js').PointMetadata} PointMetadata
 * @typedef {import('./util/selection-types.js').MatchMethod} MatchMethod
 * @typedef {import('./util/selection-types.js').MatchMetadata} MatchMetadata
 * @typedef {import('./util/selection-types.js').ScaleType} ScaleType
 * @typedef {import('./util/selection-types.js').Extent} Extent
 * @typedef {import('./util/selection-types.js').Scale} Scale
 * @typedef {import('./util/selection-types.js').BinMethod} BinMethod
 * @typedef {import('./util/selection-types.js').IntervalMetadata} IntervalMetadata
 * @typedef {import('./util/selection-types.js').SelectionClause} SelectionClause
 */
