import { scaleTransform } from '@uwdata/mosaic-sql';
import type * as msql from '@uwdata/mosaic-sql';
import type { Mark } from '../Mark.js';
import type { TransformScaleName } from '../../types.js';

export function channelScale<T>(mark: Mark, channel: TransformScaleName): msql.Scale<T> {
  const { plot } = mark;

  let scaleType: msql.ScaleType | undefined = plot.getAttribute(`${channel}Scale`);
  if (!scaleType) {
    const { type } = mark.channelField(channel);
    scaleType = type === 'date' ? 'time' : 'linear';
  }

  const options: msql.ScaleOptions = { type: scaleType };
  switch (scaleType) {
    case 'log':
      options.base = plot.getAttribute(`${channel}Base`) ?? 10;
      break;
    case 'pow':
      options.exponent = plot.getAttribute(`${channel}Exponent`) ?? 1;
      break;
    case 'symlog':
      options.constant = plot.getAttribute(`${channel}Constant`) ?? 1;
      break;
  }

  return scaleTransform<T>(options);
}

