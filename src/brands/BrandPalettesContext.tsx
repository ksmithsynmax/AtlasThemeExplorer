import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BRAND_THEMES, type BrandId, type BrandTheme, type ColorToken, type Mode } from './brandThemes';

type Overrides = Partial<Record<BrandId, Partial<Record<Mode, Partial<Record<ColorToken, string>>>>>>;

export interface ColorChange {
  id: number;
  brand: BrandId;
  mode: Mode;
  token: ColorToken;
  from: string;
  to: string;
  at: number;
}

interface BrandPalettesState {
  brands: BrandTheme[];
  history: ColorChange[];
  isEdited: (id: BrandId) => boolean;
  original: (id: BrandId, mode: Mode, token: ColorToken) => string;
  setColor: (id: BrandId, mode: Mode, token: ColorToken, hex: string) => void;
  resetColor: (id: BrandId, mode: Mode, token: ColorToken) => void;
  resetBrand: (id: BrandId) => void;
  clearHistory: () => void;
}

const BrandPalettesContext = createContext<BrandPalettesState | null>(null);
const STORAGE_KEY = 'atlas-theme-explorer.brandOverrides.v2';
const HISTORY_KEY = 'atlas-theme-explorer.colorHistory';
/** Picker drags fire many changes; edits to the same color this close together count as one. */
const MERGE_MS = 3000;

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') ?? fallback;
  } catch {
    return fallback;
  }
}

const builtIn = (id: BrandId) => BRAND_THEMES.find((t) => t.id === id)!;

const LEGACY_STORAGE_KEY = 'atlas-theme-explorer.brandOverrides';

/** Carries over edits saved before v2, minus the Atlas card colors, which were reset. */
function loadOverrides(): Overrides {
  if (localStorage.getItem(LEGACY_STORAGE_KEY) === null) return load(STORAGE_KEY, {});
  const old = load<Overrides>(LEGACY_STORAGE_KEY, {});
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  delete old.atlas?.dark?.surface;
  delete old.atlas?.light?.surface;
  return old;
}

/** Built-in brand palettes plus any edits made in the browser, which are saved locally. */
export function BrandPalettesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>(loadOverrides);
  const [history, setHistory] = useState<ColorChange[]>(() => load(HISTORY_KEY, []));
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)), [overrides]);
  useEffect(() => localStorage.setItem(HISTORY_KEY, JSON.stringify(history)), [history]);

  const brands = useMemo(
    () =>
      BRAND_THEMES.map((theme) => ({
        ...theme,
        modes: {
          dark: { ...theme.modes.dark, ...overrides[theme.id]?.dark },
          light: { ...theme.modes.light, ...overrides[theme.id]?.light },
        },
      })),
    [overrides],
  );

  const original = useCallback(
    (id: BrandId, mode: Mode, token: ColorToken) => builtIn(id).modes[mode][token],
    [],
  );

  const record = useCallback((brand: BrandId, mode: Mode, token: ColorToken, from: string, to: string) => {
    if (from === to) return;
    const at = Date.now();
    setHistory((all) => {
      const last = all[0];
      if (last && last.brand === brand && last.mode === mode && last.token === token && at - last.at < MERGE_MS) {
        return last.from === to ? all.slice(1) : [{ ...last, to, at }, ...all.slice(1)];
      }
      return [{ id: at, brand, mode, token, from, to, at }, ...all];
    });
  }, []);

  const current = useCallback(
    (id: BrandId, mode: Mode, token: ColorToken) => overrides[id]?.[mode]?.[token] ?? original(id, mode, token),
    [overrides, original],
  );

  const setColor = useCallback(
    (id: BrandId, mode: Mode, token: ColorToken, hex: string) => {
      record(id, mode, token, current(id, mode, token), hex);
      setOverrides((all) => {
        const modeOverrides = { ...all[id]?.[mode] };
        if (hex === original(id, mode, token)) delete modeOverrides[token];
        else modeOverrides[token] = hex;
        const brand = { ...all[id], [mode]: modeOverrides };
        const next = { ...all, [id]: brand };
        if (!Object.values(brand).some((m) => m && Object.keys(m).length)) delete next[id];
        return next;
      });
    },
    [current, original, record],
  );

  const resetColor = useCallback(
    (id: BrandId, mode: Mode, token: ColorToken) => setColor(id, mode, token, original(id, mode, token)),
    [setColor, original],
  );

  const resetBrand = useCallback(
    (id: BrandId) => {
      for (const [mode, tokens] of Object.entries(overrides[id] ?? {}) as [Mode, Partial<Record<ColorToken, string>>][]) {
        for (const [token, hex] of Object.entries(tokens) as [ColorToken, string][]) {
          record(id, mode, token, hex, original(id, mode, token));
        }
      }
      setOverrides((all) => {
        const next = { ...all };
        delete next[id];
        return next;
      });
    },
    [overrides, original, record],
  );

  const clearHistory = useCallback(() => setHistory([]), []);
  const isEdited = useCallback(
    (id: BrandId) => Object.values(overrides[id] ?? {}).some((m) => m && Object.keys(m).length > 0),
    [overrides],
  );

  const value = useMemo(
    () => ({ brands, history, isEdited, original, setColor, resetColor, resetBrand, clearHistory }),
    [brands, history, isEdited, original, setColor, resetColor, resetBrand, clearHistory],
  );

  return <BrandPalettesContext.Provider value={value}>{children}</BrandPalettesContext.Provider>;
}

export function useBrandPalettes() {
  const value = useContext(BrandPalettesContext);
  if (!value) throw new Error('useBrandPalettes must be used inside BrandPalettesProvider');
  return value;
}
