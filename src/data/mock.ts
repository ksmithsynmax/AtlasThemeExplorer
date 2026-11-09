import { basins, ports } from '../widgets/specs';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(42);
const pick = <T,>(items: T[], weights: number[]) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

export interface MapPoint {
  id: number;
  lng: number;
  lat: number;
  meaning: string;
  /** Degrees clockwise from north. */
  heading?: number;
}

/** Persian Gulf, through the Strait of Hormuz, into the Gulf of Oman. Every point is open water. */
const hormuzLane: [number, number][] = [
  [52.6, 26.0],
  [53.8, 26.25],
  [54.9, 26.2],
  [55.7, 26.35],
  [56.3, 26.58],
  [56.75, 26.2],
  [57.2, 25.6],
  [57.9, 25.1],
  [58.8, 24.85],
];
const fujairahAnchorage: [number, number] = [56.6, 25.2];

const bearing = ([x1, y1]: [number, number], [x2, y2]: [number, number]) =>
  (Math.atan2((x2 - x1) * Math.cos((y1 * Math.PI) / 180), y2 - y1) * 180) / Math.PI;

/** Holding patterns rather than transits, so their heading is arbitrary. */
const loitering = new Set(['sts', 'stsAis', 'similar', 'zombie']);

export const detections: MapPoint[] = Array.from({ length: 150 }, (_, id) => {
  const meaning = pick(
    ['ais', 'light', 'dark', 'unattributed', 'spoofedPosition', 'spoofingShip', 'stsAis', 'sts', 'similar', 'zombie'],
    [40, 22, 12, 5, 4, 4, 3, 4, 3, 3],
  );

  if (loitering.has(meaning) && rand() < 0.6) {
    const [lng, lat] = fujairahAnchorage;
    return { id, meaning, lng: lng + (rand() - 0.5) * 0.3, lat: lat + (rand() - 0.5) * 0.45, heading: rand() * 360 };
  }

  const seg = Math.floor(rand() * (hormuzLane.length - 1));
  const a = hormuzLane[seg];
  const b = hormuzLane[seg + 1];
  const t = rand();
  const along = bearing(a, b);
  const outbound = rand() < 0.5;
  const narrow = a[0] > 55.9 && a[0] < 56.9;
  const width = narrow ? 0.1 : 0.28;
  const offset = (rand() - 0.5) * 2 * width + (outbound ? -0.04 : 0.04);
  const normal = ((along + 90) * Math.PI) / 180;
  const lng = a[0] + (b[0] - a[0]) * t + Math.sin(normal) * offset;
  const lat = a[1] + (b[1] - a[1]) * t + Math.cos(normal) * offset;
  const heading = loitering.has(meaning)
    ? rand() * 360
    : (outbound ? along : along + 180) + (rand() - 0.5) * 24;
  return { id, meaning, lng, lat, heading };
});

export const wells: MapPoint[] = Array.from({ length: 320 }, (_, id) => ({
  id,
  lng: -104.4 + rand() * 3.4,
  lat: 30.9 + rand() * 2.4,
  meaning: pick(['producing', 'drilling', 'permitted', 'shutin'], [60, 14, 14, 12]),
}));

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const detectionsByDay = days.map((day) => ({
  day,
  ais: Math.round(110 + rand() * 30),
  light: Math.round(60 + rand() * 20),
  dark: Math.round(10 + rand() * 14),
  unattributed: Math.round(4 + rand() * 6),
  spoofedPosition: Math.round(3 + rand() * 5),
  spoofingShip: Math.round(3 + rand() * 5),
  stsAis: Math.round(2 + rand() * 5),
  sts: Math.round(3 + rand() * 5),
  similar: Math.round(2 + rand() * 4),
  zombie: Math.round(1 + rand() * 4),
}));

const vesselNames = [
  'Nordic Aurora',
  'Gulf Meridian',
  'Sea Falcon',
  'Pacific Dawn',
  'Atlas Voyager',
  'Coral Spirit',
  'Iron Tide',
  'Blue Horizon',
];

