import { createElement, type ComponentType } from 'react';
import type { LineId } from '../engine/types';
import type { GameProps } from './types';
import { StackQueueGame } from './StackQueue';
import { GraphGame } from './Graph';
import { BinarySearchGame } from './BinarySearch';
import { BubbleSortGame } from './BubbleSort';
import { RecursionGame } from './Recursion';
import { HashTableGame } from './HashTable';
import { MergeSortGame } from './MergeSort';
import { QuickSortGame } from './QuickSort';
import { TwoPointersGame } from './TwoPointers';
import { DijkstraGame } from './Dijkstra';

const BfsGame = (p: GameProps) => createElement(GraphGame, { ...p, kind: 'bfs' });
const DfsGame = (p: GameProps) => createElement(GraphGame, { ...p, kind: 'dfs' });

/** One game per line. Adding a line = add it to LINES, GUIDE, and here. */
export const GAMES: Record<LineId, ComponentType<GameProps>> = {
  sq: StackQueueGame,
  bfs: BfsGame,
  dfs: DfsGame,
  bin: BinarySearchGame,
  bub: BubbleSortGame,
  rec: RecursionGame,
  hash: HashTableGame,
  merge: MergeSortGame,
  quick: QuickSortGame,
  two: TwoPointersGame,
  dij: DijkstraGame,
};
