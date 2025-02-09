import { MosaicClient } from "./MosaicClient.js";

/**
 * Interface for activatable objects.
 * @see {@link ActivatableClient}
 * @see {@link ActivatableClient.activate}
 */
export abstract class Activatable {
    abstract activate(): void;
}

/**
 * Base class for activatable Mosaic clients.
 */
export class ActivatableClient extends MosaicClient implements Activatable {
    /**
     * Activates the input.
     * @throws {Error} If the method is not implemented by the subclass.
     */
    activate(): void {
        throw new Error("activate method must be implemented by subclass.");
    }
}