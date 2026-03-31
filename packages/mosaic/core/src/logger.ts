import type { Coordinator } from "./Coordinator.js";
import type { Logger } from "./types.js";
import {
  EventType,
  type ErrorEvent,
  type QueryEndEvent,
  type QueryStartEvent,
  type WarningEvent,
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

  const onQueryStart = (event: QueryStartEvent): void => {
    const key = event.query;
    const stack = starts.get(key) ?? [];
    stack.push(now());
    starts.set(key, stack);

    logger.groupCollapsed(`query ${key}`);
  };

  const onQueryEnd = (event: QueryEndEvent): void => {
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

  const onWarning = (event: WarningEvent): void => {
    logger.warn(event.message);
  };

  const onError = (event: ErrorEvent): void => {
    logger.error(event.message);
  };

  coordinator.eventBus.observe(EventType.QueryStart, onQueryStart);
  coordinator.eventBus.observe(EventType.QueryEnd, onQueryEnd);
  coordinator.eventBus.observe(EventType.Warning, onWarning);
  coordinator.eventBus.observe(EventType.Error, onError);

  return () => {
    coordinator.eventBus.unobserve(EventType.QueryStart, onQueryStart);
    coordinator.eventBus.unobserve(EventType.QueryEnd, onQueryEnd);
    coordinator.eventBus.unobserve(EventType.Warning, onWarning);
    coordinator.eventBus.unobserve(EventType.Error, onError);
  };
}
