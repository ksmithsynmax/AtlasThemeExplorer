import {
  COLOR_TOKENS,
  MODES,
  onPrimaryColor,
  ROUND_MIX,
  SERIES_TOKENS,
  seriesColor,
  type BrandTheme,
  type ColorToken,
  type Mode,
  type PaletteColors,
} from './brandThemes';
import { blend, contrast, difference, simulate, VISIONS, type Vision } from './colorMath';

/** WCAG 2.1 AA, the standard ADA cases are judged against. */
export const TEXT_AA = 4.5;
export const TEXT_AAA = 7;
export const GRAPHIC_AA = 3;
/**
 * OKLab distance between two colors that must be told apart at a glance.
 * Not a WCAG rule; a charting rule of thumb.
 */
export const DISTINCT = 0.1;
export const CONFUSABLE = 0.05;

const TITLE_OPACITY = 0.85;
const LEGEND_OPACITY = 0.7;

const SHADES = ROUND_MIX.slice(1).map((m) => `${Math.round(m * 100)}%`);
const SERIES_N = SERIES_TOKENS.length;

export const SHADED_NOTE =
  `No new colors. Past ${SERIES_N} series, charts reuse the ${SERIES_N} series colors as solid shades: series ${SERIES_N + 1}–${SERIES_N * 2} ` +
  `have ${SHADES[0]} Text mixed in, series ${SERIES_N * 2 + 1}–${SERIES_N * 3} have ${SHADES[1]}. This isn't opacity. ` +
  `The same ${GRAPHIC_AA}:1 applies.`;

export type Status = 'pass' | 'warn' | 'fail';

export interface ContrastCheck {
  label: string;
  usage: string;
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  status: Status;
  kind: 'text' | 'graphic';
}

export interface PairCheck {
  a: { label: string; color: string };
  b: { label: string; color: string };
  vision: Vision;
  distance: number;
  status: Status;
}

export interface Audit {
  text: ContrastCheck[];
  marks: ContrastCheck[];
  faded: ContrastCheck[];
  /** Series colors compared with each other, for every type of vision. */
  pairs: PairCheck[];
  /** Primary compared with Success, Warning and Error, so the brand never reads as a status. */
  statusPairs: PairCheck[];
  /** Series colors in order, then Error, for color blindness previews. */
  swatches: { label: string; color: string }[];
  wcagPassed: number;
  wcagTotal: number;
}

export const tokenLabel = (key: ColorToken) => COLOR_TOKENS.find((t) => t.key === key)?.label ?? key;

function check(label: string, usage: string, fg: string, bg: string, kind: ContrastCheck['kind']): ContrastCheck {
  const ratio = contrast(fg, bg);
  const required = kind === 'text' ? TEXT_AA : GRAPHIC_AA;
  return { label, usage, fg, bg, ratio, required, status: ratio >= required ? 'pass' : 'fail', kind };
}

const pairStatus = (d: number): Status => (d >= DISTINCT ? 'pass' : d >= CONFUSABLE ? 'warn' : 'fail');

function comparePairs(named: { label: string; color: string }[], against?: { label: string; color: string }[]) {
  const pairs: PairCheck[] = [];
  for (const { id: vision } of VISIONS) {
    const sets = against
      ? named.flatMap((a) => against.map((b) => [a, b] as const))
      : named.flatMap((a, i) => named.slice(i + 1).map((b) => [a, b] as const));
    for (const [a, b] of sets) {
      const distance = difference(simulate(a.color, vision), simulate(b.color, vision));
      pairs.push({ a, b, vision, distance, status: pairStatus(distance) });
    }
  }
  return pairs;
}

export function auditPalette(c: PaletteColors, onPrimary = c.surface): Audit {
  const card = c.surface;
  const text = [
    check('Text on page', 'Page title, menus', c.text, c.background, 'text'),
    check('Text on card', 'Tooltip values, donut total', c.text, card, 'text'),
    check('Chart titles', 'Text at 85% on card', blend(c.text, card, TITLE_OPACITY), card, 'text'),
    check('Legend labels', 'Text at 70% on card', blend(c.text, card, LEGEND_OPACITY), card, 'text'),
    check('Secondary text on card', 'Axis labels, captions, notes', c.textSecondary, card, 'text'),
    check('Secondary text on page', 'Control labels, hex codes', c.textSecondary, c.background, 'text'),
    check('Primary button', 'Button text on Primary', onPrimary, c.primary, 'text'),
  ];

  const marks = [
    ...SERIES_TOKENS.map((k, i) => check(tokenLabel(k), `Series ${i + 1}`, c[k], card, 'graphic')),
    check(tokenLabel('error'), 'Alerts', c.error, card, 'graphic'),
  ];

  const faded = SHADES.flatMap((shade, r) =>
    SERIES_TOKENS.map((k, i) => {
      const index = (r + 1) * SERIES_N + i;
      return check(
        `Series ${index + 1} · ${tokenLabel(k)}, shaded`,
        `${shade} Text mixed in`,
        seriesColor(index, c),
        card,
        'graphic',
      );
    }),
  );

  const named = SERIES_TOKENS.map((k) => ({ label: tokenLabel(k), color: c[k] }));
  const status = (['success', 'warning', 'error'] as const).map((k) => ({ label: tokenLabel(k), color: c[k] }));
  const pairs = comparePairs(named);
  const statusPairs = comparePairs([{ label: 'Primary', color: c.primary }], status);

  const wcag = [...text, ...marks, ...faded];
  return {
    text,
    marks,
    faded,
    pairs,
    statusPairs,
    swatches: [...named, { label: tokenLabel('error'), color: c.error }],
    wcagPassed: wcag.filter((x) => x.status === 'pass').length,
    wcagTotal: wcag.length,
  };
}

export interface OverviewRow {
  theme: BrandTheme;
  mode: { id: Mode; label: string };
  passed: number;
  total: number;
  /** Series pairs that look the same for some type of color blindness. */
  confusable: number;
  /** Status colors the brand Primary could be mistaken for. */
  statusClashes: number;
}

export function auditAll(themes: BrandTheme[]): OverviewRow[] {
  return themes.flatMap((theme) =>
    MODES.map((mode) => {
      const a = auditPalette(theme.modes[mode.id], onPrimaryColor(theme, mode.id));
      return {
        theme,
        mode,
        passed: a.wcagPassed,
        total: a.wcagTotal,
        confusable: a.pairs.filter((p) => p.status === 'fail').length,
        statusClashes: a.statusPairs.filter((p) => p.vision === 'normal' && p.status !== 'pass').length,
      };
    }),
  );
}
