import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addItemMessage,
  deleteItemsMessage,
  deleteListMessage,
  listName,
  moveMessage,
  partialMoveMessage,
} from '../lib/inventoryHistory';
import { parseQuantity } from '../lib/quantity';
import type { HistoryLog } from '../lib/inventoryHistory';
import { useHistory } from './HistoryContext';
import type { InventoryList, InventoryState, MaterialItem } from '../types';

interface InventoryContextValue extends InventoryState {
  activeList: InventoryList;
  setActiveListId: (id: string) => void;
  addList: (name: string) => void;
  removeList: (listId: string) => void;
  addItemFromScan: (barcode: string) => MaterialItem | null;
  addItemManually: (name: string) => MaterialItem | null;
  removeItem: (itemId: string) => void;
  removeItems: (itemIds: string[]) => void;
  updateItem: (itemId: string, updates: Partial<Pick<MaterialItem, 'name' | 'material' | 'quantity'>>) => void;
  moveItemToList: (itemId: string, targetListId: string) => void;
  moveItemQuantity: (itemId: string, targetListId: string, amount: number) => void;
  moveItemsToList: (itemIds: string[], targetListId: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

const STORAGE_KEY = 'inventory-data';

const DEFAULT_LISTS: InventoryList[] = [
  { id: 'warehouse', name: 'Warehouse', items: [] },
  { id: 'truck-1', name: 'Truck 1', items: [] },
  { id: 'truck-2', name: 'Truck 2', items: [] },
  { id: 'job-site', name: 'Job Site', items: [] },
];

const SEED_PIPES: MaterialItem[] = [
  {
    id: 'pipe-1',
    barcode: 'PIPE-1',
    name: 'Pipe 1',
    material: '',
    quantity: '',
    addedAt: '1970-01-01T00:00:00.000Z',
  },
  {
    id: 'pipe-2',
    barcode: 'PIPE-2',
    name: 'Pipe 2',
    material: '',
    quantity: '',
    addedAt: '1970-01-01T00:00:01.000Z',
  },
  {
    id: 'pipe-3',
    barcode: 'PIPE-3',
    name: 'Pipe 3',
    material: '',
    quantity: '',
    addedAt: '1970-01-01T00:00:02.000Z',
  },
];

type LegacyMaterialItem = MaterialItem & { length?: string };

function normalizeItem(item: LegacyMaterialItem): MaterialItem {
  return {
    id: item.id,
    barcode: item.barcode,
    name: item.name,
    material: item.material ?? '',
    quantity: item.quantity ?? item.length ?? '',
    addedAt: item.addedAt,
  };
}

function normalizeState(state: InventoryState): InventoryState {
  return {
    ...state,
    lists: state.lists.map((list) => ({
      ...list,
      items: list.items.map((item) => normalizeItem(item as LegacyMaterialItem)),
    })),
  };
}

function ensureSeedPipes(state: InventoryState): InventoryState {
  const existingIds = new Set(state.lists.flatMap((list) => list.items.map((item) => item.id)));
  const missing = SEED_PIPES.filter((pipe) => !existingIds.has(pipe.id));
  if (missing.length === 0) return state;

  const warehouseIndex = state.lists.findIndex((list) => list.id === 'warehouse');
  const targetIndex = warehouseIndex >= 0 ? warehouseIndex : 0;

  const lists = state.lists.map((list, index) =>
    index === targetIndex ? { ...list, items: [...missing, ...list.items] } : list,
  );

  return { ...state, lists };
}

function loadState(): InventoryState {
  let base: InventoryState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      base = { lists: DEFAULT_LISTS, activeListId: DEFAULT_LISTS[0].id };
    } else {
      const parsed = JSON.parse(raw) as InventoryState;
      base =
        parsed.lists?.length
          ? parsed
          : { lists: DEFAULT_LISTS, activeListId: DEFAULT_LISTS[0].id };
    }
  } catch {
    base = { lists: DEFAULT_LISTS, activeListId: DEFAULT_LISTS[0].id };
  }

  const withSeeds = ensureSeedPipes(base);
  const state = normalizeState(withSeeds);
  if (state !== base) saveState(state);
  return state;
}

