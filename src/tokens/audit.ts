import { chatFocus, chatTurns, screenWidgets, shellFocus, type ScenarioId } from '../scenarios';
import { widgetSpecs, type WidgetId } from '../widgets/specs';
import { resolveScope, shellColor, shellOwner, type ResolveContext } from './approaches';
import { meanings, owners, type Meaning, type OwnerId } from './domains';
import { hexOf, type Swatch } from './palettes';

export type UseKind = 'shell' | 'identity' | 'reserved' | 'meaning' | 'series';

export interface ColorUse {
  color: Swatch;
  hex: string;
  kind: UseKind;
  /** Uses with the same key mean the same thing. */
  key: string;
  label: string;
  widgets: string[];
}

export interface Collision {
  hex: string;
  uses: ColorUse[];
  severity: 'conflict' | 'ambiguous';
}

export interface AuditResult {
  uses: ColorUse[];
  collisions: Collision[];
  conflicts: number;
  ambiguities: number;
  /** Widgets wearing another domain's color. */
  misattributed: string[];
  /** Widgets with no visible domain identity. */
  identityLost: string[];
  /** Meanings whose color differs from the standalone product. */
  remapped: { meaning: Meaning; color: Swatch }[];
}

const NEUTRAL = new Set([hexOf('vulGlyph')]);
const isData = (u: ColorUse) => u.kind === 'meaning' || u.kind === 'series' || u.kind === 'reserved';

export function auditScreen(widgetIds: WidgetId[], ctx: ResolveContext): AuditResult {
  const byKey = new Map<string, ColorUse>();
  const add = (color: Swatch, kind: UseKind, key: string, label: string, widget?: string) => {
    const existing = byKey.get(key);
    if (existing) {
      if (widget && !existing.widgets.includes(widget)) existing.widgets.push(widget);
      return;
    }
    byKey.set(key, { color, hex: hexOf(color), kind, key, label, widgets: widget ? [widget] : [] });
  };

  const shell = shellOwner(ctx);
  add(shellColor(ctx), 'shell', `identity:${shell}`, `${owners[shell].label} (shell)`);

  const misattributed: string[] = [];
  const identityLost: string[] = [];
  const remapped = new Map<string, { meaning: Meaning; color: Swatch }>();

  for (const id of widgetIds) {
    const spec = widgetSpecs[id];
    const scope = resolveScope(spec.owner, spec.meanings, ctx);

    add(scope.accent, 'identity', `identity:${scope.accentOwner}`, `${owners[scope.accentOwner].label} identity`, spec.title);

    if (scope.accentOwner === 'atlas') identityLost.push(spec.title);
    else if (scope.accentOwner !== scope.identity) misattributed.push(spec.title);

    for (const key of spec.meanings) {
      const color = scope.meaningColors[key];
      const role = scope.meaningRoles[key];
      if (role) add(color, 'reserved', `reserved:${role}`, `${role[0].toUpperCase()}${role.slice(1)} (reserved)`, spec.title);
      else add(color, 'meaning', `meaning:${key}`, meanings[key].label, spec.title);
      if (hexOf(color) !== hexOf(meanings[key].native)) remapped.set(key, { meaning: meanings[key], color });
    }
    spec.series.forEach((name, i) => {
      add(scope.series[i % scope.series.length], 'series', `series:${name}`, name, spec.title);
    });
  }

  const uses = [...byKey.values()];
  const byHex = new Map<string, ColorUse[]>();
  for (const u of uses) {
    if (NEUTRAL.has(u.hex)) continue;
    byHex.set(u.hex, [...(byHex.get(u.hex) ?? []), u]);
  }

  const collisions: Collision[] = [];
  for (const [hex, group] of byHex) {
    if (group.length < 2) continue;
    const dataCount = group.filter(isData).length;
    collisions.push({ hex, uses: group, severity: dataCount >= 2 ? 'conflict' : 'ambiguous' });
  }
  collisions.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'conflict' ? -1 : 1));

  return {
    uses,
    collisions,
    conflicts: collisions.filter((c) => c.severity === 'conflict').length,
    ambiguities: collisions.filter((c) => c.severity === 'ambiguous').length,
    misattributed,
    identityLost,
    remapped: [...remapped.values()],
  };
}

/** How many times the shell color changes as the chat session progresses. */
export function shellChanges(ctx: Omit<ResolveContext, 'focus'>, upToTurn = chatTurns.length): number {
  let changes = 0;
  let previous = shellOwner({ ...ctx, focus: chatFocus(1) });
  for (let turn = 2; turn <= upToTurn; turn++) {
    const next = shellOwner({ ...ctx, focus: chatFocus(turn) });
    if (next !== previous) changes++;
    previous = next;
  }
  return changes;
}

export function auditScenario(
  id: ScenarioId,
  ctx: Omit<ResolveContext, 'focus'>,
  mixedFocus: OwnerId,
) {
  return auditScreen(screenWidgets(id), { ...ctx, focus: shellFocus(id, mixedFocus) });
}
