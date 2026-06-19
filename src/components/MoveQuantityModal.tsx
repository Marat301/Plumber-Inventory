import { useEffect, useState } from 'react';
import type { MaterialItem } from '../types';
import { Button } from './Button';

interface MoveQuantityModalProps {
  open: boolean;
  item: MaterialItem;
  targetListName: string;
  maxQuantity: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export function MoveQuantityModal({
  open,
  item,
  targetListName,
  maxQuantity,
  onClose,
  onConfirm,
}: MoveQuantityModalProps) {
  const [amount, setAmount] = useState('1');

  useEffect(() => {
    if (open) setAmount('1');
  }, [open, item.id]);

  if (!open) return null;

  const parsed = Number.parseInt(amount, 10);
  const isValid = Number.isFinite(parsed) && parsed >= 1 && parsed <= maxQuantity;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(parsed);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">How many to move?</h2>
        <p className="modal-description">
          Move <strong>{item.name}</strong> to <strong>{targetListName}</strong>. Available:{' '}
          {maxQuantity}
        </p>
        <label className="field">
          <span>Quantity</span>
          <input
            type="number"
            className="input"
            min={1}
            max={maxQuantity}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && isValid && handleConfirm()}
          />
        </label>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Move
          </Button>
        </div>
      </div>
    </div>
  );
}