function saveState(state: InventoryState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(loadState);
  const { logHistory } = useHistory();

  const persist = useCallback((updater: (prev: InventoryState) => InventoryState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const activeList = useMemo(
    () => state.lists.find((list) => list.id === state.activeListId) ?? state.lists[0],
    [state],
  );

  const setActiveListId = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, activeListId: id }));
    },
    [persist],
  );

  const addList = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const newList: InventoryList = {
        id: createId('list'),
        name: trimmed,
        items: [],
      };

      persist((prev) => ({
        lists: [...prev.lists, newList],
        activeListId: newList.id,
      }));
      logHistory(`${trimmed} list created`);
    },
    [persist, logHistory],
  );

  const removeList = useCallback(
    (listId: string) => {
      let historyLog: HistoryLog | null = null;

      persist((prev) => {
        if (prev.lists.length <= 1) return prev;

        const list = prev.lists.find((entry) => entry.id === listId);
        if (!list) return prev;

        historyLog = deleteListMessage(list.name, list.items);

        const removeIndex = prev.lists.findIndex((entry) => entry.id === listId);
        const lists = prev.lists.filter((entry) => entry.id !== listId);
        let activeListId = prev.activeListId;

        if (activeListId === listId) {
          const nextIndex = Math.min(removeIndex, lists.length - 1);
          activeListId = lists[nextIndex].id;
        }

        return { lists, activeListId };
      });

      if (historyLog) logHistory(historyLog.message, historyLog.details);
    },
    [persist, logHistory],
  );

  const addItemToActiveList = useCallback(
    (item: MaterialItem): MaterialItem => {
      let historyLog: HistoryLog | null = null;

      persist((prev) => {
        const listIndex = prev.lists.findIndex((list) => list.id === prev.activeListId);
        if (listIndex === -1) return prev;

        const list = prev.lists[listIndex];
        historyLog = addItemMessage(item.name, list.name, item.quantity);

        const updatedLists = [...prev.lists];
        updatedLists[listIndex] = {
          ...list,
          items: [item, ...list.items],
        };

        return { ...prev, lists: updatedLists };
      });

      if (historyLog) logHistory(historyLog.message, historyLog.details);
      return item;
    },
    [persist, logHistory],
  );

  const addItemFromScan = useCallback(
    (barcode: string): MaterialItem | null => {
      const trimmed = barcode.trim();
      if (!trimmed) return null;

      let result: MaterialItem | null = null;
      let historyLog: HistoryLog | null = null;

      persist((prev) => {
        const listIndex = prev.lists.findIndex((list) => list.id === prev.activeListId);
        if (listIndex === -1) return prev;

        const list = prev.lists[listIndex];
        const existing = list.items.find((item) => item.barcode === trimmed);
        if (existing) {
          result = existing;
          return prev;
        }

        const item: MaterialItem = {
          id: createId('item'),
          barcode: trimmed,
          name: `Item ${trimmed.slice(-6)}`,
          material: '',
          quantity: '',
          addedAt: new Date().toISOString(),
        };

        result = item;
        historyLog = addItemMessage(item.name, list.name, item.quantity);

        const updatedLists = [...prev.lists];
        updatedLists[listIndex] = {
          ...list,
          items: [item, ...list.items],
        };

        return { ...prev, lists: updatedLists };
      });

      if (historyLog) logHistory(historyLog.message, historyLog.details);
      return result;
    },
    [persist, logHistory],
  );

  const addItemManually = useCallback(
    (name: string): MaterialItem | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const item: MaterialItem = {
        id: createId('item'),
        barcode: createId('manual'),
        name: trimmed,
        material: '',
        quantity: '',
        addedAt: new Date().toISOString(),
      };

      return addItemToActiveList(item);
    },
    [addItemToActiveList],
  );

  const removeItems = useCallback(
    (itemIds: string[]) => {
      const idSet = new Set(itemIds);
      if (idSet.size === 0) return;

      let historyLog: HistoryLog | null = null;

      persist((prev) => {
        const removedByList: { list: InventoryList; items: MaterialItem[] }[] = [];

        for (const list of prev.lists) {
          const removed = list.items.filter((item) => idSet.has(item.id));
          if (removed.length > 0) {
            removedByList.push({ list, items: removed });
          }
        }

        if (removedByList.length === 0) return prev;

        const primary = removedByList[0];
        historyLog = deleteItemsMessage(primary.items, primary.list.name);

        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            items: list.items.filter((item) => !idSet.has(item.id)),
          })),
        };
      });

      if (historyLog) logHistory(historyLog.message, historyLog.details);
    },
    [persist, logHistory],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      removeItems([itemId]);
    },
    [removeItems],
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<Pick<MaterialItem, 'name' | 'material' | 'quantity'>>) => {
      persist((prev) => ({
        ...prev,
        lists: prev.lists.map((list) =>
          list.id === prev.activeListId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item,
                ),
              }
            : list,
        ),
      }));
    },
    [persist],
  );

  const moveItemsToList = useCallback(
    (itemIds: string[], targetListId: string) => {
      const idSet = new Set(itemIds);
      if (idSet.size === 0) return;

      let historyLog: HistoryLog | null = null;

      persist((prev) => {
        const itemsToMove: MaterialItem[] = [];
        let sourceListId: string | undefined;

        for (const list of prev.lists) {
          const found = list.items.filter((entry) => idSet.has(entry.id));
          if (found.length > 0) {
            itemsToMove.push(...found);
            sourceListId = list.id;
          }
        }

        if (!sourceListId || sourceListId === targetListId || itemsToMove.length === 0) {
          return prev;
        }

        historyLog = moveMessage(itemsToMove, listName(prev.lists, targetListId));

        return {
          ...prev,
          lists: prev.lists.map((list) => {
            if (list.id === sourceListId) {
              return { ...list, items: list.items.filter((entry) => !idSet.has(entry.id)) };
            }
            if (list.id === targetListId) {
              return { ...list, items: [...itemsToMove, ...list.items] };
            }
            return list;
          }),
        };
      });

      if (historyLog) logHistory(historyLog.message, historyLog.details);
    },
    [persist, logHistory],
  );

  const moveItemQuantity = useCallback(
    (itemId: string, targetListId: string, amount: number) => {
      let historyLog: HistoryLog | null = null;

      persist((prev) => {
        let sourceListId: string | undefined;
        let item: MaterialItem | undefined;

        for (const list of prev.lists) {
          const found = list.items.find((entry) => entry.id === itemId);
          if (found) {
            item = found;
            sourceListId = list.id;
            break;
          }
        }

        if (!item || !sourceListId || sourceListId === targetListId) return prev;

        const totalQty = parseQuantity(item.quantity);
        if (totalQty === null || amount < 1 || amount > totalQty) return prev;

        if (amount >= totalQty) {
          return prev;
        }

        const remaining = totalQty - amount;
        const targetListName = listName(prev.lists, targetListId);
        historyLog = partialMoveMessage(item, amount, targetListName);

        const movedItem: MaterialItem = {
          ...item,
          id: createId('item'),
          quantity: String(amount),
          addedAt: new Date().toISOString(),
        };

        return {
          ...prev,
          lists: prev.lists.map((list) => {
            if (list.id === sourceListId) {
              return {
                ...list,
                items: list.items.map((entry) =>
                  entry.id === itemId ? { ...entry, quantity: String(remaining) } : entry,
                ),
              };
            }

            if (list.id === targetListId) {
              const existingIndex = list.items.findIndex(
                (entry) =>
                  entry.name === item!.name &&
                  entry.material === item!.material &&
                  entry.barcode === item!.barcode,
              );

              if (existingIndex >= 0) {
                const existing = list.items[existingIndex];
                const existingQty = parseQuantity(existing.quantity) ?? 0;
                const updated = [...list.items];
                updated[existingIndex] = {
                  ...existing,
                  quantity: String(existingQty + amount),
                };
                return { ...list, items: updated };
              }

              return { ...list, items: [movedItem, ...list.items] };
            }

            return list;
          }),
        };
      });

      if (historyLog) logHistory(historyLog.message, historyLog.details);
    },
    [persist, logHistory],
  );

  const moveItemToList = useCallback(
    (itemId: string, targetListId: string) => {
      moveItemsToList([itemId], targetListId);
    },
    [moveItemsToList],
  );

  const value = useMemo(
    () => ({
      ...state,
      activeList,
      setActiveListId,
      addList,
      removeList,
      addItemFromScan,
      addItemManually,
      removeItem,
      removeItems,
      updateItem,
      moveItemToList,
      moveItemQuantity,
      moveItemsToList,
    }),
    [state, activeList, setActiveListId, addList, removeList, addItemFromScan, addItemManually, removeItem, removeItems, updateItem, moveItemToList, moveItemQuantity, moveItemsToList],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
