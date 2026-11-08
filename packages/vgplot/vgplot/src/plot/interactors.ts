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
import type * as mc from '@uwdata/mosaic-core';

type Interactor = Parameters<Plot['addInteractor']>[0];
type SelectionAs<T extends { selection: mc.Selection }> = Rename<T, 'selection', 'as'>;
type Options<T extends new (...args: any) => Interactor> = SelectionAs<ConstructorParameters<T>[1]>

type PanZoomOptions = Omit<ConstructorParameters<typeof PanZoom>[1], 'zoom'>;
type PanZoom1DOptions = Omit<PanZoomOptions, 'panx' | 'pany'>;
type ToggleChannelsOptions = Options<typeof Toggle>;
type ToggleOptions = Omit<ToggleChannelsOptions, 'channels'>;
type Interval1DOptions = Omit<Options<typeof Interval1D>, 'channel'>;
type NearestOptions = Omit<Options<typeof Nearest>, 'pointer'>;

interface HighlightOptions {
  by: mc.Selection;
  opacity?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  fill?: string;
  stroke?: string;
}

function interactor<T extends new (...args: any) => Interactor>(
  InteractorClass: T,
  options: ConstructorParameters<T>[1],
): PlotDirective {
  return (plot: Plot): void => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

export function highlight({ by, ...channels }: HighlightOptions): PlotDirective {
  return interactor(Highlight, { selection: by, channels });
}

export function intervalX({ as, ...rest }: Interval1DOptions): PlotDirective {
  return interactor(Interval1D, { selection: as, channel: 'x', ...rest });
}

export function intervalY({ as, ...rest }: Interval1DOptions): PlotDirective {
  return interactor(Interval1D, { selection: as, channel: 'y', ...rest });
}

export function intervalXY({ as, ...rest }: Options<typeof Interval2D>): PlotDirective {
  return interactor(Interval2D, { selection: as, ...rest });
}

export function nearest({ as, ...rest }: NearestOptions): PlotDirective {
  return interactor(Nearest, { selection: as, pointer: 'xy', ...rest });
}

export function nearestX({ as, ...rest }: NearestOptions): PlotDirective {
  return interactor(Nearest, { selection: as, pointer: 'x', ...rest });
}

export function nearestY({ as, ...rest }: NearestOptions): PlotDirective {
  return interactor(Nearest, { selection: as, pointer: 'y', ...rest });
}

export function region({ as, channels, ...rest }: Options<typeof Region>): PlotDirective {
  return interactor(Region, { selection: as, channels, ...rest });
}

export function toggle({ as, channels, ...rest }: ToggleChannelsOptions): PlotDirective {
  return interactor(Toggle, { selection: as, channels, ...rest });
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
  return toggle({ channels: ['color'], ...options });
}

function zoom(options: ConstructorParameters<typeof PanZoom>[1]): PlotDirective {
  return interactor(PanZoom, options);
}

export function pan(options: PanZoomOptions = {}): PlotDirective {
  return zoom({ zoom: false, ...options });
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
