import { useState } from 'react';
import type { MaterialItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { canSplitQuantity, parseQuantity } from '../lib/quantity';
import { Button } from './Button';
import { MoveQuantityModal } from './MoveQuantityModal';

interface MaterialCardProps {
  item: MaterialItem;
}

export function MaterialCard({ item }: MaterialCardProps) {
  const { lists, activeList, updateItem, removeItem, moveItemToList, moveItemQuantity } =
    useInventory();
  const [expanded, setExpanded] = useState(false);
  const [movePrompt, setMovePrompt] = useState<{
    targetListId: string;
    targetListName: string;
  } | null>(null);

  const otherLists = lists.filter((list) => list.id !== activeList.id);
  const maxQuantity = parseQuantity(item.quantity);

  const handleMoveClick = (targetListId: string, targetListName: string) => {
    if (canSplitQuantity(item.quantity)) {
      setMovePrompt({ targetListId, targetListName });
      return;
    }

    moveItemToList(item.id, targetListId);
    setExpanded(false);
  };

  const confirmPartialMove = (amount: number) => {
    if (!movePrompt || maxQuantity === null) return;

    if (amount >= maxQuantity) {
      moveItemToList(item.id, movePrompt.targetListId);
    } else {
      moveItemQuantity(item.id, movePrompt.targetListId, amount);
    }

    setMovePrompt(null);
    setExpanded(false);
  };

  return (
    <>
      <article className="material-card">
        <button
          type="button"
          className="material-card-header"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="material-card-info">
            <span className="material-card-name">{item.name}</span>
            {item.quantity.trim() && (
              <span className="material-card-quantity">Qty: {item.quantity}</span>
            )}
          </div>
          <span className="material-card-chevron">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="material-card-body">
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Material</span>
              <input
                className="input"
                placeholder="e.g. Copper, PVC"
                value={item.material}
                onChange={(e) => updateItem(item.id, { material: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Quantity</span>
              <input
                className="input"
                placeholder="e.g. 5"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
              />
            </label>

            {otherLists.length > 0 && (
              <div className="material-card-move">
                <span className="material-card-move-label">Move to</span>
                <div className="material-card-move-buttons">
                  {otherLists.map((list) => (
                    <Button
                      key={list.id}
                      type="button"
                      variant="secondary"
                      className="material-card-move-btn"
                      onClick={() => handleMoveClick(list.id, list.name)}
                    >
                      {list.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button variant="danger" className="material-card-delete" onClick={() => removeItem(item.id)}>
              Remove
            </Button>
          </div>
        )}

        {!expanded && item.material && (
          <div className="material-card-tags">
            <span className="tag">{item.material}</span>
          </div>
        )}
      </article>

      {movePrompt && maxQuantity !== null && (
        <MoveQuantityModal
          open
          item={item}
          targetListName={movePrompt.targetListName}
          maxQuantity={maxQuantity}
          onClose={() => setMovePrompt(null)}
          onConfirm={confirmPartialMove}
        />
      )}
    </>
  );
}
