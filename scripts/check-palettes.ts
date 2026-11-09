import { auditPalette } from '../src/brands/audit';
import { BRAND_THEMES, MODES } from '../src/brands/brandThemes';

let failures = 0;
for (const theme of BRAND_THEMES) {
  for (const mode of MODES) {
    const a = auditPalette(theme.modes[mode.id]);
    const wcag = [...a.text, ...a.marks, ...a.faded].filter((x) => x.status !== 'pass');
    const pairs = a.pairs.filter((p) => p.status === 'fail');
    const close = a.pairs.filter((p) => p.status === 'warn');
    const status = a.statusPairs.filter((p) => p.status !== 'pass');
    const line = `${theme.name.padEnd(9)} ${mode.label.padEnd(5)} WCAG ${a.wcagPassed}/${a.wcagTotal}  same-looking ${pairs.length}  close ${close.length}  status-clash ${status.length}`;
    console.log(line);
    for (const x of wcag) console.log(`   WCAG fail: ${x.label} ${x.ratio.toFixed(2)} < ${x.required}`);
    for (const p of [...pairs, ...status.filter((s) => s.status === 'fail' || s.vision === 'normal')])
      console.log(`   ${p.vision}: ${p.a.label} vs ${p.b.label} ${p.distance.toFixed(3)} ${p.status}`);
    failures += wcag.length + pairs.length;
  }
}
process.exitCode = failures ? 1 : 0;