export const events = vesselNames.map((vessel, i) => ({
  id: i,
  time: `${String(23 - i * 2).padStart(2, '0')}:${String(Math.round(rand() * 59)).padStart(2, '0')}`,
  vessel,
  meaning: pick(
    ['dark', 'unattributed', 'spoofedPosition', 'spoofingShip', 'sts', 'similar', 'zombie'],
    [4, 2, 2, 2, 2, 1, 1],
  ),
  location: `${(25.2 + rand() * 1.3).toFixed(2)}°N ${(55 + rand() * 3).toFixed(2)}°E`,
  confidence: Math.round(70 + rand() * 29),
}));

const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

export const portCalls = weeks.map((week) =>
  Object.fromEntries([
    ['week', week],
    ...ports.map((p, i) => [p, Math.round(18 + i * 4 + rand() * 12)]),
  ]),
);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const basinBase = [5.6, 1.1, 1.2, 0.4];

export const production = months.map((month, m) =>
  Object.fromEntries([
    ['month', month],
    ...basins.map((b, i) => [b, +(basinBase[i] * (1 + m * 0.012) + rand() * 0.15).toFixed(2)]),
  ]),
);

export const rigs = weeks.map((week) => ({ week, Rigs: Math.round(296 + rand() * 12) }));

export const flaring = days.map((day, i) => ({
  day,
  flare: Math.round(12 + rand() * 10 + (i === 2 || i === 5 ? 18 : 0)),
  exceedance: Math.round(1 + rand() * 4 + (i === 2 ? 6 : 0)),
  compliant: Math.round(40 + rand() * 10),
}));

/** Separate seed so these maps don't shift the other mock data. */
const infraRand = seeded(7);
const near = ([lng, lat]: [number, number], spread: number) => ({
  lng: lng + (infraRand() - 0.5) * spread * 2,
  lat: lat + (infraRand() - 0.5) * spread * 2,
});

/** Permian Basin field activity. */
export const hyperionActivity: MapPoint[] = Array.from({ length: 170 }, (_, id) => {
  const r = infraRand();
  const meaning = r < 0.7 ? 'hypWell' : r < 0.88 ? 'hypRig' : 'hypFrac';
  return { id, meaning, lng: -104.2 + infraRand() * 3.2, lat: 31.0 + infraRand() * 2.3 };
});

const buildoutSites: { meaning: string; at: [number, number]; spread: number; count: number }[] = [
  { meaning: 'solar', at: [-102.2, 31.2], spread: 1.2, count: 14 },
  { meaning: 'wind', at: [-101.0, 33.6], spread: 1.4, count: 14 },
  { meaning: 'battery', at: [-97.0, 31.0], spread: 1.6, count: 9 },
  { meaning: 'naturalGas', at: [-96.4, 30.6], spread: 1.5, count: 9 },
  { meaning: 'compressor', at: [-97.8, 31.6], spread: 2.4, count: 12 },
  { meaning: 'datacenter', at: [-96.8, 32.8], spread: 0.35, count: 5 },
  { meaning: 'datacenter', at: [-97.7, 30.3], spread: 0.3, count: 4 },
  { meaning: 'datacenter', at: [-99.7, 32.4], spread: 0.25, count: 3 },
  { meaning: 'lng', at: [-93.87, 29.75], spread: 0.08, count: 2 },
  { meaning: 'lng', at: [-93.33, 30.03], spread: 0.08, count: 2 },
  { meaning: 'lng', at: [-97.2, 27.9], spread: 0.06, count: 2 },
  { meaning: 'liquefaction', at: [-95.32, 28.98], spread: 0.06, count: 2 },
  { meaning: 'liquefaction', at: [-93.34, 29.82], spread: 0.06, count: 2 },
  { meaning: 'regasification', at: [-90.0, 29.9], spread: 0.15, count: 2 },
];

/** Power and LNG projects under construction across Texas and the Gulf Coast. */
export const vulcanBuildout: MapPoint[] = buildoutSites.flatMap(({ meaning, at, spread, count }) =>
  Array.from({ length: count }, () => ({ meaning, ...near(at, spread) })),
).map((p, id) => ({ id, ...p }));
