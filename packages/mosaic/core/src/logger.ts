import type { Coordinator } from './Coordinator.js';
import type { Logger } from './types.js';
import {
  EventType,
  type MosaicErrorEvent,
  type MosaicQueryEndEvent,
  type MosaicQueryStartEvent,
  type MosaicWarningEvent,
} from './Events.js';

/**
 * Log coordinator events to a console-like logger.
 * Each query is logged as a collapsed group with its elapsed time.
 * @param coordinator The coordinator to observe.
 * @param logger The logger to use, defaults to `console`.
 * @returns A function that stops logging when called.
 */
export function observeLogger(
  coordinator: Coordinator,
  logger: Logger = console
): () => void {
  const { eventBus } = coordinator;
  const starts = new Map<number, number>();

  const onQueryStart = (event: MosaicQueryStartEvent) => {
    starts.set(event.queryId, event.timestamp);
    logger.groupCollapsed(`query ${event.query}`);
  };

  const onQueryEnd = (event: MosaicQueryEndEvent) => {
    const t0 = starts.get(event.queryId);
    if (t0 == null) return;
    starts.delete(event.queryId);
    logger.log(event.query, (event.timestamp - t0).toFixed(1));
    logger.groupEnd();
  };

  const onWarning = (event: MosaicWarningEvent) => logger.warn(event.message);
  const onError = (event: MosaicErrorEvent) => logger.error(event.error);

  eventBus.addEventListener(EventType.QueryStart, onQueryStart);
  eventBus.addEventListener(EventType.QueryEnd, onQueryEnd);
  eventBus.addEventListener(EventType.Warning, onWarning);
  eventBus.addEventListener(EventType.Error, onError);

  return () => {
    eventBus.removeEventListener(EventType.QueryStart, onQueryStart);
    eventBus.removeEventListener(EventType.QueryEnd, onQueryEnd);
    eventBus.removeEventListener(EventType.Warning, onWarning);
    eventBus.removeEventListener(EventType.Error, onError);
    starts.clear();
  };
}
