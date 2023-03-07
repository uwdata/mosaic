import { epoch_ms } from '@uwdata/mosaic-sql';

export function binField(mark, channel) {
  if (!mark.stats) return channel;
  const { column } = mark.channelField(channel);
  const { type } = mark.stats[column];
  return type === 'date' ? epoch_ms(channel) : channel;
}
