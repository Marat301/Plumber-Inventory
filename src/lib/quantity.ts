export function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;

  const amount = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return amount;
}

export function canSplitQuantity(value: string): boolean {
  const amount = parseQuantity(value);
  return amount !== null && amount > 1;
}
