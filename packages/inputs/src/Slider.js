import { MosaicClient, isParam, isSelection } from '@uwdata/mosaic-core';
import { Query, eq, literal, max, min } from '@uwdata/mosaic-sql';
import { input } from './input.js';

let _id = 0;

export const slider = options => input(Slider, options);

export class Slider extends MosaicClient {
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
    width
  } = {}) {
    super(filterBy);
    this.id = 'slider_' + (++_id);
    this.from = from;
    this.column = column || 'value';
    this.selection = as;
    this.min = min;
    this.max = max;
    this.step = step;

    this.element = element || document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    if (label) {
      const lab = document.createElement('label');
      lab.setAttribute('for', this.id);
      lab.innerText = label;
      this.element.appendChild(lab);
    }

    this.slider = document.createElement('input');
    this.slider.setAttribute('id', this.id);
    this.slider.setAttribute('type', 'range');
    if (width != null) this.slider.style.width = `${+width}px`;
    if (min != null) this.slider.setAttribute('min', min);
    if (max != null) this.slider.setAttribute('max', max);
    if (step != null) this.slider.setAttribute('step', step);
    if (value != null) {
      this.slider.setAttribute('value', value);
      if (this.selection?.value === undefined) this.publish(value);
    }
    this.element.appendChild(this.slider);

    if (this.selection) {
      this.slider.addEventListener('input', () => {
        this.publish(+this.slider.value);
      });
      if (!isSelection(this.selection)) {
        this.selection.addEventListener('value', value => {
          if (value !== +this.slider.value) {
            this.slider.value = value;
          }
        });
      }
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
    if (this.min == null) this.slider.setAttribute('min', min);
    if (this.max == null) this.slider.setAttribute('max', max);
    if (this.step == null) this.slider.setAttribute('step', (max - min) / 500);
    return this;
  }

  publish(value) {
    const { selection, column } = this;
    if (isSelection(selection)) {
      selection.update({
        source: this,
        schema: { type: 'point' },
        value,
        predicate: eq(column, literal(value))
      });
    } else if (isParam(this.selection)) {
      selection.update(value);
    }
  }
}
