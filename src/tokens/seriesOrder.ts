import { GRAPHIC_AA } from '../brands/audit';
import { DARK_NEUTRALS } from '../brands/brandThemes';
import { contrast, difference, simulate, VISIONS } from '../brands/colorMath';
import { hexOf, type Swatch } from './palettes';

/** How a palette's series colors are lined up on charts. */
export type SeriesOrderId = 'palette' | 'best';

export const seriesOrders: { id: SeriesOrderId; name: string; rule: string }[] = [
  {
    id: 'palette',
    name: 'Palette order',
    rule: 'Primary, Secondary, Accent 1–3, then Success and Warning, as listed in the palette.',
  },
  {
    id: 'best',
    name: 'Best fit',
    rule:
      'Primary first. The rest are ordered so each new series is as different as possible from the ones before it, for every type of vision. Colors too faint on the dark card come later, and Success and Warning come last.',
  },
];

/** Hard to tell apart for the worst-off viewer: the smallest distance across all visions. */
const distance = (a: string, b: string) =>
  Math.min(...VISIONS.map(({ id }) => difference(simulate(a, id), simulate(b, id))));

const isStatus = (s: Swatch) => /(Success|Warning)$/.test(s);

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((p) => [x, ...p]));
}

/**
 * Closest pair among the first 2, 3, 4… colors. Comparing these in order favors
 * the small charts, which are most charts.
 */
function prefixScores(hexes: string[]) {
  const scores: number[] = [];
  let worst = Infinity;
  for (let k = 1; k < hexes.length; k++) {
    for (let j = 0; j < k; j++) worst = Math.min(worst, distance(hexes[k], hexes[j]));
    scores.push(worst);
  }
  return scores;
}

const beats = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-9) return a[i] > b[i];
  return false;
};

function bestTail(head: Swatch[], rest: Swatch[]) {
  let best = rest;
  let bestScore = prefixScores([...head, ...rest].map(hexOf));
  for (const p of permutations(rest)) {
    const score = prefixScores([...head, ...p].map(hexOf));
    if (beats(score, bestScore)) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

const cache = new Map<string, Swatch[]>();

/** Keeps the first color, reorders the rest for distinctness. Uses only the given colors. */
export function bestSeriesOrder(series: Swatch[]): Swatch[] {
  const key = series.join();
  const hit = cache.get(key);
  if (hit) return hit;

  const [first, ...rest] = series;
  const visible = (s: Swatch) => contrast(hexOf(s), DARK_NEUTRALS.surface) >= GRAPHIC_AA;
  const groups = [
    rest.filter((s) => !isStatus(s) && visible(s)),
    rest.filter((s) => !isStatus(s) && !visible(s)),
    rest.filter(isStatus),
  ];
  const ordered = first ? groups.reduce((head, group) => [...head, ...bestTail(head, group)], [first]) : [];
  cache.set(key, ordered);
  return ordered;
}
