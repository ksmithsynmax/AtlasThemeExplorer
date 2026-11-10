import { groupLead, meanings, owners, registryColors, reserved, type OwnerId, type SemanticRole } from './domains';
import { brandColor, hexOf, type ColorName, type Swatch } from './palettes';
import { bestSeriesOrder, type SeriesOrderId } from './seriesOrder';

/** Where domain color shows up in the UI. */
export type ApproachId = 'scoped' | 'shell' | 'unified';
/** How data colors on maps and charts are assigned. */
export type DataModeId = 'native' | 'reserved' | 'unique';

interface Option<Id> {
  id: Id;
  letter: string;
  name: string;
  tagline: string;
  rule: string;
}

export const approaches: Option<ApproachId>[] = [
  {
    id: 'scoped',
    letter: 'A',
    name: 'Scoped widgets',
    tagline: 'Teal shell, each widget wears its domain',
    rule: 'The shell is always Atlas cyan. Each widget takes its domain color for accent, tag and icon.',
  },
  {
    id: 'shell',
    letter: 'B',
    name: 'Domain shell',
    tagline: 'The whole app re-themes to the active domain',
    rule: 'The shell re-themes to the domain the user is working in, and widgets inherit it.',
  },
  {
    id: 'unified',
    letter: 'C',
    name: 'One Atlas look',
    tagline: 'No domain color anywhere in the UI',
    rule: 'Shell and widgets are all Atlas cyan. The domain shows as a text label only.',
  },
];

export const dataModes: Option<DataModeId>[] = [
  {
    id: 'native',
    letter: '1',
    name: 'Native',
    tagline: 'Each product keeps today’s colors',
    rule: 'Every meaning keeps the color from its standalone product. Series use the domain palette.',
  },
  {
    id: 'reserved',
    letter: '2',
    name: 'Reserved',
    tagline: 'Alert and warning mean one thing everywhere',
    rule: 'Red is always alert and orange is always warning. Anything else on those hues, or on Atlas cyan, is shifted.',
  },
  {
    id: 'unique',
    letter: '3',
    name: 'Unique',
    tagline: 'Every meaning in Atlas owns a color',
    rule: 'One registry gives every meaning its own palette color. Plain series use the domain palette.',
  },
];

export const approachById = Object.fromEntries(approaches.map((a) => [a.id, a])) as Record<
  ApproachId,
  Option<ApproachId>
>;
export const dataModeById = Object.fromEntries(dataModes.map((d) => [d.id, d])) as Record<
  DataModeId,
  Option<DataModeId>
>;

export interface ResolveContext {
  approach: ApproachId;
  dataMode: DataModeId;
  /** Domain the shell follows under B. `null` means it cannot tell. */
  focus: OwnerId | null;
  /** Hyperion, BasinIQ and Vulcan all wear Hyperion's palette as one Energy group. */
  groupEnergy?: boolean;
  seriesOrder?: SeriesOrderId;
}

export interface ResolvedScope {
  owner: OwnerId;
  /** Whose palette the widget wears on its own: the product, or its group lead when grouped. */
  identity: OwnerId;
  accentOwner: OwnerId;
  accent: Swatch;
  meaningColors: Record<string, Swatch>;
  /** Meanings that resolved to a globally reserved color. */
  meaningRoles: Record<string, SemanticRole | undefined>;
  series: Swatch[];
}

const reservedHexes = new Set(Object.values(reserved).map((c) => hexOf(c)));
const shiftFallback: ColorName[] = ['atlasSecondary', 'atlasAccent1', 'atlasAccent2', 'atlasAccent3', 'atlasSuccess'];

export function identityOf(owner: OwnerId, ctx: Pick<ResolveContext, 'groupEnergy'>): OwnerId {
  const group = owners[owner].group;
  return ctx.groupEnergy && group ? (groupLead[group] ?? owner) : owner;
}

export function shellOwner(ctx: Pick<ResolveContext, 'approach' | 'focus' | 'groupEnergy'>): OwnerId {
  if (ctx.approach !== 'shell' || !ctx.focus) return 'atlas';
  return identityOf(ctx.focus, ctx);
}

export function shellColor(ctx: Pick<ResolveContext, 'approach' | 'focus' | 'groupEnergy'>): ColorName {
  return owners[shellOwner(ctx)].color;
}

function shiftOffReserved(palette: ColorName[]): ColorName[] {
  const blocked = new Set([...reservedHexes, hexOf('atlas')]);
  const kept = palette.filter((c) => !blocked.has(hexOf(c)));
  const seen = new Set(kept.map((c) => hexOf(c)));
  for (const c of shiftFallback) {
    if (!blocked.has(hexOf(c)) && !seen.has(hexOf(c))) {
      kept.push(c);
      seen.add(hexOf(c));
    }
  }
  return kept;
}

export function resolveScope(owner: OwnerId, meaningKeys: string[], ctx: ResolveContext): ResolvedScope {
  const { approach, dataMode } = ctx;
  const identity = identityOf(owner, ctx);

  const accentOwner: OwnerId =
    approach === 'shell'
      ? shellOwner(ctx)
      : approach === 'unified'
        ? 'atlas'
        : identity;
  const accent: Swatch = owners[accentOwner].color;

  const meaningColors: Record<string, Swatch> = {};
  const meaningRoles: Record<string, SemanticRole | undefined> = {};
  for (const key of meaningKeys) {
    const m = meanings[key];
    if (dataMode === 'native') {
      meaningColors[key] = m.native;
    } else if (dataMode === 'unique') {
      meaningColors[key] = registryColors[key];
    } else if (m.semantic) {
      meaningColors[key] = reserved[m.semantic];
      meaningRoles[key] = m.semantic;
    } else {
      meaningColors[key] = reservedHexes.has(hexOf(m.native)) ? (m.alt ?? brandColor(m.owner, 'secondary')) : m.native;
    }
  }

  // Series follow whichever domain the widget visibly belongs to.
  const palette = owners[accentOwner].categorical;
  const shifted = dataMode === 'reserved' ? shiftOffReserved(palette) : palette;
  const series: Swatch[] = ctx.seriesOrder === 'best' ? bestSeriesOrder(shifted) : shifted;

  return { owner, identity, accentOwner, accent, meaningColors, meaningRoles, series };
}
