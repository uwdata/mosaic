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
   * Add an event listener callback for the provided event type.
   * @param type The event type.
   * @param callback The event handler callback function to add.
   */
  addEventListener<K extends EventKey<E>>(
    type: K,
    callback: EventCallback<E[K]>,
  ): void;
  override addEventListener(
    type: string,
    callback: EventCallback<E[EventKey<E>]>,
  ): void {
    super.addEventListener(type, callback);
  }

  /**
   * Remove an event listener callback for the provided event type.
   * @param type The event type.
   * @param callback The event handler callback function to remove.
   */
  removeEventListener<K extends EventKey<E>>(
    type: K,
    callback: EventCallback<E[K]>,
  ): void;
  override removeEventListener(
    type: string,
    callback: EventCallback<E[EventKey<E>]>,
  ): void {
    super.removeEventListener(type, callback);
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
