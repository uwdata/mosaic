// oxlint-disable typescript/explicit-module-boundary-types
import type { Mark } from '@uwdata/mosaic-plot';
import type { Callback, Plot, Rename, Require } from './types.js'
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
type PanZoomOptions = Omit<ConstructorParameters<typeof PanZoom>[1], 'zoom'>;
type PanZoom1DOptions = Omit<PanZoomOptions, 'panx' | 'pany'>;

type SelectionAs<T extends { selection?: unknown }> = Rename<Require<T, 'selection'>, 'selection', 'as'>;

type ToggleChannelsOptions = SelectionAs<ConstructorParameters<typeof Toggle>[1]>;
type ToggleOptions = Omit<ToggleChannelsOptions, 'channels'>;

function interactor<T extends Interactor>(
  InteractorClass: new (mark: Mark, options: unknown) => T,
  options: unknown,
): Callback {
  return (plot: Plot): void => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

export function highlight({ by, ...channels }): Callback {
  return interactor(Highlight, { selection: by, channels });
}

export function intervalX({ as, ...rest }): Callback {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'x' });
}

export function intervalY({ as, ...rest }): Callback {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'y' });
}

export function intervalXY({ as, ...rest }): Callback {
  return interactor(Interval2D, { ...rest, selection: as });
}

export function nearest({ as, ...rest }): Callback {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'xy' });
}

export function nearestX({ as, ...rest }): Callback {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'x' });
}

export function nearestY({ as, ...rest }): Callback {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'y' });
}

export function region({ as, ...rest }): Callback {
  return interactor(Region, { ...rest, selection: as });
}

export function toggle({ as, ...rest }: ToggleChannelsOptions): Callback {
  return interactor(Toggle, { ...rest, selection: as });
}

export function toggleX(options: ToggleOptions): Callback {
  return toggle({ ...options, channels: ['x'] });
}

export function toggleY(options: ToggleOptions): Callback {
  return toggle({ ...options, channels: ['y'] });
}

export function toggleZ(options: ToggleOptions): Callback {
  return toggle({ ...options, channels: ['z'] });
}

export function toggleColor(options: ToggleOptions): Callback {
  return toggle({ ...options, channels: ['color'] });
}

function zoom(options: ConstructorParameters<typeof PanZoom>[1]): Callback {
  return interactor(PanZoom, options);
}

export function pan(options: PanZoomOptions = {}): Callback {
  return zoom({ ...options, zoom: false });
}

export function panX(options: PanZoom1DOptions = {}): Callback {
  return zoom({ ...options, zoom: false, pany: false });
}

export function panY(options: PanZoom1DOptions = {}): Callback {
  return zoom({ ...options, zoom: false, panx: false });
}

export function panZoom(options: PanZoomOptions = {}): Callback {
  return zoom(options);
}

export function panZoomX(options: PanZoom1DOptions = {}): Callback {
  return zoom({ ...options, pany: false });
}

export function panZoomY(options: PanZoom1DOptions = {}): Callback {
  return zoom({ ...options, panx: false });
}
