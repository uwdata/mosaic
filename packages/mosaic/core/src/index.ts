export { MosaicClient } from './MosaicClient.js';
export { makeClient } from './make-client.js';
export { Coordinator, coordinator } from './Coordinator.js';
export { initializeDevtools, createEventClients } from './devtools.js';
export { Selection, isSelection } from './Selection.js';
export { Param, isParam } from './Param.js';
export { Priority } from './QueryManager.js';

// deprecated in favor of constructors
export { restConnector } from './connectors/rest.js';
export { socketConnector } from './connectors/socket.js';
export { wasmConnector } from './connectors/wasm.js';

export { RestConnector } from './connectors/rest.js';
export { SocketConnector } from './connectors/socket.js';
export { DuckDBWASMConnector } from './connectors/wasm.js';

export {
  clauseInterval,
  clauseIntervals,
  clauseList,
  clausePoint,
  clausePoints,
  clauseMatch,
  clauseMatchAny
} from './SelectionClause.js';

export { decodeIPC } from './util/decode-ipc.js';
export { distinct } from './util/distinct.js';
export { isArrowTable } from './util/is-arrow-table.js';
export { Synchronizer } from './util/synchronizer.js';
export { throttle } from './util/throttle.js';
export { toDataColumns } from './util/to-data-columns.js';
export { queryFieldInfo } from './util/field-info.js';
export { jsType } from './util/js-type.js';
export { isActivatable } from './util/is-activatable.js';
export type { QueryResult } from './util/query-result.js';

export * from './types.js';

export type * from './connectors/Connector.js';
export type * from './Selection.js';
export type * from './SelectionClause.js';
