import type { OwnerId } from '../../tokens/domains';
import raw from './patterns.json';

/** What a series is doing in a comparison chart. */
export type SeriesRole = 'current' | 'prior' | 'avg' | 'range' | 'ours' | 'theirs';

export interface PatternSeries {
  name: string;
  label: string;
  role?: SeriesRole;
  /** Theia meaning key; the series keeps that meaning's color. */
  meaning?: string;
}

export interface PatternExample {
  id: string;
  title: string;
  /** Product whose analysts built the original dashboard. */
  product: OwnerId;
  /** Name of the original dashboard. */
  source: string;
  unit: string;
  x: string;
  chart: 'line' | 'bar' | 'area';
  stacked?: boolean;
  /** Ordered levels: `risk` runs worst to best, `range` runs high to low with no good or bad. */
  scale?: 'risk' | 'range';
  series: PatternSeries[];
  data: Record<string, string | number | null>[];
}

export type PatternId = 'nowThen' | 'versus' | 'levels' | 'categories';

export const patternExamples = raw as unknown as Record<PatternId, PatternExample[]>;

export const patterns: { id: PatternId; label: string; summary: string; share: string }[] = [
  {
    id: 'nowThen',
    label: 'Now vs then',
    summary: 'This year against last year, often with a 5-year average or range.',
    share: 'About 30 of the 75 charts reviewed',
  },
  {
    id: 'versus',
    label: 'SynMax vs others',
    summary: "Our number against someone else's: EIA, IIR, or what a company announced.",
    share: 'About 7 of the 75 charts reviewed',
  },
  {
    id: 'levels',
    label: 'Ordered levels',
    summary: 'Levels with an order: high, medium, low risk; behind or on time; P10, P50, P90.',
    share: 'About 9 of the 75 charts, and most map layers',
  },
  {
    id: 'categories',
    label: 'Categories',
    summary: 'Groups with no order, like terminals, regions or countries. The only case for the series list.',
    share: 'About 12 of the 75 charts; 4 of them have more than 7 groups',
  },
];
