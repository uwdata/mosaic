export class Concat {
  constructor(elements, { type = 'vertical' }) {
    this.elements = elements;
    this.element = document.createElement('div');
    this.element.setAttribute('class', `concat-${type}`);
    this.element.value = this;

    elements.forEach(el => this.element.appendChild(el));
  }
}
