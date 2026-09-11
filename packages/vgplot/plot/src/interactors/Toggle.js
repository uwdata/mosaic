/** @import { ClauseSource } from '@uwdata/mosaic-core' */
/** @import { InteractorMark } from '../marks/Mark.js' */
import { clauseList, clausePoints } from '@uwdata/mosaic-core';
import { getDatum } from './util/get-datum.js';
import { neq, neqSome } from './util/neq.js';

/**
 * @import {Activatable} from '@uwdata/mosaic-core'
 * @implements {Activatable}
 */
export class Toggle {
  /**
   * @param {InteractorMark} mark The mark to interact with.
   * @param {*} options The interactor options.
   */
  constructor(mark, {
    selection,
    channels,
    peers = true,
    listMatch
  }) {
    this.mark = mark;
    this.value = null;
    this.selection = selection;
    this.peers = peers;
    this.listMatch = listMatch;
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
    const clients = this.peers ? mark.plot.markSet : new Set().add(mark);
    const opt = { source: /** @type {ClauseSource} */(this), clients };

    // unnested fields use a list-membership predicate instead of point equality
    if (fields.length === 1 && mark.isUnnested(fields[0])) {
      const list = value?.length ? value.map(v => v[0]) : undefined;
      return clauseList(fields[0], list, { ...opt, listMatch: this.listMatch });
    }

    return clausePoints(fields, value, opt);
  }

  init(svg, selector, accessor) {
    const { mark, as, selection } = this;
    const columns = mark.data && 'columns' in mark.data ? mark.data.columns : {};
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
      if (!evt.buttons) this.activate();
    });
  }

  activate() {
    this.selection.activate(this.clause([this.fields.map(() => 0)]));
  }
}

function isTargetElement(groups, node) {
  return groups.some(g => g.contains(node));
}
