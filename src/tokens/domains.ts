import { SERIES_TOKENS, type BrandId } from '../brands/brandThemes';
import { brandColor, type BrandColor, type ColorName } from './palettes';

/** The brand's seven series tokens, in chart order. */
const brandSeries = (id: BrandId) => SERIES_TOKENS.map((t) => brandColor(id, t));

export type OwnerId = 'atlas' | 'maritime' | 'hyperion' | 'basiniq' | 'vulcan';
export type SemanticRole = 'alert' | 'warning';

export interface Owner {
  id: OwnerId;
  label: string;
  color: BrandColor;
  /** Grouping label only, e.g. Energy. Groups have no palette of their own. */
  group?: string;
  /** Series colors, in order, from the owner's brand palette. */
  categorical: ColorName[];
}

export const owners: Record<OwnerId, Owner> = {
  atlas: {
    id: 'atlas',
    label: 'Atlas',
    color: 'atlas',
    categorical: brandSeries('atlas'),
  },
  maritime: {
    id: 'maritime',
    label: 'Theia',
    color: 'maritime',
    categorical: brandSeries('maritime'),
  },
  hyperion: {
    id: 'hyperion',
    label: 'Hyperion',
    color: 'hyperion',
    group: 'Energy',
    categorical: brandSeries('hyperion'),
  },
  basiniq: {
    id: 'basiniq',
    label: 'BasinIQ',
    color: 'basiniq',
    group: 'Energy',
    categorical: brandSeries('basiniq'),
  },
  vulcan: {
    id: 'vulcan',
    label: 'Vulcan',
    color: 'vulcan',
    group: 'Energy',
    categorical: brandSeries('vulcan'),
  },
};

/** Product whose palette a whole group wears when its products are grouped. */
export const groupLead: Record<string, OwnerId> = { Energy: 'hyperion' };

/** Reserved semantic colors. Only the hybrid approach enforces them globally. */
export const reserved: Record<SemanticRole, ColorName> = {
  alert: 'red',
  warning: 'orange',
};

export interface Meaning {
  key: string;
  label: string;
  owner: OwnerId;
  /** Color the meaning has in its original standalone product. */
  native: ColorName;
  semantic?: SemanticRole;
  /** Used by the hybrid approach when `native` lands on a reserved hue. */
  alt?: ColorName;
}

const meaningList: Meaning[] = [
  { key: 'ais', label: 'AIS', owner: 'maritime', native: 'detAis' },
  { key: 'light', label: 'Light', owner: 'maritime', native: 'detLight' },
  { key: 'dark', label: 'Dark', owner: 'maritime', native: 'detDark', semantic: 'alert' },
  { key: 'unattributed', label: 'Unattributed', owner: 'maritime', native: 'detUnattributed' },
  { key: 'spoofedPosition', label: 'Spoofed position', owner: 'maritime', native: 'detSpoofing', semantic: 'warning' },
  { key: 'spoofingShip', label: 'Spoofing ship', owner: 'maritime', native: 'detSpoofing', semantic: 'warning' },
  { key: 'stsAis', label: 'Ship-to-ship (AIS)', owner: 'maritime', native: 'detAis' },
  { key: 'sts', label: 'Ship-to-ship', owner: 'maritime', native: 'detSts' },
  { key: 'similar', label: 'Similar ships', owner: 'maritime', native: 'detSimilar' },
  { key: 'zombie', label: 'Zombie ships', owner: 'maritime', native: 'detZombie' },

  { key: 'hypWell', label: 'Wells', owner: 'hyperion', native: 'hypWell' },
  { key: 'hypRig', label: 'Rigs', owner: 'hyperion', native: 'hypRig' },
  { key: 'hypFrac', label: 'Frac crews', owner: 'hyperion', native: 'hypFrac' },

  { key: 'producing', label: 'Producing well', owner: 'basiniq', native: 'green' },
  { key: 'drilling', label: 'Drilling', owner: 'basiniq', native: 'lime' },
  { key: 'permitted', label: 'Permitted', owner: 'basiniq', native: 'cyan' },
  { key: 'shutin', label: 'Shut-in', owner: 'basiniq', native: 'gray' },

  { key: 'flare', label: 'Flare event', owner: 'vulcan', native: 'red', alt: 'pink' },
  { key: 'exceedance', label: 'Emissions exceedance', owner: 'vulcan', native: 'orange', semantic: 'alert' },
  { key: 'compliant', label: 'Within limits', owner: 'vulcan', native: 'gray' },

  { key: 'solar', label: 'Solar', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'naturalGas', label: 'Natural gas', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'wind', label: 'Wind', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'battery', label: 'Battery', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'lng', label: 'LNG', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'compressor', label: 'Compressor station', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'datacenter', label: 'Datacenter', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'regasification', label: 'Regasification', owner: 'vulcan', native: 'vulGlyph' },
  { key: 'liquefaction', label: 'Liquefaction', owner: 'vulcan', native: 'vulGlyph' },
];

export const meanings: Record<string, Meaning> = Object.fromEntries(
  meaningList.map((m) => [m.key, m]),
);

/**
 * Approach H: one Atlas-wide registry where every meaning owns a unique hue.
 * Blue and green stay free for domain identity. Cyan is close to the Atlas primary.
 */
export const registryColors: Record<string, ColorName> = {
  ais: 'detAis',
  light: 'detLight',
  dark: 'detDark',
  unattributed: 'detUnattributed',
  spoofedPosition: 'detSpoofing',
  spoofingShip: 'pink.9',
  stsAis: 'teal.3',
  sts: 'detSts',
  similar: 'detSimilar',
  zombie: 'detZombie',
  producing: 'teal',
  drilling: 'lime',
  permitted: 'cyan',
  shutin: 'gray',
  flare: 'pink',
  exceedance: 'violet',
  compliant: 'gray',
  hypWell: 'hypWell',
  hypRig: 'hypRig',
  hypFrac: 'hypFrac',
  solar: 'vulGlyph',
  naturalGas: 'vulGlyph',
  wind: 'vulGlyph',
  battery: 'vulGlyph',
  lng: 'vulGlyph',
  compressor: 'vulGlyph',
  datacenter: 'vulGlyph',
  regasification: 'vulGlyph',
  liquefaction: 'vulGlyph',
};
