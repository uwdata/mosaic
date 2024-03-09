export function getField(mark, channel) {
  const field = mark.channelField(channel)?.field;
  return field?.basis || field;
}
