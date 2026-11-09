type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const rgbToHex = (rgb: Rgb) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
};

/** The color a semi-transparent `fg` produces once drawn over `bg`. */
export function blend(fg: string, bg: string, alpha: number) {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  return rgbToHex(f.map((v, i) => v * alpha + b[i] * (1 - alpha)) as Rgb);
}

/** WCAG 2.x relative luminance. */
function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, 1 to 21. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Color vision deficiency (Machado, Oliveira & Fernandes 2009, full severity).

export type Vision = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export const VISIONS: { id: Vision; label: string; note: string }[] = [
  { id: 'normal', label: 'Typical vision', note: '' },
  { id: 'protanopia', label: 'Protanopia', note: 'No red cones, about 1% of men' },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia',
    note: 'No green cones, the most common, about 1% of men (6% with milder forms)',
  },
  { id: 'tritanopia', label: 'Tritanopia', note: 'No blue cones, rare' },
];

const CVD: Record<Exclude<Vision, 'normal'>, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export function simulate(hex: string, vision: Vision) {
  if (vision === 'normal') return hex.toUpperCase();
  const lin = hexToRgb(hex).map(toLinear);
  const out = CVD[vision].map((row) => row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]);
  return rgbToHex(out.map(fromLinear) as Rgb);
}

// Perceptual difference: distance in OKLab, where 0.02 is barely noticeable.

function oklab(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function difference(a: string, b: string) {
  const p = oklab(a);
  const q = oklab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
