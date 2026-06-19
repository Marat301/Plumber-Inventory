import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import type { InventoryList } from '../types';
import { Button } from './Button';
import { PlusIcon, TrashIcon } from './Icons';

export function ListTabs() {
  const { lists, activeList, activeListId, setActiveListId, addList, removeList } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listToDelete, setListToDelete] = useState<InventoryList | null>(null);

  const handleAddList = () => {
    if (newListName.trim()) {
      addList(newListName);
      setNewListName('');
      setShowAddModal(false);
    }
  };

  const requestDeleteList = () => {
    if (lists.length <= 1) return;

    if (activeList.items.length > 0) {
      setListToDelete(activeList);
      return;
    }

    removeList(activeListId);
  };

  const confirmDeleteList = () => {
    if (!listToDelete) return;
    removeList(listToDelete.id);
    setListToDelete(null);
  };

  return (
    <>
      <div className="list-tabs">
        <div className="list-tabs-scroll">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              className={`list-tab ${list.id === activeListId ? 'active' : ''}`}
              onClick={() => setActiveListId(list.id)}
            >
              {list.name}
              <span className="list-tab-count">{list.items.length}</span>
            </button>
          ))}
          {lists.length > 1 && (
            <button
              type="button"
              className="list-tab list-tab-delete"
              onClick={requestDeleteList}
              aria-label={`Delete ${activeList.name}`}
            >
              <TrashIcon />
            </button>
          )}
          <button
            type="button"
            className="list-tab list-tab-add"
            onClick={() => setShowAddModal(true)}
            aria-label="Add new list"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New List</h2>
            <input
              type="text"
              className="input"
              placeholder="List name (e.g. Truck 3)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
            />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddList} disabled={!newListName.trim()}>
                Add List
              </Button>
            </div>
          </div>
        </div>
      )}

      {listToDelete && (
        <div className="modal-overlay" onClick={() => setListToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Are you sure?</h2>
            <p className="modal-description">
              <strong>{listToDelete.name}</strong> has {listToDelete.items.length}{' '}
              {listToDelete.items.length === 1 ? 'item' : 'items'}. Deleting this list will remove
              all of them. This cannot be undone.
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setListToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDeleteList}>
                Delete List
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
