import type { HistoryDetail } from '../types';
import type { InventoryList, MaterialItem } from '../types';

export interface HistoryLog {
  message: string;
  details?: HistoryDetail[];
}

export function listName(lists: InventoryList[], listId: string): string {
  return lists.find((list) => list.id === listId)?.name ?? 'Unknown list';
}

function itemDetail(item: MaterialItem): HistoryDetail {
  const quantity = item.quantity.trim();
  return quantity ? { name: item.name, quantity } : { name: item.name };
}

function itemDetails(items: MaterialItem[]): HistoryDetail[] {
  return items.map(itemDetail);
}

function quantitySuffix(item: MaterialItem): string {
  const quantity = item.quantity.trim();
  return quantity ? ` (${quantity})` : '';
}

export function partialMoveMessage(
  item: MaterialItem,
  amount: number,
  targetListName: string,
): HistoryLog {
  return {
    message: `${amount} of ${item.name} moved to ${targetListName}`,
    details: [{ name: item.name, quantity: String(amount) }],
  };
}

export function moveMessage(items: MaterialItem[], targetListName: string): HistoryLog {
  if (items.length === 1) {
    const item = items[0];
    return {
      message: `${item.name}${quantitySuffix(item)} moved to ${targetListName}`,
    };
  }
  return {
    message: `${items.length} items moved to ${targetListName}`,
    details: itemDetails(items),
  };
}

export function deleteItemsMessage(items: MaterialItem[], listName: string): HistoryLog {
  if (items.length === 1) {
    const item = items[0];
    return {
      message: `${item.name}${quantitySuffix(item)} deleted from ${listName}`,
    };
  }
  return {
    message: `${items.length} items deleted from ${listName}`,
    details: itemDetails(items),
  };
}

export function addItemMessage(itemName: string, listName: string, quantity?: string): HistoryLog {
  const trimmedQty = quantity?.trim();
  const message = trimmedQty
    ? `${itemName} (${trimmedQty}) added to ${listName}`
    : `${itemName} added to ${listName}`;
  return { message };
}

export function deleteListMessage(listName: string, items: MaterialItem[]): HistoryLog {
  if (items.length === 0) {
    return { message: `${listName} list deleted` };
  }
  return {
    message: `${listName} list deleted`,
    details: itemDetails(items),
  };
}
