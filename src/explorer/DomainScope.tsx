import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { resolveScope, type ResolvedScope } from '../tokens/approaches';
import { mantineColor } from '../tokens/palettes';
import { widgetSpecs, type WidgetId, type WidgetSpec } from '../widgets/specs';
import { useExplorer } from './ExplorerContext';

interface ScopeValue extends ResolvedScope {
  spec: WidgetSpec;
  /** Mantine color string for a domain meaning, e.g. `red.6`. */
  meaningColor: (key: string) => string;
  /** Mantine color string for the nth categorical series. */
  seriesColor: (index: number) => string;
}

const ScopeContext = createContext<ScopeValue | null>(null);

/**
 * Declares which domain a widget belongs to. Everything inside resolves its
 * accent, tags and data colors through the active approach.
 */
export function DomainScope({ widget, children }: { widget: WidgetId; children: ReactNode }) {
  const { ctx } = useExplorer();
  const spec = widgetSpecs[widget];

  const value = useMemo<ScopeValue>(() => {
    const resolved = resolveScope(spec.owner, spec.meanings, ctx);
    return {
      ...resolved,
      spec,
      meaningColor: (key) => mantineColor(resolved.meaningColors[key]),
      seriesColor: (index) => mantineColor(resolved.series[index % resolved.series.length]),
    };
  }, [spec, ctx]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const value = useContext(ScopeContext);
  if (!value) throw new Error('useScope must be used inside DomainScope');
  return value;
}
