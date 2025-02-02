 
// TODO: change this to be at same level as MosaicClient to avoid duplicate in interactors
import { coordinator, MosaicClient } from '@uwdata/mosaic-core';

/**
 * Base class for all inputs.
 * This class should not be instantiated directly.
 */
export class Input extends MosaicClient {
  constructor(filterBy) {
    super(filterBy);
  }

  /**
   * Activates the input.
   * @throws {Error} If the method is not implemented by the subclass.
   */
  activate() {
    throw new Error('activate method must be implemented by subclass');
  }
}

export function input(InputClass, options) {
  const input = new InputClass(options);
  coordinator().connect(input);
  return input.element;
}