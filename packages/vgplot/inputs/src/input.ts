import { coordinator, MosaicClient, Selection, Activatable } from '@uwdata/mosaic-core';

/**
 * Instantiate an input, register it with the coordinator, and
 * return the corresponding HTML element.
 */
export function input<T extends new (...args: any) => Input>(
  InputClass: T,
  ...params: ConstructorParameters<T>
): HTMLElement {
  // TODO @dangotbanned: Figure out how to test this without 'document is not defined'
  const input = new InputClass(params);
  coordinator().connect(input);
  return input.element;
}

/** Base class for input components. */
export class Input extends MosaicClient implements Activatable {
  readonly element: HTMLElement
  /**
   * Create a new input instance.
   * @param [filterBy] A selection with which to filter backing data that parameterizes this input.
   * @param [element] Optional container HTML element to use.
   * @param [className] A class name to set on the container element.
   */
  constructor(filterBy?: Selection, element?: HTMLElement, readonly className: string = 'input') {
    super(filterBy);
    this.element = element || document.createElement('div');
    if (className) this.element.setAttribute('class', className);
    Object.defineProperty(this.element, 'value', { value: this });
  }

  activate(): void {
    // subclasses should override
  }
}
