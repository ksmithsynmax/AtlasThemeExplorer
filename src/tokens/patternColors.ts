import { BRAND_COLOR_TOKENS, SERIES_TOKENS, type BrandTheme, type Mode } from '../brands/brandThemes';
import { blend, contrast, difference, hue } from '../brands/colorMath';
import type { PatternExample, PatternSeries } from '../data/reference/patterns';
import { resolveScope, type ResolveContext } from './approaches';
import type { OwnerId } from './domains';
import { brandColor, cssVar, mantineColor, type ColorName, type Swatch } from './palettes';

/** How the second half of a pair (last year, their number) is drawn. */
export type CompareStyleId = 'shade' | 'second';
/** Where the colors for ordered levels come from. */
export type LevelStyleId = 'status' | 'steps';

export const compareStyles: { id: CompareStyleId; name: string; rule: string }[] = [
  {
    id: 'shade',
    name: 'Same color, dashed',
    rule: 'This year and SynMax use the primary. Last year, averages and their numbers use the same color, dashed or outlined.',
  },
  {
    id: 'second',
    name: 'Next palette color',
    rule: 'Each line or bar takes the next palette color: primary, then the next series color.',
  },
];

export const levelStyles: { id: LevelStyleId; name: string; rule: string }[] = [
  {
    id: 'status',
    name: 'Status colors',
    rule: 'Worst to best runs Error, Warning, Success. Two levels use Error and Success. A fourth level goes between Warning and Success and takes the palette color closest to that in-between shade.',
  },
  {
    id: 'steps',
    name: 'Palette steps',
    rule: "The palette's series colors ordered by contrast on the card. The first level gets the strongest, the last the weakest.",
  },
];

/** How groups with no order are told apart. */
export type CategoryStyleId = 'every' | 'focus' | 'small';

export const categoryStyles: { id: CategoryStyleId; name: string; rule: string }[] = [
  {
    id: 'every',
    name: 'Every group a color',
    rule: 'Each group takes the next palette color. Past 7 groups the colors repeat.',
  },
  {
    id: 'focus',
    name: 'Top 4 + Other',
    rule: 'The 4 biggest groups get palette colors that sit next to each other on the color wheel. The rest fold into one outlined Other. Names sit on the chart.',
  },
  {
    id: 'small',
    name: 'Small multiples',
    rule: 'One small chart per group, all in the primary color, on the same scale.',
  },
];

type BrandToken = (typeof BRAND_COLOR_TOKENS)[number];
type SeriesToken = (typeof SERIES_TOKENS)[number];

export interface SeriesStyle {
  /** Mantine color, e.g. `hyperion.6`. */
  color: string;
  /** CSS color for strokes Mantine doesn't color itself. */
  css: string;
  dash?: string;
  /** Bars drawn as outlines only. */
  outline?: boolean;
  thin?: boolean;
}

export interface PatternColorContext {
  ctx: ResolveContext;
  compareStyle: CompareStyleId;
  levelStyle: LevelStyleId;
  categoryStyle: CategoryStyleId;
  brands: BrandTheme[];
  mode: Mode;
}

const swatch = (s: Swatch, extra: Partial<SeriesStyle> = {}): SeriesStyle => ({ color: mantineColor(s), css: cssVar(s), ...extra });

const ROLE_DASH: Partial<Record<NonNullable<PatternSeries['role']>, Partial<SeriesStyle>>> = {
  prior: { dash: '6 4' },
  avg: { dash: '2 3' },
  range: { dash: '1 4', thin: true },
  theirs: { dash: '6 4', outline: true },
};

function levelColors(owner: OwnerId, n: number, pc: PatternColorContext): ColorName[] {
  const palette = (pc.brands.find((b) => b.id === owner) ?? pc.brands[0]).modes[pc.mode];
  const hex = (t: BrandToken) => palette[t];

  if (pc.levelStyle === 'steps') {
    const ranked = [...SERIES_TOKENS].sort((a, b) => contrast(hex(b), palette.surface) - contrast(hex(a), palette.surface));
    return Array.from({ length: n }, (_, i) => brandColor(owner, ranked[n === 1 ? 0 : Math.round((i * (ranked.length - 1)) / (n - 1))]));
  }

  if (n === 1) return [brandColor(owner, 'primary')];
  if (n === 2) return [brandColor(owner, 'error'), brandColor(owner, 'success')];

  const status: BrandToken[] = ['error', 'warning', 'success'];
  const between: BrandToken[] = [];
  const extra = n - status.length;
  for (let i = 1; i <= extra; i++) {
    const target = blend(hex('success'), hex('warning'), i / (extra + 1));
    const candidates = BRAND_COLOR_TOKENS.filter((k) => !status.includes(k) && !between.includes(k));
    between.push(candidates.reduce((a, b) => (difference(hex(a), target) <= difference(hex(b), target) ? a : b)));
  }
  return ['error', 'warning', ...between, 'success'].map((t) => brandColor(owner, t as BrandToken));
}

