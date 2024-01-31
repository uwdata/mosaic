import { parseHConcat } from './ast/HConcatNode.js';
import { parseHSpace } from './ast/HSpaceNode.js';
import { parseInput } from './ast/InputNode.js';
import { parsePlot, parseTopLevelMark } from './ast/PlotNode.js';
import { parseVConcat } from './ast/VConcatNode.js';
import { parseVSpace } from './ast/VSpaceNode.js';
import {
  HCONCAT, HSPACE, INPUT, MARK, PLOT, VCONCAT, VSPACE
} from './constants.js';

/**
 * Map of specification keys to component parsers.
 */
export function componentMap(overrides = []) {
  return new Map([
    [ PLOT, parsePlot ],
    [ MARK, parseTopLevelMark ],
    [ INPUT, parseInput ],
    [ HCONCAT, parseHConcat ],
    [ VCONCAT, parseVConcat ],
    [ HSPACE, parseHSpace ],
    [ VSPACE, parseVSpace ],
    ...overrides
  ]);
};
