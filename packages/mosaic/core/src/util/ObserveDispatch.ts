import { Dispatch, EventCallback } from "./AsyncDispatch.js";

type EventMap = Record<string, unknown>;
type EventKey<E extends EventMap> = Extract<keyof E, string>;

/**
 * Synchronous event dispatcher that pushes pre-built events directly
 * to callbacks without queueing or Promise handling.
 */
export class ObserveDispatch<E extends EventMap> extends Dispatch<
  E[EventKey<E>]
> {
  /**
   * Subscribe to events of the given type.
   * Shorthand for addEventListener().
   * @param type The event type.
   * @param callback The event handler callback function to add.
   * @returns This ObserveDispatch instance for method chaining.
   */
  observe<K extends EventKey<E>>(type: K, callback: EventCallback<E[K]>): this {
    this.addEventListener(type, callback as EventCallback<E[EventKey<E>]>);
    return this;
  }

  /**
   * Unsubscribe from events of the given type.
   * Shorthand for removeEventListener().
   * @param type The event type.
   * @param callback The event handler callback function to remove.
   * @returns This ObserveDispatch instance for method chaining.
   */
  unobserve<K extends EventKey<E>>(
    type: K,
    callback: EventCallback<E[K]>,
  ): this {
    this.removeEventListener(type, callback as EventCallback<E[EventKey<E>]>);
    return this;
  }

  /**
   * Emit an already-constructed event value to listeners for the given event type.
   * @param type The event type.
   * @param value The complete event object.
   */
  emit<K extends EventKey<E>>(type: K, value: E[K]): void;
  override emit(type: string, value: E[EventKey<E>]): void {
    const callbacks = this._callbacks.get(type);
    if (!callbacks?.size) return;

    const event = this.willEmit(type, value);
    for (const callback of callbacks) {
      callback(event);
    }
  }
}
