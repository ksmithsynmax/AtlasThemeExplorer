import { DEFAULT_THEME, type MantineColorsTuple } from '@mantine/core';
import {
  BRAND_THEMES,
  SERIES_TOKENS,
  type BrandId,
  type BrandTheme,
  type Mode,
} from '../brands/brandThemes';
import { blend } from '../brands/colorMath';

const base = DEFAULT_THEME.colors;

/** A Mantine 10-shade ramp with `hex` as shade 6, the shade Mantine treats as the color itself. */
export function ramp(hex: string): MantineColorsTuple {
  const tints = [0.92, 0.8, 0.62, 0.42, 0.24, 0.1].map((w) => blend('#FFFFFF', hex, w));
  const shades = [0.15, 0.3, 0.45].map((b) => blend('#000000', hex, b));
  return [...tints, hex, ...shades] as unknown as MantineColorsTuple;
}

type SeriesToken = (typeof SERIES_TOKENS)[number];

/**
 * Mantine color name for a brand's series token: the brand id itself for
 * Primary (`maritime`), otherwise e.g. `maritimeAccent1`.
 */
export type BrandColor = BrandId | `${BrandId}${Capitalize<Exclude<SeriesToken, 'primary'>>}`;

export function brandColor(brand: BrandId, token: SeriesToken): BrandColor {
  return (token === 'primary' ? brand : `${brand}${token[0].toUpperCase()}${token.slice(1)}`) as BrandColor;
}

export function brandColorEntries(brands: BrandTheme[], mode: Mode): [BrandColor, string][] {
  return brands.flatMap((b) => SERIES_TOKENS.map((t) => [brandColor(b.id, t), b.modes[mode][t]] as [BrandColor, string]));
}

/**
 * Ramps for every brand series token, from the dark-mode palette. The theme
 * swaps in the light-mode value per color scheme; these static copies are what
 * the audit compares by hex.
 */
export const brandPalettes = Object.fromEntries(
  brandColorEntries(BRAND_THEMES, 'dark').map(([name, hex]) => [name, ramp(hex)]),
) as Record<BrandColor, MantineColorsTuple>;

/** Body fills of the SynMax Maritime detection icons (Figma: SynMax Detections, Default state). */
export const detectionHexes = {
  detAis: '#00EB6C',
  detLight: '#00A3E3',
  detDark: '#FFA500',
  detUnattributed: '#F75349',
  detSpoofing: '#FF6D99',
  detSts: '#A78BFA',
  detSimilar: '#D256FE',
  detZombie: '#A9A9A9',
  /** Hyperion legend shapes (Figma: Data type icons). */
  hypWell: '#25A72C',
  hypRig: '#2483F8',
  hypFrac: '#FF4E4E',
  /** Vulcan glyphs are white; the shape carries the meaning, not the color. */
  vulGlyph: '#FFFFFF',
};

export const detectionPalettes = Object.fromEntries(
  Object.entries(detectionHexes).map(([name, hex]) => [name, ramp(hex)]),
) as Record<keyof typeof detectionHexes, MantineColorsTuple>;

/** A Mantine color name: a built-in palette, a brand palette or a detection color. */
export type ColorName = BrandColor | keyof typeof detectionHexes | keyof typeof base;

/** A color name, optionally with a shade (`blue` means `blue.6`). */
export type Swatch = ColorName | `${ColorName}.${number}`;

const allPalettes: Record<string, MantineColorsTuple> = { ...base, ...brandPalettes, ...detectionPalettes };

function parse(swatch: Swatch): [string, number] {
  const [name, shade] = swatch.split('.');
  return [name, shade === undefined ? 6 : Number(shade)];
}

export function hexOf(swatch: Swatch): string {
  const [name, shade] = parse(swatch);
  return allPalettes[name][shade];
}

/** Mantine color prop value, e.g. `blue.6`. */
export function mantineColor(swatch: Swatch): string {
  const [name, shade] = parse(swatch);
  return `${name}.${shade}`;
}

export function cssVar(swatch: Swatch): string {
  const [name, shade] = parse(swatch);
  return `var(--mantine-color-${name}-${shade})`;
}
