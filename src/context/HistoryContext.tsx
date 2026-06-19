import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { HistoryDetail, HistoryEntry } from '../types';

interface HistoryContextValue {
  entries: HistoryEntry[];
  logHistory: (message: string, details?: HistoryDetail[]) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

const STORAGE_KEY = 'inventory-history';
const MAX_ENTRIES = 200;

function normalizeDetail(detail: HistoryDetail | string): HistoryDetail {
  if (typeof detail === 'string') {
    return { name: detail };
  }
  return {
    name: detail.name,
    ...(detail.quantity?.trim() ? { quantity: detail.quantity.trim() } : {}),
  };
}

function loadEntries(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((entry) => ({
      ...entry,
      details: entry.details?.map(normalizeDetail),
    }));
  } catch {
    return [];
  }
}

function saveEntries(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function createHistoryId() {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadEntries);

  const logHistory = useCallback((message: string, details?: HistoryDetail[]) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const normalizedDetails = details?.map(normalizeDetail).filter((detail) => detail.name);

    const entry: HistoryEntry = {
      id: createHistoryId(),
      message: trimmed,
      timestamp: new Date().toISOString(),
      ...(normalizedDetails && normalizedDetails.length > 0 ? { details: normalizedDetails } : {}),
    };

    setEntries((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveEntries(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ entries, logHistory, clearHistory }),
    [entries, logHistory, clearHistory],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
