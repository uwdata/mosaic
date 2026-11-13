import { isNode } from '@uwdata/mosaic-sql';
import type { Field, InteractorMark } from '../../marks/Mark.js';
import type { ChannelName } from '../../types.js';

function extractField(field: Field | undefined): unknown | undefined {
  if (isNode(field)) {
    if (field.type === 'COLUMN_REF') {
      // @ts-ignore
      return field.column;
    } else if (field.type === 'AGGREGATE') {
      // @ts-ignore
      return field.args[0] ?? field;
    } else if (field.type === 'CUSTOM' && 'column' in field) {
      // handle custom transforms (like bin) that expose a column
      return field.column;
    }
  }
  return field;
}

export function getField(mark: InteractorMark, channel: ChannelName): unknown | undefined {
  return extractField(mark.channelField(channel)?.field);
}

export function getFields(mark: InteractorMark, channels: ChannelName[]): { fields: any[]; as: any[]; } {
  const fields: any[] = [];
  const as: any[] = [];
  channels.forEach(c => {
    const q = c === 'color' ? ['color', 'fill', 'stroke'] as const
      : c === 'x' ? ['x', 'x1', 'x2'] as const
        : c === 'y' ? ['y', 'y1', 'y2'] as const
          : [c];
    for (let i = 0; i < q.length; ++i) {
      const f = mark.channelField(q[i], { exact: true });
      if (f) {
        fields.push(extractField(f.field));
        as.push(f.as);
        return;
      }
    }
    throw new Error(`Missing channel: ${c}`);
  });
  return { fields, as };
}
