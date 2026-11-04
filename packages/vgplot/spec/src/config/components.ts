import { parseHConcat } from '../ast/HConcatNode.js';
import { parseHSpace } from '../ast/HSpaceNode.js';
import { parseInput } from '../ast/InputNode.js';
import { parseLegend } from '../ast/PlotLegendNode.js';
import { parsePlot } from '../ast/PlotNode.js';
import { parseVConcat } from '../ast/VConcatNode.js';
import { parseVSpace } from '../ast/VSpaceNode.js';
import type { ComponentParser } from '../parse-spec.js';

import {
  HCONCAT, HSPACE, INPUT, LEGEND, PLOT, VCONCAT, VSPACE
} from '../constants.js';

const NAMES = [HCONCAT, HSPACE, INPUT, LEGEND, PLOT, VCONCAT, VSPACE] as const
export type ComponentName = (typeof NAMES)[number]

/**
 * Map of specification keys to component parsers.
 */
export function componentMap(overrides: [ComponentName, ComponentParser][] = []): Map<ComponentName, ComponentParser> {
  return new Map([
    [ PLOT, parsePlot ],
    [ LEGEND, parseLegend ],
    [ INPUT, parseInput ],
    [ HCONCAT, parseHConcat ],
    [ VCONCAT, parseVConcat ],
    [ HSPACE, parseHSpace ],
    [ VSPACE, parseVSpace ],
    ...overrides
  ]);
}
