export class Concat {
  constructor(plots, { type = 'vertical' }) {
    this.plots = plots;
    this.element = document.createElement('div');
    this.element.setAttribute('class', `concat-${type}`);
    this.element.value = this;

    plots.forEach(p => this.element.appendChild(p.element));
  }
}
