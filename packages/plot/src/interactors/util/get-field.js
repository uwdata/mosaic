export function getField(mark, channels) {
  const field = mark.channelField(channels)?.field;
  return field?.basis || field;
}
