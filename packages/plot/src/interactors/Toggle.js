import { clausePoints } from '@uwdata/mosaic-core';
import { getDatum } from './util/get-datum.js';
import { neq, neqSome } from './util/neq.js';

export class Toggle {
  /**
   * @param {*} mark The mark to interact with.
   * @param {*} options The interactor options.
   */
  constructor(mark, {
    selection,
    channels,
    peers = true
  }) {
    this.value = null;
    this.mark = mark;
    this.selection = selection;
    this.peers = peers;
    const fields = this.fields = [];
    const as = this.as = [];
    channels.forEach(c => {
      const q = c === 'color' ? ['color', 'fill', 'stroke']
        : c === 'x' ? ['x', 'x1', 'x2']
        : c === 'y' ? ['y', 'y1', 'y2']
        : [c];
      for (let i = 0; i < q.length; ++i) {
        const f = mark.channelField(q[i], { exact: true });
        if (f) {
          fields.push(f.field?.basis || f.field);
          as.push(f.as);
          return;
        }
      }
      throw new Error(`Missing channel: ${c}`);
    });
  }

  clause(value) {
    const { fields, mark } = this;
    return clausePoints(fields, value, {
      source: this,
      clients: this.peers ? mark.plot.markSet : new Set().add(mark)
    });
  }

  init(svg, selector, accessor) {
    const { mark, as, selection } = this;
    const { data: { columns = {} } = {} } = mark;
    accessor ??= target => as.map(name => columns[name][getDatum(target)]);

    selector ??= `[data-index="${mark.index}"]`;
    const groups = Array.from(svg.querySelectorAll(selector));

    svg.addEventListener('pointerdown', evt => {
      const state = selection.single ? selection.value : this.value;
      const target = evt.target;
      let value = null;

      if (isTargetElement(groups, target)) {
        const point = accessor(target);
        if ((evt.shiftKey || evt.metaKey) && state?.length) {
          value = state.filter(s => neq(s, point));
          if (value.length === state.length) value.push(point);
        } else if (state?.length === 1 && !neq(state[0], point)) {
          value = null;
        } else {
          value = [point];
        }
      }

      this.value = value;
      if (neqSome(state, value)) {
        selection.update(this.clause(value));
      }
    });

    svg.addEventListener('pointerenter', evt => {
      if (evt.buttons) return;
      this.selection.activate(this.clause([this.fields.map(() => 0)]));
    });
  }
}

function isTargetElement(groups, node) {
  return groups.some(g => g.contains(node));
}
