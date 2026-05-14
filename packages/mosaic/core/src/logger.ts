import type { Coordinator } from "./Coordinator.js";
import type { Logger } from "./types.js";
import {
  EventType,
  type MosaicErrorEvent,
  type MosaicQueryEndEvent,
  type MosaicQueryStartEvent,
  type MosaicWarningEvent,
} from "./Events.js";

function now(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

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

  // Track start times by query text; use a stack per query to support overlap.
  const starts = new Map<string, number[]>();

  const onQueryStart = (event: MosaicQueryStartEvent): void => {
    const key = event.query;
    const stack = starts.get(key) ?? [];
    stack.push(now());
    starts.set(key, stack);

    logger.groupCollapsed(`query ${key}`);
  };

  const onQueryEnd = (event: MosaicQueryEndEvent): void => {
    const key = event.query;
    const stack = starts.get(key);
    const t0 = stack?.pop();
    const elapsed = t0 == null ? undefined : (now() - t0).toFixed(1);

    if (elapsed != null) {
      logger.log(key, elapsed);
    } else {
      logger.log(key);
    }

    logger.groupEnd();
  };

  const onWarning = (event: MosaicWarningEvent): void => {
    logger.warn(event.message);
  };

  const onError = (event: MosaicErrorEvent): void => {
    logger.error(event.message);
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
  };
}
