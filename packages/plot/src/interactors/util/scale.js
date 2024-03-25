export function getScale(fig, channel, plot) {
  const scale = fig.scale(channel);
  if (scale) return scale;

  const proj = fig.projection();
  if (proj && (channel === 'x' || channel === 'y')) {
    const type = plot.getAttribute('projectionType');
    return projectionScale(proj, type, channel);
  }
}

function projectionScale(proj, type, channel) {
  const { offset, translate: [tx, ty], scale, width, height } = proj;
  const planar = type === 'identity' || type === 'reflect-y';

  let range;
  let apply;
  let invert;

  if (channel === 'x') {
    range = [offset[0], offset[0] + width];
    apply = planar ? x => x * scale + tx
      : v => proj.stream([v, 0])[0];
    invert = planar ? x => (x - tx) / scale
      : proj.invert ? x => proj.invert([(x - tx) / scale, 0])[0]
      : null;
  } else {
    range = [offset[1], offset[1] + height];
    apply = type === 'identity' ? y => y * scale + ty
      : type === 'reflect-y' ? y => -y * scale + ty
      : v => proj.stream([0, v])[1];
    invert = type === 'identity' ? y => (y - ty) / scale
      : type === 'reflect-y' ? y => (ty - y) / scale
      : proj.invert ? y => proj.invert([0, (y - ty) / scale])[1]
      : null;
  }

  return {
    type: planar || type === 'equirectangular' ? 'linear' : `${type}-x`,
    domain: range.map(v => invert(v)),
    range,
    apply,
    invert
  };
}
