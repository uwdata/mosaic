import type { InteractorMark } from '../marks/Mark.js';
import { throttle, type Selection } from '@uwdata/mosaic-core';
import { and, isAggregateExpression, type SelectQuery } from '@uwdata/mosaic-sql';
import { getDatum } from './util/get-datum.js';
import { sanitizeStyles } from './util/sanitize-styles.js';
import type { Interactor, SVG } from '../types.js';

function configureMark<Mark extends InteractorMark>(mark: Mark): Mark {
  const { channels } = mark;
  const dims = new Set;
  let ordered = false;
  let aggregate = false;

  for (const c of channels) {
    const { channel, field, as } = c;
    if (channel === 'orderby') {
      ordered = true;
    } else if (field) {
      //@ts-expect-error Type 'string' is not assignable to type 'SQLNode'.
      if (isAggregateExpression(field)) {
        aggregate = true;
      } else {
        if (dims.has(as)) continue;
        dims.add(as);
      }
    }
  }

  // if orderby is defined, we're ok: nothing to do
  // or, if there is no groupby aggregation, we're ok: nothing to do
  // grouping may result in optimizations that change result order
  // so we orderby the grouping dimensions to ensure stable indices
  if (!ordered && aggregate && dims.size) {
    mark.channels.push(({ channel: 'orderby', value: Array.from(dims) }));
  }

  return mark;
}

export class Highlight implements Interactor {
  mark: InteractorMark;
  selection: Selection;
  channels: [string, unknown][] | (string | number)[][];
  svg: any;
  values: any[];
  nodes: any;

  constructor(mark: InteractorMark, {
    selection,
    channels = {}
  }: { selection: Selection; channels?: Record<string, string | number>; }) {
    this.mark = configureMark(mark);
    this.selection = selection;
    const c = Object.entries(sanitizeStyles(channels));
    this.channels = c.length ? c : [['opacity', 0.2]];
    this.selection.addEventListener('value', throttle(() => this.update()));
  }

  init(svg: SVG): Promise<void> {
    this.svg = svg;
    const values = this.values = [];
    const index = this.mark.index;
    const g = `g[data-index="${index}"]`;
    const selector = `${g} > *:not(g), ${g} > g > *`;
    const nodes = this.nodes = svg.querySelectorAll(selector);

    const { channels } = this;
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      values.push(channels.map(c => node.getAttribute(c[0])));
    }

    return this.update();
  }

  async update(): Promise<void> {
    const { svg, nodes, channels, values, mark, selection } = this;
    if (!svg) return;

    const test = await predicateFunction(mark, selection);

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      const base = values[i];
      const t = test(getDatum(node));
      // TODO? handle inherited values / remove attributes
      for (let j = 0; j < channels.length; ++j) {
        const [attr, value] = channels[j];
        node.setAttribute(attr, t ? base[j] : value);
      }
    }
  }
}
//NOTE: This function depends on `Mark` and reaches into the internals of mosaic sql
async function predicateFunction(mark: InteractorMark, selection: Selection): Promise<(i: any) => boolean> {
  //@ts-expect-error Argument of type 'InteractorMark' is not assignable to parameter of type 'MosaicClient'.
  const pred = selection?.predicate(mark);
  //@ts-expect-error Proerty length does not exist on 'true'
  if (!pred || pred.length === 0) {
    return () => true;
  }

  // set flag so we do not skip cross-filtered sources
  //@ts-expect-error Argument of type 'InteractorMark' is not assignable to parameter of type 'MosaicClient'.
  const filter = mark.filterBy?.predicate(mark, true);

  const s = { __: and(pred) };
  const q = mark.query(filter);
  //@ts-expect-error Property 'queries' does not exist on type 'SelectQuery'.
  (q.queries || [q]).forEach((q: SelectQuery) => {
    q._groupby.length ? q.select(s) : q.setSelect(s);
  });

  const data = await mark.coordinator.query(q);
  const v = data.getChild?.('__');
  //@ts-expect-error Property 'length' does not exist on type 'Table<TypeMap>'.
  return !(data.numRows || data.length) ? (() => false)
    : v ? (i => v.at(i))
      : (i => data[i].__);
}
