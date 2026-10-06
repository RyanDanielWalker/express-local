import type { Guide, Line, LineId } from '../engine/types';
import { ALGO_LINES } from './lines';
import { ALGO_GUIDE } from './guide';

/** Every line on the map, grouped by division in map order. */
export const LINES: Line[] = [...ALGO_LINES];

/** Field guide copy, keyed by line id. */
export const GUIDE: Record<LineId, Guide> = { ...ALGO_GUIDE };
