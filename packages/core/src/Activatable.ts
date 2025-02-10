import { isActivatable } from "./util/is-activatable.js";

/**
 * Interface for activatable objects.
 * 
 * @see {@link isActivatable}
 */
export interface Activatable {
  activate(): void;
}