import type * as mc from '@uwdata/mosaic-core';
import { type Field, type InteractorMark } from '../marks/Mark.js';
import { clauseList, clausePoints, ClauseSource, Selection } from '@uwdata/mosaic-core';
import { getDatum } from './util/get-datum.js';
import { neq, neqSome } from './util/neq.js';
import type { ChannelName, Interactor, SVG } from '../types.js';


export class Toggle implements Interactor, mc.Activatable {
  mark: InteractorMark;
  value: any[] | null;
  selection: Selection;
  peers: boolean;
  listMatch: 'any' | 'all' | undefined;
  fields: Field[];
  as: string[];

  constructor(mark: InteractorMark, {
    selection,
    channels,
    peers = true,
    listMatch = undefined
  }: { selection: Selection; channels: ChannelName[]; peers?: boolean; listMatch?: 'any' | 'all'; }) {
    this.mark = mark;
    this.value = null;
    this.selection = selection;
    this.peers = peers;
    this.listMatch = listMatch;
    const fields: Field[] = this.fields = [];
    const as: string[] = this.as = [];
    channels.forEach(c => {
      const q = c === 'color' ? ['color', 'fill', 'stroke'] as const
        : c === 'x' ? ['x', 'x1', 'x2'] as const
          : c === 'y' ? ['y', 'y1', 'y2'] as const
            : [c];
      for (let i = 0; i < q.length; ++i) {
        const f = mark.channelField(q[i], { exact: true });
        let field: Field | undefined;
        if ((field = f?.field)) {
          fields.push(typeof field === 'object' && 'basis' in field ? field.basis : field);
          as.push(f.as);
          return;
        }
      }
      throw new Error(`Missing channel: ${c}`);
    });
  }

  clause(value: any[] | undefined): mc.SelectionClause {
    const { fields, mark } = this;
    const clients = this.peers ? mark.plot.markSet : new Set([mark]);
    const opt = { source: (this), clients };

    // unnested fields use a list-membership predicate instead of point equality
    if (fields.length === 1 && mark.isUnnested(fields[0])) {
      const list = value?.length ? value.map(v => v[0]) : undefined;
      //@ts-expect-error  Type 'Set<InteractorMark>' is not assignable to type 'Set<MosaicClient>'.
      return clauseList(fields[0], list, { ...opt, listMatch: this.listMatch });
    }
    //@ts-expect-error  Type 'Set<InteractorMark>' is not assignable to type 'Set<MosaicClient>'.
    return clausePoints(fields, value, opt);
  }

  init(svg: SVG, selector?: string, accessor?: (target: any) => any[]): void {
    const { mark, as, selection } = this;
    const columns = mark.data && 'columns' in mark.data ? mark.data.columns : {};
    accessor ??= target => as.map(name => columns[name][getDatum(target)]);

    selector ??= `[data-index="${mark.index}"]`;
    const groups = Array.from(svg.querySelectorAll(selector));

    svg.addEventListener('pointerdown', (evt: PointerEvent) => {
      const state = selection.single ? selection.value as any[] | undefined : this.value;
      const target = evt.target;
      let value: any | any[] | null = null;

      if (isTargetElement(groups, target)) {
        const point = accessor(target);
        if ((evt.shiftKey || evt.metaKey) && state?.length) {
          value = state.filter(s => neq(s, point));
          if (value.length === state.length) value.push(point);
          if (value.length === 0) value = null;
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

    svg.addEventListener('pointerenter', (evt: PointerEvent) => {
      if (!evt.buttons) this.activate();
    });
  }

  activate(): void {
    this.selection.activate(this.clause([this.fields.map(() => 0)]));
  }
}

function isTargetElement(groups, node) {
  return groups.some(g => g.contains(node));
}
