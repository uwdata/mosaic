import { coordinator, MosaicClient } from '@uwdata/mosaic-core';

/**
 * Instantiate an input, register it with the coordinator, and
 * return the corresponding HTML element.
 * @template {new (...args: any) => Input} T
 * @param {T} InputClass
 * @param {ConstructorParameters<T>} params
 * @returns {HTMLElement} The container element of the input.
 */
export function input(InputClass, ...params) {
  const input = new InputClass(...params);
  coordinator().connect(input);
  return input.element;
}

/**
 * Base class for input components.
 * @import {Activatable} from '@uwdata/mosaic-core'
 * @implements {Activatable}
 */
export class Input extends MosaicClient {
  /**
   * Create a new input instance.
   * @param {import('@uwdata/mosaic-core').Selection} [filterBy] A selection
   *  with which to filter backing data that parameterizes this input.
   * @param {HTMLElement} [element] Optional container HTML element to use.
   * @param {string} [className] A class name to set on the container element.
   */
  constructor(filterBy, element, className = 'input') {
    super(filterBy);
    this.element = element || document.createElement('div');
    if (className) this.element.setAttribute('class', className);
    Object.defineProperty(this.element, 'value', { value: this });
  }

  activate() {
    // subclasses should override
  }
}
