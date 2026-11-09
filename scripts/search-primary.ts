import { contrast, difference, simulate, VISIONS } from '../src/brands/colorMath';
import { BRAND_THEMES, SERIES_TOKENS, type Mode } from '../src/brands/brandThemes';

// OKLCH -> sRGB hex
function oklchToHex(L: number, C: number, hDeg: number): string | null {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  if (lin.some((v) => v < -0.001 || v > 1.001)) return null;
  const toS = (v: number) => { const c = Math.min(1, Math.max(0, v)); return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055); };
  return '#' + lin.map((v) => Math.round(toS(v)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const argv = process.argv.slice(-4); const [brandId, mode, hMin, hMax] = [argv[0], argv[1] as Mode, Number(argv[2]), Number(argv[3])];
const theme = BRAND_THEMES.find((t) => t.id === brandId)!;
const c = theme.modes[mode];
const others = [...SERIES_TOKENS.filter((k) => k !== 'primary').map((k) => c[k]), c.error];
const best: { hex: string; score: number; normal: number }[] = [];
const [Lmin, Lmax] = mode === "dark" ? [Number(process.env.LMIN ?? 0.62), Number(process.env.LMAX ?? 0.8)] : [0.42, 0.58];
for (let L = Lmin; L <= Lmax; L += 0.01)
  for (let C = 0.13; C <= 0.25; C += 0.01)
    for (let H = hMin; H <= hMax; H += 2) {
      const hex = oklchToHex(L, C, H);
      if (!hex) continue;
      if (contrast(c.surface, hex) < 4.5 || contrast(hex, c.surface) < 3) continue;
      let worst = Infinity, normal = Infinity;
      for (const v of VISIONS) for (const o of others) {
        const d = difference(simulate(hex, v.id), simulate(o, v.id));
        worst = Math.min(worst, d);
        if (v.id === 'normal') normal = Math.min(normal, d);
      }
      best.push({ hex, score: worst, normal });
    }
best.sort((a, b) => b.score - a.score);
console.log(best.slice(0, 5).map((b) => `${b.hex} worstCVD=${b.score.toFixed(3)} normal=${b.normal.toFixed(3)}`).join('\n'));
