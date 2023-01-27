import { isSelection, isSignal } from '../mosaic/index.js';
import { eq, literal } from '../sql/index.js';

let _id = 0;

export class Slider {
  constructor({
    as,
    min,
    max,
    step,
    column,
    label = column,
    value = as?.value
  } = {}) {
    this.id = 'slider_' + (++_id);
    this.column = column || 'value';
    this.selection = as;

    this.element = document.createElement('div');
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

  publish(value) {
    const { selection, column } = this;
    if (isSelection(selection)) {
      selection.update({
        source: this,
        schema: { type: 'point' },
        value,
        predicate: eq(column, literal(value))
      });
    } else if (isSignal(this.selection)) {
      selection.update(value);
    }
  }
}
