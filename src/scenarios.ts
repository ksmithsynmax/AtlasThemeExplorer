import type { OwnerId } from './tokens/domains';
import { widgetSpecs, type WidgetId } from './widgets/specs';

export type ScenarioId = 'maritime' | 'energy' | 'mixed' | 'chat';

export interface ChatTurn {
  question: string;
  answer: string;
  /** Product the turn is about; `null` when it spans products. */
  focus: OwnerId | null;
  widgets: WidgetId[];
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** Shell focus under approach B. `null` means the user has to choose. */
  focus: OwnerId | null;
  widgets: WidgetId[];
}

export const chatTurns: ChatTurn[] = [
  {
    question: 'Any dark vessel activity near Galveston this week?',
    answer:
      'Yes. 14 vessels went dark within 40 nm of Galveston, 3 of them near a known STS area. Here are the detections and the most recent events.',
    focus: 'maritime',
    widgets: ['maritime-map', 'maritime-events'],
  },
  {
    question: 'How is Permian production trending, and how many rigs are running?',
    answer:
      'Permian output is up 4% month over month. The rig count has held steady around 300 for six weeks.',
    focus: 'basiniq',
    widgets: ['energy-production', 'basiniq-rigs'],
  },
  {
    question: 'Do flaring spikes in the Permian line up with tanker departures from Corpus Christi?',
    answer:
      'Partly. Two of the three flaring spikes were followed by a jump in Corpus Christi port calls within 10 days. Both views are below.',
    focus: null,
    widgets: ['vulcan-flaring', 'maritime-port-calls', 'maritime-detections'],
  },
];

export const scenarios: Record<ScenarioId, Scenario> = {
  maritime: {
    id: 'maritime',
    label: 'Theia dashboard',
    description: 'A user who lives in Theia. Do they see Theia blue or Atlas cyan?',
    focus: 'maritime',
    widgets: ['maritime-map', 'maritime-detections', 'maritime-events', 'maritime-port-calls'],
  },
  energy: {
    id: 'energy',
    label: 'Energy dashboard',
    description: 'Energy is three products, Hyperion, BasinIQ and Vulcan, each with its own palette.',
    focus: null,
    widgets: [
      'hyperion-activity-map',
      'vulcan-buildout-map',
      'basiniq-wells-map',
      'energy-production',
      'basiniq-rigs',
      'vulcan-flaring',
    ],
  },
  mixed: {
    id: 'mixed',
    label: 'Mixed dashboard',
    description: 'Theia and Energy widgets side by side on one Atlas dashboard.',
    focus: null,
    widgets: [
      'maritime-map',
      'maritime-detections',
      'energy-production',
      'basiniq-wells-map',
      'vulcan-flaring',
    ],
  },
  chat: {
    id: 'chat',
    label: 'LLM session',
    description: 'One conversation that starts in Theia, drifts to Energy, then asks across both.',
    focus: null,
    widgets: chatTurns.flatMap((t) => t.widgets),
  },
};

/**
 * Shell focus after `turnCount` turns under approach B. Cross-domain turns
 * have no single domain, so the shell keeps whatever it showed last.
 */
export function chatFocus(turnCount: number): OwnerId | null {
  const known = chatTurns.slice(0, turnCount).filter((t) => t.focus);
  return known.length ? known[known.length - 1].focus : null;
}

export function screenWidgets(id: ScenarioId, chatStep = chatTurns.length): WidgetId[] {
  if (id === 'chat') return chatTurns.slice(0, chatStep).flatMap((t) => t.widgets);
  return scenarios[id].widgets;
}

/** Products whose widgets appear in a scenario, in order of first appearance. */
export function scenarioOwners(id: ScenarioId): OwnerId[] {
  return [...new Set(scenarios[id].widgets.map((w) => widgetSpecs[w].owner))];
}

/** Product the shell follows under approach B. */
export function shellFocus(id: ScenarioId, mixedFocus: OwnerId, chatStep = chatTurns.length) {
  if (id === 'chat') return chatFocus(chatStep);
  if (scenarios[id].focus) return scenarios[id].focus;
  const choices = scenarioOwners(id);
  return choices.includes(mixedFocus) ? mixedFocus : choices[0];
}

export const dashboardScenarios: ScenarioId[] = ['maritime', 'energy', 'mixed', 'chat'];
