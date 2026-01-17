import { Dispatch, EventCallback } from "./AsyncDispatch.js";

/**
 * Synchronous event dispatcher that pushes events directly to callbacks
 * without queuing or Promise handling. Suitable for simple observer patterns.
 */
export class ObserveDispatch<T> extends Dispatch<T> {
  constructor() {
    super();
  }

  /**
   * Subscribe to events of the given type. Essentially
   * a shorthand/wrapper for addEventListener().
   * @param type The event type.
   * @param callback The event handler callback function to add.
   * @returns This ObserveDispatch instance for method chaining.
   */
  observe(type: string, callback: EventCallback<T>): this {
    this.addEventListener(type, callback);
    return this;
  }

  /**
   * Unsubscribe from events of the given type. Essentially
   * a shorthand/wrapper for removeEventListener().
   * @param type The event type.
   * @param callback The event handler callback function to remove.
   * @returns This ObserveDispatch instance for method chaining.
   */
  unobserve(type: string, callback: EventCallback<T>): this {
    this.removeEventListener(type, callback);
    return this;
  }

  /**
   * Emit an event value to listeners for the given event type.
   * Events are dispatched *synchronously* to all registered callbacks.
   * This is different from the AsyncDispatch class, which use queues to
   * manage un-emitted event values.
   * @param type The event type.
   * @param value The event value.
   */
  override emit(type: string, value: T): void {
    const callbacks = this._callbacks.get(type);
    if (callbacks && callbacks.size > 0) {
      const event = this.willEmit(type, { ...value, timestamp: new Date() });
      // Execute all callbacks synchronously
      for (const callback of callbacks) {
        callback(event);
      }
    }
  }
}
