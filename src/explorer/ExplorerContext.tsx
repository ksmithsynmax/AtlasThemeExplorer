import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { chatTurns, scenarios, shellFocus, type ScenarioId } from '../scenarios';
import {
  approachById,
  dataModeById,
  type ApproachId,
  type DataModeId,
  type ResolveContext,
} from '../tokens/approaches';
import type { OwnerId } from '../tokens/domains';

export type ViewId = ScenarioId | 'compare' | 'architecture' | 'palettes';

interface ExplorerState {
  view: ViewId;
  setView: (view: ViewId) => void;
  approach: ApproachId;
  setApproach: (approach: ApproachId) => void;
  dataMode: DataModeId;
  setDataMode: (mode: DataModeId) => void;
  /** Which domain the shell follows on the mixed dashboard under approach B. */
  mixedFocus: OwnerId;
  setMixedFocus: (focus: OwnerId) => void;
  /** Number of chat turns shown. */
  chatStep: number;
  setChatStep: (step: number) => void;
  /** Draw a dashed outline around each widget showing which domain scope it renders in. */
  scopeOutlines: boolean;
  setScopeOutlines: (show: boolean) => void;
  /** Label Hyperion, BasinIQ and Vulcan widgets as one Energy scope. Colors don't change. */
  groupEnergy: boolean;
  setGroupEnergy: (group: boolean) => void;
  /** Resolve context for the current screen. */
  ctx: ResolveContext;
}

const ExplorerContext = createContext<ExplorerState | null>(null);

const initial = new URLSearchParams(window.location.search);

function fromUrl<T extends string>(key: string, allowed: Record<string, unknown>, fallback: T): T {
  const value = initial.get(key);
  return value && value in allowed ? (value as T) : fallback;
}

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>((initial.get('view') as ViewId) ?? 'maritime');
  const [approach, setApproach] = useState(fromUrl<ApproachId>('approach', approachById, 'scoped'));
  const [dataMode, setDataMode] = useState(fromUrl<DataModeId>('data', dataModeById, 'native'));
  const [mixedFocus, setMixedFocus] = useState<OwnerId>(
    (initial.get('focus') as OwnerId) ?? 'maritime',
  );
  const [chatStep, setChatStep] = useState(Number(initial.get('turn') ?? chatTurns.length));
  const [scopeOutlines, setScopeOutlines] = useState(initial.get('outlines') === '1');
  const [groupEnergy, setGroupEnergy] = useState(initial.get('group') === 'energy');

  useEffect(() => {
    const params = new URLSearchParams({
      view,
      approach,
      data: dataMode,
      focus: mixedFocus,
      turn: String(chatStep),
      ...(scopeOutlines ? { outlines: '1' } : {}),
      ...(groupEnergy ? { group: 'energy' } : {}),
    });
    window.history.replaceState(null, '', `?${params}`);
  }, [view, approach, dataMode, mixedFocus, chatStep, scopeOutlines, groupEnergy]);

  const ctx = useMemo<ResolveContext>(
    () => ({
      approach,
      dataMode,
      focus: view in scenarios ? shellFocus(view as ScenarioId, mixedFocus, chatStep) : null,
      groupEnergy,
    }),
    [view, approach, dataMode, mixedFocus, chatStep, groupEnergy],
  );

  const value = useMemo(
    () => ({
      view,
      setView,
      approach,
      setApproach,
      dataMode,
      setDataMode,
      mixedFocus,
      setMixedFocus,
      chatStep,
      setChatStep,
      scopeOutlines,
      setScopeOutlines,
      groupEnergy,
      setGroupEnergy,
      ctx,
    }),
    [view, approach, dataMode, mixedFocus, chatStep, scopeOutlines, groupEnergy, ctx],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer() {
  const value = useContext(ExplorerContext);
  if (!value) throw new Error('useExplorer must be used inside ExplorerProvider');
  return value;
}
