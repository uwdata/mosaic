/* eslint-disable no-unused-vars */
// TODO: change this to be at same level as MosaicClient to avoid duplicate in inputs

/**
 * Base class for all interactors.
 * This class should not be instantiated directly.
 */
export class Interactor {
    constructor(mark) {
        this.mark = mark;
    }

    /**
     * Initializes the interactor.
     * @param {SVGElement} svg - The SVG element.
     * @throws {Error} If the method is not implemented by the subclass.
     */
    init(svg) {
      throw new Error('init method must be implemented by subclass');
    }
  
    /**
     * Activates the interactor.
     * @throws {Error} If the method is not implemented by the subclass.
     */
    activate() {
      throw new Error('activate method must be implemented by subclass');
    }
  }