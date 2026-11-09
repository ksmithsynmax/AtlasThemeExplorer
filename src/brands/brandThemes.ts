import { blend } from './colorMath';

export type Mode = 'dark' | 'light';

export const MODES: { id: Mode; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

/** Exactly 12 tokens. Gridlines and borders derive from `text` via opacity. */
export interface PaletteColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
  accent3: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textSecondary: string;
}

export type ColorToken = keyof PaletteColors;

export const COLOR_TOKENS: { key: ColorToken; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Card' },
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent1', label: 'Accent 1' },
  { key: 'accent2', label: 'Accent 2' },
  { key: 'accent3', label: 'Accent 3' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
  { key: 'text', label: 'Text' },
  { key: 'textSecondary', label: 'Secondary text' },
];

export type BrandId = 'atlas' | 'maritime' | 'hyperion' | 'basiniq' | 'vulcan';

export interface BrandTheme {
  id: BrandId;
  name: string;
  /** Where the brand sits: Atlas, a domain, or a product inside a domain. */
  level: string;
  modes: Record<Mode, PaletteColors>;
  /** Text on Primary (buttons, active nav). Defaults to the card color. */
  onPrimary?: Partial<Record<Mode, string>>;
}

export const onPrimaryColor = (theme: BrandTheme, mode: Mode) => theme.onPrimary?.[mode] ?? theme.modes[mode].surface;

const DARK_NEUTRALS = { background: '#0A0E19', surface: '#131928', text: '#F5F7FA', textSecondary: '#9AA1AD' };
const LIGHT_NEUTRALS = { background: '#F4F6FA', surface: '#FFFFFF', text: '#0A0E19', textSecondary: '#5F6573' };
const DARK_STATUS = { warning: '#F5C04A', error: '#EF4E6A' };
const LIGHT_STATUS = { warning: '#C78802', error: '#DC3550' };

/**
 * Atlas is the real palette from AtlasCharts. The other four are first drafts:
 * same neutrals and status colors, with the brand hue as Primary and the
 * remaining roles re-picked so every series pair stays distinct.
 */
export const BRAND_THEMES: BrandTheme[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    level: 'Platform',
    modes: {
      dark: {
        ...DARK_NEUTRALS,
        primary: '#08B2DB',
        secondary: '#7C84FC',
        accent1: '#F04F98',
        accent2: '#006CD7',
        accent3: '#E9FC0D',
        success: '#00EB6C',
        warning: '#FFA500',
        error: '#FF4E4E',
      },
      light: {
        ...LIGHT_NEUTRALS,
        ...LIGHT_STATUS,
        primary: '#10809E',
        secondary: '#7055F7',
        accent1: '#C2348E',
        accent2: '#CE6A39',
        accent3: '#3C6AA3',
        success: '#1A9A6C',
      },
    },
  },
  {
    id: 'maritime',
    name: 'Theia',
    level: 'Domain',
    onPrimary: { dark: '#FFFFFF' },
    modes: {
      dark: {
        ...DARK_NEUTRALS,
        primary: '#006CD7',
        secondary: '#7B6CF6',
        accent1: '#FF6D99',
        accent2: '#A78BFA',
        accent3: '#00A3E3',
        success: '#00EB6C',
        warning: '#FFA500',
        error: '#F75349',
      },
      light: {
        ...LIGHT_NEUTRALS,
        ...LIGHT_STATUS,
        primary: '#3C6AA3',
        secondary: '#7055F7',
        accent1: '#C2348E',
        accent2: '#CE6A39',
        accent3: '#10809E',
        success: '#1A9A6C',
      },
    },
  },
  {
    id: 'hyperion',
    name: 'Hyperion',
    level: 'Product in Energy',
    modes: {
      dark: {
        ...DARK_NEUTRALS,
        ...DARK_STATUS,
        primary: '#25A72C',
        secondary: '#FC701A',
        accent1: '#2483F8',
        accent2: '#F04F98',
        accent3: '#7C84FC',
        success: '#25A72C',
        warning: '#FCEC38',
        error: '#FF4E4E',
      },
      light: {
        ...LIGHT_NEUTRALS,
        ...LIGHT_STATUS,
        primary: '#25A72C',
        secondary: '#FC701A',
        accent1: '#2483F8',
        accent2: '#F04F98',
        accent3: '#7C84FC',
        success: '#25A72C',
        warning: '#FCEC38',
        error: '#FF4E4E',
      },
    },
  },
  {
    id: 'basiniq',
    name: 'BasinIQ',
    level: 'Product in Energy',
    modes: {
      dark: {
        ...DARK_NEUTRALS,
        ...DARK_STATUS,
        primary: '#3AD784',
        secondary: '#099E5E',
        accent1: '#E9FC0D',
        accent2: '#005537',
        accent3: '#01312B',
        success: '#1CAD78',
      },
      light: {
        ...LIGHT_NEUTRALS,
        ...LIGHT_STATUS,
        primary: '#099E5E',
        secondary: '#005537',
        accent1: '#E9FC0D',
        accent2: '#3AD784',
        accent3: '#01312B',
        success: '#1A9A6C',
      },
    },
  },
  {
    id: 'vulcan',
    name: 'Vulcan',
    level: 'Product in Energy',
    modes: {
      dark: {
        ...DARK_NEUTRALS,
        ...DARK_STATUS,
        primary: '#FE6260',
        secondary: '#7C84FC',
        accent1: '#00A1C9',
        accent2: '#F04F98',
        accent3: '#FC701A',
        success: '#25A72C',
        warning: '#FCEC38',
        error: '#FF4E4E',
      },
      light: {
        ...LIGHT_NEUTRALS,
        ...LIGHT_STATUS,
        primary: '#FE6260',
        secondary: '#7C84FC',
        accent1: '#00A1C9',
        accent2: '#F04F98',
        accent3: '#FC701A',
        success: '#25A72C',
        warning: '#FCEC38',
        error: '#FF4E4E',
      },
    },
  },
];

/** Error is left out so no series reads as a problem. */
export const SERIES_TOKENS = ['primary', 'secondary', 'accent1', 'accent2', 'accent3', 'success', 'warning'] as const;

/** Past 7 series, colors repeat mixed toward Text by these amounts. */
export const ROUND_MIX = [0, 0.35, 0.6];

export function seriesColors(c: PaletteColors): string[] {
  return SERIES_TOKENS.map((k) => c[k]);
}

/** Color for series `index` (0-based): the 7 tokens, then the same mixed 35% and 60% with Text. */
export function seriesColor(index: number, c: PaletteColors) {
  const colors = seriesColors(c);
  const mix = ROUND_MIX[Math.min(Math.floor(index / colors.length), ROUND_MIX.length - 1)];
  const base = colors[index % colors.length];
  return mix ? blend(c.text, base, mix) : base;
}
