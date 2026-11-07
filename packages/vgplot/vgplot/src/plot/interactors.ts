// oxlint-disable typescript/explicit-module-boundary-types
import type { Mark } from '@uwdata/mosaic-plot';
import type { PlotDirective, Plot, Rename, Require } from './types.js'
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
): PlotDirective {
  return (plot: Plot): void => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

// TODO @dangotbanned: type `{Highlight,highlight}`
// TODO @dangotbanned: use `Rename` for selection -> by
export function highlight({ by, ...channels }): PlotDirective {
  return interactor(Highlight, { selection: by, channels });
}

// TODO @dangotbanned: type `{Interval*,interval*}`
export function intervalX({ as, ...rest }): PlotDirective {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'x' });
}

// TODO @dangotbanned: type `{Interval*,interval*}`
export function intervalY({ as, ...rest }): PlotDirective {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'y' });
}

// TODO @dangotbanned: type `{Interval*,interval*}`
export function intervalXY({ as, ...rest }): PlotDirective {
  return interactor(Interval2D, { ...rest, selection: as });
}

// TODO @dangotbanned: type `{Nearest*,nearest*}`
export function nearest({ as, ...rest }): PlotDirective {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'xy' });
}

// TODO @dangotbanned: type `{Nearest*,nearest*}`
export function nearestX({ as, ...rest }): PlotDirective {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'x' });
}

// TODO @dangotbanned: type `{Nearest*,nearest*}`
export function nearestY({ as, ...rest }): PlotDirective {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'y' });
}

export function region({ as, ...rest }): PlotDirective {
  return interactor(Region, { ...rest, selection: as });
}

export function toggle({ as, ...rest }: ToggleChannelsOptions): PlotDirective {
  return interactor(Toggle, { ...rest, selection: as });
}

export function toggleX(options: ToggleOptions): PlotDirective {
  return toggle({ ...options, channels: ['x'] });
}

export function toggleY(options: ToggleOptions): PlotDirective {
  return toggle({ ...options, channels: ['y'] });
}

export function toggleZ(options: ToggleOptions): PlotDirective {
  return toggle({ ...options, channels: ['z'] });
}

export function toggleColor(options: ToggleOptions): PlotDirective {
  return toggle({ ...options, channels: ['color'] });
}

function zoom(options: ConstructorParameters<typeof PanZoom>[1]): PlotDirective {
  return interactor(PanZoom, options);
}

export function pan(options: PanZoomOptions = {}): PlotDirective {
  return zoom({ ...options, zoom: false });
}

export function panX(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ ...options, zoom: false, pany: false });
}

export function panY(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ ...options, zoom: false, panx: false });
}

export function panZoom(options: PanZoomOptions = {}): PlotDirective {
  return zoom(options);
}

export function panZoomX(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ ...options, pany: false });
}

export function panZoomY(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ ...options, panx: false });
}
