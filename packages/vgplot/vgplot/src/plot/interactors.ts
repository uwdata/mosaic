// oxlint-disable typescript/explicit-module-boundary-types

import type { PlotDirective, Plot, Rename } from './types.js'
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

type SelectionAs<T extends { selection: unknown }> = Rename<T, 'selection', 'as'>;

type ToggleChannelsOptions = SelectionAs<ConstructorParameters<typeof Toggle>[1]>;
type ToggleOptions = Omit<ToggleChannelsOptions, 'channels'>;

function interactor<T extends new (...args: any) => Interactor>(
  InteractorClass: T,
  options: ConstructorParameters<T>[1],
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
  return interactor(Interval1D, { selection: as, channel: 'x', ...rest });
}

// TODO @dangotbanned: type `{Interval*,interval*}`
export function intervalY({ as, ...rest }): PlotDirective {
  return interactor(Interval1D, { selection: as, channel: 'y', ...rest });
}

// TODO @dangotbanned: type `{Interval*,interval*}`
export function intervalXY({ as, ...rest }): PlotDirective {
  return interactor(Interval2D, { selection: as, ...rest });
}

// TODO @dangotbanned: type `{Nearest*,nearest*}`
export function nearest({ as, ...rest }): PlotDirective {
  return interactor(Nearest, { selection: as, pointer: 'xy', ...rest });
}

// TODO @dangotbanned: type `{Nearest*,nearest*}`
export function nearestX({ as, ...rest }): PlotDirective {
  return interactor(Nearest, { selection: as, pointer: 'x', ...rest });
}

// TODO @dangotbanned: type `{Nearest*,nearest*}`
export function nearestY({ as, ...rest }): PlotDirective {
  return interactor(Nearest, { selection: as, pointer: 'y', ...rest});
}

export function region({ as, channels, ...rest }): PlotDirective {
  return interactor(Region, { selection: as, channels, ...rest });
}

export function toggle({ as, channels,...rest }: ToggleChannelsOptions): PlotDirective {
  return interactor(Toggle, {selection: as, channels, ...rest });
}

export function toggleX(options: ToggleOptions): PlotDirective {
  return toggle({ channels: ['x'], ...options });
}

export function toggleY(options: ToggleOptions): PlotDirective {
  return toggle({ channels: ['y'], ...options });
}

export function toggleZ(options: ToggleOptions): PlotDirective {
  return toggle({ channels: ['z'], ...options });
}

export function toggleColor(options: ToggleOptions): PlotDirective {
  return toggle({ channels: ['color'], ...options  });
}

function zoom(options: ConstructorParameters<typeof PanZoom>[1]): PlotDirective {
  return interactor(PanZoom, options);
}

export function pan(options: PanZoomOptions = {}): PlotDirective {
  return zoom({ zoom: false, ...options  });
}

export function panX(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ zoom: false, pany: false, ...options });
}

export function panY(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ zoom: false, panx: false, ...options });
}

export function panZoom(options: PanZoomOptions = {}): PlotDirective {
  return zoom(options);
}

export function panZoomX(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ pany: false, ...options });
}

export function panZoomY(options: PanZoom1DOptions = {}): PlotDirective {
  return zoom({ panx: false, ...options });
}
