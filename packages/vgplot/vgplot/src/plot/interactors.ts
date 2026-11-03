// oxlint-disable typescript/explicit-module-boundary-types
import type { Mark, Plot } from '@uwdata/mosaic-plot';
import {
  Highlight,
  Interval1D,
  Interval2D,
  Nearest,
  PanZoom,
  Region,
  Toggle,
} from '@uwdata/mosaic-plot';

type Interactor = Parameters<Plot['addInteractor']>[0];
type InteractorReturn = (plot: Plot) => void;
type PanZoomOptions = Omit<ConstructorParameters<typeof PanZoom>[1], 'zoom'>;
type PanZoom1DOptions = Omit<PanZoomOptions, 'panx' | 'pany'>;

function interactor<T extends Interactor>(
  InteractorClass: new (mark: Mark, options: unknown) => T,
  options: unknown,
): InteractorReturn {
  return (plot: Plot): void => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

export function highlight({ by, ...channels }): InteractorReturn {
  return interactor(Highlight, { selection: by, channels });
}

export function intervalX({ as, ...rest }): InteractorReturn {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'x' });
}

export function intervalY({ as, ...rest }): InteractorReturn {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'y' });
}

export function intervalXY({ as, ...rest }): InteractorReturn {
  return interactor(Interval2D, { ...rest, selection: as });
}

export function nearest({ as, ...rest }): InteractorReturn {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'xy' });
}

export function nearestX({ as, ...rest }): InteractorReturn {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'x' });
}

export function nearestY({ as, ...rest }): InteractorReturn {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'y' });
}

export function region({ as, ...rest }): InteractorReturn {
  return interactor(Region, { ...rest, selection: as });
}

export function toggle({ as, ...rest }): InteractorReturn {
  return interactor(Toggle, { ...rest, selection: as });
}

export function toggleX(options): InteractorReturn {
  return toggle({ ...options, channels: ['x'] });
}

export function toggleY(options): InteractorReturn {
  return toggle({ ...options, channels: ['y'] });
}

export function toggleZ(options): InteractorReturn {
  return toggle({ ...options, channels: ['z'] });
}

export function toggleColor(options): InteractorReturn {
  return toggle({ ...options, channels: ['color'] });
}

function zoom(options: ConstructorParameters<typeof PanZoom>[1]): InteractorReturn {
  return interactor(PanZoom, options);
}

export function pan(options: PanZoomOptions = {}): InteractorReturn {
  return zoom({ ...options, zoom: false });
}

export function panX(options: PanZoom1DOptions = {}): InteractorReturn {
  return zoom({ ...options, zoom: false, pany: false });
}

export function panY(options: PanZoom1DOptions = {}): InteractorReturn {
  return zoom({ ...options, zoom: false, panx: false });
}

export function panZoom(options: PanZoomOptions = {}): InteractorReturn {
  return zoom(options);
}

export function panZoomX(options: PanZoom1DOptions = {}): InteractorReturn {
  return zoom({ ...options, pany: false });
}

export function panZoomY(options: PanZoom1DOptions = {}): InteractorReturn {
  return zoom({ ...options, panx: false });
}