export interface PatternStyles {
  /** Whose palette the chart wears under the current approach. */
  palette: OwnerId;
  styles: SeriesStyle[];
}

/** Colors for every series of an example as it appears under the current approach. Only palette and meaning colors are used. */
export function patternSeriesStyles(example: PatternExample, pc: PatternColorContext): PatternStyles {
  const meaningKeys = example.series.flatMap((s) => (s.meaning ? [s.meaning] : []));
  const scope = resolveScope(example.product, meaningKeys, pc.ctx);
  const palette = scope.accentOwner;
  return { palette, styles: seriesStyles(example, palette, scope.series, scope.meaningColors, pc) };
}

function seriesStyles(
  example: PatternExample,
  owner: OwnerId,
  series: Swatch[],
  meaningColors: Record<string, Swatch>,
  pc: PatternColorContext,
): SeriesStyle[] {
  if (example.scale) {
    return levelColors(owner, example.series.length, pc).map((c) => swatch(c));
  }

  const roles = example.series.map((s) => s.role);
  if (roles.every(Boolean)) {
    if (pc.compareStyle === 'shade') {
      return example.series.map((s) => swatch(series[0], ROLE_DASH[s.role!]));
    }
    const order = ['current', 'ours', 'prior', 'theirs', 'avg', 'range'];
    const slots = [...new Set(roles)].sort((a, b) => order.indexOf(a!) - order.indexOf(b!));
    return example.series.map((s) =>
      swatch(series[slots.indexOf(s.role) % series.length], s.role === 'range' ? { dash: '1 4', thin: true } : {}),
    );
  }

  if (pc.categoryStyle === 'small') {
    return example.series.map((s) => swatch(s.meaning ? meaningColors[s.meaning] : brandColor(owner, 'primary')));
  }

  if (pc.categoryStyle === 'focus' && !example.series.some((s) => s.meaning)) {
    const plain = example.series.filter((s) => s.name !== OTHER);
    const colors = neighborColors(owner, plain.length, pc);
    return example.series.map((s) =>
      s.name === OTHER ? swatch(brandColor(owner, 'primary'), { outline: true }) : swatch(colors[plain.indexOf(s) % colors.length]),
    );
  }

  return example.series.map((s, i) => (s.meaning ? swatch(meaningColors[s.meaning]) : swatch(series[i % series.length])));
}

/** `count` series colors that sit next to each other on the color wheel, always including Primary. */
function neighborColors(owner: OwnerId, count: number, pc: PatternColorContext): ColorName[] {
  const palette = (pc.brands.find((b) => b.id === owner) ?? pc.brands[0]).modes[pc.mode];
  const seen = new Set<string>();
  const tokens = SERIES_TOKENS.filter((t) => !seen.has(palette[t]) && seen.add(palette[t]));
  const byHue = [...tokens].sort((a, b) => hue(palette[a]) - hue(palette[b]));
  const k = Math.min(count, byHue.length);

  let best: SeriesToken[] = byHue.slice(0, k);
  let bestSpan = Infinity;
  for (let start = 0; start < byHue.length; start++) {
    const window = Array.from({ length: k }, (_, i) => byHue[(start + i) % byHue.length]);
    if (!window.includes('primary')) continue;
    const span = (hue(palette[window[k - 1]]) - hue(palette[window[0]]) + 360) % 360;
    if (span < bestSpan) [best, bestSpan] = [window, span];
  }
  const at = best.indexOf('primary');
  const ordered = at < k / 2 ? best : [...best].reverse();
  const rotated = [...ordered.slice(ordered.indexOf('primary')), ...ordered.slice(0, ordered.indexOf('primary'))];
  return rotated.map((t) => brandColor(owner, t));
}

/** Series key for the groups folded into Other. */
export const OTHER = '__other';

/** Keeps the `keep` biggest groups, largest first, and folds the rest (and any existing Other) into one Other series. */
export function foldCategories(example: PatternExample, keep = 4): PatternExample {
  if (example.series.some((s) => s.meaning)) return example;
  const total = (name: string) => example.data.reduce((t, r) => t + Math.abs(Number(r[name]) || 0), 0);
  const isOther = (s: PatternSeries) => /^other$/i.test(s.label);
  const ranked = example.series.filter((s) => !isOther(s)).sort((a, b) => total(b.name) - total(a.name));
  const folded = [...ranked.slice(keep), ...example.series.filter(isOther)];
  if (folded.length === 1 && !isOther(folded[0])) return { ...example, series: ranked };
  if (!folded.length) return { ...example, series: ranked };

  const label = folded.length === 1 ? folded[0].label : `Other (${folded.length})`;
  const data = example.data.map((row) => ({
    ...row,
    [OTHER]: folded.reduce((t, s) => t + (Number(row[s.name]) || 0), 0),
  }));
  return { ...example, series: [...ranked.slice(0, keep), { name: OTHER, label }], data };
}
