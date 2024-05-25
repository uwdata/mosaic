import { MosaicClient, Param, interval, isParam, isSelection, point } from '@uwdata/mosaic-core';
import { Query, max, min } from '@uwdata/mosaic-sql';
import { input } from './input.js';

let _id = 0;

export const slider = options => input(Slider, options);

/**
 * Create a new slider input.
 * @param {object} [options] Options object
 * @param {HTMLElement} [options.element] The parent DOM element in which to
 *  place the slider elements. If undefined, a new `div` element is created.
 * @param {Selection} [options.filterBy] A selection to filter the database
 *  table indicated by the `from` property.
 * @param {Param} [options.as] The output param or selection. A selection
 *  clause is added based on the currently selected slider option.
 * @param {'point' | 'interval'} [options.select] The type of selection clause
 *  predicate to generate if the **as** option is a Selection.  If `'point'`
 *  (the default), the selection predicate is an equality check for the slider
 *  value. If `'interval'`, the predicate checks an interval from the minimum
 *  to the current slider value.
 * @param {number} [options.min] The minimum slider value.
 * @param {number} [options.max] The maximum slider value.
 * @param {number} [options.step] The slider step, the amount to increment
 *  between consecutive values.
 * @param {number} [options.value] The initial slider value.
 * @param {string} [options.from] The name of a database table to use as a data
 *  source for this widget. Used in conjunction with the `column` property.
 *  The minimum and maximum values of the column determine the slider range.
 * @param {string} [options.column] The name of a database column whose values
 *  determine the slider range. Used in conjunction with the `from` property.
 *  The minimum and maximum values of the column determine the slider range.
 * @param {string} [options.label] A text label for this input.
 * @param {number} [options.width] The width of the slider in screen pixels.
 */
export class Slider extends MosaicClient {
  /**
   * Create a new Slider instance.
   * @param {object} options Options object
   */
  constructor({
    element,
    filterBy,
    as,
    min,
    max,
    step,
    from,
    column,
    label = column,
    value = as?.value,
    select = 'point',
    width
  } = {}) {
    super(filterBy);
    this.id = 'slider_' + (++_id);
    this.from = from;
    this.column = column || 'value';
    this.selection = as;
    this.selectionType = select;
    this.min = min;
    this.max = max;
    this.step = step;

    this.element = element || document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    if (label) {
      const desc = document.createElement('label');
      desc.setAttribute('for', this.id);
      desc.innerText = label;
      this.element.appendChild(desc);
    }

    this.slider = document.createElement('input');
    this.slider.setAttribute('id', this.id);
    this.slider.setAttribute('type', 'range');
    if (width != null) this.slider.style.width = `${+width}px`;
    if (min != null) this.slider.setAttribute('min', min);
    if (max != null) this.slider.setAttribute('max', max);
    if (step != null) this.slider.setAttribute('step', step);
    this.element.appendChild(this.slider);

    this.curval = document.createElement('label');
    this.curval.setAttribute('for', this.id);
    this.curval.setAttribute('class', 'value');
    this.element.appendChild(this.curval);

    // handle initial value
    if (value != null) {
      this.slider.setAttribute('value', value);
      if (this.selection?.value === undefined) this.publish(value);
    }
    this.curval.innerText = this.slider.value;

    // respond to slider input
    this.slider.addEventListener('input', () => {
      const value = +this.slider.value;
      this.curval.innerText = value;
      if (this.selection) this.publish(value);
    });

    // track param updates
    if (this.selection && !isSelection(this.selection)) {
      this.selection.addEventListener('value', value => {
        if (value !== +this.slider.value) {
          this.slider.value = value;
          this.curval.innerText = value;
        }
      });
    }
  }

  query(filter = []) {
    const { from, column } = this;
    if (!from || (this.min != null && this.max != null)) return null;
    return Query
      .select({ min: min(column), max: max(column) })
      .from(from)
      .where(filter);
  }

  queryResult(data) {
    const { min, max } = Array.from(data)[0];
    if (this.min == null) {
      this.min = min;
      this.slider.setAttribute('min', min);
    }
    if (this.max == null) {
      this.max = max;
      this.slider.setAttribute('max', max);
    }
    if (this.step == null) {
      this.step = String((max - min) / 500);
      this.slider.setAttribute('step', this.step);
    }
    return this;
  }

  publish(value) {
    const { column, selectionType, selection } = this;
    if (isSelection(selection)) {
      if (selectionType === 'interval') {
        const domain = [this.min ?? 0, value];
        selection.update(interval(column, domain, {
          source: this,
          bin: 'ceil',
          scale: { type: 'identity', domain },
          pixelSize: this.step
        }));
      } else {
        selection.update(point(column, value, { source: this }));
      }
    } else if (isParam(this.selection)) {
      selection.update(value);
    }
  }
}
