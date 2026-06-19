export interface MaterialItem {
  id: string;
  barcode: string;
  name: string;
  material: string;
  quantity: string;
  addedAt: string;
}

export interface InventoryList {
  id: string;
  name: string;
  items: MaterialItem[];
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
}

export interface InventoryState {
  lists: InventoryList[];
  activeListId: string;
}

export interface HistoryDetail {
  name: string;
  quantity?: string;
}

export interface HistoryEntry {
  id: string;
  message: string;
  timestamp: string;
  details?: HistoryDetail[];
}
