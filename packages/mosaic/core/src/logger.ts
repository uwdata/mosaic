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
 * Observe coordinator events and log them in a way that mirrors prior
 * coordinator-internal logging behavior.
 *
 * @param coordinator The coordinator to observe.
 * @param logger The logger to use. Pass `null` to disable logging.
 * @returns Unsubscribe function.
 */
export function observeLogger(
  coordinator: Coordinator,
  logger: Logger | null = console,
): () => void {
  if (!logger) return () => {};

  const starts = new Map<number, number>();

  const onQueryStart = (event: MosaicQueryStartEvent): void => {
    starts.set(event.queryId, event.timestamp);

    logger.groupCollapsed(`query ${event.query}`);
  };

  const onQueryEnd = (event: MosaicQueryEndEvent): void => {
    const t0 = starts.get(event.queryId);
    const openedGroup = t0 != null;
    starts.delete(event.queryId);
    const elapsed = t0 == null ? undefined : (event.timestamp - t0).toFixed(1);

    if (elapsed != null) {
      logger.log(event.query, elapsed);
    } else {
      // Surface unmatched terminal events without closing a group this observer did not open.
      logger.log(event.query);
    }

    if (openedGroup) logger.groupEnd();
  };

  const onWarning = (event: MosaicWarningEvent): void => {
    logger.warn(event.message);
  };

  const onError = (event: MosaicErrorEvent): void => {
    logger.error(event.error ?? event.message);
  };

  coordinator.eventBus.addEventListener(EventType.QueryStart, onQueryStart);
  coordinator.eventBus.addEventListener(EventType.QueryEnd, onQueryEnd);
  coordinator.eventBus.addEventListener(EventType.Warning, onWarning);
  coordinator.eventBus.addEventListener(EventType.Error, onError);

  return () => {
    coordinator.eventBus.removeEventListener(EventType.QueryStart, onQueryStart);
    coordinator.eventBus.removeEventListener(EventType.QueryEnd, onQueryEnd);
    coordinator.eventBus.removeEventListener(EventType.Warning, onWarning);
    coordinator.eventBus.removeEventListener(EventType.Error, onError);
    starts.clear();
  };
}
