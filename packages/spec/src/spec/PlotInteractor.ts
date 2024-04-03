import { Highlight } from './interactors/Highlight.js';
import { IntervalX, IntervalY } from './interactors/Interval1D.js';
import { IntervalXY } from './interactors/Interval2D.js';
import { NearestX, NearestY } from './interactors/Nearest.js';
import { Pan, PanX, PanY, PanZoom, PanZoomX, PanZoomY } from './interactors/PanZoom.js';
import { Toggle, ToggleColor, ToggleX, ToggleY } from './interactors/Toggle.js';

export type PlotInteractor =
  | Highlight
  | IntervalX
  | IntervalY
  | IntervalXY
  | NearestX
  | NearestY
  | Toggle
  | ToggleX
  | ToggleY
  | ToggleColor
  | Pan
  | PanX
  | PanY
  | PanZoom
  | PanZoomX
  | PanZoomY;
