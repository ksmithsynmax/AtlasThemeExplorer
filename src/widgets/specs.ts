import type { OwnerId } from '../tokens/domains';

export type WidgetId =
  | 'maritime-map'
  | 'maritime-detections'
  | 'maritime-events'
  | 'maritime-port-calls'
  | 'energy-production'
  | 'basiniq-wells-map'
  | 'basiniq-rigs'
  | 'vulcan-flaring'
  | 'hyperion-activity-map'
  | 'vulcan-buildout-map';

export interface WidgetSpec {
  id: WidgetId;
  title: string;
  owner: OwnerId;
  /** Domain meanings this widget encodes with color. */
  meanings: string[];
  /** Non-meaningful series, colored from the categorical palette in order. */
  series: string[];
  span?: 1 | 2;
}

export const basins = ['Permian', 'Eagle Ford', 'Bakken', 'Haynesville'];
export const ports = ['Houston', 'Corpus Christi', 'New Orleans', 'Freeport'];

const detectionMeanings = [
  'ais',
  'light',
  'dark',
  'unattributed',
  'spoofedPosition',
  'spoofingShip',
  'stsAis',
  'sts',
  'similar',
  'zombie',
];

export const widgetSpecs: Record<WidgetId, WidgetSpec> = {
  'maritime-map': {
    id: 'maritime-map',
    title: 'Strait of Hormuz detections',
    owner: 'maritime',
    meanings: detectionMeanings,
    series: [],
    span: 2,
  },
  'maritime-detections': {
    id: 'maritime-detections',
    title: 'Detections by type',
    owner: 'maritime',
    meanings: detectionMeanings,
    series: [],
  },
  'maritime-events': {
    id: 'maritime-events',
    title: 'Recent events',
    owner: 'maritime',
    meanings: ['dark', 'unattributed', 'spoofedPosition', 'spoofingShip', 'sts', 'similar', 'zombie'],
    series: [],
  },
  'maritime-port-calls': {
    id: 'maritime-port-calls',
    title: 'Tanker port calls',
    owner: 'maritime',
    meanings: [],
    series: ports,
  },
  'energy-production': {
    id: 'energy-production',
    title: 'Oil production by basin',
    owner: 'hyperion',
    meanings: [],
    series: basins,
  },
  'basiniq-wells-map': {
    id: 'basiniq-wells-map',
    title: 'Permian well status',
    owner: 'basiniq',
    meanings: ['producing', 'drilling', 'permitted', 'shutin'],
    series: [],
    span: 2,
  },
  'basiniq-rigs': {
    id: 'basiniq-rigs',
    title: 'Active rigs',
    owner: 'basiniq',
    meanings: [],
    series: ['Rigs'],
  },
  'vulcan-flaring': {
    id: 'vulcan-flaring',
    title: 'Flaring & emissions',
    owner: 'vulcan',
    meanings: ['flare', 'exceedance', 'compliant'],
    series: [],
  },
  'hyperion-activity-map': {
    id: 'hyperion-activity-map',
    title: 'Permian rigs, frac crews & wells',
    owner: 'hyperion',
    meanings: ['hypWell', 'hypRig', 'hypFrac'],
    series: [],
    span: 2,
  },
  'vulcan-buildout-map': {
    id: 'vulcan-buildout-map',
    title: 'Power & LNG build-out',
    owner: 'vulcan',
    meanings: [
      'solar',
      'naturalGas',
      'wind',
      'battery',
      'lng',
      'compressor',
      'datacenter',
      'regasification',
      'liquefaction',
    ],
    series: [],
    span: 2,
  },
};
