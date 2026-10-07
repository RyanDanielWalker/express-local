import type { Guide, Line, LineId } from '../engine/types';
import { ALGO_LINES } from './lines';
import { ALGO_GUIDE } from './guide';
import { NEST_LINES, NEST_GUIDE } from './nest';
import { REACT_LINES, REACT_GUIDE } from './react';
import { TS_LINES, TS_GUIDE } from './typescript';

/**
 * Every line on the map, grouped by division in map order. Saves refer to
 * lines by id, so lines and divisions can be added anywhere. Unlock order is
 * the order within a division.
 */
export const LINES: Line[] = [...ALGO_LINES, ...NEST_LINES, ...REACT_LINES, ...TS_LINES];

/** Field guide copy, keyed by line id. */
export const GUIDE: Record<LineId, Guide> = { ...ALGO_GUIDE, ...NEST_GUIDE, ...REACT_GUIDE, ...TS_GUIDE };
